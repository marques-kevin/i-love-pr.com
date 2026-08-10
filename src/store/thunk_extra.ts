import type { Repositories } from '@/repositories'
import type { GitHubViewerProfile, SavedAccount } from '@/lib/types'
import type { BusinessHoursConfig, AppSettings } from '@/lib/types'

export type ActivateAccountInput = {
  profile: GitHubViewerProfile
  token: string
  repos: string[]
  sync_interval_hours?: number
  backfill_limit?: number
  ignored_bots?: string[]
  test_file_globs?: string[]
  business_hours?: BusinessHoursConfig
  locale?: AppSettings['locale']
}

export type SessionApi = {
  get_active_login: () => string | null
  list_accounts: () => Promise<SavedAccount[]>
  get_accounts: () => SavedAccount[]
  logout: () => Promise<void>
  switch_account: (login: string) => Promise<void>
  start_add_account: () => Promise<void>
  cancel_add_account: () => Promise<void>
  activate_account: (input: ActivateAccountInput) => Promise<void>
  upsert_account_profile: (
    account: Omit<SavedAccount, 'last_used_at'> & { last_used_at?: string },
  ) => Promise<void>
  wipe_active_account: () => Promise<void>
  refresh_accounts: () => Promise<SavedAccount[]>
}

export type ThunkExtra = {
  repositories: Repositories
  session: SessionApi
}
