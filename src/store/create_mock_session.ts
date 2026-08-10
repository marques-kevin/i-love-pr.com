import type { SessionApi } from '@/store/thunk_extra'

export function create_mock_session(overrides: Partial<SessionApi> = {}): SessionApi {
  return {
    get_active_login: () => 'testuser',
    list_accounts: async () => [],
    get_accounts: () => [],
    logout: async () => undefined,
    switch_account: async () => undefined,
    start_add_account: async () => undefined,
    cancel_add_account: async () => undefined,
    activate_account: async () => undefined,
    upsert_account_profile: async () => undefined,
    wipe_active_account: async () => undefined,
    refresh_accounts: async () => [],
    ...overrides,
  }
}
