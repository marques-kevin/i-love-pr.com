import { connect, type ConnectedProps } from 'react-redux'
import type { RootState } from '@/store'

export const map_state_to_props = (state: RootState) => ({
  pr_coverage: state.sync.pr_coverage,
  sync_states: state.sync.sync_states,
  active_repo: state.dashboard.active_repo,
})

export const connector = connect(map_state_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
