export type ImportedRepoSettings = {
  imported_repos?: string[]
  active_repo?: string | null
} | null

export type ImportedRepoChrome = {
  show_filters: boolean
  show_period_picker: boolean
  show_sync: boolean
  show_settings: boolean
  show_customize: boolean
  show_tab_mutations: boolean
  show_share: boolean
  show_imported_hint: boolean
}

const MUTABLE_CHROME: ImportedRepoChrome = {
  show_filters: true,
  show_period_picker: true,
  show_sync: true,
  show_settings: true,
  show_customize: true,
  show_tab_mutations: true,
  show_share: true,
  show_imported_hint: false,
}

const IMPORTED_CHROME: ImportedRepoChrome = {
  show_filters: false,
  show_period_picker: false,
  show_sync: false,
  show_settings: false,
  show_customize: false,
  show_tab_mutations: false,
  show_share: false,
  show_imported_hint: true,
}

export function is_imported_repo(
  settings: ImportedRepoSettings | undefined,
  repo: string | null | undefined,
): boolean {
  if (!repo) return false
  return (settings?.imported_repos ?? []).includes(repo)
}

export function is_imported_active_repo(
  settings: ImportedRepoSettings | undefined,
  dashboard_active_repo: string | null | undefined,
): boolean {
  return is_imported_repo(settings, dashboard_active_repo ?? settings?.active_repo)
}

export function imported_repo_chrome(is_imported: boolean): ImportedRepoChrome {
  return is_imported ? IMPORTED_CHROME : MUTABLE_CHROME
}
