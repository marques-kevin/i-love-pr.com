import { connect, type ConnectedProps } from 'react-redux'
import type { DashboardLayoutItem } from '@/lib/types'
import { save_dashboard_layout } from '@/modules/settings/redux/settings_slice'
import type { AppDispatch, RootState } from '@/store'
import { DEFAULT_DASHBOARD_LAYOUT, normalize_dashboard_layout } from '@/lib/dashboard_layout'

function map_state_to_props(state: RootState) {
  const raw = state.settings.settings?.dashboard_layout
  return {
    layout: normalize_dashboard_layout(raw === undefined ? DEFAULT_DASHBOARD_LAYOUT : raw),
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
