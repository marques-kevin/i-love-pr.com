import { connect, type ConnectedProps } from 'react-redux'
import type { RootState } from '@/store'

export const map_state_to_props = (state: RootState) => ({
  pr_coverage: state.sync.pr_coverage,
})

export const connector = connect(map_state_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
