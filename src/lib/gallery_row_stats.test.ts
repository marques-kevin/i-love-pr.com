import { describe, expect, it } from 'vitest'
import { compute_gallery_row_stats } from '@/lib/gallery_row_stats'
import type { PrFactRecord } from '@/lib/types'

const NOW = new Date('2026-03-15T12:00:00.000Z')

function fact(overrides: Partial<PrFactRecord> & Pick<PrFactRecord, 'pr_id'>): PrFactRecord {
  return {
    _version: 8,
    repo_full_name: 'acme/app',
    author: 'dev',
    state: 'MERGED',
    created_at: '2026-03-01T10:00:00.000Z',
    merged_at: '2026-03-10T10:00:00.000Z',
    pr_number: 1,
    title: 'Test PR',
    request_review_at: '2026-03-01T11:00:00.000Z',
    first_approved_at: '2026-03-02T10:00:00.000Z',
    is_bot: false,
    lines_added: 10,
    lines_deleted: 2,
    lines_changed: 12,
    review_rounds: 1,
    cycle: {
      time_from_creation_to_asked_for_review: 1,
      time_from_creation_to_merged: 24,
      time_from_creation_to_approved: 20,
      time_from_asked_for_review_to_approved: 19,
      time_from_asked_for_review_to_first_review: 4,
    },
    ...overrides,
  }
}

describe('compute_gallery_row_stats', () => {
  it('returns nulls when there are no facts', () => {
    const stats = compute_gallery_row_stats([], NOW)
    expect(stats).toEqual({
      merged_count_30d: null,
      open_count: null,
      weekly_merged_counts: null,
      avg_cycle_hours: null,
      avg_time_to_first_review_hours: null,
    })
  })

  it('excludes bot facts', () => {
    const stats = compute_gallery_row_stats(
      [
        fact({
          pr_id: 'bot',
          is_bot: true,
          merged_at: '2026-03-10T10:00:00.000Z',
        }),
        fact({
          pr_id: 'human',
          merged_at: '2026-03-10T10:00:00.000Z',
        }),
      ],
      NOW,
    )

    expect(stats.merged_count_30d).toBe(1)
    expect(stats.avg_cycle_hours).toBe(24)
  })

  it('counts only merges in the last 30 days', () => {
    const stats = compute_gallery_row_stats(
      [
        fact({ pr_id: 'recent', merged_at: '2026-03-10T10:00:00.000Z' }),
        fact({ pr_id: 'old', merged_at: '2026-01-01T10:00:00.000Z' }),
      ],
      NOW,
    )

    expect(stats.merged_count_30d).toBe(1)
    expect(stats.avg_cycle_hours).toBe(24)
    expect(stats.avg_time_to_first_review_hours).toBe(4)
  })

  it('uses dash semantics when there are facts but no merge or sparkline data', () => {
    const stats = compute_gallery_row_stats(
      [
        fact({
          pr_id: 'open-only',
          state: 'OPEN',
          merged_at: null,
          cycle: {
            time_from_creation_to_asked_for_review: null,
            time_from_creation_to_merged: null,
            time_from_creation_to_approved: null,
            time_from_asked_for_review_to_approved: null,
            time_from_asked_for_review_to_first_review: null,
          },
        }),
      ],
      NOW,
    )

    expect(stats.merged_count_30d).toBeNull()
    expect(stats.open_count).toBe(1)
    expect(stats.weekly_merged_counts).toBeNull()
    expect(stats.avg_cycle_hours).toBeNull()
    expect(stats.avg_time_to_first_review_hours).toBeNull()
  })

  it('builds eight weekly buckets of merged counts', () => {
    const stats = compute_gallery_row_stats(
      [
        fact({ pr_id: 'w1', merged_at: '2026-03-03T10:00:00.000Z' }),
        fact({ pr_id: 'w2', merged_at: '2026-03-04T10:00:00.000Z' }),
        fact({ pr_id: 'w3', merged_at: '2026-02-24T10:00:00.000Z' }),
      ],
      NOW,
    )

    expect(stats.weekly_merged_counts).toHaveLength(8)
    expect(stats.weekly_merged_counts?.reduce((sum, count) => sum + count, 0)).toBe(3)
  })

  it('averages cycle metrics while ignoring null fields', () => {
    const stats = compute_gallery_row_stats(
      [
        fact({
          pr_id: 'with-cycle',
          merged_at: '2026-03-10T10:00:00.000Z',
          cycle: {
            time_from_creation_to_asked_for_review: 1,
            time_from_creation_to_merged: 20,
            time_from_creation_to_approved: 18,
            time_from_asked_for_review_to_approved: 17,
            time_from_asked_for_review_to_first_review: 6,
          },
        }),
        fact({
          pr_id: 'missing-cycle',
          merged_at: '2026-03-11T10:00:00.000Z',
          cycle: {
            time_from_creation_to_asked_for_review: null,
            time_from_creation_to_merged: null,
            time_from_creation_to_approved: null,
            time_from_asked_for_review_to_approved: null,
            time_from_asked_for_review_to_first_review: null,
          },
        }),
      ],
      NOW,
    )

    expect(stats.avg_cycle_hours).toBe(20)
    expect(stats.avg_time_to_first_review_hours).toBe(6)
  })

  it('counts open PRs independently of the 30 day window', () => {
    const stats = compute_gallery_row_stats(
      [
        fact({
          pr_id: 'old-open',
          state: 'OPEN',
          created_at: '2025-01-01T10:00:00.000Z',
          merged_at: null,
        }),
        fact({
          pr_id: 'recent-open',
          state: 'OPEN',
          created_at: '2026-03-01T10:00:00.000Z',
          merged_at: null,
        }),
      ],
      NOW,
    )

    expect(stats.open_count).toBe(2)
    expect(stats.merged_count_30d).toBeNull()
  })
})
