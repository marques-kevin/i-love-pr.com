import { DEFAULT_IGNORED_BOTS } from '@/lib/bots'
import { DEFAULT_BUSINESS_HOURS, normalizeBusinessHours } from '@/lib/business-hours'
import { DEFAULT_TEST_FILE_GLOBS } from '@/lib/test_file_patterns'
import type { RepoSettings } from '@/lib/types'

export function default_repo_settings(repo_full_name: string): RepoSettings {
  return {
    repo_full_name,
    ignored_bots: [...DEFAULT_IGNORED_BOTS],
    test_file_globs: [...DEFAULT_TEST_FILE_GLOBS],
    business_hours: {
      ...DEFAULT_BUSINESS_HOURS,
      workdays: [...DEFAULT_BUSINESS_HOURS.workdays],
    },
  }
}

export function normalize_repo_settings(
  repo_full_name: string,
  row?: Partial<RepoSettings> | null,
): RepoSettings {
  const defaults = default_repo_settings(repo_full_name)
  return {
    repo_full_name,
    ignored_bots: row?.ignored_bots != null ? [...row.ignored_bots] : defaults.ignored_bots,
    test_file_globs:
      row?.test_file_globs != null ? [...row.test_file_globs] : defaults.test_file_globs,
    business_hours: normalizeBusinessHours(row?.business_hours ?? defaults.business_hours),
  }
}

export function parse_ignored_bots(text: string): string[] {
  return text
    .split(/[\n,]/)
    .map((line) => line.trim())
    .filter(Boolean)
}
