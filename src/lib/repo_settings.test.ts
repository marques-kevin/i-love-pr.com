import { describe, expect, it } from 'vitest'
import { DEFAULT_IGNORED_BOTS } from '@/lib/bots'
import { DEFAULT_BUSINESS_HOURS } from '@/lib/business-hours'
import { rebuild_pr_facts_for_prs } from '@/lib/rebuild_pr_facts'
import { default_repo_settings, resolve_repo_settings } from '@/lib/repo_settings'
import { DEFAULT_TEST_FILE_GLOBS } from '@/lib/test_file_patterns'
import { create_memory_repositories } from '@/repositories'
import type { AppSettings, PullRequestRecord, ReviewRecord } from '@/lib/types'

function sample_pr(overrides: Partial<PullRequestRecord> = {}): PullRequestRecord {
  return {
    id: 'org/repo#1',
    repo_full_name: 'org/repo',
    number: 1,
    title: 'Test',
    author: 'legacy-global-bot',
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
  repos: ['org/repo-a', 'org/repo-b'],
  imported_repos: [],
  active_repo: 'org/repo-a',
  sync_interval_hours: 24,
  backfill_limit: 200,
  ignored_bots: ['legacy-global-bot'],
  test_file_globs: ['**/*.legacy.ts'],
  teams: [],
  business_hours: {
    enabled: true,
    time_zone: 'UTC',
    workdays: [1, 2, 3, 4, 5],
    start_minutes: 9 * 60,
    end_minutes: 18 * 60,
  },
  dashboards: [],
  active_dashboard_id: 'default',
  active_dashboard_by_repo: {},
  locale: null,
  onboarded_at: '2026-01-01T00:00:00.000Z',
}

describe('repo_settings', () => {
  it('returns factory defaults when no row exists', async () => {
    const repositories = create_memory_repositories({ settings: sample_settings })
    const resolved = await repositories.repo_settings.get('org/new-repo')
    const defaults = default_repo_settings('org/new-repo')

    expect(resolved.ignored_bots).toEqual(defaults.ignored_bots)
    expect(resolved.ignored_bots).toEqual([...DEFAULT_IGNORED_BOTS])
    expect(resolved.test_file_globs).toEqual([...DEFAULT_TEST_FILE_GLOBS])
    expect(resolved.business_hours.enabled).toBe(DEFAULT_BUSINESS_HOURS.enabled)
  })

  it('resolve_repo_settings falls back to defaults for empty stored arrays', () => {
    const resolved = resolve_repo_settings(
      {
        repo_full_name: 'org/repo',
        ignored_bots: [],
        test_file_globs: [],
        business_hours: DEFAULT_BUSINESS_HOURS,
      },
      'org/repo',
    )
    expect(resolved.ignored_bots).toEqual([...DEFAULT_IGNORED_BOTS])
    expect(resolved.test_file_globs).toEqual([...DEFAULT_TEST_FILE_GLOBS])
  })

  it('saving repo A does not change repo B resolved config or facts', async () => {
    const pr_a = sample_pr({
      id: 'org/repo-a#1',
      repo_full_name: 'org/repo-a',
    })
    const pr_b = sample_pr({
      id: 'org/repo-b#1',
      repo_full_name: 'org/repo-b',
    })
    const repositories = create_memory_repositories({
      settings: sample_settings,
      pull_requests: [pr_a, pr_b],
      reviews: [
        sample_review({ pr_id: pr_a.id, repo_full_name: pr_a.repo_full_name }),
        sample_review({ pr_id: pr_b.id, repo_full_name: pr_b.repo_full_name }),
      ],
    })

    await repositories.repo_settings.save('org/repo-a', {
      ignored_bots: ['legacy-global-bot'],
      test_file_globs: ['**/*.spec.ts'],
      business_hours: { ...DEFAULT_BUSINESS_HOURS, enabled: true },
    })

    const repo_a = await repositories.repo_settings.get('org/repo-a')
    const repo_b = await repositories.repo_settings.get('org/repo-b')

    expect(repo_a.ignored_bots).toEqual(['legacy-global-bot'])
    expect(repo_b.ignored_bots).toEqual([...DEFAULT_IGNORED_BOTS])
    expect(repo_a.test_file_globs).toEqual(['**/*.spec.ts'])
    expect(repo_b.test_file_globs).toEqual([...DEFAULT_TEST_FILE_GLOBS])

    await rebuild_pr_facts_for_prs(repositories, [pr_a, pr_b])
    const facts_a = await repositories.pr_facts.list_by_repos(['org/repo-a'])
    const facts_b = await repositories.pr_facts.list_by_repos(['org/repo-b'])

    expect(facts_a[0].is_bot).toBe(true)
    expect(facts_b[0].is_bot).toBe(false)
  })
})
