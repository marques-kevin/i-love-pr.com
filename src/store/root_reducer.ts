import { combineReducers } from '@reduxjs/toolkit'
import { dashboard_reducer } from '@/modules/dashboard/redux/dashboard_slice'
import { i18n_reducer } from '@/modules/i18n/redux/i18n_slice'
import { settings_reducer } from '@/modules/settings/redux/settings_slice'
import { sync_reducer } from '@/modules/sync/redux/sync_slice'

export const root_reducer = combineReducers({
  settings: settings_reducer,
  sync: sync_reducer,
  dashboard: dashboard_reducer,
  i18n: i18n_reducer,
})

export type RootState = ReturnType<typeof root_reducer>
