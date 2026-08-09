import { connect, type ConnectedProps } from 'react-redux'
import type { RootState } from '@/store'

export const map_state_to_props = (state: RootState) => ({
  loading: state.dashboard.loading,
  has_metrics: state.dashboard.metrics != null,
})

export const map_dispatch_to_props = {}

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
