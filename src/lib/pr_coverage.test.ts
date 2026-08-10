import { describe, expect, it } from 'vitest'
import { compute_created_at_bounds } from './pr_coverage'

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
