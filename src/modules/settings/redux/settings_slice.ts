import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { DEFAULT_IGNORED_BOTS } from '@/lib/bots'
import { GitHubClient, type GitHubRepoOption } from '@/lib/github-client'
import { requestPersistentStorage } from '@/lib/storage'
import type { AppSettings, BusinessHoursConfig } from '@/lib/types'
import type { SaveSettingsInput } from '@/repositories'
import { create_app_async_thunk } from '@/store/create_app_async_thunk'

export type SettingsState = {
  settings: AppSettings | null
  loading: boolean
  error: string | null
  available_repos: GitHubRepoOption[]
  available_repos_loading: boolean
  available_repos_error: string | null
  available_repos_token: string | null
}

const initial_state: SettingsState = {
  settings: null,
  loading: true,
  error: null,
  available_repos: [],
  available_repos_loading: false,
  available_repos_error: null,
  available_repos_token: null,
}

export const load_settings = create_app_async_thunk<AppSettings | null, void>(
  'settings/load',
  async (_, { extra }) => {
    void requestPersistentStorage()
    const settings = await extra.repositories.settings.get()
    return settings ?? null
  },
)

export const save_settings = create_app_async_thunk<
  AppSettings,
  {
    token: string
    repos: string[]
    syncIntervalHours?: number
    backfillLimit?: number
    ignoredBots?: string[]
    businessHours?: BusinessHoursConfig
  }
>('settings/save', async (input, { extra }) => {
  const payload: SaveSettingsInput = {
    token: input.token.trim(),
    repos: input.repos.map((r) => r.trim()).filter(Boolean),
    syncIntervalHours: input.syncIntervalHours,
    backfillLimit: input.backfillLimit,
    ignoredBots: input.ignoredBots ?? DEFAULT_IGNORED_BOTS,
    businessHours: input.businessHours,
  }
  const next = await extra.repositories.settings.save(payload)
  await extra.repositories.settings.upsert_repos(next.repos)
  return next
})

export const upsert_team = create_app_async_thunk<
  AppSettings,
  { name: string; members: string[]; id?: string }
>('settings/upsert_team', async (input, { extra }) => {
  return extra.repositories.settings.upsert_team(input)
})

export const delete_team = create_app_async_thunk<AppSettings, string>(
  'settings/delete_team',
  async (id, { extra }) => {
    return extra.repositories.settings.delete_team(id)
  },
)

export const reset_sync_data = create_app_async_thunk<void, void>(
  'settings/reset_sync_data',
  async (_, { extra }) => {
    await extra.repositories.settings.reset_sync_data()
  },
)

export const clear_all_data = create_app_async_thunk<void, void>(
  'settings/clear_all_data',
  async (_, { extra }) => {
    await extra.repositories.settings.clear_all_data()
  },
)

export type LoadAvailableReposArg = {
  token?: string
  force?: boolean
}

export const load_available_repos = create_app_async_thunk<
  { repos: GitHubRepoOption[]; token: string },
  LoadAvailableReposArg | void
>(
  'settings/load_available_repos',
  async (arg, { getState }) => {
    const token = (arg?.token ?? getState().settings.settings?.token ?? '').trim()
    if (!token) {
      return { repos: [], token: '' }
    }
    const client = new GitHubClient(token)
    const listed = await client.listRepositories()
    return { repos: listed.repos, token }
  },
  {
    condition: (arg, { getState }) => {
      const token = (arg?.token ?? getState().settings.settings?.token ?? '').trim()
      if (!token) return false
      const state = getState().settings
      if (state.available_repos_loading) return false
      if (!arg?.force && state.available_repos_token === token) return false
      return true
    },
  },
)

const settings_slice = createSlice({
  name: 'settings',
  initialState: initial_state,
  reducers: {
    set_settings(state, action: PayloadAction<AppSettings | null>) {
      state.settings = action.payload
      state.loading = false
    },
    clear_available_repos(state) {
      state.available_repos = []
      state.available_repos_loading = false
      state.available_repos_error = null
      state.available_repos_token = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(load_settings.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(load_settings.fulfilled, (state, action) => {
        state.settings = action.payload
        state.loading = false
      })
      .addCase(load_settings.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? 'Failed to load settings'
      })
      .addCase(save_settings.fulfilled, (state, action) => {
        state.settings = action.payload
        state.loading = false
      })
      .addCase(upsert_team.fulfilled, (state, action) => {
        state.settings = action.payload
      })
      .addCase(delete_team.fulfilled, (state, action) => {
        state.settings = action.payload
      })
      .addCase(clear_all_data.fulfilled, (state) => {
        state.settings = null
        state.loading = false
        state.available_repos = []
        state.available_repos_loading = false
        state.available_repos_error = null
        state.available_repos_token = null
      })
      .addCase(load_available_repos.pending, (state) => {
        state.available_repos_loading = true
        state.available_repos_error = null
      })
      .addCase(load_available_repos.fulfilled, (state, action) => {
        state.available_repos = action.payload.repos
        state.available_repos_token = action.payload.token || null
        state.available_repos_loading = false
      })
      .addCase(load_available_repos.rejected, (state, action) => {
        state.available_repos_loading = false
        state.available_repos_error = action.error.message ?? 'Failed to load repositories'
        state.available_repos = []
        state.available_repos_token = null
      })
  },
})

export const { set_settings, clear_available_repos } = settings_slice.actions
export const settings_reducer = settings_slice.reducer
