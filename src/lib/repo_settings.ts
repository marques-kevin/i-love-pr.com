import { DEFAULT_IGNORED_BOTS } from '@/lib/bots'
import { DEFAULT_BUSINESS_HOURS, normalizeBusinessHours } from '@/lib/business-hours'
import { DEFAULT_TEST_FILE_GLOBS } from '@/lib/test_file_patterns'
import type { BusinessHoursConfig, RepoSettings, RepoSettingsRecord } from '@/lib/types'

export function default_repo_settings(repo_full_name: string): RepoSettings {
  return {
    repo_full_name,
    ignored_bots: [...DEFAULT_IGNORED_BOTS],
    test_file_globs: [...DEFAULT_TEST_FILE_GLOBS],
    business_hours: normalizeBusinessHours(DEFAULT_BUSINESS_HOURS),
  }
}

export function resolve_repo_settings(
  stored: RepoSettingsRecord | undefined,
  repo_full_name: string,
): RepoSettings {
  if (!stored) return default_repo_settings(repo_full_name)
  return {
    repo_full_name,
    ignored_bots:
      stored.ignored_bots.length > 0 ? [...stored.ignored_bots] : [...DEFAULT_IGNORED_BOTS],
    test_file_globs:
      stored.test_file_globs.length > 0
        ? [...stored.test_file_globs]
        : [...DEFAULT_TEST_FILE_GLOBS],
    business_hours: normalizeBusinessHours(stored.business_hours ?? DEFAULT_BUSINESS_HOURS),
  }
}

export type SaveRepoSettingsInput = {
  ignored_bots?: string[]
  test_file_globs?: string[]
  business_hours?: BusinessHoursConfig
}
