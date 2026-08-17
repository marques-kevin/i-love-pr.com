import { describe, expect, it } from 'vitest'
import { DEFAULT_BUSINESS_HOURS } from '@/lib/business-hours'
import { DEFAULT_IGNORED_BOTS } from '@/lib/bots'
import { DEFAULT_TEST_FILE_GLOBS } from '@/lib/test_file_patterns'
import {
  assert_snapshot_has_no_token,
  export_repo_snapshot,
  import_repo_snapshot,
  parse_repo_snapshot,
  parse_share_id_from_url,
  RepoSnapshotError,
  serialize_repo_snapshot,
  validate_repo_snapshot,
} from '@/lib/repo_snapshot'
import type { AppSettings, PullRequestRecord } from '@/lib/types'
import { create_memory_repositories } from '@/repositories'

function base_settings(repos: string[]): AppSettings {
  return {
    id: 'settings',
    token: 'ghp_test',
    repos,
    active_repo: repos[0] ?? null,
    sync_interval_hours: 24,
    backfill_limit: 200,
    ignored_bots: [...DEFAULT_IGNORED_BOTS],
    test_file_globs: [...DEFAULT_TEST_FILE_GLOBS],
    teams: [],
    business_hours: DEFAULT_BUSINESS_HOURS,
    dashboards: [],
    active_dashboard_id: '',
    active_dashboard_by_repo: {},
    locale: null,
    onboarded_at: new Date().toISOString(),
  }
}

function sample_pr(repo_full_name: string): PullRequestRecord {
  return {
    id: 'pr-1',
    repo_full_name,
    number: 1,
    title: 'Sample PR',
    author: 'alice',
    state: 'MERGED',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-02T00:00:00.000Z',
    closed_at: '2026-01-02T00:00:00.000Z',
    merged_at: '2026-01-02T00:00:00.000Z',
    ready_for_review_at: '2026-01-01T01:00:00.000Z',
    first_review_requested_at: '2026-01-01T01:00:00.000Z',
    additions: 10,
    deletions: 2,
    changed_files: 1,
    commits_count: 1,
    comments_count: 0,
    labels: [],
  }
}

describe('repo_snapshot', () => {
  it('exports and imports a repository round-trip', async () => {
    const repo = 'acme/widgets'
    const repositories = create_memory_repositories({
      settings: base_settings([repo]),
      pull_requests: [sample_pr(repo)],
      reviews: [
        {
          id: 'rev-1',
          pr_id: 'pr-1',
          repo_full_name: repo,
          pr_number: 1,
          author: 'bob',
          state: 'APPROVED',
          submitted_at: '2026-01-01T02:00:00.000Z',
        },
      ],
      pr_changed_files: [
        {
          id: 'file-1',
          pr_id: 'pr-1',
          path: 'src/widget.ts',
          additions: 10,
          deletions: 2,
        },
      ],
    })

    const exported = await export_repo_snapshot(repositories, repo)
    assert_snapshot_has_no_token(exported)
    expect(exported.pull_requests).toHaveLength(1)
    expect(exported.settings_subset.ignored_bots).toEqual([...DEFAULT_IGNORED_BOTS])

    const target = create_memory_repositories({
      settings: base_settings([]),
    })
    const result = await import_repo_snapshot(target, exported)
    expect(result.repo_full_name).toBe(repo)
    expect(result.pr_count).toBe(1)

    const settings = await target.settings.get()
    expect(settings?.repos).toContain(repo)
    const prs = await target.pull_requests.list_by_repos([repo])
    expect(prs).toHaveLength(1)
    const facts = await target.pr_facts.list_by_repos([repo])
    expect(facts).toHaveLength(1)
  })

  it('rejects unsupported snapshot versions', () => {
    expect(() => validate_repo_snapshot({ schema_version: 99 })).toThrow(RepoSnapshotError)
  })

  it('parses serialized snapshots', () => {
    const snapshot = {
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
    const parsed = parse_repo_snapshot(serialize_repo_snapshot(snapshot as never))
    expect(parsed.repo_full_name).toBe('acme/widgets')
  })

  it('extracts share ids from urls', () => {
    expect(parse_share_id_from_url('https://i-love-pr.com/?import=abc123')).toBe('abc123')
    expect(parse_share_id_from_url('https://i-love-pr.com/share/xyz789')).toBe('xyz789')
    expect(parse_share_id_from_url('raw-share-id')).toBe('raw-share-id')
  })
})
