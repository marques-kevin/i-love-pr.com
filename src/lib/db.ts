import Dexie, { type EntityTable, type Transaction } from 'dexie'
import {
  normalize_active_dashboard_id,
  normalize_dashboards,
} from './dashboard_layout'
import { normalize_stored_locale } from './i18n'
import type {
  AppSettings,
  DashboardLayoutItem,
  DashboardTab,
  PrFactRecord,
  PullRequestRecord,
  RepoRecord,
  ReviewRecord,
  SyncState,
} from './types'

export const DEFAULT_BACKFILL_LIMIT = 200

/** Legacy empty table kept so Dexie schema stays valid for existing DBs. */
type LegacyChartSpecRow = { id: string }

type LegacyRow = Record<string, unknown>

function as_rows(value: unknown): LegacyRow[] {
  return Array.isArray(value) ? (value as LegacyRow[]) : []
}

function migrate_settings_row(row: LegacyRow): AppSettings {
  const teams = as_rows(row.teams).map((team) => ({
    id: String(team.id ?? ''),
    name: String(team.name ?? ''),
    members: Array.isArray(team.members) ? (team.members as string[]) : [],
    created_at: String(team.created_at ?? team.createdAt ?? new Date().toISOString()),
  }))
  const business =
    row.business_hours && typeof row.business_hours === 'object'
      ? (row.business_hours as LegacyRow)
      : row.businessHours && typeof row.businessHours === 'object'
        ? (row.businessHours as LegacyRow)
        : {}

  const legacy_layout = Array.isArray(row.dashboard_layout)
    ? (row.dashboard_layout as DashboardLayoutItem[])
    : undefined
  const dashboards = normalize_dashboards(
    Array.isArray(row.dashboards) ? (row.dashboards as DashboardTab[]) : undefined,
    legacy_layout,
  )

  return {
    id: 'settings',
    token: String(row.token ?? ''),
    repos: Array.isArray(row.repos) ? (row.repos as string[]) : [],
    sync_interval_hours: Number(row.sync_interval_hours ?? row.syncIntervalHours ?? 24),
    backfill_limit: Number(row.backfill_limit ?? row.backfillLimit ?? DEFAULT_BACKFILL_LIMIT),
    ignored_bots: Array.isArray(row.ignored_bots)
      ? (row.ignored_bots as string[])
      : Array.isArray(row.ignoredBots)
        ? (row.ignoredBots as string[])
        : [],
    teams,
    business_hours: {
      enabled: Boolean(business.enabled ?? false),
      time_zone: String(business.time_zone ?? business.timeZone ?? 'UTC'),
      workdays: Array.isArray(business.workdays)
        ? (business.workdays as number[])
        : [1, 2, 3, 4, 5],
      start_minutes: Number(business.start_minutes ?? business.startMinutes ?? 9 * 60),
      end_minutes: Number(business.end_minutes ?? business.endMinutes ?? 18 * 60),
    },
    dashboards,
    active_dashboard_id: normalize_active_dashboard_id(
      typeof row.active_dashboard_id === 'string' ? row.active_dashboard_id : undefined,
      dashboards,
    ),
    locale: normalize_stored_locale(row.locale),
    onboarded_at: String(row.onboarded_at ?? row.onboardedAt ?? new Date().toISOString()),
  }
}

function migrate_repo_row(row: LegacyRow): RepoRecord | null {
  const full_name = String(row.full_name ?? row.fullName ?? '')
  if (!full_name) return null
  return {
    full_name,
    owner: String(row.owner ?? full_name.split('/')[0] ?? ''),
    name: String(row.name ?? full_name.split('/')[1] ?? ''),
    added_at: String(row.added_at ?? row.addedAt ?? new Date().toISOString()),
  }
}

function migrate_sync_state_row(row: LegacyRow): SyncState | null {
  const repo_full_name = String(row.repo_full_name ?? row.repoFullName ?? '')
  if (!repo_full_name) return null
  return {
    repo_full_name,
    cursor_updated_at: (row.cursor_updated_at ?? row.cursorUpdatedAt ?? null) as string | null,
    page_cursor: (row.page_cursor ?? row.pageCursor ?? null) as string | null,
    mode: (row.mode as SyncState['mode']) ?? 'idle',
    last_synced_at: (row.last_synced_at ?? row.lastSyncedAt ?? null) as string | null,
    last_error: (row.last_error ?? row.lastError ?? null) as string | null,
    total_fetched: Number(row.total_fetched ?? row.totalFetched ?? 0),
    backfill_fetched: Number(row.backfill_fetched ?? row.backfillFetched ?? 0),
  }
}

function migrate_pull_request_row(row: LegacyRow): PullRequestRecord | null {
  const id = String(row.id ?? '')
  if (!id) return null
  return {
    id,
    repo_full_name: String(row.repo_full_name ?? row.repoFullName ?? ''),
    number: Number(row.number ?? 0),
    title: String(row.title ?? ''),
    author: String(row.author ?? ''),
    state: (row.state as PullRequestRecord['state']) ?? 'OPEN',
    created_at: String(row.created_at ?? row.createdAt ?? ''),
    updated_at: String(row.updated_at ?? row.updatedAt ?? ''),
    closed_at: (row.closed_at ?? row.closedAt ?? null) as string | null,
    merged_at: (row.merged_at ?? row.mergedAt ?? null) as string | null,
    ready_for_review_at: (row.ready_for_review_at ?? row.readyForReviewAt ?? null) as string | null,
    first_review_requested_at: (row.first_review_requested_at ??
      row.firstReviewRequestedAt ??
      null) as string | null,
    additions: Number(row.additions ?? 0),
    deletions: Number(row.deletions ?? 0),
    changed_files: Number(row.changed_files ?? row.changedFiles ?? 0),
    commits_count: Number(row.commits_count ?? row.commitsCount ?? 0),
    comments_count: Number(row.comments_count ?? row.commentsCount ?? 0),
    labels: Array.isArray(row.labels) ? (row.labels as string[]) : [],
  }
}

function migrate_review_row(row: LegacyRow): ReviewRecord | null {
  const id = String(row.id ?? '')
  if (!id) return null
  return {
    id,
    pr_id: String(row.pr_id ?? row.prId ?? ''),
    repo_full_name: String(row.repo_full_name ?? row.repoFullName ?? ''),
    pr_number: Number(row.pr_number ?? row.prNumber ?? 0),
    author: String(row.author ?? ''),
    state: (row.state as ReviewRecord['state']) ?? 'COMMENTED',
    submitted_at: String(row.submitted_at ?? row.submittedAt ?? ''),
  }
}

async function migrate_to_snake_case(tx: Transaction): Promise<void> {
  const settings_rows = as_rows(await tx.table('settings').toArray())
  await tx.table('settings').clear()
  for (const row of settings_rows) {
    await tx.table('settings').put(migrate_settings_row(row))
  }

  const repo_rows = as_rows(await tx.table('repos').toArray())
  await tx.table('repos').clear()
  for (const row of repo_rows) {
    const next = migrate_repo_row(row)
    if (next) await tx.table('repos').put(next)
  }

  const review_rows = as_rows(await tx.table('reviews').toArray())
  await tx.table('reviews').clear()
  for (const row of review_rows) {
    const next = migrate_review_row(row)
    if (next) await tx.table('reviews').put(next)
  }

  const pull_rows = as_rows(await tx.table('pullRequests').toArray())
  for (const row of pull_rows) {
    const next = migrate_pull_request_row(row)
    if (next) await tx.table('pull_requests').put(next)
  }

  const sync_rows = as_rows(await tx.table('syncState').toArray())
  for (const row of sync_rows) {
    const next = migrate_sync_state_row(row)
    if (next) await tx.table('sync_state').put(next)
  }

  const fact_rows = as_rows(await tx.table('prFacts').toArray())
  for (const row of fact_rows) {
    if (row.pr_id) await tx.table('pr_facts').put(row)
  }
}

export class IlovePrDatabase extends Dexie {
  settings!: EntityTable<AppSettings, 'id'>
  repos!: EntityTable<RepoRecord, 'full_name'>
  pull_requests!: EntityTable<PullRequestRecord, 'id'>
  reviews!: EntityTable<ReviewRecord, 'id'>
  sync_state!: EntityTable<SyncState, 'repo_full_name'>
  pr_facts!: EntityTable<PrFactRecord, 'pr_id'>
  chart_specs!: EntityTable<LegacyChartSpecRow, 'id'>

  constructor() {
    super('ilovepr')
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
  }
}

export const db = new IlovePrDatabase()
