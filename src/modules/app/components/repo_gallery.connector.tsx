import { connect, type ConnectedProps } from 'react-redux'
import {
  request_add_repository as request_add_repository_action,
  request_import_repository as request_import_repository_action,
} from '@/store'
import type { AppDispatch, RootState } from '@/store'

export const map_state_to_props = (state: RootState) => ({
  repos: state.settings.settings?.repos ?? [],
  sync_states: state.sync.sync_states,
})

export const map_dispatch_to_props = (dispatch: AppDispatch) => ({
  request_add_repository: () => {
    dispatch(request_add_repository_action())
  },
  request_import_repository: () => {
    dispatch(request_import_repository_action())
  },
})

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
