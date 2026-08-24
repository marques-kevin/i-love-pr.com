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
  type RepoSnapshotV1,
} from '@/lib/repo_snapshot'
import type { AppSettings, DashboardTab, PullRequestRecord } from '@/lib/types'
import { create_memory_repositories } from '@/repositories'

function base_settings(repos: string[]): AppSettings {
  return {
    id: 'settings',
    token: 'ghp_test',
    repos,
    imported_repos: [],
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

function sample_dashboard(repo_full_name: string, layout_empty = false): DashboardTab {
  return {
    id: `dash-${repo_full_name}`,
    name: 'Main',
    repo_full_name,
    layout: layout_empty ? [] : [{ instance_id: 'cycle_time', widget_id: 'cycle_time' }],
    members: [],
    period_key: '30d',
    custom_from: '',
    custom_to: '',
    hide_test_files: false,
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
  it('creates empty-token settings when importing without prior settings', async () => {
    const repo = 'acme/widgets'
    const snapshot: RepoSnapshotV1 = {
      schema_version: 1,
      exported_at: '2026-01-01T00:00:00.000Z',
      repo_full_name: repo,
      repos: [],
      pull_requests: [sample_pr(repo)],
      reviews: [],
      pr_changed_files: [],
      settings_subset: {
        teams: [],
        dashboards: [],
        ignored_bots: ['import-bot'],
        test_file_globs: ['**/*.spec.ts'],
        business_hours: DEFAULT_BUSINESS_HOURS,
      },
    }
    const target = create_memory_repositories()
    const result = await import_repo_snapshot(target, snapshot)
    expect(result.repo_full_name).toBe(repo)

    const settings = await target.settings.get()
    expect(settings?.token).toBe('')
    expect(settings?.repos).toContain(repo)
    expect(settings?.imported_repos).toEqual([repo])

    const repo_settings = await target.repo_settings.get(repo)
    expect(repo_settings.ignored_bots).toEqual(['import-bot'])
    expect(repo_settings.test_file_globs).toEqual(['**/*.spec.ts'])

    const facts = await target.pr_facts.list_by_repos([repo])
    expect(facts).toHaveLength(1)
  })

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
    expect(settings?.imported_repos).toContain(repo)
    const prs = await target.pull_requests.list_by_repos([repo])
    expect(prs).toHaveLength(1)
    const facts = await target.pr_facts.list_by_repos([repo])
    expect(facts).toHaveLength(1)
  })

  it('rejects unsupported snapshot versions', () => {
    expect(() => validate_repo_snapshot({ schema_version: 99 })).toThrow(RepoSnapshotError)
  })

  it('parses serialized snapshots', () => {
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
    const parsed = parse_repo_snapshot(serialize_repo_snapshot(snapshot))
    expect(parsed.repo_full_name).toBe('acme/widgets')
  })

  it('extracts share ids from urls', () => {
    expect(parse_share_id_from_url('https://i-love-pr.com/?import=abc123')).toBe('abc123')
    expect(parse_share_id_from_url('https://i-love-pr.com/share/xyz789')).toBe('xyz789')
    expect(parse_share_id_from_url('raw-share-id')).toBe('raw-share-id')
  })

  it('writes snapshot bots and globs to repo_settings without changing account settings', async () => {
    const repo = 'acme/widgets'
    const exporter_settings = base_settings([repo])
    const exporter_repos = create_memory_repositories({
      settings: exporter_settings,
      pull_requests: [sample_pr(repo)],
    })
    await exporter_repos.repo_settings.save(repo, {
      ignored_bots: ['exporter-bot'],
      test_file_globs: ['**/*.exporter.ts'],
      business_hours: {
        ...DEFAULT_BUSINESS_HOURS,
        enabled: true,
        time_zone: 'America/New_York',
      },
    })

    const exported = await export_repo_snapshot(exporter_repos, repo)
    expect(exported.settings_subset.ignored_bots).toEqual(['exporter-bot'])

    const importer_settings = base_settings([])
    importer_settings.ignored_bots = ['local-bot']
    importer_settings.test_file_globs = ['**/*.spec.ts']
    importer_settings.business_hours = {
      ...DEFAULT_BUSINESS_HOURS,
      enabled: true,
      time_zone: 'Europe/Paris',
      start_minutes: 8 * 60,
    }
    const target = create_memory_repositories({ settings: importer_settings })
    await import_repo_snapshot(target, exported)

    const settings = await target.settings.get()
    expect(settings?.ignored_bots).toEqual(['local-bot'])
    expect(settings?.test_file_globs).toEqual(['**/*.spec.ts'])
    expect(settings?.business_hours).toEqual(importer_settings.business_hours)
    expect(settings?.repos).toContain(repo)

    const repo_settings = await target.repo_settings.get(repo)
    expect(repo_settings.ignored_bots).toEqual(['exporter-bot'])
    expect(repo_settings.test_file_globs).toEqual(['**/*.exporter.ts'])
    expect(repo_settings.business_hours.time_zone).toBe('America/New_York')
  })

  it('exports dashboards with layout and skips empty layouts', async () => {
    const repo = 'acme/widgets'
    const settings = base_settings([repo])
    settings.dashboards = [
      sample_dashboard(repo),
      { ...sample_dashboard(repo, true), id: 'empty-tab' },
    ]

    const exported = await export_repo_snapshot(
      create_memory_repositories({ settings, pull_requests: [sample_pr(repo)] }),
      repo,
    )
    expect(exported.settings_subset.dashboards).toEqual([sample_dashboard(repo)])
    expect(exported.settings_subset.dashboards.every((tab) => tab.layout.length > 0)).toBe(true)
  })

  it('parses dashboard layout from a snapshot and skips empty layouts', () => {
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
        dashboards: [
          sample_dashboard('acme/widgets'),
          sample_dashboard('acme/widgets', true),
          {
            ...sample_dashboard('acme/widgets'),
            id: 'missing-layout',
            layout: [],
          },
        ],
        ignored_bots: [],
        test_file_globs: [],
        business_hours: DEFAULT_BUSINESS_HOURS,
      },
    }
    const parsed = parse_repo_snapshot(serialize_repo_snapshot(snapshot))
    expect(parsed.settings_subset.dashboards).toEqual([sample_dashboard('acme/widgets')])
    expect(parsed.settings_subset.dashboards[0]?.layout).toEqual([
      { instance_id: 'cycle_time', widget_id: 'cycle_time' },
    ])
  })

  it('imports dashboards that include a widget layout', async () => {
    const repo = 'acme/widgets'
    const local_repo = 'other/repo'
    const incoming = sample_dashboard(repo)
    const local_tab = sample_dashboard(local_repo)
    const snapshot: RepoSnapshotV1 = {
      schema_version: 1,
      exported_at: '2026-01-01T00:00:00.000Z',
      repo_full_name: repo,
      repos: [],
      pull_requests: [],
      reviews: [],
      pr_changed_files: [],
      settings_subset: {
        teams: [],
        dashboards: [incoming],
        ignored_bots: ['exporter-bot'],
        test_file_globs: [],
        business_hours: DEFAULT_BUSINESS_HOURS,
      },
    }
    const importer_settings = base_settings([local_repo])
    importer_settings.dashboards = [local_tab]
    const target = create_memory_repositories({ settings: importer_settings })
    await import_repo_snapshot(target, snapshot)
    const settings = await target.settings.get()
    expect(settings?.dashboards).toEqual([local_tab, incoming])
    expect(settings?.dashboards.find((tab) => tab.id === incoming.id)?.layout).toEqual([
      { instance_id: 'cycle_time', widget_id: 'cycle_time' },
    ])
  })

  it('does not import empty-layout dashboards over local tabs', async () => {
    const repo = 'acme/widgets'
    const local_tab = sample_dashboard(repo)
    const importer_settings = base_settings([repo])
    importer_settings.dashboards = [local_tab]
    const target = create_memory_repositories({ settings: importer_settings })

    const snapshot: RepoSnapshotV1 = {
      schema_version: 1,
      exported_at: '2026-01-01T00:00:00.000Z',
      repo_full_name: repo,
      repos: [],
      pull_requests: [],
      reviews: [],
      pr_changed_files: [],
      settings_subset: {
        teams: [],
        dashboards: [sample_dashboard(repo, true)],
        ignored_bots: ['should-not-apply'],
        test_file_globs: ['**/*.nope.ts'],
        business_hours: { ...DEFAULT_BUSINESS_HOURS, time_zone: 'UTC' },
      },
    }
    await import_repo_snapshot(target, snapshot)
    const settings = await target.settings.get()
    expect(settings?.dashboards).toEqual([local_tab])
    expect(settings?.ignored_bots).toEqual([...DEFAULT_IGNORED_BOTS])
    const repo_settings = await target.repo_settings.get(repo)
    expect(repo_settings.ignored_bots).toEqual(['should-not-apply'])
    expect(repo_settings.test_file_globs).toEqual(['**/*.nope.ts'])
  })

  it('tags imported repos in imported_repos', async () => {
    const repo = 'acme/widgets'
    const snapshot: RepoSnapshotV1 = {
      schema_version: 1,
      exported_at: '2026-01-01T00:00:00.000Z',
      repo_full_name: repo,
      repos: [],
      pull_requests: [sample_pr(repo)],
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
    const target = create_memory_repositories({ settings: base_settings([]) })
    await import_repo_snapshot(target, snapshot)
    const settings = await target.settings.get()
    expect(settings?.imported_repos).toEqual([repo])
  })

  it('keeps PAT repos out of imported_repos when re-importing', async () => {
    const repo = 'acme/widgets'
    const pat_settings = base_settings([repo])
    const snapshot: RepoSnapshotV1 = {
      schema_version: 1,
      exported_at: '2026-01-01T00:00:00.000Z',
      repo_full_name: repo,
      repos: [],
      pull_requests: [sample_pr(repo)],
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
    const target = create_memory_repositories({ settings: pat_settings })
    await import_repo_snapshot(target, snapshot)
    const settings = await target.settings.get()
    expect(settings?.repos).toContain(repo)
    expect(settings?.imported_repos).toEqual([])
  })
})
