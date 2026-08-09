import { connect, type ConnectedProps } from 'react-redux'
import type { RootState } from '@/store'
import {
  clear_all_data,
  delete_team,
  load_settings,
  refresh_metrics,
  refresh_sync_states,
  reset_sync_data,
  run_sync,
  save_settings,
  set_bootstrapped,
  set_custom_from,
  set_custom_to,
  set_members,
  set_period_key,
  set_selected_repos,
  set_show_settings,
  sync_selected_repos_with_settings,
  upsert_team,
} from '@/store'

export const map_state_to_props = (state: RootState) => ({
  settings: state.settings.settings,
  settings_loading: state.settings.loading,
  syncing: state.sync.syncing,
  progress: state.sync.progress,
  rate_limit: state.sync.rate_limit,
  sync_error: state.sync.error,
  sync_states: state.sync.sync_states,
  bootstrapped: state.sync.bootstrapped,
  selected_repos: state.dashboard.selected_repos,
  members: state.dashboard.members,
  period_key: state.dashboard.period_key,
  custom_from: state.dashboard.custom_from,
  custom_to: state.dashboard.custom_to,
  metrics: state.dashboard.metrics,
  contributors: state.dashboard.contributors,
  metrics_loading: state.dashboard.loading,
  show_settings: state.dashboard.show_settings,
})

export const map_dispatch_to_props = {
  load_settings,
  save_settings,
  upsert_team,
  delete_team,
  reset_sync_data,
  clear_all_data,
  run_sync,
  refresh_sync_states,
  set_bootstrapped,
  refresh_metrics,
  set_selected_repos,
  sync_selected_repos_with_settings,
  set_members,
  set_period_key,
  set_custom_from,
  set_custom_to,
  set_show_settings,
}

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
