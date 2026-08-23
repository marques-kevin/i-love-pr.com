import { combineReducers } from '@reduxjs/toolkit'
import { accounts_reducer } from '@/modules/accounts/redux/accounts_slice'
import { gallery_reducer } from '@/modules/app/redux/gallery_slice'
import { dashboard_reducer } from '@/modules/dashboard/redux/dashboard_slice'
import { i18n_reducer } from '@/modules/i18n/redux/i18n_slice'
import { settings_reducer } from '@/modules/settings/redux/settings_slice'
import { sync_reducer } from '@/modules/sync/redux/sync_slice'

export const root_reducer = combineReducers({
  accounts: accounts_reducer,
  settings: settings_reducer,
  sync: sync_reducer,
  dashboard: dashboard_reducer,
  gallery: gallery_reducer,
  i18n: i18n_reducer,
})

export type RootState = ReturnType<typeof root_reducer>
