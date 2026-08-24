import Dexie from 'dexie'
import {
  GUEST_WORKSPACE_LOGIN,
  IlovePrDatabase,
  LEGACY_WORKSPACE_DB_NAME,
  open_workspace_db,
  workspace_db_name,
} from '@/lib/db'
import { GitHubClient } from '@/lib/github-client'
import {
  delete_saved_account,
  get_active_login,
  get_saved_account,
  is_legacy_migrated,
  list_saved_accounts,
  mark_legacy_migrated,
  set_active_login,
  upsert_saved_account,
} from '@/lib/meta_db'
import type { GitHubViewerProfile, SavedAccount } from '@/lib/types'
import { create_demo_account, create_demo_seed, DEMO_LOGIN, is_demo_mode } from '@/lib/demo_mode'
import { create_dexie_repositories, create_memory_repositories } from '@/repositories'
import type { Repositories } from '@/repositories'
import { create_store, type AppStore } from '@/store/create_store'
import { global_app_initialized } from '@/modules/app/redux/app_events'
import { hydrate_accounts } from '@/modules/accounts/redux/accounts_slice'
import { request_add_repository } from '@/modules/dashboard/redux/dashboard_slice'
import type { ActivateAccountInput, SessionApi } from '@/store/thunk_extra'

export type SessionSnapshot = {
  ready: boolean
  login: string | null
  accounts: SavedAccount[]
  store: AppStore | null
  /** When true, guest gate should show onboarding even if accounts exist. */
  adding_account: boolean
}

type Listener = () => void

async function copy_table(source: Dexie, target: Dexie, table_name: string): Promise<void> {
  if (!source.tables.some((table) => table.name === table_name)) return
  if (!target.tables.some((table) => table.name === table_name)) return
  const rows = await source.table(table_name).toArray()
  if (rows.length === 0) return
  await target.table(table_name).bulkPut(rows)
}

async function copy_workspace(source: IlovePrDatabase, target: IlovePrDatabase): Promise<void> {
  await target.open()
  const tables = [
    'settings',
    'repos',
    'repo_settings',
    'pull_requests',
    'reviews',
    'sync_state',
    'pr_facts',
    'pr_changed_files',
    'chart_specs',
  ]
  for (const table of tables) {
    await copy_table(source, target, table)
  }
}

async function migrate_legacy_workspace_if_needed(): Promise<void> {
  if (await is_legacy_migrated()) return

  const exists = await Dexie.exists(LEGACY_WORKSPACE_DB_NAME)
  if (!exists) {
    await mark_legacy_migrated()
    return
  }

  const legacy = new IlovePrDatabase(LEGACY_WORKSPACE_DB_NAME)
  try {
    await legacy.open()
    const settings = await legacy.settings.get('settings')
    if (!settings?.token?.trim()) {
      await mark_legacy_migrated()
      return
    }

    let profile: GitHubViewerProfile
    try {
      const client = new GitHubClient(settings.token)
      const validated = await client.validateToken()
      profile = {
        login: validated.login,
        name: validated.name,
        email: validated.email,
        avatar_url: validated.avatar_url,
      }
    } catch {
      // Keep legacy data accessible on next boot attempt if offline.
      return
    }

    const target = open_workspace_db(profile.login)
    await copy_workspace(legacy, target)
    await target.close()

    await upsert_saved_account({
      login: profile.login,
      name: profile.name,
      email: profile.email,
      avatar_url: profile.avatar_url,
      token: settings.token,
    })
    await set_active_login(profile.login)
    await mark_legacy_migrated()

    await legacy.close()
    await Dexie.delete(LEGACY_WORKSPACE_DB_NAME)
  } catch {
    try {
      await legacy.close()
    } catch {
      // ignore
    }
  }
}

export class SessionManager {
  private listeners = new Set<Listener>()
  private snapshot: SessionSnapshot = {
    ready: false,
    login: null,
    accounts: [],
    store: null,
    adding_account: false,
  }
  private workspace: IlovePrDatabase | null = null
  private remount_generation = 0
  private demo_mode = false

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  get_snapshot = (): SessionSnapshot => this.snapshot

  private notify() {
    for (const listener of this.listeners) listener()
  }

  private set_snapshot(patch: Partial<SessionSnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch }
    this.notify()
  }

  private create_session_api(): SessionApi {
    return {
      get_active_login: () => this.snapshot.login,
      list_accounts: () =>
        this.demo_mode ? Promise.resolve(this.snapshot.accounts) : list_saved_accounts(),
      get_accounts: () => this.snapshot.accounts,
      logout: () => this.logout(),
      switch_account: (login) => this.switch_account(login),
      start_add_account: () => this.start_add_account(),
      cancel_add_account: () => this.cancel_add_account(),
      activate_account: (input) => {
        if (this.demo_mode) {
          return Promise.reject(new Error('Add a real account by disabling VITE_DEMO_MODE'))
        }
        return this.activate_account(input)
      },
      upsert_account_profile: async (account) => {
        if (this.demo_mode) return
        await upsert_saved_account(account)
        await this.refresh_accounts()
      },
      wipe_active_account: () => this.wipe_active_account(),
      refresh_accounts: () => this.refresh_accounts(),
    }
  }

  private build_store(
    repositories: Repositories,
    options: {
      login: string | null
      accounts: SavedAccount[]
      adding_account: boolean
    },
  ): AppStore {
    const store = create_store({
      repositories,
      session: this.create_session_api(),
    })
    store.dispatch(
      hydrate_accounts({
        accounts: options.accounts,
        active_login: options.login,
        adding_account: options.adding_account,
      }),
    )
    store.dispatch(global_app_initialized())
    return store
  }

  private async close_workspace() {
    if (!this.workspace) return
    try {
      await this.workspace.close()
    } catch {
      // ignore
    }
    this.workspace = null
  }

  private async refresh_accounts() {
    if (this.demo_mode) {
      return this.snapshot.accounts
    }
    const accounts = await list_saved_accounts()
    this.set_snapshot({ accounts })
    this.snapshot.store?.dispatch(
      hydrate_accounts({
        accounts,
        active_login: this.snapshot.login,
        adding_account: this.snapshot.adding_account,
      }),
    )
    return accounts
  }

  async boot(): Promise<void> {
    if (is_demo_mode()) {
      await this.mount_demo()
      return
    }

    await migrate_legacy_workspace_if_needed()
    const accounts = await list_saved_accounts()
    const active_login = await get_active_login()

    if (active_login && accounts.some((account) => account.login === active_login)) {
      await this.mount_workspace(active_login)
      return
    }

    if (active_login) {
      await set_active_login(null)
    }

    await this.mount_guest({ accounts, adding_account: accounts.length === 0 })
  }

  private async mount_demo(): Promise<void> {
    this.demo_mode = true
    this.remount_generation += 1
    await this.close_workspace()

    const account = create_demo_account()
    const accounts = [account]
    const repositories = create_memory_repositories(create_demo_seed())
    const store = this.build_store(repositories, {
      login: DEMO_LOGIN,
      accounts,
      adding_account: false,
    })

    this.set_snapshot({
      ready: true,
      login: DEMO_LOGIN,
      accounts,
      store,
      adding_account: false,
    })
  }

  private async mount_guest(options?: {
    accounts?: SavedAccount[]
    adding_account?: boolean
  }): Promise<void> {
    this.demo_mode = false
    this.remount_generation += 1
    const generation = this.remount_generation
    await this.close_workspace()

    const workspace = open_workspace_db(GUEST_WORKSPACE_LOGIN)
    await workspace.open()
    if (generation !== this.remount_generation) {
      await workspace.close()
      return
    }

    this.workspace = workspace
    const accounts = options?.accounts ?? (await list_saved_accounts())
    const repositories = create_dexie_repositories(workspace)
    const store = this.build_store(repositories, {
      login: null,
      accounts,
      adding_account: options?.adding_account ?? false,
    })
    this.set_snapshot({
      ready: true,
      login: null,
      accounts,
      store,
      adding_account: options?.adding_account ?? false,
    })
  }

  private async mount_workspace(login: string): Promise<void> {
    this.demo_mode = false
    this.remount_generation += 1
    const generation = this.remount_generation
    await this.close_workspace()

    const account = await get_saved_account(login)
    if (!account) {
      await set_active_login(null)
      await this.mount_guest()
      return
    }

    const workspace = open_workspace_db(login)
    await workspace.open()
    if (generation !== this.remount_generation) {
      await workspace.close()
      return
    }

    this.workspace = workspace
    const repositories = create_dexie_repositories(workspace)
    await set_active_login(login)
    await upsert_saved_account({ ...account, last_used_at: new Date().toISOString() })
    const accounts = await list_saved_accounts()
    const store = this.build_store(repositories, {
      login,
      accounts,
      adding_account: false,
    })

    void this.refresh_profile(account).catch(() => undefined)

    this.set_snapshot({
      ready: true,
      login,
      accounts,
      store,
      adding_account: false,
    })
  }

  private async refresh_profile(account: SavedAccount): Promise<void> {
    const client = new GitHubClient(account.token)
    const profile = await client.validateToken()
    await upsert_saved_account({
      login: profile.login,
      name: profile.name,
      email: profile.email,
      avatar_url: profile.avatar_url,
      token: account.token,
    })
    if (this.snapshot.login === account.login) {
      await this.refresh_accounts()
    }
  }

  async logout(): Promise<void> {
    await set_active_login(null)
    await this.mount_guest({ adding_account: false })
  }

  async start_add_account(): Promise<void> {
    await set_active_login(null)
    await this.mount_guest({ adding_account: true })
  }

  async cancel_add_account(): Promise<void> {
    this.set_snapshot({ adding_account: false })
    this.snapshot.store?.dispatch(
      hydrate_accounts({
        accounts: this.snapshot.accounts,
        active_login: this.snapshot.login,
        adding_account: false,
      }),
    )
  }

  async switch_account(login: string): Promise<void> {
    const account = await get_saved_account(login)
    if (!account) throw new Error('Account not found')
    await this.mount_workspace(login)
  }

  async activate_account(input: ActivateAccountInput): Promise<void> {
    const login = input.profile.login
    this.remount_generation += 1
    const generation = this.remount_generation
    await this.close_workspace()

    const workspace = open_workspace_db(login)
    await workspace.open()
    if (generation !== this.remount_generation) {
      await workspace.close()
      return
    }

    const repositories = create_dexie_repositories(workspace)
    const next = await repositories.settings.save({
      token: input.token.trim(),
      repos: input.repos.map((repo) => repo.trim()).filter(Boolean),
      sync_interval_hours: input.sync_interval_hours,
      backfill_limit: input.backfill_limit,
      ignored_bots: input.ignored_bots,
      test_file_globs: input.test_file_globs,
      business_hours: input.business_hours,
      locale: input.locale,
    })
    await repositories.settings.upsert_repos(next.repos)

    await upsert_saved_account({
      login: input.profile.login,
      name: input.profile.name,
      email: input.profile.email,
      avatar_url: input.profile.avatar_url,
      token: input.token.trim(),
    })
    await set_active_login(login)

    this.workspace = workspace
    const accounts = await list_saved_accounts()
    const store = this.build_store(repositories, {
      login,
      accounts,
      adding_account: false,
    })
    if (next.repos.length === 0) {
      store.dispatch(request_add_repository())
    }
    this.set_snapshot({
      ready: true,
      login,
      accounts,
      store,
      adding_account: false,
    })
  }

  async wipe_active_account(): Promise<void> {
    const login = this.snapshot.login
    if (!login) return
    await this.close_workspace()
    await Dexie.delete(workspace_db_name(login))
    await delete_saved_account(login)
    await set_active_login(null)
    await this.mount_guest({ adding_account: false })
  }
}

export const session_manager = new SessionManager()

export function account_display_name(account: Pick<SavedAccount, 'name' | 'login'>): string {
  return account.name?.trim() || account.login
}

export function account_secondary_line(account: Pick<SavedAccount, 'email' | 'login'>): string {
  return account.email?.trim() || `@${account.login}`
}
