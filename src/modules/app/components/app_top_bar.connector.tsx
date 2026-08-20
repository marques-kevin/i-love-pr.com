import { connect, type ConnectedProps } from 'react-redux'
import {
  clear_add_repository_request,
  load_available_repos,
  set_active_repo,
  set_show_settings,
} from '@/store'
import type { AppDispatch, RootState } from '@/store'

export const map_state_to_props = (state: RootState) => ({
  repos: state.settings.settings?.repos ?? [],
  active_repo: state.dashboard.active_repo,
  sync_states: state.sync.sync_states,
  add_repository_requested: state.dashboard.add_repository_requested,
})

export const map_dispatch_to_props = (dispatch: AppDispatch) => ({
  set_show_settings: (show: boolean) => {
    dispatch(set_show_settings(show))
  },
  set_active_repo: (repo_full_name: string) => {
    void dispatch(set_active_repo(repo_full_name))
  },
  load_available_repos: () => {
    void dispatch(load_available_repos({ force: false }))
  },
  clear_add_repository_request: () => {
    dispatch(clear_add_repository_request())
  },
})

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
