import { connect, type ConnectedProps } from 'react-redux'
import { create_repo_share_link, download_repo_snapshot_file } from '@/store'

export const map_dispatch_to_props = {
  download_repo_snapshot_file,
  create_repo_share_link,
}

export const connector = connect(null, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
