import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { ImportJobStep } from '@/lib/import_progress'

export type ImportJobStatus = 'idle' | 'running' | 'success' | 'error'

export type ImportJobState = {
  status: ImportJobStatus
  step: ImportJobStep | null
  percent: number
  repo_full_name: string | null
  error: string | null
  /** True after the user confirms import (not when landing on a share URL). */
  confirmed: boolean
}

const initial_import_job: ImportJobState = {
  status: 'idle',
  step: null,
  percent: 0,
  repo_full_name: null,
  error: null,
  confirmed: false,
}

const import_job_slice = createSlice({
  name: 'import_job',
  initialState: initial_import_job,
  reducers: {
    start_import_job(state) {
      state.status = 'running'
      state.step = 'download'
      state.percent = 0
      state.repo_full_name = null
      state.error = null
      state.confirmed = true
    },
    update_import_job(
      state,
      action: PayloadAction<{
        step?: ImportJobStep | null
        percent?: number
        repo_full_name?: string | null
      }>,
    ) {
      if (state.status !== 'running') return
      if (action.payload.step !== undefined) {
        state.step = action.payload.step
      }
      if (action.payload.percent !== undefined) {
        state.percent = action.payload.percent
      }
      if (action.payload.repo_full_name !== undefined) {
        state.repo_full_name = action.payload.repo_full_name
      }
    },
    complete_import_job(state, action: PayloadAction<{ repo_full_name: string }>) {
      state.status = 'success'
      state.step = 'facts'
      state.percent = 100
      state.repo_full_name = action.payload.repo_full_name
      state.error = null
      state.confirmed = true
    },
    fail_import_job(state, action: PayloadAction<string>) {
      state.status = 'error'
      state.error = action.payload
    },
    reset_import_job() {
      return initial_import_job
    },
  },
})

export const {
  start_import_job,
  update_import_job,
  complete_import_job,
  fail_import_job,
  reset_import_job,
} = import_job_slice.actions
export const import_job_reducer = import_job_slice.reducer
