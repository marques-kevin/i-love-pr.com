import {
  configureStore,
  createListenerMiddleware,
  type ThunkDispatch,
  type UnknownAction,
} from '@reduxjs/toolkit'
import { register_app_listeners } from './register_app_listeners'
import { root_reducer, type RootState } from './root_reducer'
import type { ThunkExtra } from './thunk_extra'

export type AppDispatch = ThunkDispatch<RootState, ThunkExtra, UnknownAction>

export function create_store(extra: ThunkExtra) {
  const listener_middleware = createListenerMiddleware<RootState, AppDispatch, ThunkExtra>({
    extra,
  })

  register_app_listeners(listener_middleware)

  return configureStore({
    reducer: root_reducer,
    middleware: (get_default_middleware) =>
      get_default_middleware({
        thunk: { extraArgument: extra },
        serializableCheck: false,
      }).prepend(listener_middleware.middleware),
  })
}

export type AppStore = ReturnType<typeof create_store>
export type { RootState }
