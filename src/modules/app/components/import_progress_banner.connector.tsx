import { connect, type ConnectedProps } from 'react-redux'
import { dismiss_import_job } from '@/store'
import type { AppDispatch, RootState } from '@/store'

export const map_state_to_props = (state: RootState) => ({
  import_job: state.settings.import_job,
})

export const map_dispatch_to_props = (dispatch: AppDispatch) => ({
  dismiss_import_job: () => {
    dispatch(dismiss_import_job())
  },
})

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
