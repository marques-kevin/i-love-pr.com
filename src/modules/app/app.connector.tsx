import { connect, type ConnectedProps } from 'react-redux'
import type { RootState } from '@/store'
import { set_show_settings } from '@/store'

export const map_state_to_props = (state: RootState) => ({
  settings: state.settings.settings,
  settings_loading: state.settings.loading,
})

export const map_dispatch_to_props = {
  set_show_settings,
}

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
