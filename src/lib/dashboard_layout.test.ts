import { describe, expect, it } from 'vitest'
import {
  DEFAULT_DASHBOARD_ID,
  DEFAULT_DASHBOARD_LAYOUT,
  normalize_dashboard_layout,
  normalize_dashboards,
  normalize_settings_dashboards,
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

describe('normalize_dashboards', () => {
  it('creates a default tab when missing', () => {
    const dashboards = normalize_dashboards(undefined)
    expect(dashboards).toHaveLength(1)
    expect(dashboards[0].id).toBe(DEFAULT_DASHBOARD_ID)
    expect(dashboards[0].layout).toEqual(DEFAULT_DASHBOARD_LAYOUT)
  })

  it('migrates legacy dashboard_layout', () => {
    const dashboards = normalize_dashboards(undefined, [
      { instance_id: '1', widget_id: 'cycle_time' },
    ])
    expect(dashboards).toEqual([
      {
        id: DEFAULT_DASHBOARD_ID,
        name: '',
        layout: [{ instance_id: '1', widget_id: 'cycle_time' }],
      },
    ])
  })

  it('keeps an intentional empty legacy layout', () => {
    expect(normalize_dashboards(undefined, [])[0].layout).toEqual([])
  })
})

describe('normalize_settings_dashboards', () => {
  it('falls back active id to the first dashboard', () => {
    const result = normalize_settings_dashboards({
      dashboards: [
        {
          id: 'a',
          name: 'A',
          layout: [{ instance_id: '1', widget_id: 'cycle_time' }],
        },
      ],
      active_dashboard_id: 'missing',
    })
    expect(result.active_dashboard_id).toBe('a')
  })
})
