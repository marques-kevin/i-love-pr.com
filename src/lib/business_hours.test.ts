import { describe, expect, it } from 'vitest'
import {
  DEFAULT_BUSINESS_HOURS,
  create_elapsed_hours_fn,
  elapsedHours,
  minutesToTimeInput,
  timeInputToMinutes,
} from './business-hours'

describe('business_hours helpers', () => {
  it('converts minutes to time input and back', () => {
    expect(minutesToTimeInput(9 * 60 + 30)).toBe('09:30')
    expect(timeInputToMinutes('18:00')).toBe(18 * 60)
  })

  it('uses calendar hours when business hours disabled', () => {
    const hours = elapsedHours('2026-08-07T15:00:00.000Z', '2026-08-10T08:00:00.000Z', {
      ...DEFAULT_BUSINESS_HOURS,
      enabled: false,
    })
    expect(hours).toBe(65)
  })

  it('counts only business windows across a weekend', () => {
    const cfg = {
      ...DEFAULT_BUSINESS_HOURS,
      enabled: true,
      time_zone: 'Europe/Paris',
      workdays: [1, 2, 3, 4, 5],
      start_minutes: 9 * 60,
      end_minutes: 18 * 60,
    }
    // Fri 17:00 -> Mon 10:00 Paris ≈ 2 business hours
    const hours = elapsedHours('2026-08-07T15:00:00.000Z', '2026-08-10T08:00:00.000Z', cfg)
    expect(hours).toBe(2)
  })

  it('counts same-day overlap', () => {
    const cfg = {
      ...DEFAULT_BUSINESS_HOURS,
      enabled: true,
      time_zone: 'Europe/Paris',
      workdays: [1, 2, 3, 4, 5],
      start_minutes: 9 * 60,
      end_minutes: 18 * 60,
    }
    const hours = elapsedHours('2026-08-06T07:00:00.000Z', '2026-08-06T10:00:00.000Z', cfg)
    expect(hours).toBe(3)
  })

  it('reuses day windows across many calls via create_elapsed_hours_fn', () => {
    const cfg = {
      ...DEFAULT_BUSINESS_HOURS,
      enabled: true,
      time_zone: 'Europe/Paris',
      workdays: [1, 2, 3, 4, 5],
      start_minutes: 9 * 60,
      end_minutes: 18 * 60,
    }
    const elapsed = create_elapsed_hours_fn(cfg)
    expect(elapsed('2026-08-07T15:00:00.000Z', '2026-08-10T08:00:00.000Z')).toBe(2)
    expect(elapsed('2026-08-07T15:00:00.000Z', '2026-08-10T08:00:00.000Z')).toBe(2)
  })
})
