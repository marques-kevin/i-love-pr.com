import { connect, type ConnectedProps } from 'react-redux'
import type { RootState } from '@/store'
import { cancel_add_account, clear_available_repos, complete_onboarding } from '@/store'

export const map_state_to_props = (state: RootState) => ({
  accounts: state.accounts.accounts,
  adding_account: state.accounts.adding_account,
})

export const map_dispatch_to_props = {
  complete_onboarding,
  clear_available_repos,
  cancel_add_account,
}

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
