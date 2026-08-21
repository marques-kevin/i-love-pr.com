import { describe, expect, it } from 'vitest'
import { create_memory_repositories } from '@/repositories'
import { create_mock_session } from '@/store/create_mock_session'
import { create_store, load_settings, save_settings } from '@/store'

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

  it('keeps imported_repos when saving settings without adding repos', async () => {
    const repositories = create_memory_repositories({
      settings: {
        id: 'settings',
        token: 'ghp_x',
        repos: ['acme/imported', 'acme/own'],
        imported_repos: ['acme/imported'],
        active_repo: 'acme/own',
        sync_interval_hours: 24,
        backfill_limit: 200,
        ignored_bots: [],
        test_file_globs: [],
        teams: [],
        business_hours: {
          enabled: false,
          time_zone: 'UTC',
          workdays: [1, 2, 3, 4, 5],
          start_minutes: 9 * 60,
          end_minutes: 18 * 60,
        },
        dashboards: [],
        active_dashboard_id: '',
        active_dashboard_by_repo: {},
        locale: null,
        onboarded_at: new Date().toISOString(),
      },
    })
    const store = create_store({
      repositories,
      session: create_mock_session({ get_active_login: () => 'testuser' }),
    })

    await store.dispatch(
      save_settings({
        token: 'ghp_new',
        repos: ['acme/imported', 'acme/own'],
      }),
    )

    expect(store.getState().settings.settings?.imported_repos).toEqual(['acme/imported'])
  })

  it('keeps imported_repos when adding an unrelated PAT repo', async () => {
    const repositories = create_memory_repositories({
      settings: {
        id: 'settings',
        token: 'ghp_x',
        repos: ['acme/imported'],
        imported_repos: ['acme/imported'],
        active_repo: 'acme/imported',
        sync_interval_hours: 24,
        backfill_limit: 200,
        ignored_bots: [],
        test_file_globs: [],
        teams: [],
        business_hours: {
          enabled: false,
          time_zone: 'UTC',
          workdays: [1, 2, 3, 4, 5],
          start_minutes: 9 * 60,
          end_minutes: 18 * 60,
        },
        dashboards: [],
        active_dashboard_id: '',
        active_dashboard_by_repo: {},
        locale: null,
        onboarded_at: new Date().toISOString(),
      },
    })
    const store = create_store({
      repositories,
      session: create_mock_session({ get_active_login: () => 'testuser' }),
    })

    await store.dispatch(
      save_settings({
        token: 'ghp_x',
        repos: ['acme/imported', 'acme/new'],
      }),
    )

    expect(store.getState().settings.settings?.imported_repos).toEqual(['acme/imported'])
    expect(store.getState().settings.settings?.repos).toEqual(['acme/imported', 'acme/new'])
  })
})
