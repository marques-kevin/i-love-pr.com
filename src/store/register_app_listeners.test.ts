import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_BUSINESS_HOURS } from '@/lib/business-hours'
import type { RepoSnapshotV1 } from '@/lib/repo_snapshot'
import { create_memory_repositories } from '@/repositories'
import { create_mock_session } from '@/store/create_mock_session'
import { create_store, global_app_initialized } from '@/store'
import { import_repo_snapshot_from_link } from '@/modules/settings/redux/settings_slice'

const snapshot: RepoSnapshotV1 = {
  schema_version: 1,
  exported_at: '2026-01-01T00:00:00.000Z',
  repo_full_name: 'acme/widgets',
  repos: [],
  pull_requests: [
    {
      id: 'pr-1',
      repo_full_name: 'acme/widgets',
      number: 1,
      title: 'Sample',
      author: 'alice',
      state: 'MERGED',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-02T00:00:00.000Z',
      closed_at: '2026-01-02T00:00:00.000Z',
      merged_at: '2026-01-02T00:00:00.000Z',
      ready_for_review_at: null,
      first_review_requested_at: null,
      additions: 1,
      deletions: 0,
      changed_files: 1,
      commits_count: 1,
      comments_count: 0,
      labels: [],
    },
  ],
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

  it('opens the import dialog on boot without writing facts', async () => {
    vi.stubGlobal('navigator', { language: 'en' })
    vi.stubGlobal('window', {
      location: {
        href: 'https://i-love-pr.com/?import=abc123',
        origin: 'https://i-love-pr.com',
        pathname: '/',
        search: '?import=abc123',
        hash: '',
      },
      history: { replaceState: vi.fn() },
    })

    const repositories = create_memory_repositories()
    const store = create_store({
      repositories,
      session: create_mock_session({ get_active_login: () => null }),
    })

    await store.dispatch(global_app_initialized())
    await vi.waitFor(() => {
      expect(store.getState().dashboard.import_repo_requested).toBe(true)
    })

    expect(store.getState().dashboard.import_repo_link).toContain('abc123')
    expect(store.getState().import_job.status).toBe('idle')
    const facts = await repositories.pr_facts.list_by_repos(['acme/widgets'])
    expect(facts).toHaveLength(0)
  })

  it('imports on confirm even when settings were empty (guest)', async () => {
    vi.stubGlobal('navigator', { language: 'en' })
    vi.stubGlobal('window', {
      location: {
        href: 'https://i-love-pr.com/',
        origin: 'https://i-love-pr.com',
        pathname: '/',
        search: '',
        hash: '',
      },
      history: { replaceState: vi.fn() },
    })
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        headers: { get: () => null },
        body: null,
        text: async () => JSON.stringify(snapshot),
      })),
    )

    const repositories = create_memory_repositories()
    const store = create_store({
      repositories,
      session: create_mock_session({ get_active_login: () => null }),
    })

    await store.dispatch(global_app_initialized())
    await store.dispatch(
      import_repo_snapshot_from_link({
        share_link: 'https://i-love-pr.com/?import=abc123',
      }),
    )

    const settings = store.getState().settings.settings
    expect(settings?.token).toBe('')
    expect(settings?.imported_repos).toEqual(['acme/widgets'])
    expect(store.getState().import_job.status).toBe('success')
    const facts = await repositories.pr_facts.list_by_repos(['acme/widgets'])
    expect(facts).toHaveLength(1)
  })

  it('does not write anything when import is cancelled before confirm', async () => {
    vi.stubGlobal('navigator', { language: 'en' })
    vi.stubGlobal('window', {
      location: {
        href: 'https://i-love-pr.com/?import=abc123',
        origin: 'https://i-love-pr.com',
        pathname: '/',
        search: '?import=abc123',
        hash: '',
      },
      history: { replaceState: vi.fn() },
    })

    const repositories = create_memory_repositories()
    const store = create_store({
      repositories,
      session: create_mock_session({ get_active_login: () => null }),
    })

    await store.dispatch(global_app_initialized())
    await vi.waitFor(() => {
      expect(store.getState().dashboard.import_repo_requested).toBe(true)
    })

    const facts = await repositories.pr_facts.list_by_repos(['acme/widgets'])
    expect(facts).toHaveLength(0)
    expect(await repositories.settings.get()).toBeFalsy()
  })
})
