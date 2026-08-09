import { describe, expect, it } from 'vitest'
import {
  DEFAULT_DASHBOARD_LAYOUT,
  normalize_dashboard_layout,
} from '@/lib/dashboard_layout'

describe('normalize_dashboard_layout', () => {
  it('defaults when missing', () => {
    expect(normalize_dashboard_layout(undefined)).toEqual(DEFAULT_DASHBOARD_LAYOUT)
    expect(normalize_dashboard_layout(null)).toEqual(DEFAULT_DASHBOARD_LAYOUT)
  })

  it('keeps an intentional empty layout', () => {
    expect(normalize_dashboard_layout([])).toEqual([])
  })

  it('drops unknown widget ids', () => {
    expect(
      normalize_dashboard_layout([
        { instance_id: 'a', widget_id: 'cycle_time' },
        { instance_id: 'b', widget_id: 'not_a_widget' as 'cycle_time' },
      ]),
    ).toEqual([{ instance_id: 'a', widget_id: 'cycle_time' }])
  })
})
