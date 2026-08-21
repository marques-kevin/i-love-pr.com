import { connect, type ConnectedProps } from 'react-redux'
import {
  clear_add_repository_request,
  load_available_repos,
  open_import_dialog,
  set_show_settings,
} from '@/store'
import type { AppDispatch, RootState } from '@/store'

export const map_state_to_props = (state: RootState) => ({
  add_repository_requested: state.dashboard.add_repository_requested,
  import_dialog_open: state.dashboard.import_dialog_open,
  import_prefill_link: state.dashboard.import_prefill_link,
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
  open_import_dialog: (prefill_link?: string) => {
    dispatch(open_import_dialog(prefill_link))
  },
})

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
