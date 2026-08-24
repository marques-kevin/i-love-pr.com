import { connect, type ConnectedProps } from 'react-redux'
import { load_repo_settings } from '@/store'
import type { AppDispatch } from '@/store'

export const map_state_to_props = () => ({})

export const map_dispatch_to_props = (dispatch: AppDispatch) => ({
  load_repo_settings: (repo_full_name: string) => {
    void dispatch(load_repo_settings({ repo_full_name }))
  },
})

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
