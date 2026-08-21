import { normalize_settings_dashboards } from '@/lib/dashboard_layout'
import { parse_repo_dashboard_path } from '@/lib/repo_path'
import type { AppSettings } from '@/lib/types'

export function build_settings_after_remove_repo(
  settings: AppSettings,
  repo_full_name: string,
): AppSettings {
  const next_repos = settings.repos.filter((repo) => repo !== repo_full_name)
  const dashboards = settings.dashboards.filter((tab) => tab.repo_full_name !== repo_full_name)
  const active_dashboard_by_repo = { ...settings.active_dashboard_by_repo }
  delete active_dashboard_by_repo[repo_full_name]

  const dashboards_fields = normalize_settings_dashboards({
    repos: next_repos,
    active_repo:
      settings.active_repo === repo_full_name ? (next_repos[0] ?? null) : settings.active_repo,
    dashboards,
    active_dashboard_by_repo,
    active_dashboard_id: settings.active_dashboard_id,
  })

  return {
    ...settings,
    repos: next_repos,
    imported_repos: settings.imported_repos?.filter((repo) => repo !== repo_full_name),
    ...dashboards_fields,
  }
}

export function should_navigate_home_after_remove_repo(
  pathname: string,
  repo_full_name: string,
): boolean {
  return parse_repo_dashboard_path(pathname) === repo_full_name
}
