import { connect, type ConnectedProps } from 'react-redux'
import type { RootState } from '@/store'
import { delete_team, set_members, upsert_team } from '@/store'

export const map_state_to_props = (state: RootState) => ({
  contributors: state.dashboard.contributors,
  selected: state.dashboard.members,
  teams: state.settings.settings?.teams ?? [],
})

export const map_dispatch_to_props = {
  set_members,
  upsert_team,
  delete_team,
}

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
