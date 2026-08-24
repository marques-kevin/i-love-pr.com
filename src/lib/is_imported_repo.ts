import type { AppSettings } from '@/lib/types'

export function is_imported_repo(
  settings: AppSettings | null | undefined,
  repo_full_name: string | null | undefined,
): boolean {
  if (!settings || !repo_full_name) return false
  return (settings.imported_repos ?? []).includes(repo_full_name)
}

export type DashboardChromeFlags = {
  toolbar: boolean
  settings_gear: boolean
  sync_status: boolean
  customize: boolean
  tab_mutations: boolean
}

export function dashboard_chrome_flags(
  settings: AppSettings | null | undefined,
  repo_full_name: string | null | undefined,
): DashboardChromeFlags {
  const read_only = is_imported_repo(settings, repo_full_name)
  const show = !read_only
  return {
    toolbar: show,
    settings_gear: show,
    sync_status: show,
    customize: show,
    tab_mutations: show,
  }
}
