import { connect, type ConnectedProps } from 'react-redux'
import type { DashboardLayoutItem } from '@/lib/types'
import { save_dashboard_layout } from '@/modules/settings/redux/settings_slice'
import type { AppDispatch, RootState } from '@/store'
import { get_active_dashboard, normalize_settings_dashboards } from '@/lib/dashboard_layout'
import { imported_dashboard_chrome, select_is_imported_from_state } from '../lib/imported_dashboard'

function map_state_to_props(state: RootState) {
  const settings = state.settings.settings
  const { dashboards, active_dashboard_id } = settings
    ? normalize_settings_dashboards(settings)
    : normalize_settings_dashboards({})
  const active = get_active_dashboard(dashboards, active_dashboard_id)
  const is_imported = select_is_imported_from_state(state)
  return {
    layout: active.layout,
    chrome: imported_dashboard_chrome(is_imported),
  }
}

function map_dispatch_to_props(dispatch: AppDispatch) {
  return {
    save_layout: (layout: DashboardLayoutItem[]) => {
      void dispatch(save_dashboard_layout(layout))
    },
  }
}

const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
export { connector }
