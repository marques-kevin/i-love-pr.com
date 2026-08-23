import { describe, expect, it } from 'vitest'
import {
  compute_gallery_row_stats,
  format_gallery_count,
  format_gallery_hours,
} from './gallery_row_stats'
import type { PrFactRecord } from './types'

const NOW = new Date('2026-08-23T12:00:00.000Z')

function make_fact(overrides: Partial<PrFactRecord> = {}): PrFactRecord {
  return {
    _version: 8,
    pr_id: 'org/repo#1',
    repo_full_name: 'org/repo',
    author: 'alice',
    state: 'MERGED',
    created_at: '2026-08-10T10:00:00.000Z',
    merged_at: '2026-08-10T12:00:00.000Z',
    pr_number: 1,
    title: 'Test PR',
    request_review_at: '2026-08-10T10:00:00.000Z',
    first_approved_at: '2026-08-10T11:00:00.000Z',
    is_bot: false,
    lines_added: 10,
    lines_deleted: 2,
    lines_changed: 12,
    review_rounds: 1,
    cycle: {
      time_from_creation_to_asked_for_review: 0,
      time_from_creation_to_merged: 48,
      time_from_creation_to_approved: 36,
      time_from_asked_for_review_to_approved: 36,
      time_from_asked_for_review_to_first_review: 12,
    },
    ...overrides,
  }
}

describe('compute_gallery_row_stats', () => {
  it('returns null throughput when there are no facts', () => {
    const stats = compute_gallery_row_stats([], NOW)
    expect(stats).toEqual({
      has_facts: false,
      merged_count_30d: null,
      open_count: null,
      avg_cycle_hours: null,
      avg_first_review_hours: null,
      sparkline: null,
    })
  })

  it('ignores bot facts', () => {
    const stats = compute_gallery_row_stats(
      [make_fact({ is_bot: true, pr_id: 'org/repo#bot' })],
      NOW,
    )
    expect(stats.has_facts).toBe(false)
    expect(stats.merged_count_30d).toBeNull()
  })

  it('counts merged PRs in the last 30 days and open PRs', () => {
    const stats = compute_gallery_row_stats(
      [
        make_fact({ pr_id: 'org/repo#1', merged_at: '2026-08-20T12:00:00.000Z' }),
        make_fact({
          pr_id: 'org/repo#2',
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
        make_fact({
          pr_id: 'org/repo#3',
          merged_at: '2026-06-01T12:00:00.000Z',
        }),
      ],
      NOW,
    )

    expect(stats.has_facts).toBe(true)
    expect(stats.merged_count_30d).toBe(1)
    expect(stats.open_count).toBe(1)
    expect(stats.avg_cycle_hours).toBe(48)
    expect(stats.avg_first_review_hours).toBe(12)
  })

  it('returns zero merged count when facts exist but none merged in 30d', () => {
    const stats = compute_gallery_row_stats(
      [
        make_fact({
          pr_id: 'org/repo#old',
          merged_at: '2026-06-01T12:00:00.000Z',
        }),
      ],
      NOW,
    )

    expect(stats.merged_count_30d).toBe(0)
    expect(stats.avg_cycle_hours).toBeNull()
    expect(stats.avg_first_review_hours).toBeNull()
  })

  it('builds an eight-week Monday-start sparkline and omits it when all zeros', () => {
    const with_activity = compute_gallery_row_stats(
      [make_fact({ merged_at: '2026-08-18T12:00:00.000Z' })],
      NOW,
    )
    expect(with_activity.sparkline).toHaveLength(8)
    expect(with_activity.sparkline?.reduce((sum, count) => sum + count, 0)).toBe(1)

    const without_activity = compute_gallery_row_stats(
      [
        make_fact({
          pr_id: 'org/repo#open',
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
    expect(without_activity.sparkline).toBeNull()
  })
})

describe('format_gallery_hours', () => {
  it('formats like dashboard summary stats', () => {
    expect(format_gallery_hours(null)).toBe('—')
    expect(format_gallery_hours(6.5)).toBe('6.5h')
    expect(format_gallery_hours(30)).toBe('1.3d')
  })
})

describe('format_gallery_count', () => {
  it('uses em dash for null and stringifies numbers', () => {
    expect(format_gallery_count(null)).toBe('—')
    expect(format_gallery_count(0)).toBe('0')
    expect(format_gallery_count(4)).toBe('4')
  })
})
