import type { ListenerMiddlewareInstance, TypedStartListening } from '@reduxjs/toolkit'
import { global_app_initialized } from '@/modules/app/redux/app_events'
import {
  hydrate_dashboard_filters,
  set_custom_from,
  set_custom_to,
  set_members,
  set_period_key,
  set_selected_repos,
  sync_selected_repos_with_settings,
  refresh_metrics,
} from '@/modules/dashboard/redux/dashboard_slice'
import { ensure_pr_facts } from '@/lib/rebuild_pr_facts'
import {
  create_dashboard,
  delete_dashboard,
  load_available_repos,
  load_settings,
  save_dashboard_filters,
  save_settings,
  set_active_dashboard,
} from '@/modules/settings/redux/settings_slice'
import { hydrate_locale_from_settings } from '@/modules/i18n/redux/i18n_slice'
import {
  refresh_sync_states,
  run_sync,
  set_bootstrapped,
  refresh_pr_coverage,
} from '@/modules/sync/redux/sync_slice'
import {
  get_active_dashboard,
  normalize_dashboard_filters,
  normalize_settings_dashboards,
} from '@/lib/dashboard_layout'
import type { AppDispatch } from './create_store'
import type { RootState } from './root_reducer'
import type { ThunkExtra } from './thunk_extra'

type AppStartListening = TypedStartListening<RootState, AppDispatch, ThunkExtra>

function dispatch_refresh_pr_coverage(api: { getState: () => RootState; dispatch: AppDispatch }) {
  const { selected_repos } = api.getState().dashboard
  void api.dispatch(refresh_pr_coverage({ repos: selected_repos }))
}

function hydrate_filters_from_active_dashboard(api: {
  getState: () => RootState
  dispatch: AppDispatch
}) {
  const settings = api.getState().settings.settings
  if (!settings) return
  const { dashboards, active_dashboard_id } = normalize_settings_dashboards(settings)
  const active = get_active_dashboard(dashboards, active_dashboard_id)
  api.dispatch(hydrate_dashboard_filters(normalize_dashboard_filters(active)))
}

export function register_app_listeners(
  middleware: ListenerMiddlewareInstance<RootState, AppDispatch, ThunkExtra>,
) {
  const start_listening = middleware.startListening as AppStartListening

  start_listening({
    actionCreator: global_app_initialized,
    effect: async (_action, api) => {
      await api.dispatch(load_settings())
    },
  })

  start_listening({
    actionCreator: load_settings.fulfilled,
    effect: async (action, api) => {
      const settings = action.payload
      api.dispatch(hydrate_locale_from_settings(settings))
      if (!settings) return

      await ensure_pr_facts(api.extra.repositories)
      api.dispatch(sync_selected_repos_with_settings(settings.repos))
      hydrate_filters_from_active_dashboard(api)
      void api.dispatch(load_available_repos())
      void api.dispatch(refresh_sync_states())
      dispatch_refresh_pr_coverage(api)

      if (!api.getState().sync.bootstrapped) {
        api.dispatch(set_bootstrapped(true))
        void api.dispatch(run_sync({ force: false }))
      }
    },
  })

  start_listening({
    actionCreator: save_settings.fulfilled,
    effect: async (action, api) => {
      const settings = action.payload
      api.dispatch(hydrate_locale_from_settings(settings))
      api.dispatch(sync_selected_repos_with_settings(settings.repos))
      dispatch_refresh_pr_coverage(api)
      void api.dispatch(load_available_repos({ token: settings.token }))

      if (!api.getState().sync.bootstrapped) {
        api.dispatch(set_bootstrapped(true))
        void api.dispatch(run_sync({ force: false }))
      }
    },
  })

  start_listening({
    actionCreator: run_sync.fulfilled,
    effect: async (_action, api) => {
      dispatch_refresh_pr_coverage(api)
      void api.dispatch(refresh_metrics())
    },
  })

  start_listening({
    actionCreator: run_sync.rejected,
    effect: async (_action, api) => {
      void api.dispatch(refresh_sync_states())
      dispatch_refresh_pr_coverage(api)
      void api.dispatch(refresh_metrics())
    },
  })

  for (const action_creator of [
    set_active_dashboard.fulfilled,
    create_dashboard.fulfilled,
    delete_dashboard.fulfilled,
  ] as const) {
    start_listening({
      actionCreator: action_creator,
      effect: async (_action, api) => {
        hydrate_filters_from_active_dashboard(api)
      },
    })
  }

  start_listening({
    actionCreator: hydrate_dashboard_filters,
    effect: async (_action, api) => {
      void api.dispatch(refresh_metrics())
    },
  })

  const persist_filter_actions = [
    set_members,
    set_period_key,
    set_custom_from,
    set_custom_to,
  ] as const

  for (const action_creator of persist_filter_actions) {
    start_listening({
      actionCreator: action_creator,
      effect: async (_action, api) => {
        const settings = api.getState().settings.settings
        if (!settings) {
          void api.dispatch(refresh_metrics())
          return
        }
        const { members, period_key, custom_from, custom_to } = api.getState().dashboard
        const { active_dashboard_id } = normalize_settings_dashboards(settings)
        await api.dispatch(
          save_dashboard_filters({
            dashboard_id: active_dashboard_id,
            members,
            period_key,
            custom_from,
            custom_to,
          }),
        )
        void api.dispatch(refresh_metrics())
      },
    })
  }

  const repo_filter_actions = [set_selected_repos, sync_selected_repos_with_settings] as const

  for (const action_creator of repo_filter_actions) {
    start_listening({
      actionCreator: action_creator,
      effect: async (_action, api) => {
        dispatch_refresh_pr_coverage(api)
        void api.dispatch(refresh_metrics())
      },
    })
  }
}
