import { has_browser_navigator } from '@/lib/boundary_parse'
import { parse_repo_dashboard_path } from '@/lib/repo_path'
import type { AppSettings } from '@/lib/types'

export function active_repo_for_dashboard_view(
  settings: AppSettings | null | undefined,
  dashboard_active_repo: string | null,
  pathname = has_browser_navigator() ? window.location.pathname : '',
): string | null {
  if (!settings) return dashboard_active_repo
  const url_repo = parse_repo_dashboard_path(pathname)
  if (url_repo && settings.repos.includes(url_repo)) return url_repo
  if (dashboard_active_repo && settings.repos.includes(dashboard_active_repo)) {
    return dashboard_active_repo
  }
  return settings.active_repo ?? settings.repos[0] ?? null
}

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

export function dashboard_chrome_flags_for_state(
  settings: AppSettings | null | undefined,
  dashboard_active_repo: string | null,
  pathname?: string,
): DashboardChromeFlags {
  return dashboard_chrome_flags(
    settings,
    active_repo_for_dashboard_view(settings, dashboard_active_repo, pathname),
  )
}
