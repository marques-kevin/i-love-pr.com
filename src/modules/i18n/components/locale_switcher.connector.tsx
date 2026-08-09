import { connect, type ConnectedProps } from 'react-redux'
import type { AppLocale } from '@/lib/i18n'
import { change_locale } from '../redux/i18n_slice'
import type { AppDispatch, RootState } from '@/store'

export const map_state_to_props = (state: RootState) => ({
  locale: state.i18n.locale,
})

export const map_dispatch_to_props = (dispatch: AppDispatch) => ({
  on_change_locale: (locale: AppLocale) => {
    void dispatch(change_locale(locale))
  },
})

export const connector = connect(map_state_to_props, map_dispatch_to_props)
export type ConnectorProps = ConnectedProps<typeof connector>
