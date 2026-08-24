import { is_imported_repo } from '@/lib/repo_gallery'
import type { AppSettings } from '@/lib/types'
import type { RootState } from '@/store'

export function select_is_imported_from_state(
  state: Pick<RootState, 'settings' | 'dashboard'>,
): boolean {
  return select_is_imported(state.settings.settings, state.dashboard.active_repo)
}

export function select_is_imported(
  settings: Pick<AppSettings, 'imported_repos'> | null | undefined,
  active_repo: string | null,
): boolean {
  if (!active_repo) return false
  return is_imported_repo(settings, active_repo)
}

export type ImportedDashboardChrome = {
  show_toolbar: boolean
  show_customize_fab: boolean
  show_settings: boolean
  show_sync_status: boolean
  show_tab_mutations: boolean
  show_edit_chrome: boolean
}

export function imported_dashboard_chrome(is_imported: boolean): ImportedDashboardChrome {
  if (!is_imported) {
    return {
      show_toolbar: true,
      show_customize_fab: true,
      show_settings: true,
      show_sync_status: true,
      show_tab_mutations: true,
      show_edit_chrome: true,
    }
  }

  return {
    show_toolbar: false,
    show_customize_fab: false,
    show_settings: false,
    show_sync_status: false,
    show_tab_mutations: false,
    show_edit_chrome: false,
  }
}
