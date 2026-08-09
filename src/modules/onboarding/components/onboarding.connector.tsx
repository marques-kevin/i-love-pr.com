import { connect, type ConnectedProps } from 'react-redux'
import { save_settings } from '@/store'

export const map_state_to_props = null

export const map_dispatch_to_props = {
  save_settings,
}

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
