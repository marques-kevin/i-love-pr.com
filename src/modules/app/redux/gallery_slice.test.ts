import { describe, expect, it } from 'vitest'
import { PR_FACTS_VERSION, type PrFactRecord } from '@/lib/types'
import { create_memory_repositories } from '@/repositories'
import { create_mock_session } from '@/store/create_mock_session'
import { create_store, load_gallery_stats, save_settings } from '@/store'

function make_fact(overrides: Partial<PrFactRecord> = {}): PrFactRecord {
  return {
    _version: PR_FACTS_VERSION,
    pr_id: 'acme/app#1',
    repo_full_name: 'acme/app',
    author: 'alice',
    state: 'MERGED',
    created_at: '2026-08-10T10:00:00.000Z',
    merged_at: new Date().toISOString(),
    pr_number: 1,
    title: 'Ship it',
    request_review_at: '2026-08-10T12:00:00.000Z',
    first_approved_at: '2026-08-11T08:00:00.000Z',
    is_bot: false,
    lines_added: 10,
    lines_deleted: 2,
    lines_changed: 12,
    review_rounds: 1,
    cycle: {
      time_from_creation_to_asked_for_review: 2,
      time_from_creation_to_merged: 24,
      time_from_creation_to_approved: 22,
      time_from_asked_for_review_to_approved: 20,
      time_from_asked_for_review_to_first_review: 6,
    },
    ...overrides,
  }
}

describe('load_gallery_stats', () => {
  it('groups facts per visible repo and stores row stats', async () => {
    const repositories = create_memory_repositories()
    const store = create_store({
      repositories,
      session: create_mock_session({ get_active_login: () => 'testuser' }),
    })

    await repositories.pr_facts.put_many([
      make_fact(),
      make_fact({
        pr_id: 'acme/app#open',
        state: 'OPEN',
        merged_at: null,
      }),
    ])
    await store.dispatch(
      save_settings({
        token: 'ghp_x',
        repos: ['acme/app', 'acme/empty'],
      }),
    )

    await store.dispatch(load_gallery_stats())

    const stats = store.getState().gallery.stats_by_repo
    expect(stats['acme/app']?.merged_count).toBe(1)
    expect(stats['acme/app']?.open_count).toBe(1)
    expect(stats['acme/empty']).toEqual({
      merged_count: null,
      open_count: null,
      weekly_merged: null,
      avg_cycle_hours: null,
      avg_first_review_hours: null,
    })
  })
})
