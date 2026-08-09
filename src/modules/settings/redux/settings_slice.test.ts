import { describe, expect, it } from 'vitest'
import { create_memory_repositories } from '@/repositories'
import { create_store, load_settings, save_settings } from '@/store'

describe('settings thunks with memory repositories', () => {
  it('loads null when empty', async () => {
    const repositories = create_memory_repositories()
    const store = create_store({ repositories })
    await store.dispatch(load_settings())
    expect(store.getState().settings.settings).toBeNull()
    expect(store.getState().settings.loading).toBe(false)
  })

  it('saves then loads settings via extra.repositories', async () => {
    const repositories = create_memory_repositories()
    const store = create_store({ repositories })

    await store.dispatch(
      save_settings({
        token: 'ghp_x',
        repos: ['org/repo'],
      }),
    )

    expect(store.getState().settings.settings?.repos).toEqual(['org/repo'])

    const store2 = create_store({ repositories })
    await store2.dispatch(load_settings())
    expect(store2.getState().settings.settings?.token).toBe('ghp_x')
  })
})
