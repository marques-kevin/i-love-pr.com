import { connect, type ConnectedProps } from 'react-redux'
import type { RootState } from '@/store'

export const map_state_to_props = (state: RootState) => ({
  members: state.dashboard.members,
  repos: state.settings.settings?.repos ?? [],
  selected_repos: state.dashboard.selected_repos,
})

export const connector = connect(map_state_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
