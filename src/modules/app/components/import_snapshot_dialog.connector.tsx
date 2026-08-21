import { connect, type ConnectedProps } from 'react-redux'
import {
  close_import_dialog,
  import_repo_snapshot_from_link,
  refresh_metrics,
  run_sync,
  set_active_repo,
} from '@/store'
import type { AppDispatch, RootState } from '@/store'

export const map_state_to_props = (state: RootState) => ({
  open: state.dashboard.import_dialog_open,
  prefill_link: state.dashboard.import_prefill_link,
})

export const map_dispatch_to_props = (dispatch: AppDispatch) => ({
  on_close: () => {
    dispatch(close_import_dialog())
  },
  import_repo_snapshot_from_link: (input: { share_link: string }) => {
    return dispatch(import_repo_snapshot_from_link(input))
  },
  set_active_repo: (repo_full_name: string) => {
    return dispatch(set_active_repo(repo_full_name))
  },
  refresh_metrics: () => {
    void dispatch(refresh_metrics())
  },
  run_sync: (input: { force: boolean }) => {
    void dispatch(run_sync(input))
  },
})

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
