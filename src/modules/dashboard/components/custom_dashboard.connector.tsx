import { connect, type ConnectedProps } from 'react-redux'
import type { DashboardLayoutItem } from '@/lib/types'
import {
  create_dashboard,
  save_dashboard_layout,
  set_active_dashboard,
} from '@/modules/settings/redux/settings_slice'
import type { AppDispatch, RootState } from '@/store'
import { get_active_dashboard, normalize_settings_dashboards } from '@/lib/dashboard_layout'

function map_state_to_props(state: RootState) {
  const settings = state.settings.settings
  const { dashboards, active_dashboard_id } = settings
    ? normalize_settings_dashboards(settings)
    : normalize_settings_dashboards({})
  const active = get_active_dashboard(dashboards, active_dashboard_id)
  return {
    dashboards,
    active_dashboard_id,
    layout: active.layout,
  }
}

function map_dispatch_to_props(dispatch: AppDispatch) {
  return {
    save_layout: (layout: DashboardLayoutItem[]) => {
      void dispatch(save_dashboard_layout(layout))
    },
    create_dashboard_tab: (name: string) => {
      void dispatch(create_dashboard(name))
    },
    set_active_dashboard_id: (dashboard_id: string) => {
      void dispatch(set_active_dashboard(dashboard_id))
    },
  }
}

const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
export { connector }
