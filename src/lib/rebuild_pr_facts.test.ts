import { describe, expect, it } from 'vitest'
import { rebuild_pr_facts_for_prs, ensure_pr_facts } from '@/lib/rebuild_pr_facts'
import { create_memory_repositories } from '@/repositories'
import {
  PR_FACTS_VERSION,
  type AppSettings,
  type PullRequestRecord,
  type ReviewRecord,
} from '@/lib/types'

function sample_pr(overrides: Partial<PullRequestRecord> = {}): PullRequestRecord {
  return {
    id: 'org/repo#1',
    repo_full_name: 'org/repo',
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
    ...overrides,
  }
}

function sample_review(overrides: Partial<ReviewRecord> = {}): ReviewRecord {
  return {
    id: 'rev1',
    pr_id: 'org/repo#1',
    repo_full_name: 'org/repo',
    pr_number: 1,
    author: 'bob',
    state: 'APPROVED',
    submitted_at: '2026-08-06T08:00:00.000Z',
    ...overrides,
  }
}

const sample_settings: AppSettings = {
  id: 'settings',
  token: 't',
  repos: ['org/repo'],
  repo_sources: { 'org/repo': 'pat' },
  active_repo: 'org/repo',
  sync_interval_hours: 24,
  backfill_limit: 200,
  ignored_bots: [],
  test_file_globs: ['**/*.test.ts'],
  teams: [],
  business_hours: {
    enabled: false,
    time_zone: 'UTC',
    workdays: [1, 2, 3, 4, 5],
    start_minutes: 9 * 60,
    end_minutes: 18 * 60,
  },
  dashboards: [
    {
      id: 'default',
      name: '',
      repo_full_name: 'org/repo',
      layout: [],
      members: [],
      period_key: '30d',
      custom_from: '',
      custom_to: '',
      hide_test_files: false,
    },
  ],
  active_dashboard_id: 'default',
  active_dashboard_by_repo: { 'org/repo': 'default' },
  locale: null,
  onboarded_at: '2026-01-01T00:00:00.000Z',
}

describe('rebuild_pr_facts', () => {
  it('materializes cycle time into pr_facts', async () => {
    const repositories = create_memory_repositories({
      settings: sample_settings,
      pull_requests: [sample_pr()],
      reviews: [sample_review()],
    })

    await rebuild_pr_facts_for_prs(repositories, [sample_pr()])
    const facts = await repositories.pr_facts.list_by_repos(['org/repo'])
    expect(facts).toHaveLength(1)
    expect(facts[0].cycle.time_from_creation_to_merged).toBe(3)
    expect(facts[0].lines_added).toBe(10)
    expect(facts[0].lines_deleted).toBe(2)
    expect(facts[0].lines_changed).toBe(12)
    expect(facts[0].is_bot).toBe(false)
    expect(facts[0].request_review_at).toBe('2026-08-06T07:00:00.000Z')
    expect(facts[0].cycle.time_from_creation_to_asked_for_review).toBe(0)
    expect(facts[0]._version).toBe(PR_FACTS_VERSION)
  })

  it('ensure_pr_facts rebuilds when counts diverge', async () => {
    const pr = sample_pr()
    const repositories = create_memory_repositories({
      settings: sample_settings,
      pull_requests: [pr],
      reviews: [sample_review()],
    })

    await ensure_pr_facts(repositories)
    const facts = await repositories.pr_facts.list_by_repos(['org/repo'])
    expect(facts).toHaveLength(1)
  })

  it('ensure_pr_facts rebuilds when _version is stale', async () => {
    const pr = sample_pr()
    const repositories = create_memory_repositories({
      settings: sample_settings,
      pull_requests: [pr],
      reviews: [sample_review()],
    })

    await rebuild_pr_facts_for_prs(repositories, [pr])
    const stale = await repositories.pr_facts.list_by_repos(['org/repo'])
    await repositories.pr_facts.put_many([{ ...stale[0], _version: 1 }])

    await ensure_pr_facts(repositories)
    const facts = await repositories.pr_facts.list_by_repos(['org/repo'])
    expect(facts[0]._version).toBe(PR_FACTS_VERSION)
  })
})
