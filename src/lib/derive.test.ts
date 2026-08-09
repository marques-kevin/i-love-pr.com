import { describe, expect, it } from 'vitest'
import { derivePrFacts } from './derive'
import type { PullRequestRecord, ReviewRecord } from './types'

const base_pr: PullRequestRecord = {
  id: 'pr1',
  repoFullName: 'acme/app',
  number: 1,
  title: 'feat',
  author: 'alice',
  state: 'MERGED',
  createdAt: '2026-08-04T08:00:00.000Z',
  updatedAt: '2026-08-04T12:00:00.000Z',
  closedAt: '2026-08-04T12:00:00.000Z',
  mergedAt: '2026-08-04T12:00:00.000Z',
  readyForReviewAt: '2026-08-04T08:00:00.000Z',
  firstReviewRequestedAt: '2026-08-04T09:00:00.000Z',
  additions: 40,
  deletions: 10,
  changedFiles: 2,
  commitsCount: 1,
  commentsCount: 0,
  labels: [],
}

describe('derivePrFacts', () => {
  it('computes lines and review timings from raw rows', () => {
    const reviews: ReviewRecord[] = [
      {
        id: 'r1',
        prId: 'pr1',
        repoFullName: 'acme/app',
        prNumber: 1,
        author: 'bob',
        state: 'COMMENTED',
        submittedAt: '2026-08-04T10:00:00.000Z',
      },
      {
        id: 'r2',
        prId: 'pr1',
        repoFullName: 'acme/app',
        prNumber: 1,
        author: 'bob',
        state: 'APPROVED',
        submittedAt: '2026-08-04T11:00:00.000Z',
      },
    ]

    const facts = derivePrFacts(base_pr, reviews, [])
    expect(facts.isBot).toBe(false)
    expect(facts.linesChanged).toBe(50)
    expect(facts.timeToFirstReviewHours).toBe(1)
    expect(facts.timeToApproveHours).toBe(2)
    expect(facts.cycleTimeHours).toBe(4)
    expect(facts.firstApprovedAt).toBe('2026-08-04T11:00:00.000Z')
  })

  it('ignores bot reviewers', () => {
    const reviews: ReviewRecord[] = [
      {
        id: 'r1',
        prId: 'pr1',
        repoFullName: 'acme/app',
        prNumber: 1,
        author: 'dependabot[bot]',
        state: 'APPROVED',
        submittedAt: '2026-08-04T09:30:00.000Z',
      },
    ]
    const facts = derivePrFacts(base_pr, reviews, ['dependabot[bot]'])
    expect(facts.timeToFirstReviewHours).toBeNull()
    expect(facts.timeToApproveHours).toBeNull()
  })
})
