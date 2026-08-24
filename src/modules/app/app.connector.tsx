import { connect, type ConnectedProps } from 'react-redux'
import type { RootState } from '@/store'

export const map_state_to_props = (state: RootState) => ({
  settings: state.settings.settings,
  settings_loading: state.settings.loading,
  accounts: state.accounts.accounts,
  adding_account: state.accounts.adding_account,
  share_boot_import_status: state.dashboard.share_boot_import_status,
  share_boot_import_error: state.dashboard.share_boot_import_error,
})

export const map_dispatch_to_props = {}

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
