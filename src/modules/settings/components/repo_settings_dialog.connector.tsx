import { connect, type ConnectedProps } from 'react-redux'
import type { RootState } from '@/store'
import type { BusinessHoursConfig } from '@/lib/types'
import { save_repo_settings } from '@/store'
import type { AppDispatch } from '@/store'

export const map_state_to_props = (
  state: RootState,
  own_props: { repo_full_name: string | null },
) => ({
  repo_settings:
    own_props.repo_full_name != null
      ? state.settings.repo_settings_by_repo[own_props.repo_full_name]
      : undefined,
  repo_settings_loading:
    own_props.repo_full_name != null &&
    state.settings.repo_settings_loading_repo === own_props.repo_full_name,
})

export const map_dispatch_to_props = (dispatch: AppDispatch) => ({
  save_repo_settings: (input: {
    repo_full_name: string
    ignored_bots: string[]
    test_file_globs: string[]
    business_hours: BusinessHoursConfig
  }) => dispatch(save_repo_settings(input)).unwrap(),
})

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
