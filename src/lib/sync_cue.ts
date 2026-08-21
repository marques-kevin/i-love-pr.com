import type { SyncState } from '@/lib/types'

export type SyncCue = 'idle' | 'syncing' | 'error'

export function sync_cue_from_state(state: SyncState | undefined): SyncCue {
  if (!state) return 'idle'
  if (state.last_error) return 'error'
  if (state.mode === 'backfill' || state.mode === 'incremental' || state.mode === 'paused') {
    return 'syncing'
  }
  return 'idle'
}
