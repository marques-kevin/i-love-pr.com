import { describe, expect, it } from 'vitest'
import { ensure_pr_facts } from '@/lib/rebuild_pr_facts'
import { create_demo_seed, DEMO_REPO } from '@/lib/demo_mode'
import { create_memory_repositories } from '@/repositories'

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
