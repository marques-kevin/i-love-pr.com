import { createAsyncThunk } from '@reduxjs/toolkit'
import type { AppDispatch } from './create_store'
import type { RootState } from './root_reducer'
import type { ThunkExtra } from './thunk_extra'

/**
 * Typed createAsyncThunk with RootState, AppDispatch, and repositories extra.
 * Usage: create_app_async_thunk<Returned, ThunkArg>(type, payloadCreator)
 */
export const create_app_async_thunk = createAsyncThunk.withTypes<{
  state: RootState
  dispatch: AppDispatch
  extra: ThunkExtra
}>()
