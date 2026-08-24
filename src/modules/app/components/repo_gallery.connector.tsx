import { connect, type ConnectedProps } from 'react-redux'
import { partition_gallery_repos } from '@/lib/repo_gallery'
import { load_gallery_stats } from '@/store'
import {
  load_repo_settings,
  request_add_repository as request_add_repository_action,
  request_import_repo as request_import_repo_action,
  remove_repo,
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
    stats_by_repo: state.gallery.stats_by_repo,
    import_job: state.import_job,
  }
}

export const map_dispatch_to_props = (dispatch: AppDispatch) => ({
  request_add_repository: () => {
    dispatch(request_add_repository_action())
  },
  request_import_repository: () => {
    dispatch(request_import_repo_action(null))
  },
  remove_repo: (repo_full_name: string) => dispatch(remove_repo({ repo_full_name })),
  load_repo_settings: (repo_full_name: string) => {
    void dispatch(load_repo_settings({ repo_full_name }))
  },
  load_gallery_stats: () => {
    void dispatch(load_gallery_stats())
  },
})

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
