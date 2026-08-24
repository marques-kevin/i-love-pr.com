import { connect, type ConnectedProps } from 'react-redux'
import type { RootState } from '@/store'

export const map_state_to_props = (state: RootState) => ({
  settings: state.settings.settings,
  settings_loading: state.settings.loading,
  boot_share_import_loading: state.settings.boot_share_import_loading,
  boot_share_import_error: state.settings.boot_share_import_error,
  accounts: state.accounts.accounts,
  adding_account: state.accounts.adding_account,
})

export const map_dispatch_to_props = {}

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
