export type PrState = 'OPEN' | 'CLOSED' | 'MERGED'

export type ReviewState =
  | 'APPROVED'
  | 'CHANGES_REQUESTED'
  | 'COMMENTED'
  | 'DISMISSED'
  | 'PENDING'

export type { BusinessHoursConfig } from './business-hours'
import type { BusinessHoursConfig } from './business-hours'

export interface MemberTeam {
  id: string
  name: string
  members: string[]
  createdAt: string
}

export interface AppSettings {
  id: 'settings'
  token: string
  repos: string[]
  syncIntervalHours: number
  /** Max PRs to pull per repo during a backfill (most recently updated first) */
  backfillLimit: number
  ignoredBots: string[]
  /** Saved member filter presets (teams) */
  teams: MemberTeam[]
  businessHours: BusinessHoursConfig
  onboardedAt: string
}

export interface RepoRecord {
  fullName: string
  owner: string
  name: string
  addedAt: string
}

export interface SyncState {
  repoFullName: string
  /** ISO timestamp of the most recent PR updatedAt fully processed */
  cursorUpdatedAt: string | null
  /** Pagination cursor for in-progress backfill */
  pageCursor: string | null
  mode: 'idle' | 'backfill' | 'incremental' | 'paused'
  lastSyncedAt: string | null
  lastError: string | null
  totalFetched: number
  /** PRs fetched so far in the current backfill campaign (toward backfillLimit) */
  backfillFetched: number
}

/** Raw PR metadata as synced from GitHub — no derived metrics. */
export interface PullRequestRecord {
  id: string
  repoFullName: string
  number: number
  title: string
  author: string
  state: PrState
  createdAt: string
  updatedAt: string
  closedAt: string | null
  mergedAt: string | null
  readyForReviewAt: string | null
  /** Earliest ReviewRequestedEvent from GitHub timeline (raw) */
  firstReviewRequestedAt: string | null
  additions: number
  deletions: number
  changedFiles: number
  commitsCount: number
  commentsCount: number
  labels: string[]
}

/** Raw review event as synced from GitHub. */
export interface ReviewRecord {
  id: string
  prId: string
  repoFullName: string
  prNumber: number
  author: string
  state: ReviewState
  submittedAt: string
}

/** Metrics computed at read-time from raw PR + reviews (+ current bot list). */
export interface PrFacts {
  isBot: boolean
  linesChanged: number
  firstApprovedAt: string | null
  cycleTimeHours: number | null
  timeToFirstReviewHours: number | null
  timeToApproveHours: number | null
  reviewRounds: number
}

export type EnrichedPullRequest = PullRequestRecord & PrFacts

export interface RateLimitInfo {
  remaining: number
  limit: number
  resetAt: string
  cost?: number
}

export interface NormalizedPullRequest {
  pullRequest: PullRequestRecord
  reviews: ReviewRecord[]
}

export type PeriodKey = '7d' | '30d' | '90d' | 'custom'

export interface PeriodRange {
  key: PeriodKey
  from: Date
  to: Date
}

export interface SyncProgress {
  repoFullName: string
  mode: SyncState['mode']
  fetched: number
  message: string
  rateLimit: RateLimitInfo | null
}

export interface MetricsSnapshot {
  cycleTimeSeries: { date: string; avgHours: number; count: number }[]
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
  openPrs: EnrichedPullRequest[]
  summary: {
    mergedCount: number
    avgCycleTimeHours: number | null
    avgTimeToFirstReviewHours: number | null
    avgTimeToApproveHours: number | null
    avgReviewRounds: number | null
    avgLinesChanged: number | null
  }
}
