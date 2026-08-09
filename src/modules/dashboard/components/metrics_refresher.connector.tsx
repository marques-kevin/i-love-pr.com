import { connect, type ConnectedProps } from 'react-redux'
import type { RootState } from '@/store'
import { refresh_metrics } from '@/store'

export const map_state_to_props = (state: RootState) => ({
  selected_repos: state.dashboard.selected_repos,
  members: state.dashboard.members,
  period_key: state.dashboard.period_key,
  custom_from: state.dashboard.custom_from,
  custom_to: state.dashboard.custom_to,
})

export const map_dispatch_to_props = {
  refresh_metrics,
}

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
