import { connect, type ConnectedProps } from 'react-redux'
import type { RootState } from '@/store'
import { set_selected_repos } from '@/store'

export const map_state_to_props = (state: RootState) => ({
  repos: state.settings.settings?.repos ?? [],
  selected_repos: state.dashboard.selected_repos,
})

export const map_dispatch_to_props = {
  set_selected_repos,
}

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
