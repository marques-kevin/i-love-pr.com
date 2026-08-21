import { connect, type ConnectedProps } from 'react-redux'
import { partition_gallery_repos } from '@/lib/repo_gallery'
import {
  request_add_repository as request_add_repository_action,
  request_import_repository as request_import_repository_action,
} from '@/store'
import type { AppDispatch, RootState } from '@/store'

export const map_state_to_props = (state: RootState) => {
  const repos = state.settings.settings?.repos ?? []
  const imported_repos = state.settings.settings?.imported_repos ?? []
  const { own, imported } = partition_gallery_repos(repos, imported_repos)
  return {
    own_repositories: own,
    imported_repositories: imported,
    sync_states: state.sync.sync_states,
  }
}

export const map_dispatch_to_props = (dispatch: AppDispatch) => ({
  request_add_repository: () => {
    dispatch(request_add_repository_action())
  },
  request_import_repository: () => {
    dispatch(request_import_repository_action(undefined))
  },
})

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
