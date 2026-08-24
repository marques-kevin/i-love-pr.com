import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_BUSINESS_HOURS } from '@/lib/business-hours'
import { DEFAULT_IGNORED_BOTS } from '@/lib/bots'
import type { RepoSnapshotV1 } from '@/lib/repo_snapshot'
import { create_memory_repositories } from '@/repositories'
import { create_mock_session } from '@/store/create_mock_session'
import {
  create_store,
  import_repo_snapshot_from_link,
  load_repo_settings,
  load_settings,
  save_settings,
} from '@/store'

describe('settings thunks with memory repositories', () => {
  it('loads null when empty', async () => {
    const repositories = create_memory_repositories()
    const store = create_store({ repositories, session: create_mock_session() })
    await store.dispatch(load_settings())
    expect(store.getState().settings.settings).toBeNull()
    expect(store.getState().settings.loading).toBe(false)
  })

  it('saves then loads settings via extra.repositories', async () => {
    const repositories = create_memory_repositories()
    const store = create_store({
      repositories,
      session: create_mock_session({ get_active_login: () => 'testuser' }),
    })

    await store.dispatch(
      save_settings({
        token: 'ghp_x',
        repos: ['org/repo'],
      }),
    )

    expect(store.getState().settings.settings?.repos).toEqual(['org/repo'])

    const store2 = create_store({
      repositories,
      session: create_mock_session({ get_active_login: () => 'testuser' }),
    })
    await store2.dispatch(load_settings())
    expect(store2.getState().settings.settings?.token).toBe('ghp_x')
  })

  it('does not clear imported_repos when saving settings without adding a repo', async () => {
    const repositories = create_memory_repositories()
    await repositories.settings.save({
      token: 'ghp_x',
      repos: ['acme/imported'],
      imported_repos: ['acme/imported'],
    })
    const store = create_store({
      repositories,
      session: create_mock_session({ get_active_login: () => 'testuser' }),
    })

    await store.dispatch(
      save_settings({
        token: 'ghp_x',
        repos: ['acme/imported'],
        sync_interval_hours: 12,
      }),
    )

    expect(store.getState().settings.settings?.imported_repos).toEqual(['acme/imported'])
  })

  it('promotes a newly PAT-added repo that was listed in imported_repos', async () => {
    const repositories = create_memory_repositories()
    await repositories.settings.save({
      token: 'ghp_x',
      repos: [],
      imported_repos: ['acme/imported'],
    })
    const store = create_store({
      repositories,
      session: create_mock_session({ get_active_login: () => 'testuser' }),
    })

    await store.dispatch(
      save_settings({
        token: 'ghp_x',
        repos: ['acme/imported'],
      }),
    )

    expect(store.getState().settings.settings?.repos).toEqual(['acme/imported'])
    expect(store.getState().settings.settings?.imported_repos).toEqual([])
  })

  it('does not add newly PAT-added repos to imported_repos', async () => {
    const repositories = create_memory_repositories()
    await repositories.settings.save({ token: 'ghp_x', repos: [] })
    const store = create_store({
      repositories,
      session: create_mock_session({ get_active_login: () => 'testuser' }),
    })

    await store.dispatch(
      save_settings({
        token: 'ghp_x',
        repos: ['acme/new'],
      }),
    )

    expect(store.getState().settings.settings?.repos).toEqual(['acme/new'])
    expect(store.getState().settings.settings?.imported_repos).toEqual([])
  })

  it('stashes resolved repo settings defaults on load_repo_settings', async () => {
    const repositories = create_memory_repositories()
    const store = create_store({
      repositories,
      session: create_mock_session(),
    })

    await store.dispatch(load_repo_settings({ repo_full_name: 'org/new-repo' }))

    const state = store.getState().settings
    expect(state.current_repo_settings?.repo_full_name).toBe('org/new-repo')
    expect(state.current_repo_settings?.ignored_bots).toEqual([...DEFAULT_IGNORED_BOTS])
    expect(state.current_repo_settings_repo).toBe('org/new-repo')
    expect(state.current_repo_settings_loading).toBe(false)
    expect(state.current_repo_settings_error).toBeNull()
  })

  it('replaces current_repo_settings when loading another repo', async () => {
    const repositories = create_memory_repositories()
    await repositories.repo_settings.save('org/a', {
      ignored_bots: ['only-a[bot]'],
    })
    const store = create_store({
      repositories,
      session: create_mock_session(),
    })

    await store.dispatch(load_repo_settings({ repo_full_name: 'org/a' }))
    expect(store.getState().settings.current_repo_settings?.ignored_bots).toEqual(['only-a[bot]'])

    await store.dispatch(load_repo_settings({ repo_full_name: 'org/b' }))
    const state = store.getState().settings
    expect(state.current_repo_settings?.repo_full_name).toBe('org/b')
    expect(state.current_repo_settings?.ignored_bots).toEqual([...DEFAULT_IGNORED_BOTS])
    expect(state.current_repo_settings_repo).toBe('org/b')
  })

  it('imports a share snapshot into an empty workspace', async () => {
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
    vi.stubGlobal('navigator', { language: 'en' })
    vi.stubGlobal('window', { location: { origin: 'https://i-love-pr.com' } })
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

    const result = await store
      .dispatch(import_repo_snapshot_from_link({ share_link: 'abc123' }))
      .unwrap()
    expect(result.repo_full_name).toBe('acme/widgets')
    expect(store.getState().settings.share_import_status).toBe('success')
    expect(store.getState().settings.share_import_repo).toBe('acme/widgets')

    const settings = await repositories.settings.get()
    expect(settings?.token).toBe('')
    expect(settings?.imported_repos).toEqual(['acme/widgets'])
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})
