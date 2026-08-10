import { connect, type ConnectedProps } from 'react-redux'
import {
  create_dashboard,
  delete_dashboard,
  rename_dashboard,
  set_active_dashboard,
} from '@/modules/settings/redux/settings_slice'
import type { AppDispatch, RootState } from '@/store'
import { dashboards_for_repo, normalize_settings_dashboards } from '@/lib/dashboard_layout'

function map_state_to_props(state: RootState) {
  const settings = state.settings.settings
  const normalized = settings
    ? normalize_settings_dashboards(settings)
    : normalize_settings_dashboards({})
  const active_repo = state.dashboard.active_repo ?? normalized.active_repo
  return {
    dashboards: dashboards_for_repo(normalized.dashboards, active_repo),
    active_dashboard_id: normalized.active_dashboard_id,
  }
}

function map_dispatch_to_props(dispatch: AppDispatch) {
  return {
    create_dashboard_tab: (name: string) => {
      void dispatch(create_dashboard(name))
    },
    rename_dashboard_tab: (dashboard_id: string, name: string) => {
      void dispatch(rename_dashboard({ dashboard_id, name }))
    },
    delete_dashboard_tab: (dashboard_id: string) => {
      void dispatch(delete_dashboard(dashboard_id))
    },
    set_active_dashboard_id: (dashboard_id: string) => {
      void dispatch(set_active_dashboard(dashboard_id))
    },
  }
}

const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
export { connector }
