import { describe, expect, it } from 'vitest'
import {
  mark_new_pat_repos,
  mark_repo_source,
  merge_repo_sources_for_repos,
  repo_source,
} from '@/lib/repo_sources'
import type { AppSettings } from '@/lib/types'

function settings(repos: string[], repo_sources?: AppSettings['repo_sources']): AppSettings {
  return {
    id: 'settings',
    token: 'ghp_test',
    repos,
    repo_sources,
    active_repo: repos[0] ?? null,
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
  }
}

describe('repo_sources', () => {
  it('defaults missing entries to pat', () => {
    expect(repo_source(settings(['acme/app']), 'acme/app')).toBe('pat')
  })

  it('reads stored repo source', () => {
    expect(repo_source(settings(['acme/app'], { 'acme/app': 'import' }), 'acme/app')).toBe('import')
  })

  it('marks imported repos', () => {
    expect(mark_repo_source({}, 'acme/app', 'import')).toEqual({ 'acme/app': 'import' })
  })

  it('preserves existing sources when trimming repos', () => {
    expect(
      merge_repo_sources_for_repos({ 'acme/a': 'import', 'acme/b': 'pat' }, ['acme/a']),
    ).toEqual({ 'acme/a': 'import' })
  })

  it('marks newly added pat repos', () => {
    expect(mark_new_pat_repos({}, [], ['acme/app'])).toEqual({ 'acme/app': 'pat' })
    expect(
      mark_new_pat_repos({ 'acme/old': 'import' }, ['acme/old'], ['acme/old', 'acme/new']),
    ).toEqual({ 'acme/old': 'import', 'acme/new': 'pat' })
  })
})
