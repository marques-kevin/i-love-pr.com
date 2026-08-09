import { connect, type ConnectedProps } from 'react-redux'
import type { RootState } from '@/store'
import {
  load_settings,
  refresh_metrics,
  refresh_sync_states,
  run_sync,
  set_bootstrapped,
  set_show_settings,
  sync_selected_repos_with_settings,
} from '@/store'

export const map_state_to_props = (state: RootState) => ({
  settings: state.settings.settings,
  settings_loading: state.settings.loading,
  bootstrapped: state.sync.bootstrapped,
  syncing: state.sync.syncing,
})

export const map_dispatch_to_props = {
  load_settings,
  sync_selected_repos_with_settings,
  set_bootstrapped,
  run_sync,
  refresh_sync_states,
  refresh_metrics,
  set_show_settings,
}

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
