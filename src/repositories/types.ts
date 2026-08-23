import type {
  AppSettings,
  MemberTeam,
  NormalizedPullRequest,
  PrChangedFileRecord,
  PrFactRecord,
  PullRequestRecord,
  RepoSettings,
  ReviewRecord,
  SyncState,
  DashboardLayoutItem,
} from '@/lib/types'
import type { PrCreatedAtBounds } from '@/lib/pr_coverage'
import type { DashboardTabFilters } from '@/lib/dashboard_layout'

export type SaveSettingsInput = Partial<Omit<AppSettings, 'id'>> & {
  token: string
  repos: string[]
}

export interface SettingsRepository {
  get: () => Promise<AppSettings | undefined>
  save: (partial: SaveSettingsInput) => Promise<AppSettings>
  save_teams: (teams: MemberTeam[]) => Promise<AppSettings>
  save_dashboard_layout: (layout: DashboardLayoutItem[]) => Promise<AppSettings>
  save_dashboard_filters: (
    input: DashboardTabFilters & { dashboard_id: string },
  ) => Promise<AppSettings>
  create_dashboard: (name: string) => Promise<AppSettings>
  rename_dashboard: (input: { dashboard_id: string; name: string }) => Promise<AppSettings>
  delete_dashboard: (dashboard_id: string) => Promise<AppSettings>
  set_active_dashboard: (dashboard_id: string) => Promise<AppSettings>
  set_active_repo: (repo_full_name: string) => Promise<AppSettings>
  save_locale: (locale: AppSettings['locale']) => Promise<AppSettings>
  upsert_team: (input: { name: string; members: string[]; id?: string }) => Promise<AppSettings>
  delete_team: (id: string) => Promise<AppSettings>
  upsert_repos: (full_names: string[]) => Promise<void>
  delete_repo: (repo_full_name: string) => Promise<void>
  clear_all_data: () => Promise<void>
  reset_sync_data: () => Promise<void>
}

export interface PullRequestRepository {
  list_by_repos: (repos: string[]) => Promise<PullRequestRecord[]>
  get_created_at_bounds_by_repos: (repos: string[]) => Promise<PrCreatedAtBounds | null>
  count_by_repo: (repo_full_name: string) => Promise<number>
  put_many: (prs: PullRequestRecord[]) => Promise<void>
  delete_by_repos: (repos: string[]) => Promise<void>
  clear: () => Promise<void>
}

export interface ReviewRepository {
  list_by_pr_ids: (pr_ids: string[]) => Promise<ReviewRecord[]>
  list_by_repos: (repos: string[]) => Promise<ReviewRecord[]>
  replace_for_pr: (pr_id: string, reviews: ReviewRecord[]) => Promise<void>
  delete_by_repos: (repos: string[]) => Promise<void>
  clear: () => Promise<void>
}

export interface SyncStateRepository {
  get: (repo_full_name: string) => Promise<SyncState | undefined>
  list: () => Promise<SyncState[]>
  put: (state: SyncState) => Promise<void>
  update: (repo_full_name: string, patch: Partial<SyncState>) => Promise<SyncState>
  ensure: (repo_full_name: string) => Promise<SyncState>
  delete_by_repos: (repos: string[]) => Promise<void>
  reset_all: () => Promise<void>
  clear: () => Promise<void>
}

export interface PrFactsRepository {
  list_by_repos: (repos: string[]) => Promise<PrFactRecord[]>
  put_many: (facts: PrFactRecord[]) => Promise<void>
  delete_many: (pr_ids: string[]) => Promise<void>
  delete_by_repos: (repos: string[]) => Promise<void>
  clear: () => Promise<void>
}

export interface RepoSettingsRepository {
  get: (repo_full_name: string) => Promise<RepoSettings>
  get_many: (repo_full_names: string[]) => Promise<Record<string, RepoSettings>>
  save: (settings: RepoSettings) => Promise<RepoSettings>
  delete: (repo_full_name: string) => Promise<void>
}

export interface PrChangedFilesRepository {
  list_by_pr_ids: (pr_ids: string[]) => Promise<PrChangedFileRecord[]>
  replace_for_pr: (pr_id: string, files: PrChangedFileRecord[]) => Promise<void>
  delete_by_pr_ids: (pr_ids: string[]) => Promise<void>
  delete_by_repos: (repos: string[]) => Promise<void>
  clear: () => Promise<void>
}

export interface Repositories {
  settings: SettingsRepository
  repo_settings: RepoSettingsRepository
  pull_requests: PullRequestRepository
  reviews: ReviewRepository
  sync_state: SyncStateRepository
  pr_facts: PrFactsRepository
  pr_changed_files: PrChangedFilesRepository
}

/** Persist a synced page of raw PRs + reviews, then rebuild derived facts. */
export async function persist_normalized_page(
  repositories: Repositories,
  items: NormalizedPullRequest[],
): Promise<void> {
  if (items.length === 0) return
  for (const item of items) {
    await repositories.pull_requests.put_many([item.pull_request])
    await repositories.reviews.replace_for_pr(item.pull_request.id, item.reviews)
    await repositories.pr_changed_files.replace_for_pr(item.pull_request.id, item.changed_files)
  }
  const { rebuild_pr_facts_for_prs } = await import('@/lib/rebuild_pr_facts')
  await rebuild_pr_facts_for_prs(
    repositories,
    items.map((item) => item.pull_request),
  )
}
