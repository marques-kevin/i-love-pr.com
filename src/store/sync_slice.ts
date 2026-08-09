import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { sync_all_repos } from '@/lib/sync'
import type { RateLimitInfo, SyncProgress, SyncState } from '@/lib/types'
import type { ThunkExtra } from './thunk_extra'

type ThunkConfig = { extra: ThunkExtra }

export type SyncSliceState = {
  syncing: boolean
  progress: SyncProgress | null
  rate_limit: RateLimitInfo | null
  error: string | null
  sync_states: SyncState[]
  bootstrapped: boolean
}

const initial_state: SyncSliceState = {
  syncing: false,
  progress: null,
  rate_limit: null,
  error: null,
  sync_states: [],
  bootstrapped: false,
}

let sync_lock = false

export const refresh_sync_states = createAsyncThunk<SyncState[], void, ThunkConfig>(
  'sync/refresh_states',
  async (_, { extra }) => {
    return extra.repositories.sync_state.list()
  },
)

export const run_sync = createAsyncThunk<
  { rate_limit: RateLimitInfo | null },
  { force?: boolean },
  ThunkConfig
>('sync/run', async ({ force = false }, { extra, dispatch }) => {
  if (sync_lock) {
    return { rate_limit: null }
  }
  sync_lock = true
  try {
    const result = await sync_all_repos({
      repositories: extra.repositories,
      force,
      on_progress: (progress) => {
        dispatch(set_progress(progress))
        if (progress.rateLimit) {
          dispatch(set_rate_limit(progress.rateLimit))
        }
      },
    })
    await dispatch(refresh_sync_states())
    return result
  } finally {
    sync_lock = false
  }
})

const sync_slice = createSlice({
  name: 'sync',
  initialState: initial_state,
  reducers: {
    set_progress(state, action: PayloadAction<SyncProgress | null>) {
      state.progress = action.payload
    },
    set_rate_limit(state, action: PayloadAction<RateLimitInfo | null>) {
      state.rate_limit = action.payload
    },
    set_bootstrapped(state, action: PayloadAction<boolean>) {
      state.bootstrapped = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(run_sync.pending, (state) => {
        state.syncing = true
        state.error = null
      })
      .addCase(run_sync.fulfilled, (state, action) => {
        state.syncing = false
        if (action.payload.rate_limit) {
          state.rate_limit = action.payload.rate_limit
        }
      })
      .addCase(run_sync.rejected, (state, action) => {
        state.syncing = false
        state.error = action.error.message ?? 'Sync failed'
      })
      .addCase(refresh_sync_states.fulfilled, (state, action) => {
        state.sync_states = action.payload
      })
  },
})

export const { set_progress, set_rate_limit, set_bootstrapped } = sync_slice.actions
export const sync_reducer = sync_slice.reducer
