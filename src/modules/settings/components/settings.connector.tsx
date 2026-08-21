import { connect, type ConnectedProps } from 'react-redux'
import type { RootState } from '@/store'
import {
  clear_all_data,
  create_repo_share_link,
  download_repo_snapshot_file,
  load_settings,
  refresh_metrics,
  reset_sync_data,
  run_sync,
  save_settings,
  set_bootstrapped,
  set_show_settings,
} from '@/store'

export const map_state_to_props = (state: RootState) => ({
  settings: state.settings.settings,
  open: state.dashboard.show_settings,
  active_repo: state.dashboard.active_repo,
})

export const map_dispatch_to_props = {
  set_show_settings,
  save_settings,
  reset_sync_data,
  clear_all_data,
  load_settings,
  set_bootstrapped,
  refresh_metrics,
  run_sync,
  download_repo_snapshot_file,
  create_repo_share_link,
}

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
