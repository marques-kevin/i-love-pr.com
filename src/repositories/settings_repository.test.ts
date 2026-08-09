import { describe, expect, it } from 'vitest'
import { DEFAULT_BUSINESS_HOURS } from '@/lib/business-hours'
import { create_memory_repositories } from './memory_repositories'

describe('create_memory_repositories settings', () => {
  it('saves and reads settings', async () => {
    const repositories = create_memory_repositories()
    const saved = await repositories.settings.save({
      token: 'ghp_test',
      repos: ['acme/app'],
      syncIntervalHours: 12,
      businessHours: { ...DEFAULT_BUSINESS_HOURS, enabled: true },
    })

    expect(saved.token).toBe('ghp_test')
    expect(saved.repos).toEqual(['acme/app'])
    expect(saved.businessHours.enabled).toBe(true)

    const loaded = await repositories.settings.get()
    expect(loaded?.token).toBe('ghp_test')
  })

  it('upserts teams', async () => {
    const repositories = create_memory_repositories()
    await repositories.settings.save({ token: 't', repos: ['a/b'] })
    const with_team = await repositories.settings.upsert_team({
      name: 'Core',
      members: ['alice', 'bob'],
    })
    expect(with_team.teams).toHaveLength(1)
    expect(with_team.teams[0].members).toEqual(['alice', 'bob'])
  })
})
