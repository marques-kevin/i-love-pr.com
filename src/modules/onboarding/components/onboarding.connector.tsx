import { connect, type ConnectedProps } from 'react-redux'
import type { RootState } from '@/store'
import { clear_available_repos, load_available_repos, save_settings } from '@/store'

export const map_state_to_props = (state: RootState) => ({
  available_repos: state.settings.available_repos,
  available_repos_loading: state.settings.available_repos_loading,
})

export const map_dispatch_to_props = {
  save_settings,
  load_available_repos,
  clear_available_repos,
}

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
