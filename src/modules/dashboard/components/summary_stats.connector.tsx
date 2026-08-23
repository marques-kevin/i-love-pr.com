import { connect, type ConnectedProps } from 'react-redux'
import type { RootState } from '@/store'

export const map_state_to_props = (state: RootState) => {
  const active_repo = state.dashboard.active_repo
  const repo_settings = active_repo
    ? state.settings.repo_settings_by_repo[active_repo]
    : undefined
  return {
    summary: state.dashboard.metrics?.summary ?? null,
    business_hours_enabled: repo_settings?.business_hours.enabled === true,
  }
}

export const map_dispatch_to_props = {}

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
