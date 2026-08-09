import { describe, expect, it } from 'vitest'
import { DEFAULT_BUSINESS_HOURS } from '@/lib/business-hours'
import { create_memory_repositories } from './memory_repositories'

describe('create_memory_repositories settings', () => {
  it('saves and reads settings', async () => {
    const repositories = create_memory_repositories()
    const saved = await repositories.settings.save({
      token: 'ghp_test',
      repos: ['acme/app'],
      sync_interval_hours: 12,
      business_hours: { ...DEFAULT_BUSINESS_HOURS, enabled: true },
    })

    expect(saved.token).toBe('ghp_test')
    expect(saved.repos).toEqual(['acme/app'])
    expect(saved.business_hours.enabled).toBe(true)

    const loaded = await repositories.settings.get()
    expect(loaded?.token).toBe('ghp_test')
  })

  it('saves dashboard layout on the active tab', async () => {
    const repositories = create_memory_repositories()
    await repositories.settings.save({ token: 't', repos: ['a/b'] })
    const next = await repositories.settings.save_dashboard_layout([
      { instance_id: '1', widget_id: 'cycle_time' },
    ])
    expect(next.dashboards[0].layout).toEqual([{ instance_id: '1', widget_id: 'cycle_time' }])
  })

  it('creates a named dashboard and switches to it', async () => {
    const repositories = create_memory_repositories()
    await repositories.settings.save({ token: 't', repos: ['a/b'] })
    const next = await repositories.settings.create_dashboard('Reviewers')
    expect(next.dashboards).toHaveLength(2)
    expect(next.dashboards[1].name).toBe('Reviewers')
    expect(next.dashboards[1].layout).toEqual([])
    expect(next.active_dashboard_id).toBe(next.dashboards[1].id)
  })
})
