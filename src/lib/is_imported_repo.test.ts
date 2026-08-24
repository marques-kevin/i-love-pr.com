import { describe, expect, it } from 'vitest'
import type { AppSettings } from '@/lib/types'
import { dashboard_chrome_flags, is_imported_repo } from '@/lib/is_imported_repo'

const base_settings: AppSettings = {
  id: 'settings',
  token: 'ghp_test',
  repos: ['acme/owned', 'acme/imported'],
  imported_repos: ['acme/imported'],
  active_repo: 'acme/owned',
  ignored_bots: [],
  test_file_globs: [],
  business_hours: {
    enabled: true,
    time_zone: 'UTC',
    workdays: [1, 2, 3, 4, 5],
    start_minutes: 9 * 60,
    end_minutes: 17 * 60,
  },
  sync_interval_hours: 6,
  backfill_limit: 200,
  teams: [],
  dashboards: [],
  active_dashboard_id: 'default',
  active_dashboard_by_repo: {},
  locale: null,
  onboarded_at: '2026-01-01T00:00:00.000Z',
}

describe('is_imported_repo', () => {
  it('returns true when the repo is in imported_repos', () => {
    expect(is_imported_repo(base_settings, 'acme/imported')).toBe(true)
  })

  it('returns false for owned repos', () => {
    expect(is_imported_repo(base_settings, 'acme/owned')).toBe(false)
  })

  it('returns false when settings or repo are missing', () => {
    expect(is_imported_repo(null, 'acme/imported')).toBe(false)
    expect(is_imported_repo(base_settings, null)).toBe(false)
  })
})

describe('dashboard_chrome_flags', () => {
  it('hides mutation chrome for imported repos', () => {
    expect(dashboard_chrome_flags(base_settings, 'acme/imported')).toEqual({
      toolbar: false,
      settings_gear: false,
      sync_status: false,
      customize: false,
      tab_mutations: false,
    })
  })

  it('shows full chrome for owned repos', () => {
    expect(dashboard_chrome_flags(base_settings, 'acme/owned')).toEqual({
      toolbar: true,
      settings_gear: true,
      sync_status: true,
      customize: true,
      tab_mutations: true,
    })
  })
})
