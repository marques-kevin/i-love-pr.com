import Dexie, { type EntityTable, type Transaction } from 'dexie'
import {
  external_object_array,
  is_boolean_value,
  is_json_object,
  is_number_value,
  json_nullable_string_field,
  json_number_array,
  json_string_array,
  json_string_field,
  optional_json_string,
  parse_json_array,
  parse_string_record,
  pick_json_object,
} from './boundary_parse'
import {
  normalize_settings_dashboards,
  parse_dashboard_layout_from_json,
  parse_dashboard_tabs_from_json,
} from './dashboard_layout'
import { normalize_stored_locale } from './i18n'
import { DEFAULT_TEST_FILE_GLOBS } from './test_file_patterns'
import type { JsonObject, JsonValue } from './json_value'
import type {
  AppSettings,
  PrChangedFileRecord,
  PrFactRecord,
  PullRequestRecord,
  RepoRecord,
  ReviewRecord,
  SyncState,
} from './types'

export const DEFAULT_BACKFILL_LIMIT = 200

/** Legacy empty table kept so Dexie schema stays valid for existing DBs. */
type LegacyChartSpecRow = { id: string }

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

function parse_sync_mode(value: JsonValue | undefined): SyncState['mode'] {
  if (value === 'idle' || value === 'backfill' || value === 'incremental' || value === 'paused') {
    return value
  }
  return 'idle'
}

function migrate_settings_row(row: JsonObject): AppSettings {
  const teams = parse_json_array(row.teams)
    .filter(is_json_object)
    .map((team) => ({
      id: json_string_field(team, 'id', 'id'),
      name: json_string_field(team, 'name', 'name'),
      members: json_string_array(team.members),
      created_at: json_string_field(team, 'created_at', 'createdAt', new Date().toISOString()),
    }))
  const business = pick_json_object(row.business_hours ?? row.businessHours)
  const legacy_layout = parse_dashboard_layout_from_json(row.dashboard_layout)
  const repos = json_string_array(row.repos)
  const dashboards_fields = normalize_settings_dashboards({
    repos,
    active_repo: optional_json_string(row.active_repo),
    dashboards: parse_dashboard_tabs_from_json(row.dashboards),
    active_dashboard_id:
      optional_json_string(row.active_dashboard_id) ?? optional_json_string(row.activeDashboardId),
    active_dashboard_by_repo: parse_string_record(
      row.active_dashboard_by_repo ?? row.activeDashboardByRepo,
    ),
    dashboard_layout: legacy_layout,
  })

  return {
    id: 'settings',
    token: json_string_field(row, 'token', 'token'),
    repos,
    sync_interval_hours: Number(row.sync_interval_hours ?? row.syncIntervalHours ?? 24),
    backfill_limit: Number(row.backfill_limit ?? row.backfillLimit ?? DEFAULT_BACKFILL_LIMIT),
    ignored_bots: json_string_array(row.ignored_bots ?? row.ignoredBots),
    test_file_globs:
      json_string_array(row.test_file_globs).length > 0
        ? json_string_array(row.test_file_globs)
        : json_string_array(row.testFileGlobs).length > 0
          ? json_string_array(row.testFileGlobs)
          : [...DEFAULT_TEST_FILE_GLOBS],
    teams,
    business_hours: {
      enabled: is_boolean_value(business.enabled) ? business.enabled : false,
      time_zone: json_string_field(business, 'time_zone', 'timeZone', 'UTC'),
      workdays:
        json_number_array(business.workdays).length > 0
          ? json_number_array(business.workdays)
          : [1, 2, 3, 4, 5],
      start_minutes: is_number_value(business.start_minutes)
        ? business.start_minutes
        : is_number_value(business.startMinutes)
          ? business.startMinutes
          : 9 * 60,
      end_minutes: is_number_value(business.end_minutes)
        ? business.end_minutes
        : is_number_value(business.endMinutes)
          ? business.endMinutes
          : 18 * 60,
    },
    ...dashboards_fields,
    locale: normalize_stored_locale(row.locale ?? null),
    onboarded_at: json_string_field(row, 'onboarded_at', 'onboardedAt', new Date().toISOString()),
  }
}

function migrate_repo_row(row: JsonObject): RepoRecord | null {
  const full_name = json_string_field(row, 'full_name', 'fullName')
  if (!full_name) return null
  return {
    full_name,
    owner: json_string_field(row, 'owner', 'owner', full_name.split('/')[0] ?? ''),
    name: json_string_field(row, 'name', 'name', full_name.split('/')[1] ?? ''),
    added_at: json_string_field(row, 'added_at', 'addedAt', new Date().toISOString()),
  }
}

function migrate_sync_state_row(row: JsonObject): SyncState | null {
  const repo_full_name = json_string_field(row, 'repo_full_name', 'repoFullName')
  if (!repo_full_name) return null
  return {
    repo_full_name,
    cursor_updated_at: json_nullable_string_field(row, 'cursor_updated_at', 'cursorUpdatedAt'),
    page_cursor: json_nullable_string_field(row, 'page_cursor', 'pageCursor'),
    mode: parse_sync_mode(row.mode),
    last_synced_at: json_nullable_string_field(row, 'last_synced_at', 'lastSyncedAt'),
    last_error: json_nullable_string_field(row, 'last_error', 'lastError'),
    total_fetched: Number(row.total_fetched ?? row.totalFetched ?? 0),
    backfill_fetched: Number(row.backfill_fetched ?? row.backfillFetched ?? 0),
    remote_oldest_created_at: json_nullable_string_field(
      row,
      'remote_oldest_created_at',
      'remoteOldestCreatedAt',
    ),
  }
}

function migrate_pull_request_row(row: JsonObject): PullRequestRecord | null {
  const id = json_string_field(row, 'id', 'id')
  if (!id) return null
  return {
    id,
    repo_full_name: json_string_field(row, 'repo_full_name', 'repoFullName'),
    number: Number(row.number ?? 0),
    title: json_string_field(row, 'title', 'title'),
    author: json_string_field(row, 'author', 'author'),
    state: parse_pr_state(row.state),
    created_at: json_string_field(row, 'created_at', 'createdAt'),
    updated_at: json_string_field(row, 'updated_at', 'updatedAt'),
    closed_at: json_nullable_string_field(row, 'closed_at', 'closedAt'),
    merged_at: json_nullable_string_field(row, 'merged_at', 'mergedAt'),
    ready_for_review_at: json_nullable_string_field(row, 'ready_for_review_at', 'readyForReviewAt'),
    first_review_requested_at: json_nullable_string_field(
      row,
      'first_review_requested_at',
      'firstReviewRequestedAt',
    ),
    additions: Number(row.additions ?? 0),
    deletions: Number(row.deletions ?? 0),
    changed_files: Number(row.changed_files ?? row.changedFiles ?? 0),
    commits_count: Number(row.commits_count ?? row.commitsCount ?? 0),
    comments_count: Number(row.comments_count ?? row.commentsCount ?? 0),
    labels: json_string_array(row.labels),
  }
}

function json_nullable_number_field(row: JsonObject, snake: string, camel: string): number | null {
  const raw = row[snake] ?? row[camel]
  return is_number_value(raw) ? raw : null
}

function migrate_pr_fact_row(row: JsonObject): PrFactRecord | null {
  const pr_id = json_string_field(row, 'pr_id', 'prId')
  if (!pr_id) return null
  const cycle = pick_json_object(row.cycle)
  return {
    _version: Number(row._version ?? 0),
    pr_id,
    repo_full_name: json_string_field(row, 'repo_full_name', 'repoFullName'),
    author: json_string_field(row, 'author', 'author'),
    state: parse_pr_state(row.state),
    created_at: json_string_field(row, 'created_at', 'createdAt'),
    merged_at: json_nullable_string_field(row, 'merged_at', 'mergedAt'),
    pr_number: Number(row.pr_number ?? row.prNumber ?? 0),
    title: json_string_field(row, 'title', 'title'),
    request_review_at: json_string_field(row, 'request_review_at', 'requestReviewAt'),
    first_approved_at: json_nullable_string_field(row, 'first_approved_at', 'firstApprovedAt'),
    is_bot: row.is_bot === true || row.isBot === true,
    lines_added: Number(row.lines_added ?? row.linesAdded ?? 0),
    lines_deleted: Number(row.lines_deleted ?? row.linesDeleted ?? 0),
    lines_changed: Number(row.lines_changed ?? row.linesChanged ?? 0),
    review_rounds: Number(row.review_rounds ?? row.reviewRounds ?? 0),
    cycle: {
      time_from_creation_to_asked_for_review: json_nullable_number_field(
        cycle,
        'time_from_creation_to_asked_for_review',
        'timeFromCreationToAskedForReview',
      ),
      time_from_creation_to_merged: json_nullable_number_field(
        cycle,
        'time_from_creation_to_merged',
        'timeFromCreationToMerged',
      ),
      time_from_creation_to_approved: json_nullable_number_field(
        cycle,
        'time_from_creation_to_approved',
        'timeFromCreationToApproved',
      ),
      time_from_asked_for_review_to_approved: json_nullable_number_field(
        cycle,
        'time_from_asked_for_review_to_approved',
        'timeFromAskedForReviewToApproved',
      ),
      time_from_asked_for_review_to_first_review: json_nullable_number_field(
        cycle,
        'time_from_asked_for_review_to_first_review',
        'timeFromAskedForReviewToFirstReview',
      ),
    },
  }
}

function migrate_review_row(row: JsonObject): ReviewRecord | null {
  const id = json_string_field(row, 'id', 'id')
  if (!id) return null
  return {
    id,
    pr_id: json_string_field(row, 'pr_id', 'prId'),
    repo_full_name: json_string_field(row, 'repo_full_name', 'repoFullName'),
    pr_number: Number(row.pr_number ?? row.prNumber ?? 0),
    author: json_string_field(row, 'author', 'author'),
    state: parse_review_state(row.state),
    submitted_at: json_string_field(row, 'submitted_at', 'submittedAt'),
  }
}

async function migrate_to_snake_case(tx: Transaction): Promise<void> {
  const settings_rows = external_object_array(await tx.table('settings').toArray())
  await tx.table('settings').clear()
  for (const row of settings_rows) {
    await tx.table('settings').put(migrate_settings_row(row))
  }

  const repo_rows = external_object_array(await tx.table('repos').toArray())
  await tx.table('repos').clear()
  for (const row of repo_rows) {
    const next = migrate_repo_row(row)
    if (next) await tx.table('repos').put(next)
  }

  const review_rows = external_object_array(await tx.table('reviews').toArray())
  await tx.table('reviews').clear()
  for (const row of review_rows) {
    const next = migrate_review_row(row)
    if (next) await tx.table('reviews').put(next)
  }

  const pull_rows = external_object_array(await tx.table('pullRequests').toArray())
  for (const row of pull_rows) {
    const next = migrate_pull_request_row(row)
    if (next) await tx.table('pull_requests').put(next)
  }

  const sync_rows = external_object_array(await tx.table('syncState').toArray())
  for (const row of sync_rows) {
    const next = migrate_sync_state_row(row)
    if (next) await tx.table('sync_state').put(next)
  }

  const fact_rows = external_object_array(await tx.table('prFacts').toArray())
  for (const row of fact_rows) {
    const next = migrate_pr_fact_row(row)
    if (next) await tx.table('pr_facts').put(next)
  }
}

export const LEGACY_WORKSPACE_DB_NAME = 'ilovepr'

export class IlovePrDatabase extends Dexie {
  settings!: EntityTable<AppSettings, 'id'>
  repos!: EntityTable<RepoRecord, 'full_name'>
  pull_requests!: EntityTable<PullRequestRecord, 'id'>
  reviews!: EntityTable<ReviewRecord, 'id'>
  sync_state!: EntityTable<SyncState, 'repo_full_name'>
  pr_facts!: EntityTable<PrFactRecord, 'pr_id'>
  pr_changed_files!: EntityTable<PrChangedFileRecord, 'id'>
  chart_specs!: EntityTable<LegacyChartSpecRow, 'id'>

  constructor(name = LEGACY_WORKSPACE_DB_NAME) {
    super(name)
    this.version(1).stores({
      settings: 'id',
      repos: 'fullName, owner',
      pullRequests:
        'id, repoFullName, number, author, state, createdAt, updatedAt, mergedAt, [repoFullName+updatedAt]',
      reviews: 'id, prId, repoFullName, prNumber, author, submittedAt, [repoFullName+author]',
      syncState: 'repoFullName, lastSyncedAt, mode',
    })
    this.version(2).stores({
      settings: 'id',
      repos: 'fullName, owner',
      pullRequests:
        'id, repoFullName, number, author, state, createdAt, updatedAt, mergedAt, [repoFullName+updatedAt]',
      reviews: 'id, prId, repoFullName, prNumber, author, submittedAt, [repoFullName+author]',
      syncState: 'repoFullName, lastSyncedAt, mode',
      prFacts: 'prId, repoFullName, author, isBot, mergedAt, state, createdAt',
      chartSpecs: 'id, updatedAt',
    })
    this.version(3)
      .stores({
        settings: 'id',
        repos: 'fullName, owner',
        pullRequests:
          'id, repoFullName, number, author, state, createdAt, updatedAt, mergedAt, [repoFullName+updatedAt]',
        reviews: 'id, prId, repoFullName, prNumber, author, submittedAt, [repoFullName+author]',
        syncState: 'repoFullName, lastSyncedAt, mode',
        prFacts: 'pr_id, repo_full_name, author, is_bot, merged_at, state, created_at',
        chartSpecs: 'id, updatedAt',
      })
      .upgrade(async (tx) => {
        await tx.table('prFacts').clear()
      })
    this.version(4)
      .stores({
        settings: 'id',
        repos: 'fullName, owner',
        pullRequests:
          'id, repoFullName, number, author, state, createdAt, updatedAt, mergedAt, [repoFullName+updatedAt]',
        reviews: 'id, prId, repoFullName, prNumber, author, submittedAt, [repoFullName+author]',
        syncState: 'repoFullName, lastSyncedAt, mode',
        prFacts: 'pr_id, repo_full_name, author, is_bot, merged_at, state, created_at',
        chartSpecs: 'id, updatedAt',
      })
      .upgrade(async (tx) => {
        await tx.table('prFacts').clear()
      })
    this.version(5)
      .stores({
        settings: 'id',
        repos: 'fullName, owner',
        pullRequests:
          'id, repoFullName, number, author, state, createdAt, updatedAt, mergedAt, [repoFullName+updatedAt]',
        reviews: 'id, prId, repoFullName, prNumber, author, submittedAt, [repoFullName+author]',
        syncState: 'repoFullName, lastSyncedAt, mode',
        prFacts: 'pr_id, repo_full_name, author, is_bot, merged_at, state, created_at',
        chartSpecs: 'id, updatedAt',
      })
      .upgrade(async (tx) => {
        await tx.table('prFacts').clear()
      })
    this.version(6)
      .stores({
        settings: 'id',
        repos: 'full_name, owner',
        pull_requests:
          'id, repo_full_name, number, author, state, created_at, updated_at, merged_at, [repo_full_name+updated_at]',
        reviews:
          'id, pr_id, repo_full_name, pr_number, author, submitted_at, [repo_full_name+author]',
        sync_state: 'repo_full_name, last_synced_at, mode',
        pr_facts: 'pr_id, repo_full_name, author, is_bot, merged_at, state, created_at',
        chart_specs: 'id',
        // Delete legacy camelCase table names after copy in upgrade.
        pullRequests: null,
        syncState: null,
        prFacts: null,
        chartSpecs: null,
      })
      .upgrade(async (tx) => {
        await migrate_to_snake_case(tx)
      })
    this.version(7)
      .stores({
        settings: 'id',
        repos: 'full_name, owner',
        pull_requests:
          'id, repo_full_name, number, author, state, created_at, updated_at, merged_at, [repo_full_name+updated_at]',
        reviews:
          'id, pr_id, repo_full_name, pr_number, author, submitted_at, [repo_full_name+author]',
        sync_state: 'repo_full_name, last_synced_at, mode',
        pr_facts: 'pr_id, repo_full_name, author, is_bot, merged_at, state, created_at',
        pr_changed_files: 'id, pr_id, path',
        chart_specs: 'id',
      })
      .upgrade(async (tx) => {
        const settings_rows = external_object_array(await tx.table('settings').toArray())
        for (const row of settings_rows) {
          const migrated = migrate_settings_row(row)
          await tx.table('settings').put(migrated)
        }
      })
  }
}

export function workspace_db_name(login: string): string {
  const safe = login
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
  return `ilovepr-${safe || 'user'}`
}

export function open_workspace_db(login: string): IlovePrDatabase {
  return new IlovePrDatabase(workspace_db_name(login))
}
