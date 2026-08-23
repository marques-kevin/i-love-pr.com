import { describe, expect, it } from 'vitest'
import { DEFAULT_IGNORED_BOTS } from '@/lib/bots'
import { DEFAULT_BUSINESS_HOURS } from '@/lib/business-hours'
import { default_repo_settings } from '@/lib/repo_settings'
import { DEFAULT_TEST_FILE_GLOBS } from '@/lib/test_file_patterns'
import type { AppSettings } from '@/lib/types'
import { create_memory_repositories } from './memory_repositories'

const leftover_global_settings: AppSettings = {
  id: 'settings',
  token: 't',
  repos: ['acme/app'],
  imported_repos: [],
  active_repo: 'acme/app',
  sync_interval_hours: 24,
  backfill_limit: 200,
  ignored_bots: ['global-bot'],
  test_file_globs: ['**/*.global.ts'],
  teams: [],
  business_hours: { ...DEFAULT_BUSINESS_HOURS, enabled: true, time_zone: 'Europe/Paris' },
  dashboards: [],
  active_dashboard_id: '',
  active_dashboard_by_repo: {},
  locale: null,
  onboarded_at: '2026-01-01T00:00:00.000Z',
}

describe('repo_settings repository', () => {
  it('returns factory defaults when no row exists', async () => {
    const repositories = create_memory_repositories()
    const resolved = await repositories.repo_settings.get('acme/app')
    expect(resolved).toEqual(default_repo_settings('acme/app'))
    expect(resolved.ignored_bots).toEqual([...DEFAULT_IGNORED_BOTS])
    expect(resolved.test_file_globs).toEqual([...DEFAULT_TEST_FILE_GLOBS])
    expect(resolved.business_hours).toEqual({
      ...DEFAULT_BUSINESS_HOURS,
      workdays: [...DEFAULT_BUSINESS_HOURS.workdays],
    })
  })

  it('does not copy leftover global AppSettings onto a missing row', async () => {
    const repositories = create_memory_repositories({ settings: leftover_global_settings })
    const resolved = await repositories.repo_settings.get('acme/app')
    expect(resolved.ignored_bots).toEqual([...DEFAULT_IGNORED_BOTS])
    expect(resolved.test_file_globs).toEqual([...DEFAULT_TEST_FILE_GLOBS])
    expect(resolved.business_hours.enabled).toBe(false)
  })

  it('saving repo A does not change repo B resolved config', async () => {
    const repositories = create_memory_repositories()
    const saved_a = await repositories.repo_settings.save({
      repo_full_name: 'acme/a',
      ignored_bots: ['only-a-bot'],
      test_file_globs: ['**/*.a.ts'],
      business_hours: { ...DEFAULT_BUSINESS_HOURS, enabled: true, time_zone: 'Europe/Paris' },
    })
    expect(saved_a.ignored_bots).toEqual(['only-a-bot'])

    const resolved_b = await repositories.repo_settings.get('acme/b')
    expect(resolved_b).toEqual(default_repo_settings('acme/b'))
    expect(resolved_b.ignored_bots).not.toContain('only-a-bot')

    const resolved_a = await repositories.repo_settings.get('acme/a')
    expect(resolved_a.ignored_bots).toEqual(['only-a-bot'])
    expect(resolved_a.test_file_globs).toEqual(['**/*.a.ts'])
    expect(resolved_a.business_hours.enabled).toBe(true)
  })
})
