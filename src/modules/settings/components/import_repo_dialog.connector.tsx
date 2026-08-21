import { connect, type ConnectedProps } from 'react-redux'
import type { AppDispatch, RootState } from '@/store'
import { import_repo_snapshot_from_link, refresh_metrics, run_sync, set_active_repo } from '@/store'

export const map_state_to_props = (state: RootState) => ({
  import_repo_link: state.dashboard.import_repo_link,
})

export const map_dispatch_to_props = (dispatch: AppDispatch) => ({
  import_repo_snapshot_from_link: (input: Parameters<typeof import_repo_snapshot_from_link>[0]) =>
    dispatch(import_repo_snapshot_from_link(input)).unwrap(),
  set_active_repo: (repo_full_name: string) => {
    void dispatch(set_active_repo(repo_full_name))
  },
  refresh_metrics: () => {
    void dispatch(refresh_metrics())
  },
  run_sync: () => {
    void dispatch(run_sync({ force: false }))
  },
})

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
