import { describe, expect, it } from 'vitest'
import { DEFAULT_BUSINESS_HOURS } from '@/lib/business-hours'
import type { PullRequestRecord, ReviewRecord, SyncState } from '@/lib/types'
import { create_memory_repositories } from '@/repositories'
import { create_mock_session } from '@/store/create_mock_session'
import { create_store, load_settings, remove_repo, save_settings } from '@/store'

describe('remove_repo thunk', () => {
  it('removes repo settings and local data while keeping other repos', async () => {
    const repositories = create_memory_repositories()
    const store = create_store({
      repositories,
      session: create_mock_session({ get_active_login: () => 'testuser' }),
    })

    await store.dispatch(
      save_settings({
        token: 'ghp_x',
        repos: ['acme/app', 'acme/other'],
      }),
    )

    const pr: PullRequestRecord = {
      id: 'pr-1',
      repo_full_name: 'acme/app',
      number: 1,
      title: 'Test',
      author: 'alice',
      state: 'MERGED',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-02T00:00:00.000Z',
      merged_at: '2026-01-02T00:00:00.000Z',
      closed_at: '2026-01-02T00:00:00.000Z',
      ready_for_review_at: '2026-01-01T01:00:00.000Z',
      first_review_requested_at: '2026-01-01T01:00:00.000Z',
      additions: 1,
      deletions: 1,
      changed_files: 1,
      commits_count: 1,
      comments_count: 0,
      labels: [],
    }
    const review: ReviewRecord = {
      id: 'review-1',
      pr_id: 'pr-1',
      repo_full_name: 'acme/app',
      pr_number: 1,
      author: 'bob',
      state: 'APPROVED',
      submitted_at: '2026-01-02T00:00:00.000Z',
    }
    const sync_state: SyncState = {
      repo_full_name: 'acme/app',
      cursor_updated_at: null,
      page_cursor: null,
      mode: 'idle',
      last_synced_at: null,
      last_error: null,
      total_fetched: 1,
      backfill_fetched: 1,
      remote_oldest_created_at: null,
    }

    await repositories.pull_requests.put_many([pr])
    await repositories.reviews.replace_for_pr('pr-1', [review])
    await repositories.sync_state.put(sync_state)

    await store.dispatch(remove_repo({ repo_full_name: 'acme/app' }))

    expect(store.getState().settings.settings?.repos).toEqual(['acme/other'])
    expect(store.getState().settings.settings?.active_repo).toBe('acme/other')
    expect(await repositories.pull_requests.list_by_repos(['acme/app'])).toEqual([])
    expect(await repositories.reviews.list_by_repos(['acme/app'])).toEqual([])
    expect(await repositories.sync_state.get('acme/app')).toBeUndefined()

    const store2 = create_store({
      repositories,
      session: create_mock_session({ get_active_login: () => 'testuser' }),
    })
    await store2.dispatch(load_settings())
    expect(store2.getState().settings.settings?.repos).toEqual(['acme/other'])
    expect(store2.getState().settings.settings?.business_hours).toEqual(DEFAULT_BUSINESS_HOURS)
  })

  it('removes the repo from imported_repos', async () => {
    const repositories = create_memory_repositories()
    const store = create_store({
      repositories,
      session: create_mock_session({ get_active_login: () => 'testuser' }),
    })

    await repositories.settings.save({
      token: 'ghp_x',
      repos: ['acme/app', 'acme/imported'],
      imported_repos: ['acme/imported'],
    })

    await store.dispatch(load_settings())
    await store.dispatch(remove_repo({ repo_full_name: 'acme/imported' }))

    expect(store.getState().settings.settings?.repos).toEqual(['acme/app'])
    expect(store.getState().settings.settings?.imported_repos).toEqual([])
  })
})
