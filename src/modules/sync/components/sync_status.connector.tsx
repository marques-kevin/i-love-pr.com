import { connect, type ConnectedProps } from 'react-redux'
import type { RootState } from '@/store'
import { run_sync } from '@/store'

export const map_state_to_props = (state: RootState) => ({
  syncing: state.sync.syncing,
  progress: state.sync.progress,
  rate_limit: state.sync.rate_limit,
  sync_states: state.sync.sync_states,
  error: state.sync.error,
})

export const map_dispatch_to_props = {
  run_sync,
}

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
