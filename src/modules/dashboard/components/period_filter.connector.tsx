import { connect, type ConnectedProps } from 'react-redux'
import type { RootState } from '@/store'
import { set_custom_from, set_custom_to, set_period_key } from '@/store'

export const map_state_to_props = (state: RootState) => ({
  period_key: state.dashboard.period_key,
  custom_from: state.dashboard.custom_from,
  custom_to: state.dashboard.custom_to,
})

export const map_dispatch_to_props = {
  set_period_key,
  set_custom_from,
  set_custom_to,
}

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
