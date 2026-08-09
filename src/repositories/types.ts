import type {
  AppSettings,
  MemberTeam,
  NormalizedPullRequest,
  PullRequestRecord,
  ReviewRecord,
  SyncState,
} from '@/lib/types'

export type SaveSettingsInput = Partial<Omit<AppSettings, 'id'>> & {
  token: string
  repos: string[]
}

export interface SettingsRepository {
  get: () => Promise<AppSettings | undefined>
  save: (partial: SaveSettingsInput) => Promise<AppSettings>
  save_teams: (teams: MemberTeam[]) => Promise<AppSettings>
  upsert_team: (input: {
    name: string
    members: string[]
    id?: string
  }) => Promise<AppSettings>
  delete_team: (id: string) => Promise<AppSettings>
  upsert_repos: (full_names: string[]) => Promise<void>
  clear_all_data: () => Promise<void>
  reset_sync_data: () => Promise<void>
}

export interface PullRequestRepository {
  list_by_repos: (repos: string[]) => Promise<PullRequestRecord[]>
  count_by_repo: (repo_full_name: string) => Promise<number>
  put_many: (prs: PullRequestRecord[]) => Promise<void>
  clear: () => Promise<void>
}

export interface ReviewRepository {
  list_by_pr_ids: (pr_ids: string[]) => Promise<ReviewRecord[]>
  list_by_repos: (repos: string[]) => Promise<ReviewRecord[]>
  replace_for_pr: (pr_id: string, reviews: ReviewRecord[]) => Promise<void>
  clear: () => Promise<void>
}

export interface SyncStateRepository {
  get: (repo_full_name: string) => Promise<SyncState | undefined>
  list: () => Promise<SyncState[]>
  put: (state: SyncState) => Promise<void>
  update: (
    repo_full_name: string,
    patch: Partial<SyncState>,
  ) => Promise<SyncState>
  ensure: (repo_full_name: string) => Promise<SyncState>
  reset_all: () => Promise<void>
  clear: () => Promise<void>
}

export interface Repositories {
  settings: SettingsRepository
  pull_requests: PullRequestRepository
  reviews: ReviewRepository
  sync_state: SyncStateRepository
}

/** Persist a synced page of raw PRs + reviews. */
export async function persist_normalized_page(
  repositories: Repositories,
  items: NormalizedPullRequest[],
): Promise<void> {
  if (items.length === 0) return
  for (const item of items) {
    await repositories.pull_requests.put_many([item.pullRequest])
    await repositories.reviews.replace_for_pr(item.pullRequest.id, item.reviews)
  }
}
