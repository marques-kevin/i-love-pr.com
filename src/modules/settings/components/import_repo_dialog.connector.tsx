import { connect, type ConnectedProps } from 'react-redux'
import type { AppDispatch, RootState } from '@/store'
import {
  clear_import_repository_request,
  import_repo_snapshot_from_link,
  refresh_metrics,
  run_sync,
  set_active_repo,
} from '@/store'

export const map_state_to_props = (state: RootState) => ({
  import_repository_requested: state.dashboard.import_repository_requested,
  import_prefill_link: state.dashboard.import_prefill_link,
})

export const map_dispatch_to_props = (dispatch: AppDispatch) => ({
  import_repo_snapshot_from_link: (share_link: string) =>
    dispatch(import_repo_snapshot_from_link({ share_link })).unwrap(),
  set_active_repo: (repo_full_name: string) => dispatch(set_active_repo(repo_full_name)).unwrap(),
  refresh_metrics: () => {
    void dispatch(refresh_metrics())
  },
  run_sync: () => {
    void dispatch(run_sync({ force: false }))
  },
  clear_import_repository_request: () => {
    dispatch(clear_import_repository_request())
  },
})

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
