import { describe, expect, it } from 'vitest'
import { sync_cue_from_state } from '@/lib/sync_cue'
import type { SyncState } from '@/lib/types'

function sync_state(patch: Partial<SyncState>): SyncState {
  return {
    repo_full_name: 'acme/widgets',
    cursor_updated_at: null,
    page_cursor: null,
    mode: 'idle',
    last_synced_at: null,
    last_error: null,
    total_fetched: 0,
    backfill_fetched: 0,
    remote_oldest_created_at: null,
    ...patch,
  }
}

describe('sync_cue_from_state', () => {
  it('is idle when there is no state', () => {
    expect(sync_cue_from_state(undefined)).toBe('idle')
  })

  it('is error when last_error is set', () => {
    expect(sync_cue_from_state(sync_state({ last_error: 'boom', mode: 'idle' }))).toBe('error')
  })

  it('is syncing during backfill, incremental, or paused work', () => {
    expect(sync_cue_from_state(sync_state({ mode: 'backfill' }))).toBe('syncing')
    expect(sync_cue_from_state(sync_state({ mode: 'incremental' }))).toBe('syncing')
    expect(sync_cue_from_state(sync_state({ mode: 'paused' }))).toBe('syncing')
  })

  it('is idle when the repo is idle without errors', () => {
    expect(sync_cue_from_state(sync_state({ mode: 'idle' }))).toBe('idle')
  })
})
