import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { subDays } from 'date-fns'
import { compute_metrics, list_contributors } from '@/lib/metrics'
import type { MetricsSnapshot, PeriodKey, PeriodRange } from '@/lib/types'
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
  selected_repos: string[]
  members: string[]
  period_key: PeriodKey
  custom_from: string
  custom_to: string
  metrics: MetricsSnapshot | null
  contributors: string[]
  loading: boolean
  show_settings: boolean
}

const initial_state: DashboardState = {
  selected_repos: [],
  members: [],
  period_key: '30d',
  custom_from: '',
  custom_to: '',
  metrics: null,
  contributors: [],
  loading: false,
  show_settings: false,
}

export const refresh_metrics = create_app_async_thunk<
  { metrics: MetricsSnapshot | null; contributors: string[] },
  void
>('dashboard/refresh_metrics', async (_, { extra, getState }) => {
  const { selected_repos, members, period_key, custom_from, custom_to } = getState().dashboard
  if (selected_repos.length === 0) {
    return { metrics: null, contributors: [] }
  }
  const period = build_period(period_key, custom_from, custom_to)
  const [metrics, contributors] = await Promise.all([
    compute_metrics({
      repositories: extra.repositories,
      repos: selected_repos,
      members,
      period,
    }),
    list_contributors(extra.repositories, selected_repos),
  ])
  return { metrics, contributors }
})

const dashboard_slice = createSlice({
  name: 'dashboard',
  initialState: initial_state,
  reducers: {
    set_selected_repos(state, action: PayloadAction<string[]>) {
      state.selected_repos = action.payload
    },
    sync_selected_repos_with_settings(state, action: PayloadAction<string[]>) {
      const settings_repos = action.payload
      const next = settings_repos.filter((r) => state.selected_repos.includes(r))
      state.selected_repos = next.length > 0 ? next : settings_repos
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
    set_show_settings(state, action: PayloadAction<boolean>) {
      state.show_settings = action.payload
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
  set_selected_repos,
  sync_selected_repos_with_settings,
  set_members,
  set_period_key,
  set_custom_from,
  set_custom_to,
  set_show_settings,
} = dashboard_slice.actions

export const dashboard_reducer = dashboard_slice.reducer
