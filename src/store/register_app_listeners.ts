import type { ListenerMiddlewareInstance } from '@reduxjs/toolkit'
import { global_app_initialized } from '@/modules/app/redux/app_events'
import { load_gallery_stats } from '@/modules/app/redux/gallery_slice'
import {
  hydrate_dashboard_filters,
  set_custom_from,
  set_custom_to,
  set_hide_test_files,
  set_members,
  set_period_key,
  hydrate_active_repo,
  clamp_active_repo_to_settings,
  refresh_metrics,
} from '@/modules/dashboard/redux/dashboard_slice'
import { has_github_token } from '@/lib/app_gate'
import { has_browser_navigator } from '@/lib/boundary_parse'
import { is_demo_mode } from '@/lib/demo_mode'
import { parse_share_id_from_url } from '@/lib/repo_snapshot'
import { active_repo_from_url_or_settings } from '@/lib/repo_path'
import { should_navigate_home_after_remove_repo } from '@/lib/remove_repo'
import { ensure_pr_facts } from '@/lib/rebuild_pr_facts'
import { play_sound } from '@/lib/cuelume'
import {
  create_dashboard,
  delete_dashboard,
  import_repo_snapshot_from_link,
  load_available_repos,
  load_settings,
  remove_repo,
  save_dashboard_filters,
  save_repo_settings,
  save_settings,
  set_active_dashboard,
  set_active_repo,
} from '@/modules/settings/redux/settings_slice'
import { hydrate_locale_from_settings } from '@/modules/i18n/redux/i18n_slice'
import {
  refresh_sync_states,
  run_sync,
  set_bootstrapped,
  refresh_pr_coverage,
} from '@/modules/sync/redux/sync_slice'
import {
  dashboards_for_repo,
  get_active_dashboard,
  normalize_dashboard_filters,
  normalize_settings_dashboards,
} from '@/lib/dashboard_layout'
import type { AppDispatch } from './create_store'
import type { RootState } from './root_reducer'
import type { ThunkExtra } from './thunk_extra'

function active_repo_list(state: RootState): string[] {
  const { active_repo } = state.dashboard
  return active_repo ? [active_repo] : []
}

function dispatch_refresh_pr_coverage(api: { getState: () => RootState; dispatch: AppDispatch }) {
  void api.dispatch(refresh_pr_coverage({ repos: active_repo_list(api.getState()) }))
}

function dispatch_load_gallery_stats(api: { dispatch: AppDispatch }) {
  void api.dispatch(load_gallery_stats())
}

function current_pathname(): string {
  return has_browser_navigator() ? window.location.pathname : ''
}

function apply_active_repo_from_url_or_settings(api: {
  getState: () => RootState
  dispatch: AppDispatch
}) {
  const settings = api.getState().settings.settings
  if (!settings) return
  const active_repo = active_repo_from_url_or_settings(
    current_pathname(),
    settings.repos,
    settings.active_repo,
  )
  api.dispatch(hydrate_active_repo(active_repo))
}

function hydrate_filters_from_active_dashboard(api: {
  getState: () => RootState
  dispatch: AppDispatch
}) {
  const settings = api.getState().settings.settings
  if (!settings) return
  const normalized = normalize_settings_dashboards(settings)
  const active_repo = api.getState().dashboard.active_repo ?? normalized.active_repo
  const repo_tabs = dashboards_for_repo(normalized.dashboards, active_repo)
  const dashboard_id =
    (active_repo ? normalized.active_dashboard_by_repo[active_repo] : null) ??
    normalized.active_dashboard_id
  const active = get_active_dashboard(
    repo_tabs.length > 0 ? repo_tabs : normalized.dashboards,
    dashboard_id,
  )
  api.dispatch(hydrate_dashboard_filters(normalize_dashboard_filters(active)))
}

export function register_app_listeners(
  middleware: ListenerMiddlewareInstance<RootState, AppDispatch, ThunkExtra>,
) {
  middleware.startListening({
    actionCreator: global_app_initialized,
    effect: async (_action, api) => {
      if (has_browser_navigator()) {
        const share_id = parse_share_id_from_url(window.location.href)
        if (share_id) {
          const share_link = window.location.href.includes('://')
            ? window.location.href
            : `${window.location.origin}/?import=${share_id}`
          try {
            await api.dispatch(import_repo_snapshot_from_link({ share_link })).unwrap()
          } catch {
            await api.dispatch(load_settings())
            return
          }
        }
      }
      await api.dispatch(load_settings())
    },
  })

  middleware.startListening({
    actionCreator: load_settings.fulfilled,
    effect: async (action, api) => {
      const settings = action.payload
      api.dispatch(hydrate_locale_from_settings(settings))
      if (!settings) return

      await ensure_pr_facts(api.extra.repositories)
      apply_active_repo_from_url_or_settings(api)
      hydrate_filters_from_active_dashboard(api)
      void api.dispatch(refresh_sync_states())
      dispatch_refresh_pr_coverage(api)

      if (is_demo_mode()) {
        api.dispatch(set_bootstrapped(true))
        void api.dispatch(refresh_metrics())
        dispatch_load_gallery_stats(api)
        return
      }

      const can_use_github = has_github_token(settings)
      if (can_use_github) {
        void api.dispatch(load_available_repos())
      }
      dispatch_load_gallery_stats(api)

      if (!api.getState().sync.bootstrapped) {
        api.dispatch(set_bootstrapped(true))
        if (can_use_github) {
          void api.dispatch(run_sync({ force: false }))
        }
      }
    },
  })

  middleware.startListening({
    actionCreator: save_settings.fulfilled,
    effect: async (action, api) => {
      play_sound('success')
      const settings = action.payload
      api.dispatch(hydrate_locale_from_settings(settings))
      apply_active_repo_from_url_or_settings(api)
      api.dispatch(clamp_active_repo_to_settings(settings.repos))
      hydrate_filters_from_active_dashboard(api)
      dispatch_refresh_pr_coverage(api)
      dispatch_load_gallery_stats(api)
      if (has_github_token(settings)) {
        void api.dispatch(load_available_repos({ token: settings.token }))
        if (!api.getState().sync.bootstrapped) {
          api.dispatch(set_bootstrapped(true))
          void api.dispatch(run_sync({ force: false }))
        }
      } else if (!api.getState().sync.bootstrapped) {
        api.dispatch(set_bootstrapped(true))
      }
    },
  })

  middleware.startListening({
    actionCreator: save_repo_settings.fulfilled,
    effect: async (_action, api) => {
      void api.dispatch(refresh_metrics())
      dispatch_load_gallery_stats(api)
    },
  })

  middleware.startListening({
    actionCreator: remove_repo.fulfilled,
    effect: async (action, api) => {
      const settings = action.payload
      const deleted_repo = action.meta.arg.repo_full_name
      const pathname = current_pathname()
      if (should_navigate_home_after_remove_repo(pathname, deleted_repo)) {
        window.history.replaceState({}, '', '/')
      }
      apply_active_repo_from_url_or_settings(api)
      api.dispatch(clamp_active_repo_to_settings(settings.repos))
      hydrate_filters_from_active_dashboard(api)
      dispatch_refresh_pr_coverage(api)
      void api.dispatch(refresh_sync_states())
      void api.dispatch(refresh_metrics())
      dispatch_load_gallery_stats(api)
    },
  })

  middleware.startListening({
    actionCreator: set_active_repo.fulfilled,
    effect: async (action, api) => {
      api.dispatch(hydrate_active_repo(action.payload.active_repo))
      hydrate_filters_from_active_dashboard(api)
      dispatch_refresh_pr_coverage(api)
      void api.dispatch(refresh_metrics())
    },
  })

  middleware.startListening({
    actionCreator: run_sync.pending,
    effect: async (action) => {
      if (action.meta.arg.force) play_sound('loading')
    },
  })

  middleware.startListening({
    actionCreator: run_sync.fulfilled,
    effect: async (action, api) => {
      if (action.meta.arg.force) play_sound('success')
      dispatch_refresh_pr_coverage(api)
      void api.dispatch(refresh_metrics())
      dispatch_load_gallery_stats(api)
    },
  })

  middleware.startListening({
    actionCreator: run_sync.rejected,
    effect: async (action, api) => {
      if (action.meta.arg.force) play_sound('error')
      void api.dispatch(refresh_sync_states())
      dispatch_refresh_pr_coverage(api)
      void api.dispatch(refresh_metrics())
      dispatch_load_gallery_stats(api)
    },
  })

  for (const action_creator of [
    set_active_dashboard.fulfilled,
    create_dashboard.fulfilled,
    delete_dashboard.fulfilled,
  ] as const) {
    middleware.startListening({
      actionCreator: action_creator,
      effect: async (_action, api) => {
        hydrate_filters_from_active_dashboard(api)
      },
    })
  }

  middleware.startListening({
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
    set_hide_test_files,
  ] as const

  for (const action_creator of persist_filter_actions) {
    middleware.startListening({
      actionCreator: action_creator,
      effect: async (_action, api) => {
        const settings = api.getState().settings.settings
        if (!settings) {
          void api.dispatch(refresh_metrics())
          return
        }
        const { members, period_key, custom_from, custom_to, hide_test_files } =
          api.getState().dashboard
        const { active_dashboard_id } = normalize_settings_dashboards(settings)
        await api.dispatch(
          save_dashboard_filters({
            dashboard_id: active_dashboard_id,
            members,
            period_key,
            custom_from,
            custom_to,
            hide_test_files,
          }),
        )
        void api.dispatch(refresh_metrics())
      },
    })
  }
}
