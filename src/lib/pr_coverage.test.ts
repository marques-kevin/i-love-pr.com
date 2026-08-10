import { describe, expect, it } from 'vitest'
import {
  compute_created_at_bounds,
  compute_sync_depth_progress,
  min_remote_oldest_created_at,
} from './pr_coverage'

describe('compute_created_at_bounds', () => {
  it('returns null for an empty list', () => {
    expect(compute_created_at_bounds([])).toBeNull()
  })

  it('returns the same date for a single PR', () => {
    expect(compute_created_at_bounds(['2024-06-15T10:00:00.000Z'])).toEqual({
      oldest_created_at: '2024-06-15T10:00:00.000Z',
      newest_created_at: '2024-06-15T10:00:00.000Z',
      count: 1,
    })
  })

  it('finds the oldest and newest created_at values', () => {
    expect(
      compute_created_at_bounds([
        '2024-03-01T00:00:00.000Z',
        '2024-01-01T00:00:00.000Z',
        '2024-06-01T00:00:00.000Z',
      ]),
    ).toEqual({
      oldest_created_at: '2024-01-01T00:00:00.000Z',
      newest_created_at: '2024-06-01T00:00:00.000Z',
      count: 3,
    })
  })
})

describe('compute_sync_depth_progress', () => {
  it('returns 1 when history is complete', () => {
    expect(
      compute_sync_depth_progress({
        local_oldest_created_at: null,
        local_newest_created_at: null,
        remote_oldest_created_at: null,
        history_complete: true,
      }),
    ).toBe(1)
  })

  it('returns null when remote oldest is unknown', () => {
    expect(
      compute_sync_depth_progress({
        local_oldest_created_at: '2024-06-01T00:00:00.000Z',
        local_newest_created_at: '2024-12-01T00:00:00.000Z',
        remote_oldest_created_at: null,
        history_complete: false,
      }),
    ).toBeNull()
  })

  it('returns 0 when only the newest edge is synced', () => {
    expect(
      compute_sync_depth_progress({
        local_oldest_created_at: '2024-12-01T00:00:00.000Z',
        local_newest_created_at: '2024-12-01T00:00:00.000Z',
        remote_oldest_created_at: '2024-01-01T00:00:00.000Z',
        history_complete: false,
      }),
    ).toBe(0)
  })

  it('returns 0.5 at the midpoint of the date span', () => {
    expect(
      compute_sync_depth_progress({
        local_oldest_created_at: '2024-01-02T00:00:00.000Z',
        local_newest_created_at: '2024-01-03T00:00:00.000Z',
        remote_oldest_created_at: '2024-01-01T00:00:00.000Z',
        history_complete: false,
      }),
    ).toBe(0.5)
  })

  it('clamps to 1 when local oldest reaches remote oldest', () => {
    expect(
      compute_sync_depth_progress({
        local_oldest_created_at: '2023-01-01T00:00:00.000Z',
        local_newest_created_at: '2025-01-01T00:00:00.000Z',
        remote_oldest_created_at: '2024-01-01T00:00:00.000Z',
        history_complete: false,
      }),
    ).toBe(1)
  })
})

describe('min_remote_oldest_created_at', () => {
  it('returns the earliest ISO timestamp', () => {
    expect(
      min_remote_oldest_created_at([
        '2024-06-01T00:00:00.000Z',
        null,
        '2024-01-01T00:00:00.000Z',
        undefined,
      ]),
    ).toBe('2024-01-01T00:00:00.000Z')
  })

  it('returns null when nothing is known', () => {
    expect(min_remote_oldest_created_at([null, undefined])).toBeNull()
  })
})
