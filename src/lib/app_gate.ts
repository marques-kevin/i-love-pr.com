import type { AppSettings } from '@/lib/types'

export type ShareImportStatus = 'idle' | 'pending' | 'success' | 'error'

export type AppGateView = 'loading' | 'shell' | 'onboarding' | 'account_picker' | 'import_error'

export function has_github_token(settings: Pick<AppSettings, 'token'> | null | undefined): boolean {
  return Boolean(settings?.token.trim())
}

export function settings_have_repos(
  settings: Pick<AppSettings, 'repos'> | null | undefined,
): boolean {
  return Boolean(settings && settings.repos.length > 0)
}

export function resolve_app_gate(input: {
  settings: Pick<AppSettings, 'repos' | 'token'> | null
  settings_loading: boolean
  share_import_status: ShareImportStatus
  accounts_count: number
  adding_account: boolean
}): AppGateView {
  const has_repos = settings_have_repos(input.settings)

  if (input.settings_loading || (input.share_import_status === 'pending' && !has_repos)) {
    return 'loading'
  }
  if (input.share_import_status === 'error' && !has_repos) {
    return 'import_error'
  }
  if (has_repos) {
    return 'shell'
  }
  if (input.accounts_count > 0 && !input.adding_account) {
    return 'account_picker'
  }
  return 'onboarding'
}

export function is_imported_repo(
  settings: Pick<AppSettings, 'imported_repos'> | null | undefined,
  repo_full_name: string | null,
): boolean {
  if (!repo_full_name) return false
  return Boolean(settings?.imported_repos?.includes(repo_full_name))
}

export function can_sync_github_repo(
  settings: Pick<AppSettings, 'token' | 'imported_repos'> | null | undefined,
  repo_full_name: string | null,
): boolean {
  return has_github_token(settings) && !is_imported_repo(settings, repo_full_name)
}
