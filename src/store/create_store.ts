import { configureStore } from '@reduxjs/toolkit'
import { dashboard_reducer } from '@/modules/dashboard/redux/dashboard_slice'
import { settings_reducer } from '@/modules/settings/redux/settings_slice'
import { sync_reducer } from '@/modules/sync/redux/sync_slice'
import type { ThunkExtra } from './thunk_extra'

export function create_store(extra: ThunkExtra) {
  return configureStore({
    reducer: {
      settings: settings_reducer,
      sync: sync_reducer,
      dashboard: dashboard_reducer,
    },
    middleware: (get_default_middleware) =>
      get_default_middleware({
        thunk: { extraArgument: extra },
        serializableCheck: false,
      }),
  })
}

export type AppStore = ReturnType<typeof create_store>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
