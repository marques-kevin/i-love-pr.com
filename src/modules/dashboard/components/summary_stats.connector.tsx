import { connect, type ConnectedProps } from 'react-redux'
import type { RootState } from '@/store'

export const map_state_to_props = (state: RootState) => ({
  summary: state.dashboard.metrics?.summary ?? null,
  business_hours_enabled: state.settings.settings?.businessHours?.enabled === true,
})

export const map_dispatch_to_props = {}

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
