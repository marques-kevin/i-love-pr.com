import { connect, type ConnectedProps } from 'react-redux'
import { can_sync_github_repo } from '@/lib/app_gate'
import type { RootState } from '@/store'
import { run_sync } from '@/store'

export const map_state_to_props = (state: RootState) => ({
  syncing: state.sync.syncing,
  progress: state.sync.progress,
  sync_states: state.sync.sync_states,
  error: state.sync.error,
  active_repo: state.dashboard.active_repo,
  can_refresh: can_sync_github_repo(state.settings.settings, state.dashboard.active_repo),
})

export const map_dispatch_to_props = {
  run_sync,
}

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
