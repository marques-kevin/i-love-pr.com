import { connect, type ConnectedProps } from 'react-redux'
import { resolve_repo_settings } from '@/lib/repo_settings'
import type { RootState } from '@/store'

export const map_state_to_props = (state: RootState) => {
  const active_repo = state.dashboard.active_repo
  const repo_record = active_repo ? state.settings.repo_records[active_repo] : undefined
  return {
    summary: state.dashboard.metrics?.summary ?? null,
    business_hours_enabled: resolve_repo_settings(repo_record).business_hours.enabled,
  }
}

export const map_dispatch_to_props = {}

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
