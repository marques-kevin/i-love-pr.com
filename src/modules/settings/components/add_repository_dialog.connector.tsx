import { connect, type ConnectedProps } from 'react-redux'
import type { AppDispatch, RootState } from '@/store'
import { load_available_repos, save_settings, set_active_repo } from '@/store'

export const map_state_to_props = (state: RootState) => ({
  settings: state.settings.settings,
  available_repos: state.settings.available_repos,
  available_repos_loading: state.settings.available_repos_loading,
})

export const map_dispatch_to_props = (dispatch: AppDispatch) => ({
  load_available_repos: () => {
    void dispatch(load_available_repos({ force: false }))
  },
  save_settings: (input: Parameters<typeof save_settings>[0]) =>
    dispatch(save_settings(input)).unwrap(),
  set_active_repo: (repo_full_name: string) => {
    void dispatch(set_active_repo(repo_full_name))
  },
})

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
