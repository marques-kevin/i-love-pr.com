export type PrState = 'OPEN' | 'CLOSED' | 'MERGED'

export type ReviewState = 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED' | 'PENDING'

export type { BusinessHoursConfig } from './business-hours'
import type { BusinessHoursConfig } from './business-hours'
import type { AppLocale } from './i18n/locale'

export interface MemberTeam {
  id: string
  name: string
  members: string[]
  created_at: string
}

/** Prefabricated dashboard chart / panel ids. */
export type DashboardWidgetId =
  | 'summary_stats'
  | 'cycle_time'
  | 'throughput'
  | 'pr_size'
  | 'reviewer_load'
  | 'size_review_insight'
  | 'size_vs_review'
  | 'size_review_scatter'
  | 'open_prs'
  | 'cycle_breakdown'
  | 'review_latency'
  | 'cycle_percentiles'
  | 'review_rounds'
  | 'no_review_merges'
  | 'author_leaderboard'
  | 'open_pr_age'
  | 'flow_volume'

export interface DashboardLayoutItem {
  /** Stable instance key (allows the same widget more than once later). */
  instance_id: string
  widget_id: DashboardWidgetId
}

export interface DashboardTab {
  id: string
  /** Display name; empty for the built-in default tab (label from i18n). */
  name: string
  layout: DashboardLayoutItem[]
}

export interface AppSettings {
  id: 'settings'
  token: string
  repos: string[]
  sync_interval_hours: number
  /** Max PRs to pull per repo during a backfill (most recently updated first) */
  backfill_limit: number
  ignored_bots: string[]
  /** Saved member filter presets (teams) */
  teams: MemberTeam[]
  business_hours: BusinessHoursConfig
  /** Named dashboard tabs (first is the default). */
  dashboards: DashboardTab[]
  /** Selected dashboard tab id. */
  active_dashboard_id: string
  /** Explicit UI language; `null` = follow browser on each app init. */
  locale: AppLocale | null
  onboarded_at: string
}

export interface RepoRecord {
  full_name: string
  owner: string
  name: string
  added_at: string
}

export interface SyncState {
  repo_full_name: string
  /** ISO timestamp of the most recent PR updated_at fully processed */
  cursor_updated_at: string | null
  /** Pagination cursor for in-progress backfill */
  page_cursor: string | null
  mode: 'idle' | 'backfill' | 'incremental' | 'paused'
  last_synced_at: string | null
  last_error: string | null
  total_fetched: number
  /** PRs fetched so far in the current backfill campaign (toward backfill_limit) */
  backfill_fetched: number
}

/** Raw PR metadata as synced from GitHub — no derived metrics. */
export interface PullRequestRecord {
  id: string
  repo_full_name: string
  number: number
  title: string
  author: string
  state: PrState
  created_at: string
  updated_at: string
  closed_at: string | null
  merged_at: string | null
  ready_for_review_at: string | null
  /** Earliest ReviewRequestedEvent from GitHub timeline (raw) */
  first_review_requested_at: string | null
  additions: number
  deletions: number
  changed_files: number
  commits_count: number
  comments_count: number
  labels: string[]
}

/** Raw review event as synced from GitHub. */
export interface ReviewRecord {
  id: string
  pr_id: string
  repo_full_name: string
  pr_number: number
  author: string
  state: ReviewState
  submitted_at: string
}

/** Metrics computed at derive-time (in-memory enrich). */
export interface PrFacts {
  is_bot: boolean
  lines_changed: number
  first_approved_at: string | null
  cycle_time_hours: number | null
  time_to_first_review_hours: number | null
  time_to_approve_hours: number | null
  review_rounds: number
}

/**
 * Cached derived row in IndexedDB — snake_case, denormalized for fast filters.
 * Rebuilt on sync / settings change; not the same shape as raw GitHub rows.
 */
export interface PrFactCycleHours {
  time_from_creation_to_asked_for_review: number | null
  time_from_creation_to_merged: number | null
  time_from_creation_to_approved: number | null
  time_from_asked_for_review_to_approved: number | null
  time_from_asked_for_review_to_first_review: number | null
}

export interface PrFactRecord {
  /** Schema / derive formula version — bump `PR_FACTS_VERSION` to force rebuild. */
  _version: number
  pr_id: string
  repo_full_name: string
  author: string
  state: PrState
  created_at: string
  merged_at: string | null
  pr_number: number
  title: string
  /** When review wait starts: first request-review, else ready-for-review, else created. */
  request_review_at: string
  first_approved_at: string | null
  is_bot: boolean
  lines_added: number
  lines_deleted: number
  lines_changed: number
  review_rounds: number
  cycle: PrFactCycleHours
}

export type EnrichedPullRequest = PullRequestRecord & PrFacts

/** Bump when derive formulas / pr_facts shape change to force a local facts rebuild. */
export const PR_FACTS_VERSION = 8

/** @deprecated use PR_FACTS_VERSION */
export const DERIVE_VERSION = PR_FACTS_VERSION

export interface RateLimitInfo {
  remaining: number
  limit: number
  reset_at: string
  cost?: number
}

export interface NormalizedPullRequest {
  pull_request: PullRequestRecord
  reviews: ReviewRecord[]
}

export type PeriodKey = '7d' | '30d' | '90d' | 'custom'

export interface PeriodRange {
  key: PeriodKey
  from: Date
  to: Date
}

export interface SyncProgress {
  repo_full_name: string
  mode: SyncState['mode']
  fetched: number
  message: string
  rate_limit: RateLimitInfo | null
}

export interface MetricsSnapshot {
  cycleTimeSeries: { date: string; avgHours: number; count: number }[]
  cycleBreakdownSeries: {
    date: string
    createToAskHours: number
    askToFirstReviewHours: number
    firstReviewToApproveHours: number
    approveToMergeHours: number
    count: number
  }[]
  reviewLatencySeries: {
    date: string
    avgTimeToFirstReviewHours: number
    avgTimeToApproveHours: number
    count: number
  }[]
  cyclePercentileSeries: {
    date: string
    p50Hours: number
    p95Hours: number
    count: number
  }[]
  prSizeBuckets: { bucket: string; count: number }[]
  sizeVsReviewTime: {
    bucket: string
    count: number
    avgTimeToFirstReviewHours: number | null
    avgTimeToApproveHours: number | null
    avgCycleTimeHours: number | null
    avgHoursPerHundredLines: number | null
  }[]
  sizeReviewScatter: {
    lines: number
    timeToFirstReviewHours: number
    timeToApproveHours: number | null
    cycleTimeHours: number | null
    number: number
    title: string
    repoFullName: string
  }[]
  sizeReviewCorrelation: {
    linesVsTimeToFirstReview: number | null
    linesVsTimeToApprove: number | null
    sampleSize: number
  }
  throughput: { period: string; author: string; count: number }[]
  reviewerLoad: { reviewer: string; given: number; received: number }[]
  reviewRoundsBuckets: { rounds: string; count: number }[]
  noReviewMerges: {
    mergedCount: number
    noReviewCount: number
    noReviewRatio: number | null
  }
  authorLeaderboard: {
    author: string
    mergedCount: number
    avgCycleTimeHours: number | null
    avgLinesChanged: number | null
    avgReviewRounds: number | null
  }[]
  openPrAgeBuckets: { bucket: string; count: number }[]
  flowVolumeSeries: { date: string; opened: number; merged: number }[]
  openPrs: PrFactRecord[]
  summary: {
    mergedCount: number
    avgCycleTimeHours: number | null
    avgTimeToFirstReviewHours: number | null
    avgTimeToApproveHours: number | null
    avgReviewRounds: number | null
    avgLinesChanged: number | null
  }
}
