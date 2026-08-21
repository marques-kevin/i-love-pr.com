import { connect, type ConnectedProps } from 'react-redux'
import {
  clear_add_repository_request,
  clear_import_repo_request,
  load_available_repos,
  set_show_settings,
} from '@/store'
import type { AppDispatch, RootState } from '@/store'

export const map_state_to_props = (state: RootState) => ({
  add_repository_requested: state.dashboard.add_repository_requested,
  import_repo_requested: state.dashboard.import_repo_requested,
})

export const map_dispatch_to_props = (dispatch: AppDispatch) => ({
  set_show_settings: (show: boolean) => {
    dispatch(set_show_settings(show))
  },
  load_available_repos: () => {
    void dispatch(load_available_repos({ force: false }))
  },
  clear_add_repository_request: () => {
    dispatch(clear_add_repository_request())
  },
  clear_import_repo_request: () => {
    dispatch(clear_import_repo_request())
  },
})

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
