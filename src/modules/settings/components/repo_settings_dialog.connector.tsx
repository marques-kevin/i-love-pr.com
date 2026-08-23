import { connect, type ConnectedProps } from 'react-redux'
import { default_repo_settings } from '@/lib/repo_settings'
import { save_repo_settings } from '@/store'
import type { RootState } from '@/store'

type OwnProps = {
  repo_full_name: string | null
}

export const map_state_to_props = (state: RootState, own: OwnProps) => ({
  repo_settings: own.repo_full_name
    ? (state.settings.repo_settings_by_repo[own.repo_full_name] ??
      default_repo_settings(own.repo_full_name))
    : null,
})

export const map_dispatch_to_props = {
  save_repo_settings,
}

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
