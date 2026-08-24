import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_BUSINESS_HOURS } from '@/lib/business-hours'
import type { RepoSnapshotV1 } from '@/lib/repo_snapshot'
import { create_memory_repositories } from '@/repositories'
import { create_mock_session } from '@/store/create_mock_session'
import { create_store, global_app_initialized } from '@/store'

const snapshot: RepoSnapshotV1 = {
  schema_version: 1,
  exported_at: '2026-01-01T00:00:00.000Z',
  repo_full_name: 'acme/widgets',
  repos: [],
  pull_requests: [],
  reviews: [],
  pr_changed_files: [],
  settings_subset: {
    teams: [],
    dashboards: [],
    ignored_bots: [],
    test_file_globs: [],
    business_hours: DEFAULT_BUSINESS_HOURS,
  },
}

describe('share import boot listener', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('imports from the current share URL before load_settings', async () => {
    vi.stubGlobal('navigator', { language: 'en' })
    vi.stubGlobal('window', {
      location: {
        href: 'https://i-love-pr.com/?import=abc123',
        origin: 'https://i-love-pr.com',
        pathname: '/',
        search: '?import=abc123',
        hash: '',
      },
    })
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify(snapshot),
      })),
    )

    const repositories = create_memory_repositories()
    const store = create_store({
      repositories,
      session: create_mock_session({ get_active_login: () => null }),
    })

    await store.dispatch(global_app_initialized())
    await vi.waitFor(() => {
      expect(store.getState().settings.settings?.imported_repos).toEqual(['acme/widgets'])
    })

    const settings = store.getState().settings
    expect(settings.settings?.token).toBe('')
    expect(settings.share_import_status).toBe('success')
    expect(settings.share_import_repo).toBe('acme/widgets')
    expect(settings.loading).toBe(false)
  })

  it('records a failed share import without creating a token wall', async () => {
    vi.stubGlobal('navigator', { language: 'en' })
    vi.stubGlobal('window', {
      location: {
        href: 'https://i-love-pr.com/?import=missing',
        origin: 'https://i-love-pr.com',
        pathname: '/',
        search: '?import=missing',
        hash: '',
      },
    })
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 404,
        text: async () => 'not found',
      })),
    )

    const repositories = create_memory_repositories()
    const store = create_store({
      repositories,
      session: create_mock_session({ get_active_login: () => null }),
    })

    await store.dispatch(global_app_initialized())
    await vi.waitFor(() => {
      expect(store.getState().settings.share_import_status).toBe('error')
    })

    expect(store.getState().settings.settings).toBeNull()
    expect(store.getState().settings.loading).toBe(false)
  })
})
