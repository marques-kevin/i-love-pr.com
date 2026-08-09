import { isBotLogin } from './bots'
import {
  elapsedHours,
  type BusinessHoursConfig,
} from './business-hours'
import type {
  EnrichedPullRequest,
  PrFacts,
  PullRequestRecord,
  ReviewRecord,
} from './types'

/**
 * When review waiting starts: first "request review", else ready-for-review, else created.
 */
export function reviewWaitStartAt(pr: PullRequestRecord): string {
  return pr.firstReviewRequestedAt ?? pr.readyForReviewAt ?? pr.createdAt
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
): PrFacts {
  const humanReviews = reviews
    .filter((r) => !isBotLogin(r.author, ignoredBots) && r.author !== pr.author)
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))

  const waitStart = reviewWaitStartAt(pr)

  let cycleTimeHours: number | null = null
  if (pr.mergedAt) {
    cycleTimeHours = elapsedHours(pr.createdAt, pr.mergedAt, businessHours)
  }

  let timeToFirstReviewHours: number | null = null
  if (humanReviews.length > 0) {
    timeToFirstReviewHours = Math.max(
      0,
      elapsedHours(waitStart, humanReviews[0].submittedAt, businessHours),
    )
  }

  const firstApproval = humanReviews.find((r) => r.state === 'APPROVED')
  const firstApprovedAt = firstApproval?.submittedAt ?? null
  let timeToApproveHours: number | null = null
  if (firstApprovedAt) {
    timeToApproveHours = Math.max(
      0,
      elapsedHours(waitStart, firstApprovedAt, businessHours),
    )
  }

  return {
    isBot: isBotLogin(pr.author, ignoredBots),
    linesChanged: pr.additions + pr.deletions,
    firstApprovedAt,
    cycleTimeHours,
    timeToFirstReviewHours,
    timeToApproveHours,
    reviewRounds: countReviewRounds(humanReviews),
  }
}

export function enrichPullRequest(
  pr: PullRequestRecord,
  reviews: ReviewRecord[],
  ignoredBots: string[],
  businessHours?: BusinessHoursConfig | null,
): EnrichedPullRequest {
  return { ...pr, ...derivePrFacts(pr, reviews, ignoredBots, businessHours) }
}

function countReviewRounds(
  reviews: { author: string; state: string; submittedAt: string }[],
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
