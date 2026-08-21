import {
  is_boolean_value,
  is_json_object,
  is_number_value,
  is_string_value,
  json_string_field,
  parse_json_array,
} from '@/lib/boundary_parse'
import type { ExternalValue, JsonArray, JsonObject, JsonValue } from '@/lib/json_value'
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
import { parse_dashboard_layout_from_json } from '@/lib/dashboard_layout'
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

function decode_json_value(raw: string): JsonValue {
  try {
    // SAFETY: JSON.parse output is normalized into a JsonValue tree before snapshot validation.
    const decoded = JSON.parse(raw) as ExternalValue
    return decode_external_value(decoded)
  } catch (error) {
    if (error instanceof RepoSnapshotError) throw error
    throw new RepoSnapshotError('Snapshot is not valid JSON')
  }
}

function decode_external_value(value: ExternalValue): JsonValue {
  if (value === null) return null
  if (is_string_value(value) || is_number_value(value) || is_boolean_value(value)) {
    return value
  }
  if (Array.isArray(value)) {
    return decode_external_array(value)
  }
  if (is_json_object(value)) {
    const decoded: JsonObject = {}
    for (const [key, entry] of Object.entries(value)) {
      decoded[key] = decode_external_value(entry)
    }
    return decoded
  }
  throw new RepoSnapshotError('Snapshot is not valid JSON')
}

function decode_external_array(values: ExternalValue[]): JsonArray {
  const rows: JsonValue[] = []
  for (const value of values) {
    rows.push(decode_external_value(value))
  }
  return rows
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
      settings.dashboards.filter(
        (tab) => tab.repo_full_name === repo_full_name && tab.layout.length > 0,
      ),
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
  return validate_repo_snapshot(decode_json_value(raw))
}

export function validate_repo_snapshot(value: JsonValue): RepoSnapshotV1 {
  if (!is_json_object(value)) {
    throw new RepoSnapshotError('Snapshot must be an object')
  }
  if (value.schema_version !== REPO_SNAPSHOT_VERSION) {
    throw new RepoSnapshotError(`Unsupported snapshot version: ${String(value.schema_version)}`)
  }
  const repo_full_name = json_string_field(value, 'repo_full_name', 'repoFullName')
  if (!repo_full_name) {
    throw new RepoSnapshotError('Snapshot is missing repo_full_name')
  }
  const settings_subset_raw = value.settings_subset
  if (!is_json_object(settings_subset_raw)) {
    throw new RepoSnapshotError('Snapshot is missing settings_subset')
  }

  const snapshot: RepoSnapshotV1 = {
    schema_version: REPO_SNAPSHOT_VERSION,
    exported_at: json_string_field(value, 'exported_at', 'exportedAt'),
    repo_full_name,
    repos: parse_repo_records(parse_json_array(value.repos)),
    pull_requests: parse_pull_request_records(parse_json_array(value.pull_requests)),
    reviews: parse_review_records(parse_json_array(value.reviews)),
    pr_changed_files: parse_changed_file_records(parse_json_array(value.pr_changed_files)),
    settings_subset: parse_settings_subset(settings_subset_raw),
  }
  return snapshot
}

function parse_repo_records(rows: JsonArray): RepoRecord[] {
  const repos: RepoRecord[] = []
  for (const row of rows) {
    if (!is_json_object(row)) continue
    const full_name = json_string_field(row, 'full_name', 'fullName')
    const owner = json_string_field(row, 'owner', 'owner')
    const name = json_string_field(row, 'name', 'name')
    const added_at = json_string_field(row, 'added_at', 'addedAt', new Date().toISOString())
    if (!full_name || !owner || !name) continue
    repos.push({ full_name, owner, name, added_at })
  }
  return repos
}

function parse_pull_request_records(rows: JsonArray): PullRequestRecord[] {
  const pull_requests: PullRequestRecord[] = []
  for (const row of rows) {
    if (!is_json_object(row)) continue
    const id = json_string_field(row, 'id', 'id')
    const repo_full_name = json_string_field(row, 'repo_full_name', 'repoFullName')
    const number = row.number
    if (!id || !repo_full_name || !is_number_value(number)) continue
    pull_requests.push({
      id,
      repo_full_name,
      number,
      title: json_string_field(row, 'title', 'title'),
      author: json_string_field(row, 'author', 'author'),
      state: parse_pr_state(row.state),
      created_at: json_string_field(row, 'created_at', 'createdAt'),
      updated_at: json_string_field(row, 'updated_at', 'updatedAt'),
      closed_at: json_nullable_string(row, 'closed_at', 'closedAt'),
      merged_at: json_nullable_string(row, 'merged_at', 'mergedAt'),
      ready_for_review_at: json_nullable_string(row, 'ready_for_review_at', 'readyForReviewAt'),
      first_review_requested_at: json_nullable_string(
        row,
        'first_review_requested_at',
        'firstReviewRequestedAt',
      ),
      additions: is_number_value(row.additions) ? row.additions : 0,
      deletions: is_number_value(row.deletions) ? row.deletions : 0,
      changed_files: is_number_value(row.changed_files) ? row.changed_files : 0,
      commits_count: is_number_value(row.commits_count) ? row.commits_count : 0,
      comments_count: is_number_value(row.comments_count) ? row.comments_count : 0,
      labels: parse_string_array(row.labels),
    })
  }
  return pull_requests
}

function parse_review_records(rows: JsonArray): ReviewRecord[] {
  const reviews: ReviewRecord[] = []
  for (const row of rows) {
    if (!is_json_object(row)) continue
    const id = json_string_field(row, 'id', 'id')
    const pr_id = json_string_field(row, 'pr_id', 'prId')
    const repo_full_name = json_string_field(row, 'repo_full_name', 'repoFullName')
    const number = row.pr_number ?? row.number
    if (!id || !pr_id || !repo_full_name || !is_number_value(number)) continue
    reviews.push({
      id,
      pr_id,
      repo_full_name,
      pr_number: number,
      author: json_string_field(row, 'author', 'author'),
      state: parse_review_state(row.state),
      submitted_at: json_string_field(row, 'submitted_at', 'submittedAt'),
    })
  }
  return reviews
}

function parse_changed_file_records(rows: JsonArray): PrChangedFileRecord[] {
  const files: PrChangedFileRecord[] = []
  for (const row of rows) {
    if (!is_json_object(row)) continue
    const id = json_string_field(row, 'id', 'id')
    const pr_id = json_string_field(row, 'pr_id', 'prId')
    const path = json_string_field(row, 'path', 'path')
    if (!id || !pr_id || !path) continue
    files.push({
      id,
      pr_id,
      path,
      additions: is_number_value(row.additions) ? row.additions : 0,
      deletions: is_number_value(row.deletions) ? row.deletions : 0,
    })
  }
  return files
}

function parse_settings_subset(row: JsonObject): RepoSnapshotSettingsSubset {
  return {
    teams: parse_team_records(parse_json_array(row.teams)),
    dashboards: parse_dashboard_records(parse_json_array(row.dashboards)),
    ignored_bots: parse_string_array(row.ignored_bots),
    test_file_globs: parse_string_array(row.test_file_globs ?? row.testFileGlobs),
    business_hours: parse_business_hours(row.business_hours ?? row.businessHours),
  }
}

function parse_team_records(rows: JsonArray): MemberTeam[] {
  const teams: MemberTeam[] = []
  for (const row of rows) {
    if (!is_json_object(row)) continue
    const id = json_string_field(row, 'id', 'id')
    const name = json_string_field(row, 'name', 'name')
    if (!id || !name) continue
    teams.push({
      id,
      name,
      members: parse_string_array(row.members),
      created_at: json_string_field(row, 'created_at', 'createdAt', new Date().toISOString()),
    })
  }
  return teams
}

function parse_dashboard_records(rows: JsonArray): DashboardTab[] {
  const dashboards: DashboardTab[] = []
  for (const row of rows) {
    if (!is_json_object(row)) continue
    const id = json_string_field(row, 'id', 'id')
    const repo_full_name = json_string_field(row, 'repo_full_name', 'repoFullName')
    if (!id || !repo_full_name) continue
    const layout = parse_dashboard_layout_from_json(row.layout)
    if (!layout || layout.length === 0) continue
    dashboards.push({
      id,
      name: json_string_field(row, 'name', 'name'),
      repo_full_name,
      layout,
      members: parse_string_array(row.members),
      period_key: parse_period_key(row.period_key ?? row.periodKey),
      custom_from: json_string_field(row, 'custom_from', 'customFrom'),
      custom_to: json_string_field(row, 'custom_to', 'customTo'),
      hide_test_files: row.hide_test_files === true || row.hideTestFiles === true,
    })
  }
  return dashboards
}

function parse_business_hours(value: JsonValue | undefined): BusinessHoursConfig {
  if (value === undefined || !is_json_object(value)) {
    return {
      enabled: false,
      time_zone: 'UTC',
      workdays: [1, 2, 3, 4, 5],
      start_minutes: 9 * 60,
      end_minutes: 17 * 60,
    }
  }
  const workdays: number[] = []
  if (Array.isArray(value.workdays)) {
    for (const day of value.workdays) {
      if (is_number_value(day)) workdays.push(day)
    }
  }
  return {
    enabled: value.enabled === true,
    time_zone: json_string_field(value, 'time_zone', 'timeZone', 'UTC'),
    workdays: workdays.length > 0 ? workdays : [1, 2, 3, 4, 5],
    start_minutes: is_number_value(value.start_minutes)
      ? value.start_minutes
      : is_number_value(value.startMinutes)
        ? value.startMinutes
        : 9 * 60,
    end_minutes: is_number_value(value.end_minutes)
      ? value.end_minutes
      : is_number_value(value.endMinutes)
        ? value.endMinutes
        : 17 * 60,
  }
}

function parse_string_array(value: JsonValue | undefined): string[] {
  if (!Array.isArray(value)) return []
  const strings: string[] = []
  for (const item of value) {
    if (is_string_value(item)) strings.push(item)
  }
  return strings
}

function json_nullable_string(row: JsonObject, snake: string, camel: string): string | null {
  const raw = row[snake] ?? row[camel]
  if (raw === null || raw === undefined) return null
  return is_string_value(raw) ? raw : null
}

function parse_pr_state(value: JsonValue | undefined): PullRequestRecord['state'] {
  if (value === 'OPEN' || value === 'CLOSED' || value === 'MERGED') return value
  return 'OPEN'
}

function parse_review_state(value: JsonValue | undefined): ReviewRecord['state'] {
  if (
    value === 'APPROVED' ||
    value === 'CHANGES_REQUESTED' ||
    value === 'COMMENTED' ||
    value === 'DISMISSED' ||
    value === 'PENDING'
  ) {
    return value
  }
  return 'COMMENTED'
}

function parse_period_key(value: JsonValue | undefined): DashboardTab['period_key'] {
  if (value === '7d' || value === '30d' || value === '90d' || value === 'custom') return value
  return '30d'
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
  const previous_imported = settings.imported_repos ?? []
  const is_pat_repo =
    settings.repos.includes(repo_full_name) && !previous_imported.includes(repo_full_name)
  const merged_imported_repos = is_pat_repo
    ? previous_imported.filter((repo) => repo !== repo_full_name)
    : Array.from(new Set([...previous_imported, repo_full_name]))
  const incoming_dashboards = snapshot.settings_subset.dashboards.filter(
    (tab) => tab.layout.length > 0,
  )
  const merged_dashboards =
    incoming_dashboards.length > 0
      ? [
          ...settings.dashboards.filter((tab) => tab.repo_full_name !== repo_full_name),
          ...incoming_dashboards,
        ]
      : settings.dashboards
  const merged_teams = merge_teams_by_name(settings.teams, snapshot.settings_subset.teams)

  await repositories.settings.save({
    token: settings.token,
    repos: merged_repos,
    imported_repos: merged_imported_repos,
    dashboards: merged_dashboards,
    teams: merged_teams,
    ignored_bots: settings.ignored_bots,
    test_file_globs: settings.test_file_globs,
    business_hours: settings.business_hours,
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
