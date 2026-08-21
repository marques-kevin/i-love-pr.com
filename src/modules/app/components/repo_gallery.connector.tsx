import { connect, type ConnectedProps } from 'react-redux'
import { request_add_repository as request_add_repository_action } from '@/modules/dashboard/redux/dashboard_slice'
import {
  create_repo_share_link,
  download_repo_snapshot_file,
  remove_repository,
} from '@/modules/settings/redux/settings_slice'
import type { AppDispatch, RootState } from '@/store'

export const map_state_to_props = (state: RootState) => ({
  repos: state.settings.settings?.repos ?? [],
  sync_states: state.sync.sync_states,
})

export const map_dispatch_to_props = (dispatch: AppDispatch) => ({
  request_add_repository: () => {
    dispatch(request_add_repository_action())
  },
  remove_repository: (repo_full_name: string) => {
    dispatch(remove_repository({ repo_full_name }))
  },
  download_repo_snapshot_file: async (input: { repo_full_name: string }) => {
    await dispatch(download_repo_snapshot_file(input))
  },
  create_repo_share_link: (input: { repo_full_name: string }) => {
    return dispatch(create_repo_share_link(input))
  },
})

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
