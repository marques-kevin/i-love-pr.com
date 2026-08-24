import { connect, type ConnectedProps } from 'react-redux'
import type { AppDispatch, RootState } from '@/store'
import { import_repo_snapshot_from_link } from '@/store'

export const map_state_to_props = (state: RootState) => ({
  import_repo_link: state.dashboard.import_repo_link,
  import_job: state.import_job,
})

export const map_dispatch_to_props = (dispatch: AppDispatch) => ({
  import_repo_snapshot_from_link: (input: Parameters<typeof import_repo_snapshot_from_link>[0]) =>
    dispatch(import_repo_snapshot_from_link(input)).unwrap(),
})

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
