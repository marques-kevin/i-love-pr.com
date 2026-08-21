import { connect, type ConnectedProps } from 'react-redux'
import { set_active_repo } from '@/store'
import type { AppDispatch, RootState } from '@/store'

export const map_state_to_props = (state: RootState) => ({
  repos: state.settings.settings?.repos ?? [],
  active_repo: state.dashboard.active_repo,
})

export const map_dispatch_to_props = (dispatch: AppDispatch) => ({
  set_active_repo: (repo_full_name: string) => {
    void dispatch(set_active_repo(repo_full_name))
  },
})

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
