import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { subDays } from 'date-fns'
import { compute_metrics, list_contributors } from '@/lib/metrics'
import type { MetricsSnapshot, PeriodKey, PeriodRange } from '@/lib/types'
import type { DashboardTabFilters } from '@/lib/dashboard_layout'
import { create_app_async_thunk } from '@/store/create_app_async_thunk'

function build_period(key: PeriodKey, custom_from?: string, custom_to?: string): PeriodRange {
  const to = custom_to ? new Date(custom_to) : new Date()
  if (key === 'custom' && custom_from) {
    return { key, from: new Date(custom_from), to }
  }
  const days = key === '7d' ? 7 : key === '90d' ? 90 : 30
  return { key, from: subDays(to, days), to }
}

export type DashboardState = {
  active_repo: string | null
  members: string[]
  period_key: PeriodKey
  custom_from: string
  custom_to: string
  hide_test_files: boolean
  metrics: MetricsSnapshot | null
  contributors: string[]
  loading: boolean
  show_settings: boolean
  /** One-shot: open the add-repository dialog after onboarding. */
  add_repository_requested: boolean
  /** One-shot: open the import-repository dialog from the gallery. */
  import_repository_requested: boolean
  /** Prefill link for the import dialog (from `?import=` / `?share=`). */
  import_prefill_link: string | null
}

const initial_state: DashboardState = {
  active_repo: null,
  members: [],
  period_key: '30d',
  custom_from: '',
  custom_to: '',
  hide_test_files: false,
  metrics: null,
  contributors: [],
  loading: false,
  show_settings: false,
  add_repository_requested: false,
  import_repository_requested: false,
  import_prefill_link: null,
}

export const refresh_metrics = create_app_async_thunk<
  { metrics: MetricsSnapshot | null; contributors: string[] },
  void
>('dashboard/refresh_metrics', async (_, { extra, getState }) => {
  const { active_repo, members, period_key, custom_from, custom_to, hide_test_files } =
    getState().dashboard
  const repos = active_repo ? [active_repo] : []
  if (repos.length === 0) {
    return { metrics: null, contributors: [] }
  }
  const period = build_period(period_key, custom_from, custom_to)
  const [metrics, contributors] = await Promise.all([
    compute_metrics({
      repositories: extra.repositories,
      repos,
      members,
      period,
      hide_test_files,
    }),
    list_contributors(extra.repositories, repos),
  ])
  return { metrics, contributors }
})

const dashboard_slice = createSlice({
  name: 'dashboard',
  initialState: initial_state,
  reducers: {
    hydrate_active_repo(state, action: PayloadAction<string | null>) {
      state.active_repo = action.payload
    },
    clamp_active_repo_to_settings(state, action: PayloadAction<string[]>) {
      const settings_repos = action.payload
      if (state.active_repo && settings_repos.includes(state.active_repo)) return
      state.active_repo = settings_repos[0] ?? null
    },
    set_members(state, action: PayloadAction<string[]>) {
      state.members = action.payload
    },
    set_period_key(state, action: PayloadAction<PeriodKey>) {
      state.period_key = action.payload
    },
    set_custom_from(state, action: PayloadAction<string>) {
      state.custom_from = action.payload
    },
    set_custom_to(state, action: PayloadAction<string>) {
      state.custom_to = action.payload
    },
    set_hide_test_files(state, action: PayloadAction<boolean>) {
      state.hide_test_files = action.payload
    },
    hydrate_dashboard_filters(state, action: PayloadAction<DashboardTabFilters>) {
      state.members = action.payload.members
      state.period_key = action.payload.period_key
      state.custom_from = action.payload.custom_from
      state.custom_to = action.payload.custom_to
      state.hide_test_files = action.payload.hide_test_files
    },
    set_show_settings(state, action: PayloadAction<boolean>) {
      state.show_settings = action.payload
    },
    request_add_repository(state) {
      state.add_repository_requested = true
    },
    clear_add_repository_request(state) {
      state.add_repository_requested = false
    },
    request_import_repository(state, action: PayloadAction<string | undefined>) {
      state.import_repository_requested = true
      state.import_prefill_link = action.payload?.trim() ? action.payload.trim() : null
    },
    clear_import_repository_request(state) {
      state.import_repository_requested = false
      state.import_prefill_link = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(refresh_metrics.pending, (state) => {
        state.loading = true
      })
      .addCase(refresh_metrics.fulfilled, (state, action) => {
        state.metrics = action.payload.metrics
        state.contributors = action.payload.contributors
        state.loading = false
      })
      .addCase(refresh_metrics.rejected, (state) => {
        state.loading = false
      })
  },
})

export const {
  hydrate_active_repo,
  clamp_active_repo_to_settings,
  set_members,
  set_period_key,
  set_custom_from,
  set_custom_to,
  set_hide_test_files,
  hydrate_dashboard_filters,
  set_show_settings,
  request_add_repository,
  clear_add_repository_request,
  request_import_repository,
  clear_import_repository_request,
} = dashboard_slice.actions

export const dashboard_reducer = dashboard_slice.reducer
