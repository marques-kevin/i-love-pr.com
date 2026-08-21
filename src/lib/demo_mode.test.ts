import { describe, expect, it } from 'vitest'
import { ensure_pr_facts } from '@/lib/rebuild_pr_facts'
import {
  create_demo_seed,
  DEMO_REPO,
  is_demo_mode_flag,
  should_auto_enable_pages_preview_demo,
} from '@/lib/demo_mode'
import { create_memory_repositories } from '@/repositories'

describe('is_demo_mode_flag', () => {
  it('is true only when the Vite flag is the string true', () => {
    expect(is_demo_mode_flag('true')).toBe(true)
    expect(is_demo_mode_flag('false')).toBe(false)
    expect(is_demo_mode_flag('')).toBe(false)
    expect(is_demo_mode_flag(undefined)).toBe(false)
  })
})

describe('should_auto_enable_pages_preview_demo', () => {
  it('enables demo on Cloudflare Pages preview branches when unset', () => {
    expect(should_auto_enable_pages_preview_demo('1', 'cursor/feature', undefined)).toBe(true)
  })

  it('does not enable on the production main branch', () => {
    expect(should_auto_enable_pages_preview_demo('1', 'main', undefined)).toBe(false)
  })

  it('honors an explicit VITE_DEMO_MODE override on preview', () => {
    expect(should_auto_enable_pages_preview_demo('1', 'cursor/feature', 'false')).toBe(false)
    expect(should_auto_enable_pages_preview_demo('1', 'cursor/feature', 'true')).toBe(false)
  })

  it('does not enable outside Cloudflare Pages builds', () => {
    expect(should_auto_enable_pages_preview_demo(undefined, 'preview', undefined)).toBe(false)
    expect(should_auto_enable_pages_preview_demo('1', '', undefined)).toBe(false)
  })
})

describe('create_demo_seed', () => {
  it('seeds a workspace that materializes dashboard facts', async () => {
    const repositories = create_memory_repositories(create_demo_seed())

    const settings = await repositories.settings.get()
    expect(settings?.repos).toEqual([DEMO_REPO])
    expect(settings?.onboarded_at).toBeTruthy()

    const pull_requests = await repositories.pull_requests.list_by_repos([DEMO_REPO])
    expect(pull_requests.length).toBeGreaterThan(10)

    await ensure_pr_facts(repositories)
    const facts = await repositories.pr_facts.list_by_repos([DEMO_REPO])
    expect(facts).toHaveLength(pull_requests.length)
  })
})
