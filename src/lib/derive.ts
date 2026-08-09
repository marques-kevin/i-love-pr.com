import { isBotLogin } from './bots'
import {
  create_elapsed_hours_fn,
  type BusinessHoursConfig,
  type ElapsedHoursFn,
} from './business-hours'
import type { EnrichedPullRequest, PrFacts, PullRequestRecord, ReviewRecord } from './types'

/**
 * When review waiting starts: first "request review", else ready-for-review, else created.
 */
export function reviewWaitStartAt(pr: PullRequestRecord): string {
  return pr.first_review_requested_at ?? pr.ready_for_review_at ?? pr.created_at
}

/**
 * Pure read-time enrichment. Source of truth is raw GitHub rows in IndexedDB;
 * change a formula here without re-syncing.
 */
export function derivePrFacts(
  pr: PullRequestRecord,
  reviews: ReviewRecord[],
  ignoredBots: string[],
  businessHours?: BusinessHoursConfig | null,
  elapsed: ElapsedHoursFn = create_elapsed_hours_fn(businessHours),
): PrFacts {
  const humanReviews = reviews
    .filter((r) => !isBotLogin(r.author, ignoredBots) && r.author !== pr.author)
    .sort((a, b) => a.submitted_at.localeCompare(b.submitted_at))

  const waitStart = reviewWaitStartAt(pr)

  let cycle_time_hours: number | null = null
  if (pr.merged_at) {
    cycle_time_hours = elapsed(pr.created_at, pr.merged_at)
  }

  let time_to_first_review_hours: number | null = null
  if (humanReviews.length > 0) {
    time_to_first_review_hours = Math.max(0, elapsed(waitStart, humanReviews[0].submitted_at))
  }

  const firstApproval = humanReviews.find((r) => r.state === 'APPROVED')
  const first_approved_at = firstApproval?.submitted_at ?? null
  let time_to_approve_hours: number | null = null
  if (first_approved_at) {
    time_to_approve_hours = Math.max(0, elapsed(waitStart, first_approved_at))
  }

  return {
    is_bot: isBotLogin(pr.author, ignoredBots),
    lines_changed: pr.additions + pr.deletions,
    first_approved_at,
    cycle_time_hours,
    time_to_first_review_hours,
    time_to_approve_hours,
    review_rounds: countReviewRounds(humanReviews),
  }
}

export function enrichPullRequest(
  pr: PullRequestRecord,
  reviews: ReviewRecord[],
  ignoredBots: string[],
  businessHours?: BusinessHoursConfig | null,
  elapsed?: ElapsedHoursFn,
): EnrichedPullRequest {
  return {
    ...pr,
    ...derivePrFacts(pr, reviews, ignoredBots, businessHours, elapsed),
  }
}

function countReviewRounds(
  reviews: { author: string; state: string; submitted_at: string }[],
): number {
  if (reviews.length === 0) return 0
  const changes = reviews.filter((r) => r.state === 'CHANGES_REQUESTED').length
  const hasApproval = reviews.some((r) => r.state === 'APPROVED')
  return Math.max(1, changes + (hasApproval ? 1 : 0))
}

export function isHumanReview(
  review: ReviewRecord,
  prAuthor: string,
  ignoredBots: string[],
): boolean {
  return !isBotLogin(review.author, ignoredBots) && review.author !== prAuthor
}
