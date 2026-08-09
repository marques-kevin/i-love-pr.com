import { describe, expect, it } from 'vitest'
import { derivePrFacts } from './derive'
import type { PullRequestRecord, ReviewRecord } from './types'

const base_pr: PullRequestRecord = {
  id: 'pr1',
  repo_full_name: 'acme/app',
  number: 1,
  title: 'feat',
  author: 'alice',
  state: 'MERGED',
  created_at: '2026-08-04T08:00:00.000Z',
  updated_at: '2026-08-04T12:00:00.000Z',
  closed_at: '2026-08-04T12:00:00.000Z',
  merged_at: '2026-08-04T12:00:00.000Z',
  ready_for_review_at: '2026-08-04T08:00:00.000Z',
  first_review_requested_at: '2026-08-04T09:00:00.000Z',
  additions: 40,
  deletions: 10,
  changed_files: 2,
  commits_count: 1,
  comments_count: 0,
  labels: [],
}

describe('derivePrFacts', () => {
  it('computes lines and review timings from raw rows', () => {
    const reviews: ReviewRecord[] = [
      {
        id: 'r1',
        pr_id: 'pr1',
        repo_full_name: 'acme/app',
        pr_number: 1,
        author: 'bob',
        state: 'COMMENTED',
        submitted_at: '2026-08-04T10:00:00.000Z',
      },
      {
        id: 'r2',
        pr_id: 'pr1',
        repo_full_name: 'acme/app',
        pr_number: 1,
        author: 'bob',
        state: 'APPROVED',
        submitted_at: '2026-08-04T11:00:00.000Z',
      },
    ]

    const facts = derivePrFacts(base_pr, reviews, [])
    expect(facts.is_bot).toBe(false)
    expect(facts.lines_changed).toBe(50)
    expect(facts.time_to_first_review_hours).toBe(1)
    expect(facts.time_to_approve_hours).toBe(2)
    expect(facts.cycle_time_hours).toBe(4)
    expect(facts.first_approved_at).toBe('2026-08-04T11:00:00.000Z')
  })

  it('ignores bot reviewers', () => {
    const reviews: ReviewRecord[] = [
      {
        id: 'r1',
        pr_id: 'pr1',
        repo_full_name: 'acme/app',
        pr_number: 1,
        author: 'dependabot[bot]',
        state: 'APPROVED',
        submitted_at: '2026-08-04T09:30:00.000Z',
      },
    ]
    const facts = derivePrFacts(base_pr, reviews, ['dependabot[bot]'])
    expect(facts.time_to_first_review_hours).toBeNull()
    expect(facts.time_to_approve_hours).toBeNull()
  })
})
