import { describe, expect, it } from 'vitest'
import { DEFAULT_BUSINESS_HOURS } from '@/lib/business-hours'
import { rebuild_pr_facts_for_prs } from '@/lib/rebuild_pr_facts'
import { DEFAULT_TEST_FILE_GLOBS } from '@/lib/test_file_patterns'
import type { PullRequestRecord } from '@/lib/types'
import { create_memory_repositories } from '@/repositories'
import { create_mock_session } from '@/store/create_mock_session'
import { create_store, load_settings, save_repo_settings, save_settings } from '@/store'

function sample_pr(repo_full_name: string): PullRequestRecord {
  return {
    id: `${repo_full_name}#1`,
    repo_full_name,
    number: 1,
    title: 'Test',
    author: 'alice',
    state: 'MERGED',
    created_at: '2026-08-06T07:00:00.000Z',
    updated_at: '2026-08-06T10:00:00.000Z',
    closed_at: '2026-08-06T10:00:00.000Z',
    merged_at: '2026-08-06T10:00:00.000Z',
    ready_for_review_at: '2026-08-06T07:00:00.000Z',
    first_review_requested_at: '2026-08-06T07:00:00.000Z',
    additions: 10,
    deletions: 2,
    changed_files: 1,
    commits_count: 1,
    comments_count: 0,
    labels: [],
  }
}

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

  it('saves per-repo analysis settings without changing another repo', async () => {
    const repositories = create_memory_repositories()
    const store = create_store({
      repositories,
      session: create_mock_session({ get_active_login: () => 'testuser' }),
    })

    await store.dispatch(save_settings({ token: 'ghp_x', repos: ['acme/app', 'acme/other'] }))
    await store.dispatch(load_settings())

    await store.dispatch(
      save_repo_settings({
        repo_full_name: 'acme/app',
        ignored_bots: ['alice'],
        test_file_globs: ['**/*.spec.ts'],
        business_hours: { ...DEFAULT_BUSINESS_HOURS, enabled: true },
      }),
    )

    expect(store.getState().settings.repo_records['acme/app']?.ignored_bots).toEqual(['alice'])
    expect(store.getState().settings.repo_records['acme/other']?.ignored_bots).toBeUndefined()
    expect(store.getState().settings.repo_records['acme/app']?.test_file_globs).toEqual([
      '**/*.spec.ts',
    ])
    expect(store.getState().settings.settings?.test_file_globs).toEqual(DEFAULT_TEST_FILE_GLOBS)
  })

  it('rebuilds facts for the saved repo only', async () => {
    const pr_a = sample_pr('acme/app')
    const pr_b = sample_pr('acme/other')
    const repositories = create_memory_repositories({
      pull_requests: [pr_a, pr_b],
    })
    const store = create_store({
      repositories,
      session: create_mock_session({ get_active_login: () => 'testuser' }),
    })

    await store.dispatch(save_settings({ token: 'ghp_x', repos: ['acme/app', 'acme/other'] }))
    await rebuild_pr_facts_for_prs(repositories, [pr_a, pr_b])

    await store.dispatch(
      save_repo_settings({
        repo_full_name: 'acme/app',
        ignored_bots: ['alice'],
        test_file_globs: [...DEFAULT_TEST_FILE_GLOBS],
        business_hours: DEFAULT_BUSINESS_HOURS,
      }),
    )

    const facts_a = await repositories.pr_facts.list_by_repos(['acme/app'])
    const facts_b = await repositories.pr_facts.list_by_repos(['acme/other'])
    expect(facts_a[0].is_bot).toBe(true)
    expect(facts_b[0].is_bot).toBe(false)
  })
})
