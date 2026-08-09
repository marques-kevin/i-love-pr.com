import { createAction } from '@reduxjs/toolkit'

/** Fired once when the Redux store is ready — kicks off the event-oriented boot chain. */
export const global_app_initialized = createAction('app/global_app_initialized')
