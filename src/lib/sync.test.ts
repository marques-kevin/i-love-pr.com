import { describe, expect, it } from 'vitest'
import { DEFAULT_BUSINESS_HOURS } from '@/lib/business-hours'
import { DEFAULT_IGNORED_BOTS } from '@/lib/bots'
import { DEFAULT_TEST_FILE_GLOBS } from '@/lib/test_file_patterns'
import { sync_all_repos } from '@/lib/sync'
import type { AppSettings } from '@/lib/types'
import { create_memory_repositories } from '@/repositories'

function settings_with_token(token: string, repos: string[]): AppSettings {
  return {
    id: 'settings',
    token,
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

describe('sync_all_repos', () => {
  it('skips GitHub when the token is empty', async () => {
    const repositories = create_memory_repositories({
      settings: settings_with_token('', ['acme/widgets']),
    })
    const result = await sync_all_repos({ repositories, force: true })
    expect(result).toEqual({ rate_limit: null, sync_completed: false })
  })

  it('skips GitHub when settings are missing', async () => {
    const repositories = create_memory_repositories()
    const result = await sync_all_repos({ repositories })
    expect(result).toEqual({ rate_limit: null, sync_completed: false })
  })
})
