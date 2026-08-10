import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { SavedAccount } from '@/lib/types'

export type AccountsState = {
  accounts: SavedAccount[]
  active_login: string | null
  adding_account: boolean
}

const initial_state: AccountsState = {
  accounts: [],
  active_login: null,
  adding_account: false,
}

const accounts_slice = createSlice({
  name: 'accounts',
  initialState: initial_state,
  reducers: {
    hydrate_accounts(
      state,
      action: PayloadAction<{
        accounts: SavedAccount[]
        active_login: string | null
        adding_account: boolean
      }>,
    ) {
      state.accounts = action.payload.accounts
      state.active_login = action.payload.active_login
      state.adding_account = action.payload.adding_account
    },
  },
})

export const { hydrate_accounts } = accounts_slice.actions
export const accounts_reducer = accounts_slice.reducer
