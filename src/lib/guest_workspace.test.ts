import { describe, expect, it } from 'vitest'
import { DEFAULT_BUSINESS_HOURS } from '@/lib/business-hours'
import { DEFAULT_IGNORED_BOTS } from '@/lib/bots'
import { DEFAULT_TEST_FILE_GLOBS } from '@/lib/test_file_patterns'
import { should_mount_app_shell } from '@/lib/guest_workspace'
import type { AppSettings } from '@/lib/types'

function base_settings(overrides: Partial<AppSettings> = {}): AppSettings {
  return {
    id: 'settings',
    token: '',
    repos: [],
    imported_repos: [],
    active_repo: null,
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
    ...overrides,
  }
}

describe('should_mount_app_shell', () => {
  it('returns false when settings are missing', () => {
    expect(should_mount_app_shell(null)).toBe(false)
  })

  it('returns true for empty token with imported repos', () => {
    expect(
      should_mount_app_shell(
        base_settings({
          token: '',
          repos: ['acme/widgets'],
          imported_repos: ['acme/widgets'],
        }),
      ),
    ).toBe(true)
  })

  it('returns false for empty token with no repos', () => {
    expect(should_mount_app_shell(base_settings({ token: '', repos: [] }))).toBe(false)
  })

  it('returns true when a GitHub token is configured', () => {
    expect(
      should_mount_app_shell(
        base_settings({
          token: 'ghp_test',
          repos: [],
        }),
      ),
    ).toBe(true)
  })
})
