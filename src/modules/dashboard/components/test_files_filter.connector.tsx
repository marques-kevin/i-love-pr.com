import { connect, type ConnectedProps } from 'react-redux'
import { set_hide_test_files } from '@/store'
import type { RootState } from '@/store'

export const map_state_to_props = (state: RootState) => ({
  hide_test_files: state.dashboard.hide_test_files,
})

export const map_dispatch_to_props = {
  set_hide_test_files,
}

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
