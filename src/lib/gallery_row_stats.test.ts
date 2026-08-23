import { describe, expect, it } from 'vitest'
import { PR_FACTS_VERSION, type PrFactRecord } from './types'
import {
  EMPTY_GALLERY_ROW_STATS,
  GALLERY_SPARKLINE_WEEKS,
  compute_gallery_row_stats,
} from './gallery_row_stats'

const NOW = new Date('2026-08-23T16:00:00.000Z')

function make_fact(overrides: Partial<PrFactRecord> = {}): PrFactRecord {
  return {
    _version: PR_FACTS_VERSION,
    pr_id: 'acme/app#1',
    repo_full_name: 'acme/app',
    author: 'alice',
    state: 'MERGED',
    created_at: '2026-08-10T10:00:00.000Z',
    merged_at: '2026-08-11T10:00:00.000Z',
    pr_number: 1,
    title: 'Ship it',
    request_review_at: '2026-08-10T12:00:00.000Z',
    first_approved_at: '2026-08-11T08:00:00.000Z',
    is_bot: false,
    lines_added: 10,
    lines_deleted: 2,
    lines_changed: 12,
    review_rounds: 1,
    cycle: {
      time_from_creation_to_asked_for_review: 2,
      time_from_creation_to_merged: 24,
      time_from_creation_to_approved: 22,
      time_from_asked_for_review_to_approved: 20,
      time_from_asked_for_review_to_first_review: 6,
    },
    ...overrides,
  }
}

describe('compute_gallery_row_stats', () => {
  it('returns nulls when there are no facts', () => {
    expect(compute_gallery_row_stats([], NOW)).toEqual(EMPTY_GALLERY_ROW_STATS)
  })

  it('treats bot-only facts as empty', () => {
    const facts = [
      make_fact({
        pr_id: 'acme/app#bot',
        is_bot: true,
        merged_at: '2026-08-20T10:00:00.000Z',
      }),
    ]
    expect(compute_gallery_row_stats(facts, NOW)).toEqual(EMPTY_GALLERY_ROW_STATS)
  })

  it('excludes bots from counts and averages', () => {
    const facts = [
      make_fact({
        pr_id: 'acme/app#1',
        merged_at: '2026-08-20T10:00:00.000Z',
        cycle: {
          time_from_creation_to_asked_for_review: 1,
          time_from_creation_to_merged: 10,
          time_from_creation_to_approved: 8,
          time_from_asked_for_review_to_approved: 7,
          time_from_asked_for_review_to_first_review: 4,
        },
      }),
      make_fact({
        pr_id: 'acme/app#bot',
        is_bot: true,
        merged_at: '2026-08-21T10:00:00.000Z',
        cycle: {
          time_from_creation_to_asked_for_review: 1,
          time_from_creation_to_merged: 100,
          time_from_creation_to_approved: 8,
          time_from_asked_for_review_to_approved: 7,
          time_from_asked_for_review_to_first_review: 40,
        },
      }),
    ]
    const stats = compute_gallery_row_stats(facts, NOW)
    expect(stats.merged_count).toBe(1)
    expect(stats.avg_cycle_hours).toBe(10)
    expect(stats.avg_first_review_hours).toBe(4)
  })

  it('counts only merges inside the last 30 days', () => {
    const facts = [
      make_fact({
        pr_id: 'acme/app#recent',
        merged_at: '2026-08-10T16:00:00.000Z',
      }),
      make_fact({
        pr_id: 'acme/app#old',
        merged_at: '2026-07-20T16:00:00.000Z',
      }),
    ]
    const stats = compute_gallery_row_stats(facts, NOW)
    expect(stats.merged_count).toBe(1)
  })

  it('returns 0 merged when facts exist but none merged in 30 days', () => {
    const facts = [
      make_fact({
        pr_id: 'acme/app#old',
        merged_at: '2026-06-01T16:00:00.000Z',
      }),
      make_fact({
        pr_id: 'acme/app#open',
        state: 'OPEN',
        merged_at: null,
      }),
    ]
    const stats = compute_gallery_row_stats(facts, NOW)
    expect(stats.merged_count).toBe(0)
    expect(stats.open_count).toBe(1)
    expect(stats.avg_cycle_hours).toBeNull()
    expect(stats.avg_first_review_hours).toBeNull()
  })

  it('builds 8 Monday-start week buckets and omits an all-zero sparkline', () => {
    const empty_weeks = compute_gallery_row_stats(
      [make_fact({ state: 'OPEN', merged_at: null })],
      NOW,
    )
    expect(empty_weeks.weekly_merged).toBeNull()

    const facts = [
      make_fact({
        pr_id: 'acme/app#w1',
        merged_at: '2026-07-01T12:00:00.000Z',
      }),
      make_fact({
        pr_id: 'acme/app#w2',
        merged_at: '2026-08-12T12:00:00.000Z',
      }),
      make_fact({
        pr_id: 'acme/app#w2b',
        merged_at: '2026-08-13T12:00:00.000Z',
      }),
    ]
    const stats = compute_gallery_row_stats(facts, NOW)
    expect(stats.weekly_merged).not.toBeNull()
    expect(stats.weekly_merged).toHaveLength(GALLERY_SPARKLINE_WEEKS)
    expect(stats.weekly_merged?.[0]).toBe(1)
    expect(stats.weekly_merged?.[6]).toBe(2)
    expect(stats.weekly_merged?.reduce((sum, count) => sum + count, 0)).toBe(3)
  })

  it('averages cycle and first-review hours while skipping null fields', () => {
    const facts = [
      make_fact({
        pr_id: 'acme/app#1',
        merged_at: '2026-08-20T10:00:00.000Z',
        cycle: {
          time_from_creation_to_asked_for_review: 1,
          time_from_creation_to_merged: 10,
          time_from_creation_to_approved: 8,
          time_from_asked_for_review_to_approved: 7,
          time_from_asked_for_review_to_first_review: 4,
        },
      }),
      make_fact({
        pr_id: 'acme/app#2',
        merged_at: '2026-08-21T10:00:00.000Z',
        cycle: {
          time_from_creation_to_asked_for_review: 1,
          time_from_creation_to_merged: null,
          time_from_creation_to_approved: null,
          time_from_asked_for_review_to_approved: null,
          time_from_asked_for_review_to_first_review: 8,
        },
      }),
      make_fact({
        pr_id: 'acme/app#3',
        merged_at: '2026-08-22T10:00:00.000Z',
        cycle: {
          time_from_creation_to_asked_for_review: 1,
          time_from_creation_to_merged: 20,
          time_from_creation_to_approved: 8,
          time_from_asked_for_review_to_approved: 7,
          time_from_asked_for_review_to_first_review: null,
        },
      }),
    ]
    const stats = compute_gallery_row_stats(facts, NOW)
    expect(stats.merged_count).toBe(3)
    expect(stats.avg_cycle_hours).toBe(15)
    expect(stats.avg_first_review_hours).toBe(6)
  })

  it('counts open PRs from the current snapshot, not the 30-day window', () => {
    const facts = [
      make_fact({
        pr_id: 'acme/app#old-open',
        state: 'OPEN',
        created_at: '2026-01-01T00:00:00.000Z',
        merged_at: null,
      }),
      make_fact({
        pr_id: 'acme/app#closed',
        state: 'CLOSED',
        merged_at: null,
      }),
    ]
    const stats = compute_gallery_row_stats(facts, NOW)
    expect(stats.open_count).toBe(1)
    expect(stats.merged_count).toBe(0)
  })
})
