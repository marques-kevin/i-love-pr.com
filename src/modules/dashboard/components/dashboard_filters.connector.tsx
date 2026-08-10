import { connect, type ConnectedProps } from 'react-redux'
import type { RootState } from '@/store'

export const map_state_to_props = (state: RootState) => ({
  members: state.dashboard.members,
  hide_test_files: state.dashboard.hide_test_files,
})

export const connector = connect(map_state_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
