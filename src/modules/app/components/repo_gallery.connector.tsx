import { connect, type ConnectedProps } from 'react-redux'
import { split_repos_for_gallery } from '@/lib/repo_gallery_sections'
import { request_add_repository as request_add_repository_action } from '@/store'
import type { AppDispatch, RootState } from '@/store'

export const map_state_to_props = (state: RootState) => {
  const repos = state.settings.settings?.repos ?? []
  const { my_repositories, imported } = split_repos_for_gallery(repos, state.settings.repo_records)
  return {
    my_repositories,
    imported_repositories: imported,
    sync_states: state.sync.sync_states,
  }
}

export const map_dispatch_to_props = (dispatch: AppDispatch) => ({
  request_add_repository: () => {
    dispatch(request_add_repository_action())
  },
})

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
