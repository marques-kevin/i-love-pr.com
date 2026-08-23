import { DEFAULT_IGNORED_BOTS } from '@/lib/bots'
import { normalizeBusinessHours, type BusinessHoursConfig } from '@/lib/business-hours'
import { DEFAULT_TEST_FILE_GLOBS } from '@/lib/test_file_patterns'
import type { RepoRecord } from '@/lib/types'
import type { Repositories } from '@/repositories'

export type RepoAnalysisSettings = {
  ignored_bots: string[]
  test_file_globs: string[]
  business_hours: BusinessHoursConfig
}

export type SaveRepoSettingsInput = {
  repo_full_name: string
  ignored_bots: string[]
  test_file_globs: string[]
  business_hours: BusinessHoursConfig
}

export function resolve_repo_settings(
  repo?: Pick<RepoRecord, 'ignored_bots' | 'test_file_globs' | 'business_hours'> | null,
): RepoAnalysisSettings {
  return {
    ignored_bots: repo?.ignored_bots ?? [...DEFAULT_IGNORED_BOTS],
    test_file_globs: repo?.test_file_globs ?? [...DEFAULT_TEST_FILE_GLOBS],
    business_hours: normalizeBusinessHours(repo?.business_hours),
  }
}

export function index_repo_records(records: RepoRecord[]): Record<string, RepoRecord> {
  return Object.fromEntries(records.map((record) => [record.full_name, record]))
}

export async function load_repo_analysis_settings(
  repositories: Repositories,
  repo_full_names: string[],
): Promise<Map<string, RepoAnalysisSettings>> {
  const records = await repositories.settings.list_repos()
  const by_name = new Map(records.map((record) => [record.full_name, record]))
  const result = new Map<string, RepoAnalysisSettings>()
  for (const repo_full_name of repo_full_names) {
    result.set(repo_full_name, resolve_repo_settings(by_name.get(repo_full_name)))
  }
  return result
}
