import { connect, type ConnectedProps } from 'react-redux'
import type { BusinessHoursConfig } from '@/lib/types'
import { load_repo_settings, save_repo_settings } from '@/store'
import type { AppDispatch } from '@/store'

export const map_state_to_props = () => ({})

export const map_dispatch_to_props = (dispatch: AppDispatch) => ({
  load_repo_settings: (repo_full_name: string) =>
    dispatch(load_repo_settings({ repo_full_name })).unwrap(),
  save_repo_settings: (input: {
    repo_full_name: string
    ignored_bots: string[]
    test_file_globs: string[]
    business_hours: BusinessHoursConfig
  }) => dispatch(save_repo_settings(input)).unwrap(),
})

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
