import { connect, type ConnectedProps } from 'react-redux'
import { save_repo_settings } from '@/store'
import type { RootState } from '@/store'

export type RepoSettingsDialogOwnProps = {
  open: boolean
  repo_full_name: string | null
  on_close: () => void
}

export const map_state_to_props = (state: RootState, own_props: RepoSettingsDialogOwnProps) => ({
  repo_record: own_props.repo_full_name
    ? (state.settings.repo_records[own_props.repo_full_name] ?? null)
    : null,
})

export const map_dispatch_to_props = {
  save_repo_settings,
}

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector> & RepoSettingsDialogOwnProps
