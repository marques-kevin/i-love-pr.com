import { describe, expect, it } from 'vitest'
import { EMPTY_STAT, format_count, format_hours } from './format_hours'

describe('format_hours', () => {
  it('returns an em dash for null', () => {
    expect(format_hours(null)).toBe(EMPTY_STAT)
  })

  it('formats under 24 hours with an h suffix', () => {
    expect(format_hours(4.12)).toBe('4.1h')
  })

  it('formats 24 hours and above as days', () => {
    expect(format_hours(36)).toBe('1.5d')
  })
})

describe('format_count', () => {
  it('returns an em dash for null', () => {
    expect(format_count(null)).toBe(EMPTY_STAT)
  })

  it('stringifies zero and positive counts', () => {
    expect(format_count(0)).toBe('0')
    expect(format_count(12)).toBe('12')
  })
})
