import type {
  BusinessHoursConfig,
  DashboardTab,
  MemberTeam,
  PrChangedFileRecord,
  PullRequestRecord,
  RepoRecord,
  ReviewRecord,
} from '@/lib/types'
import type { Repositories } from '@/repositories'
import { rebuild_pr_facts_for_repos } from '@/lib/rebuild_pr_facts'

export const REPO_SNAPSHOT_VERSION = 1 as const

export type RepoSnapshotSettingsSubset = {
  teams: MemberTeam[]
  dashboards: DashboardTab[]
  ignored_bots: string[]
  test_file_globs: string[]
  business_hours: BusinessHoursConfig
}

export type RepoSnapshotV1 = {
  schema_version: typeof REPO_SNAPSHOT_VERSION
  exported_at: string
  repo_full_name: string
  repos: RepoRecord[]
  pull_requests: PullRequestRecord[]
  reviews: ReviewRecord[]
  pr_changed_files: PrChangedFileRecord[]
  settings_subset: RepoSnapshotSettingsSubset
}

export class RepoSnapshotError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RepoSnapshotError'
  }
}

function repo_record_from_full_name(repo_full_name: string): RepoRecord {
  const [owner, name] = repo_full_name.split('/')
  if (!owner || !name) {
    throw new RepoSnapshotError(`Invalid repository name: ${repo_full_name}`)
  }
  return {
    full_name: repo_full_name,
    owner,
    name,
    added_at: new Date().toISOString(),
  }
}

function settings_subset_for_repo(
  settings: NonNullable<Awaited<ReturnType<Repositories['settings']['get']>>>,
  repo_full_name: string,
): RepoSnapshotSettingsSubset {
  return {
    teams: structuredClone(settings.teams),
    dashboards: structuredClone(
      settings.dashboards.filter((tab) => tab.repo_full_name === repo_full_name),
    ),
    ignored_bots: [...settings.ignored_bots],
    test_file_globs: [...settings.test_file_globs],
    business_hours: structuredClone(settings.business_hours),
  }
}

export async function export_repo_snapshot(
  repositories: Repositories,
  repo_full_name: string,
): Promise<RepoSnapshotV1> {
  const settings = await repositories.settings.get()
  if (!settings) {
    throw new RepoSnapshotError('Settings not initialized')
  }
  if (!settings.repos.includes(repo_full_name)) {
    throw new RepoSnapshotError(`Repository not tracked: ${repo_full_name}`)
  }

  const pull_requests = await repositories.pull_requests.list_by_repos([repo_full_name])
  const pr_ids = pull_requests.map((pr) => pr.id)
  const reviews = await repositories.reviews.list_by_pr_ids(pr_ids)
  const pr_changed_files = await repositories.pr_changed_files.list_by_pr_ids(pr_ids)

  return {
    schema_version: REPO_SNAPSHOT_VERSION,
    exported_at: new Date().toISOString(),
    repo_full_name,
    repos: [repo_record_from_full_name(repo_full_name)],
    pull_requests,
    reviews,
    pr_changed_files,
    settings_subset: settings_subset_for_repo(settings, repo_full_name),
  }
}

export function serialize_repo_snapshot(snapshot: RepoSnapshotV1): string {
  return JSON.stringify(snapshot)
}

export function parse_repo_snapshot(raw: string): RepoSnapshotV1 {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new RepoSnapshotError('Snapshot is not valid JSON')
  }
  return validate_repo_snapshot(parsed)
}

export function validate_repo_snapshot(value: unknown): RepoSnapshotV1 {
  if (!value || typeof value !== 'object') {
    throw new RepoSnapshotError('Snapshot must be an object')
  }
  const snapshot = value as Partial<RepoSnapshotV1>
  if (snapshot.schema_version !== REPO_SNAPSHOT_VERSION) {
    throw new RepoSnapshotError(`Unsupported snapshot version: ${String(snapshot.schema_version)}`)
  }
  if (!snapshot.repo_full_name || typeof snapshot.repo_full_name !== 'string') {
    throw new RepoSnapshotError('Snapshot is missing repo_full_name')
  }
  if (!Array.isArray(snapshot.pull_requests)) {
    throw new RepoSnapshotError('Snapshot is missing pull_requests')
  }
  if (!Array.isArray(snapshot.reviews)) {
    throw new RepoSnapshotError('Snapshot is missing reviews')
  }
  if (!Array.isArray(snapshot.pr_changed_files)) {
    throw new RepoSnapshotError('Snapshot is missing pr_changed_files')
  }
  if (!snapshot.settings_subset || typeof snapshot.settings_subset !== 'object') {
    throw new RepoSnapshotError('Snapshot is missing settings_subset')
  }
  return snapshot as RepoSnapshotV1
}

export function assert_snapshot_has_no_token(snapshot: RepoSnapshotV1): void {
  const json = JSON.stringify(snapshot)
  if (/"token"\s*:/.test(json)) {
    throw new RepoSnapshotError('Snapshot must not contain a GitHub token')
  }
}

export async function import_repo_snapshot(
  repositories: Repositories,
  snapshot: RepoSnapshotV1,
): Promise<{ repo_full_name: string; pr_count: number }> {
  validate_repo_snapshot(snapshot)
  assert_snapshot_has_no_token(snapshot)

  const repo_full_name = snapshot.repo_full_name
  const settings = await repositories.settings.get()
  if (!settings) {
    throw new RepoSnapshotError('Settings not initialized')
  }

  if (snapshot.pull_requests.length > 0) {
    await repositories.pull_requests.put_many(snapshot.pull_requests)
  }

  const reviews_by_pr = new Map<string, ReviewRecord[]>()
  for (const review of snapshot.reviews) {
    const list = reviews_by_pr.get(review.pr_id) ?? []
    list.push(review)
    reviews_by_pr.set(review.pr_id, list)
  }
  for (const [pr_id, reviews] of reviews_by_pr) {
    await repositories.reviews.replace_for_pr(pr_id, reviews)
  }

  const changed_files_by_pr = new Map<string, PrChangedFileRecord[]>()
  for (const file of snapshot.pr_changed_files) {
    const list = changed_files_by_pr.get(file.pr_id) ?? []
    list.push(file)
    changed_files_by_pr.set(file.pr_id, list)
  }
  for (const [pr_id, files] of changed_files_by_pr) {
    await repositories.pr_changed_files.replace_for_pr(pr_id, files)
  }

  const merged_repos = Array.from(new Set([...settings.repos, repo_full_name]))
  const merged_dashboards = [
    ...settings.dashboards.filter((tab) => tab.repo_full_name !== repo_full_name),
    ...snapshot.settings_subset.dashboards,
  ]
  const merged_teams = merge_teams_by_name(settings.teams, snapshot.settings_subset.teams)

  await repositories.settings.save({
    token: settings.token,
    repos: merged_repos,
    dashboards: merged_dashboards,
    teams: merged_teams,
    ignored_bots: snapshot.settings_subset.ignored_bots,
    test_file_globs: snapshot.settings_subset.test_file_globs,
    business_hours: snapshot.settings_subset.business_hours,
  })
  await repositories.settings.upsert_repos(merged_repos)
  await rebuild_pr_facts_for_repos(repositories, [repo_full_name])

  return { repo_full_name, pr_count: snapshot.pull_requests.length }
}

function merge_teams_by_name(existing: MemberTeam[], incoming: MemberTeam[]): MemberTeam[] {
  const by_name = new Map(existing.map((team) => [team.name, team]))
  for (const team of incoming) {
    if (!by_name.has(team.name)) {
      by_name.set(team.name, structuredClone(team))
    }
  }
  return [...by_name.values()]
}

export function download_repo_snapshot(snapshot: RepoSnapshotV1): void {
  const body = serialize_repo_snapshot(snapshot)
  const blob = new Blob([body], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const safe_name = snapshot.repo_full_name.replace(/\//g, '-')
  anchor.href = url
  anchor.download = `ilovepr-${safe_name}-snapshot.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export function parse_share_id_from_url(raw_url: string): string | null {
  try {
    const url = new URL(raw_url.trim())
    const from_query = url.searchParams.get('import') ?? url.searchParams.get('share')
    if (from_query?.trim()) return from_query.trim()
    const parts = url.pathname.split('/').filter(Boolean)
    const share_index = parts.indexOf('share')
    if (share_index >= 0 && parts[share_index + 1]) {
      return parts[share_index + 1]!
    }
    return null
  } catch {
    return raw_url.trim() || null
  }
}
