import { connect, type ConnectedProps } from 'react-redux'
import { load_repo_settings } from '@/store'
import type { AppDispatch, RootState } from '@/store'
import { imported_dashboard_chrome, select_is_imported_from_state } from '../lib/imported_dashboard'

export const map_state_to_props = (state: RootState) => {
  const is_imported = select_is_imported_from_state(state)
  return {
    is_imported,
    chrome: imported_dashboard_chrome(is_imported),
  }
}

export const map_dispatch_to_props = (dispatch: AppDispatch) => ({
  load_repo_settings: (repo_full_name: string) => {
    void dispatch(load_repo_settings({ repo_full_name }))
  },
})

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
