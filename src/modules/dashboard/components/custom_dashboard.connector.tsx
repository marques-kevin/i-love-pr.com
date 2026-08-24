import { connect, type ConnectedProps } from 'react-redux'
import type { DashboardLayoutItem } from '@/lib/types'
import { save_dashboard_layout } from '@/modules/settings/redux/settings_slice'
import type { AppDispatch, RootState } from '@/store'
import { get_active_dashboard, normalize_settings_dashboards } from '@/lib/dashboard_layout'
import { dashboard_chrome_flags } from '@/lib/is_imported_repo'

function map_state_to_props(state: RootState) {
  const settings = state.settings.settings
  const { dashboards, active_dashboard_id } = settings
    ? normalize_settings_dashboards(settings)
    : normalize_settings_dashboards({})
  const active = get_active_dashboard(dashboards, active_dashboard_id)
  const chrome = dashboard_chrome_flags(settings, state.dashboard.active_repo)
  return {
    layout: active.layout,
    allow_layout_edits: chrome.customize,
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
