/**
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it } from 'vitest'
import { DEFAULT_BUSINESS_HOURS } from '@/lib/business-hours'
import {
  clear_import_repo_request,
  global_app_initialized,
  import_repo_snapshot_from_link,
} from '@/store'
import { create_mock_session } from '@/store/create_mock_session'
import { create_store } from '@/store/create_store'
import type { RepoSnapshotV1 } from '@/lib/repo_snapshot'
import { create_memory_repositories } from '@/repositories'

describe('boot import URL', () => {
  afterEach(() => {
    window.history.replaceState({}, '', '/')
  })

  it('requests the import dialog for ?import= and does not write facts', async () => {
    window.history.replaceState({}, '', '/?import=share-abc')
    const repositories = create_memory_repositories()
    const store = create_store({ repositories, session: create_mock_session() })
    const fetch_calls: string[] = []
    const original_fetch = globalThis.fetch
    globalThis.fetch = async (input: RequestInfo | URL) => {
      fetch_calls.push(String(input))
      return new Response('nope', { status: 500 })
    }

    try {
      await store.dispatch(global_app_initialized())
      expect(store.getState().dashboard.import_repo_requested).toBe(true)
      expect(store.getState().dashboard.import_repo_link).toContain('import=share-abc')
      expect(fetch_calls).toEqual([])
      expect(await repositories.settings.get()).toBeUndefined()
      const facts = await repositories.pr_facts.list_by_repos(['acme/widgets'])
      expect(facts).toHaveLength(0)
    } finally {
      globalThis.fetch = original_fetch
    }
  })

  it('writes nothing when the import request is cancelled', async () => {
    window.history.replaceState({}, '', '/?import=share-abc')
    const repositories = create_memory_repositories()
    const store = create_store({ repositories, session: create_mock_session() })

    await store.dispatch(global_app_initialized())
    expect(store.getState().dashboard.import_repo_requested).toBe(true)
    store.dispatch(clear_import_repo_request())

    expect(await repositories.settings.get()).toBeUndefined()
    const facts = await repositories.pr_facts.list_by_repos(['acme/widgets'])
    expect(facts).toHaveLength(0)
  })

  it('imports a snapshot with no prior settings after confirm', async () => {
    const snapshot: RepoSnapshotV1 = {
      schema_version: 1,
      exported_at: '2026-01-01T00:00:00.000Z',
      repo_full_name: 'acme/widgets',
      repos: [],
      pull_requests: [
        {
          id: 'pr-1',
          repo_full_name: 'acme/widgets',
          number: 1,
          title: 'Sample PR',
          author: 'alice',
          state: 'MERGED',
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-02T00:00:00.000Z',
          closed_at: '2026-01-02T00:00:00.000Z',
          merged_at: '2026-01-02T00:00:00.000Z',
          ready_for_review_at: '2026-01-01T01:00:00.000Z',
          first_review_requested_at: '2026-01-01T01:00:00.000Z',
          additions: 10,
          deletions: 2,
          changed_files: 1,
          commits_count: 1,
          comments_count: 0,
          labels: [],
        },
      ],
      reviews: [],
      pr_changed_files: [],
      settings_subset: {
        teams: [],
        dashboards: [],
        ignored_bots: [],
        test_file_globs: [],
        business_hours: DEFAULT_BUSINESS_HOURS,
      },
    }
    const repositories = create_memory_repositories()
    const store = create_store({ repositories, session: create_mock_session() })
    const original_fetch = globalThis.fetch
    globalThis.fetch = async () =>
      new Response(JSON.stringify(snapshot), {
        status: 200,
        headers: { 'content-type': 'application/json', 'content-length': '2048' },
      })

    try {
      const result = await store.dispatch(
        import_repo_snapshot_from_link({ share_link: 'https://i-love-pr.com/?import=share-abc' }),
      )
      expect(result.type).toBe('settings/import_repo_snapshot_from_link/fulfilled')
      const settings = await repositories.settings.get()
      expect(settings?.token).toBe('')
      expect(settings?.imported_repos).toEqual(['acme/widgets'])
      const facts = await repositories.pr_facts.list_by_repos(['acme/widgets'])
      expect(facts).toHaveLength(1)
      expect(store.getState().settings.import_job.status).toBe('success')
      expect(store.getState().settings.import_job.percent).toBe(100)
    } finally {
      globalThis.fetch = original_fetch
    }
  })
})
