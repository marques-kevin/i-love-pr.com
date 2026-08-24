import { connect, type ConnectedProps } from 'react-redux'
import { dashboard_chrome_flags_for_state } from '@/lib/is_imported_repo'
import { load_repo_settings } from '@/store'
import type { AppDispatch, RootState } from '@/store'

export const map_state_to_props = (state: RootState) => {
  const chrome = dashboard_chrome_flags_for_state(
    state.settings.settings,
    state.dashboard.active_repo,
  )
  return {
    is_imported: !chrome.toolbar,
    chrome,
  }
}

export const map_dispatch_to_props = (dispatch: AppDispatch) => ({
  load_repo_settings: (repo_full_name: string) => {
    void dispatch(load_repo_settings({ repo_full_name }))
  },
})

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
