import { describe, expect, it } from 'vitest'
import { percentile } from '@/lib/metrics'

describe('percentile', () => {
  it('returns null for empty input', () => {
    expect(percentile([], 0.5)).toBeNull()
  })

  it('returns the only value', () => {
    expect(percentile([10], 0.95)).toBe(10)
  })

  it('computes p50 and p95 on a sorted range', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    expect(percentile(values, 0.5)).toBe(5.5)
    expect(percentile(values, 0.95)).toBeCloseTo(9.55)
  })
})
