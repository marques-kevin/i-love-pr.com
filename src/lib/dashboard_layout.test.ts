import { describe, expect, it } from 'vitest'
import {
  DEFAULT_DASHBOARD_ID,
  DEFAULT_DASHBOARD_LAYOUT,
  default_dashboard_filters,
  default_dashboard_id_for_repo,
  normalize_dashboard_layout,
  normalize_dashboards,
  normalize_settings_dashboards,
  parse_dashboard_layout_from_json,
  parse_dashboard_tabs_from_json,
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
      parse_dashboard_layout_from_json([
        { instance_id: 'a', widget_id: 'cycle_time' },
        { instance_id: 'b', widget_id: 'not_a_widget' },
      ]),
    ).toEqual([{ instance_id: 'a', widget_id: 'cycle_time' }])
  })
})

describe('normalize_dashboards', () => {
  it('creates a default tab when missing', () => {
    const dashboards = normalize_dashboards(undefined)
    expect(dashboards).toHaveLength(1)
    expect(dashboards[0].id).toBe(DEFAULT_DASHBOARD_ID)
    expect(dashboards[0].repo_full_name).toBe('')
    expect(dashboards[0].layout).toEqual(DEFAULT_DASHBOARD_LAYOUT)
    expect(dashboards[0]).toMatchObject(default_dashboard_filters())
  })

  it('migrates legacy dashboard_layout', () => {
    const dashboards = normalize_dashboards(undefined, [
      { instance_id: '1', widget_id: 'cycle_time' },
    ])
    expect(dashboards).toEqual([
      {
        id: DEFAULT_DASHBOARD_ID,
        name: '',
        repo_full_name: '',
        layout: [{ instance_id: '1', widget_id: 'cycle_time' }],
        ...default_dashboard_filters(),
      },
    ])
  })

  it('keeps an intentional empty legacy layout', () => {
    expect(normalize_dashboards(undefined, [])[0].layout).toEqual([])
  })

  it('fills missing per-tab filters on legacy tabs', () => {
    const dashboards = normalize_dashboards([
      {
        id: 'a',
        name: 'A',
        repo_full_name: '',
        layout: [],
        members: [],
        period_key: '30d',
        custom_from: '',
        custom_to: '',
        hide_test_files: false,
      },
    ])
    expect(dashboards[0]).toMatchObject({
      id: 'a',
      name: 'A',
      repo_full_name: '',
      ...default_dashboard_filters(),
    })
  })
})

describe('normalize_settings_dashboards', () => {
  it('falls back active id to the first dashboard', () => {
    const result = normalize_settings_dashboards({
      repos: ['acme/app'],
      dashboards: [
        {
          id: 'a',
          name: 'A',
          repo_full_name: 'acme/app',
          layout: [{ instance_id: '1', widget_id: 'cycle_time' }],
          members: ['alice'],
          period_key: '7d',
          custom_from: '',
          custom_to: '',
          hide_test_files: false,
        },
      ],
      active_dashboard_id: 'missing',
    })
    expect(result.active_repo).toBe('acme/app')
    expect(result.active_dashboard_id).toBe('a')
    expect(result.active_dashboard_by_repo['acme/app']).toBe('a')
    expect(result.dashboards[0].members).toEqual(['alice'])
    expect(result.dashboards[0].period_key).toBe('7d')
  })

  it('assigns missing repo_full_name and creates tabs per repo', () => {
    const legacy_tabs = parse_dashboard_tabs_from_json([
      {
        id: 'legacy',
        name: '',
        layout: [],
        members: [],
        period_key: '30d',
        custom_from: '',
        custom_to: '',
        hide_test_files: false,
      },
    ])
    const result = normalize_settings_dashboards({
      repos: ['acme/a', 'acme/b'],
      dashboards: legacy_tabs,
      active_dashboard_id: 'legacy',
    })
    expect(result.active_repo).toBe('acme/a')
    expect(result.dashboards.find((tab) => tab.id === 'legacy')?.repo_full_name).toBe('acme/a')
    expect(result.dashboards.some((tab) => tab.repo_full_name === 'acme/b')).toBe(true)
    expect(result.dashboards.find((tab) => tab.repo_full_name === 'acme/b')?.id).toBe(
      default_dashboard_id_for_repo('acme/b'),
    )
  })
})
