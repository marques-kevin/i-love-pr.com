import { connect, type ConnectedProps } from 'react-redux'
import type { RootState } from '@/store'
import { logout_account, start_add_account, switch_account } from '@/store'

export const map_state_to_props = (state: RootState) => ({
  accounts: state.accounts.accounts,
  active_login: state.accounts.active_login,
})

export const map_dispatch_to_props = {
  logout_account,
  switch_account,
  start_add_account,
}

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
