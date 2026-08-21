import { connect, type ConnectedProps } from 'react-redux'
import { normalize_settings_dashboards } from '@/lib/dashboard_layout'
import { set_active_repo } from '@/store'
import type { AppDispatch, RootState } from '@/store'

export const map_state_to_props = (state: RootState) => {
  const settings = state.settings.settings
  const normalized = settings
    ? normalize_settings_dashboards(settings)
    : normalize_settings_dashboards({})

  return {
    repos: settings?.repos ?? [],
    active_repo: state.dashboard.active_repo,
    active_dashboard_id: normalized.active_dashboard_id,
  }
}

export const map_dispatch_to_props = (dispatch: AppDispatch) => ({
  set_active_repo: (repo_full_name: string) => {
    void dispatch(set_active_repo(repo_full_name))
  },
})

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
