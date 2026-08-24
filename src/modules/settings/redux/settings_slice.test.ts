import { describe, expect, it } from 'vitest'
import { DEFAULT_IGNORED_BOTS } from '@/lib/bots'
import { DEFAULT_BUSINESS_HOURS } from '@/lib/business-hours'
import { DEFAULT_TEST_FILE_GLOBS } from '@/lib/test_file_patterns'
import { create_memory_repositories } from '@/repositories'
import { create_mock_session } from '@/store/create_mock_session'
import {
  create_dashboard,
  create_repo_share_link,
  create_store,
  hydrate_active_repo,
  load_repo_settings,
  load_settings,
  save_dashboard_layout,
  save_repo_settings,
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

  it('no-ops layout, tab, settings, and share mutations for an imported repo', async () => {
    const repositories = create_memory_repositories()
    await repositories.settings.save({
      token: 'ghp_x',
      repos: ['acme/imported'],
      imported_repos: ['acme/imported'],
      active_repo: 'acme/imported',
    })
    const store = create_store({
      repositories,
      session: create_mock_session({ get_active_login: () => 'testuser' }),
    })
    await store.dispatch(load_settings())
    store.dispatch(hydrate_active_repo('acme/imported'))

    const before = await repositories.settings.get()
    const before_repo_settings = await repositories.repo_settings.get('acme/imported')

    const layout_result = await store.dispatch(save_dashboard_layout([]))
    const tab_result = await store.dispatch(create_dashboard('Guest view'))
    const settings_result = await store.dispatch(
      save_repo_settings({
        repo_full_name: 'acme/imported',
        ignored_bots: ['custom[bot]'],
        test_file_globs: [...DEFAULT_TEST_FILE_GLOBS],
        business_hours: DEFAULT_BUSINESS_HOURS,
      }),
    )
    const share_result = await store.dispatch(
      create_repo_share_link({ repo_full_name: 'acme/imported' }),
    )

    expect(layout_result.meta.requestStatus).toBe('rejected')
    expect(tab_result.meta.requestStatus).toBe('rejected')
    expect(settings_result.meta.requestStatus).toBe('rejected')
    expect(share_result.meta.requestStatus).toBe('rejected')

    const after = await repositories.settings.get()
    expect(after?.dashboards).toEqual(before?.dashboards)
    expect(after?.active_dashboard_id).toBe(before?.active_dashboard_id)
    expect(await repositories.repo_settings.get('acme/imported')).toEqual(before_repo_settings)
  })
})
