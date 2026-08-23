import { describe, expect, it } from 'vitest'
import { DEFAULT_IGNORED_BOTS } from '@/lib/bots'
import { DEFAULT_BUSINESS_HOURS } from '@/lib/business-hours'
import { resolve_repo_settings } from '@/lib/repo_settings'
import { DEFAULT_TEST_FILE_GLOBS } from '@/lib/test_file_patterns'

describe('resolve_repo_settings', () => {
  it('uses factory defaults when the repo has no saved prefs', () => {
    expect(resolve_repo_settings(undefined)).toEqual({
      ignored_bots: DEFAULT_IGNORED_BOTS,
      test_file_globs: DEFAULT_TEST_FILE_GLOBS,
      business_hours: DEFAULT_BUSINESS_HOURS,
    })
    expect(resolve_repo_settings({})).toEqual({
      ignored_bots: DEFAULT_IGNORED_BOTS,
      test_file_globs: DEFAULT_TEST_FILE_GLOBS,
      business_hours: DEFAULT_BUSINESS_HOURS,
    })
  })

  it('keeps an explicit empty ignored_bots list', () => {
    const resolved = resolve_repo_settings({
      ignored_bots: [],
      test_file_globs: ['**/*.spec.ts'],
      business_hours: { ...DEFAULT_BUSINESS_HOURS, enabled: true },
    })
    expect(resolved.ignored_bots).toEqual([])
    expect(resolved.test_file_globs).toEqual(['**/*.spec.ts'])
    expect(resolved.business_hours.enabled).toBe(true)
  })
})
