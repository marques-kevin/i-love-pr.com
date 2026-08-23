import { describe, expect, it } from 'vitest'
import { DEFAULT_BUSINESS_HOURS } from '@/lib/business-hours'
import { rebuild_pr_facts_for_prs } from '@/lib/rebuild_pr_facts'
import type { AppSettings, PullRequestRecord } from '@/lib/types'
import { create_memory_repositories } from '@/repositories'
import { create_mock_session } from '@/store/create_mock_session'
import { create_store, save_repo_settings } from '@/store'

function sample_pr(repo_full_name: string, author: string): PullRequestRecord {
  return {
    id: `${repo_full_name}#1`,
    repo_full_name,
    number: 1,
    title: 'Test',
    author,
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

const sample_settings: AppSettings = {
  id: 'settings',
  token: 't',
  repos: ['acme/a', 'acme/b'],
  imported_repos: [],
  active_repo: 'acme/a',
  sync_interval_hours: 24,
  backfill_limit: 200,
  ignored_bots: [],
  test_file_globs: [],
  teams: [],
  business_hours: DEFAULT_BUSINESS_HOURS,
  dashboards: [
    {
      id: 'default-a',
      name: '',
      repo_full_name: 'acme/a',
      layout: [],
      members: [],
      period_key: '30d',
      custom_from: '',
      custom_to: '',
      hide_test_files: false,
    },
    {
      id: 'default-b',
      name: '',
      repo_full_name: 'acme/b',
      layout: [],
      members: [],
      period_key: '30d',
      custom_from: '',
      custom_to: '',
      hide_test_files: false,
    },
  ],
  active_dashboard_id: 'default-a',
  active_dashboard_by_repo: { 'acme/a': 'default-a', 'acme/b': 'default-b' },
  locale: null,
  onboarded_at: '2026-01-01T00:00:00.000Z',
}

describe('save_repo_settings', () => {
  it('rebuilds facts for the saved repo only', async () => {
    const pr_a = sample_pr('acme/a', 'alice')
    const pr_b = sample_pr('acme/b', 'dependabot')
    const repositories = create_memory_repositories({
      settings: sample_settings,
      pull_requests: [pr_a, pr_b],
    })
    await rebuild_pr_facts_for_prs(repositories, [pr_a, pr_b])
    const before_b = await repositories.pr_facts.list_by_repos(['acme/b'])

    const store = create_store({
      repositories,
      session: create_mock_session({ get_active_login: () => 'testuser' }),
    })

    await store.dispatch(
      save_repo_settings({
        repo_full_name: 'acme/a',
        ignored_bots: ['alice'],
        test_file_globs: ['**/*.a.ts'],
        business_hours: { ...DEFAULT_BUSINESS_HOURS, enabled: true },
      }),
    )

    const after_a = await repositories.pr_facts.list_by_repos(['acme/a'])
    const after_b = await repositories.pr_facts.list_by_repos(['acme/b'])
    expect(store.getState().settings.repo_settings_by_repo['acme/a']?.ignored_bots).toEqual([
      'alice',
    ])
    expect(after_a[0].is_bot).toBe(true)
    expect(after_b).toEqual(before_b)
    expect(await repositories.repo_settings.get('acme/b')).toMatchObject({
      ignored_bots: expect.not.arrayContaining(['alice']),
    })
  })
})
