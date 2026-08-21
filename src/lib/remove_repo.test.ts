import { describe, expect, it } from 'vitest'
import { build_settings_after_remove_repo } from '@/lib/remove_repo'
import type { AppSettings } from '@/lib/types'

function base_settings(overrides: Partial<AppSettings> = {}): AppSettings {
  return {
    id: 'settings',
    token: 'ghp_test',
    repos: ['acme/app', 'acme/other'],
    active_repo: 'acme/app',
    sync_interval_hours: 24,
    backfill_limit: 100,
    ignored_bots: [],
    test_file_globs: [],
    teams: [],
    business_hours: {
      enabled: false,
      time_zone: 'UTC',
      workdays: [1, 2, 3, 4, 5],
      start_minutes: 9 * 60,
      end_minutes: 17 * 60,
    },
    dashboards: [
      {
        id: 'default-app',
        name: 'Overview',
        repo_full_name: 'acme/app',
        layout: [],
        members: [],
        period_key: '30d',
        custom_from: '',
        custom_to: '',
        hide_test_files: false,
      },
      {
        id: 'default-other',
        name: 'Overview',
        repo_full_name: 'acme/other',
        layout: [],
        members: [],
        period_key: '30d',
        custom_from: '',
        custom_to: '',
        hide_test_files: false,
      },
    ],
    active_dashboard_id: 'default-app',
    active_dashboard_by_repo: {
      'acme/app': 'default-app',
      'acme/other': 'default-other',
    },
    locale: null,
    onboarded_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('build_settings_after_remove_repo', () => {
  it('removes the repo, dashboards, and active dashboard mapping', () => {
    const next = build_settings_after_remove_repo(base_settings(), 'acme/app')

    expect(next.repos).toEqual(['acme/other'])
    expect(next.dashboards.map((tab) => tab.repo_full_name)).toEqual(['acme/other'])
    expect(next.active_dashboard_by_repo).toEqual({ 'acme/other': 'default-other' })
  })

  it('clamps active_repo to the first remaining repo', () => {
    const next = build_settings_after_remove_repo(base_settings(), 'acme/app')
    expect(next.active_repo).toBe('acme/other')
  })

  it('sets active_repo to null when the last repo is removed', () => {
    const next = build_settings_after_remove_repo(
      base_settings({ repos: ['acme/app'], active_repo: 'acme/app' }),
      'acme/app',
    )
    expect(next.repos).toEqual([])
    expect(next.active_repo).toBeNull()
  })
})
