import { connect, type ConnectedProps } from 'react-redux'
import type { BusinessHoursConfig } from '@/lib/types'
import { save_repo_settings } from '@/store'
import type { AppDispatch, RootState } from '@/store'

export const map_state_to_props = (state: RootState) => ({
  current_repo_settings: state.settings.current_repo_settings,
  current_repo_settings_repo: state.settings.current_repo_settings_repo,
  current_repo_settings_loading: state.settings.current_repo_settings_loading,
  current_repo_settings_error: state.settings.current_repo_settings_error,
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
