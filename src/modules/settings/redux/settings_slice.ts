import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { has_browser_navigator } from '@/lib/boundary_parse'
import { DEFAULT_IGNORED_BOTS } from '@/lib/bots'
import { GitHubClient, type GitHubRepoOption } from '@/lib/github-client'
import {
  download_repo_snapshot,
  export_repo_snapshot,
  import_repo_snapshot,
  parse_share_id_from_url,
} from '@/lib/repo_snapshot'
import { rebuild_pr_facts_for_repos } from '@/lib/rebuild_pr_facts'
import { build_settings_after_remove_repo } from '@/lib/remove_repo'
import { normalize_repo_settings } from '@/lib/repo_settings'
import {
  build_share_page_url,
  encode_share_snapshot,
  fetch_share_snapshot,
  request_share_upload_urls,
  upload_share_snapshot,
} from '@/lib/share_client'
import { requestPersistentStorage } from '@/lib/storage'
import { track_umami_event } from '@/lib/umami'
import type { AppSettings, BusinessHoursConfig, RepoSettings } from '@/lib/types'
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
  repo_settings_by_repo: Record<string, RepoSettings>
}

const initial_state: SettingsState = {
  settings: null,
  loading: true,
  error: null,
  available_repos: [],
  available_repos_loading: false,
  available_repos_error: null,
  available_repos_token: null,
  repo_settings_by_repo: {},
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
    sync_interval_hours?: number
    backfill_limit?: number
    locale?: AppSettings['locale']
  }
>('settings/save', async (input, { extra }) => {
  const token = input.token.trim()
  const repos = input.repos.map((r) => r.trim()).filter(Boolean)

  const previous = await extra.repositories.settings.get()
  const previous_repos = previous?.repos ?? []
  const previous_imported = previous?.imported_repos ?? []
  const promoted_repos = repos.filter(
    (repo) => previous_imported.includes(repo) && !previous_repos.includes(repo),
  )
  const imported_repos = previous_imported.filter((repo) => !promoted_repos.includes(repo))
  const payload: SaveSettingsInput = {
    token,
    repos,
    imported_repos,
    sync_interval_hours: input.sync_interval_hours,
    backfill_limit: input.backfill_limit,
    locale: input.locale,
  }
  const next = await extra.repositories.settings.save(payload)
  await extra.repositories.settings.upsert_repos(next.repos)

  try {
    const client = new GitHubClient(token)
    const profile = await client.validateToken()
    await extra.session.upsert_account_profile({
      login: profile.login,
      name: profile.name,
      email: profile.email,
      avatar_url: profile.avatar_url,
      token,
    })
  } catch {
    const login = extra.session.get_active_login()
    if (login) {
      const existing = extra.session.get_accounts().find((account) => account.login === login)
      await extra.session.upsert_account_profile({
        login,
        name: existing?.name ?? null,
        email: existing?.email ?? null,
        avatar_url: existing?.avatar_url ?? null,
        token,
      })
    }
  }

  if (previous?.token !== next.token && next.token) {
    track_umami_event('token_saved')
  }

  for (const repo of next.repos) {
    if (!previous_repos.includes(repo)) {
      track_umami_event('repository_added')
    }
  }

  return next
})

export const complete_onboarding = create_app_async_thunk<void, { token: string }>(
  'settings/complete_onboarding',
  async (input, { extra }) => {
    const token = input.token.trim()
    const client = new GitHubClient(token)
    const profile = await client.validateToken()
    await extra.session.activate_account({
      profile: {
        login: profile.login,
        name: profile.name,
        email: profile.email,
        avatar_url: profile.avatar_url,
      },
      token,
      repos: [],
      ignored_bots: DEFAULT_IGNORED_BOTS,
    })
    track_umami_event('token_saved')
  },
)

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

export const save_dashboard_layout = create_app_async_thunk<
  AppSettings,
  AppSettings['dashboards'][number]['layout']
>('settings/save_dashboard_layout', async (layout, { extra }) => {
  return extra.repositories.settings.save_dashboard_layout(layout)
})

export const save_dashboard_filters = create_app_async_thunk<
  AppSettings,
  {
    dashboard_id: string
    members: string[]
    period_key: AppSettings['dashboards'][number]['period_key']
    custom_from: string
    custom_to: string
    hide_test_files: boolean
  }
>('settings/save_dashboard_filters', async (input, { extra }) => {
  return extra.repositories.settings.save_dashboard_filters(input)
})

export const create_dashboard = create_app_async_thunk<AppSettings, string>(
  'settings/create_dashboard',
  async (name, { extra }) => {
    return extra.repositories.settings.create_dashboard(name)
  },
)

export const rename_dashboard = create_app_async_thunk<
  AppSettings,
  { dashboard_id: string; name: string }
>('settings/rename_dashboard', async (input, { extra }) => {
  return extra.repositories.settings.rename_dashboard(input)
})

export const delete_dashboard = create_app_async_thunk<AppSettings, string>(
  'settings/delete_dashboard',
  async (dashboard_id, { extra }) => {
    return extra.repositories.settings.delete_dashboard(dashboard_id)
  },
)

export const set_active_dashboard = create_app_async_thunk<AppSettings, string>(
  'settings/set_active_dashboard',
  async (dashboard_id, { extra }) => {
    return extra.repositories.settings.set_active_dashboard(dashboard_id)
  },
)

export const set_active_repo = create_app_async_thunk<AppSettings, string>(
  'settings/set_active_repo',
  async (repo_full_name, { extra }) => {
    return extra.repositories.settings.set_active_repo(repo_full_name)
  },
)

export const load_repo_settings = create_app_async_thunk<
  Record<string, RepoSettings>,
  string[] | void
>('settings/load_repo_settings', async (repos, { extra, getState }) => {
  const repo_full_names = repos ?? getState().settings.settings?.repos ?? []
  if (repo_full_names.length === 0) return {}
  return extra.repositories.repo_settings.get_many(repo_full_names)
})

export const save_repo_settings = create_app_async_thunk<
  RepoSettings,
  {
    repo_full_name: string
    ignored_bots: string[]
    test_file_globs: string[]
    business_hours: BusinessHoursConfig
  }
>('settings/save_repo_settings', async (input, { extra }) => {
  const next = await extra.repositories.repo_settings.save(
    normalize_repo_settings(input.repo_full_name, {
      repo_full_name: input.repo_full_name,
      ignored_bots: input.ignored_bots,
      test_file_globs: input.test_file_globs,
      business_hours: input.business_hours,
    }),
  )
  await rebuild_pr_facts_for_repos(extra.repositories, [next.repo_full_name])
  return next
})

export const reset_sync_data = create_app_async_thunk<void, void>(
  'settings/reset_sync_data',
  async (_, { extra }) => {
    await extra.repositories.settings.reset_sync_data()
  },
)

export const clear_all_data = create_app_async_thunk<void, void>(
  'settings/clear_all_data',
  async (_, { extra }) => {
    await extra.session.wipe_active_account()
  },
)

export const download_repo_snapshot_file = create_app_async_thunk<void, { repo_full_name: string }>(
  'settings/download_repo_snapshot_file',
  async ({ repo_full_name }, { extra }) => {
    const snapshot = await export_repo_snapshot(extra.repositories, repo_full_name)
    download_repo_snapshot(snapshot)
  },
)

export const create_repo_share_link = create_app_async_thunk<
  { share_url: string; pr_count: number },
  { repo_full_name: string }
>('settings/create_repo_share_link', async ({ repo_full_name }, { extra }) => {
  const snapshot = await export_repo_snapshot(extra.repositories, repo_full_name)
  const payload = encode_share_snapshot(snapshot)
  const urls = await request_share_upload_urls(payload.byte_length)
  await upload_share_snapshot(urls.upload_url, payload.body)
  return {
    share_url: build_share_page_url(urls.share_id),
    pr_count: snapshot.pull_requests.length,
  }
})

export const import_repo_snapshot_from_link = create_app_async_thunk<
  { repo_full_name: string; pr_count: number },
  { share_link: string }
>('settings/import_repo_snapshot_from_link', async ({ share_link }, { extra }) => {
  const share_id = parse_share_id_from_url(share_link)
  if (!share_id) {
    throw new Error('Invalid share link')
  }
  const origin = has_browser_navigator() ? window.location.origin : ''
  const download_url = `${origin}/api/share/${share_id}`
  const snapshot = await fetch_share_snapshot(download_url)
  return import_repo_snapshot(extra.repositories, snapshot)
})

export const remove_repo = create_app_async_thunk<AppSettings, { repo_full_name: string }>(
  'settings/remove_repo',
  async ({ repo_full_name }, { extra }) => {
    const existing = await extra.repositories.settings.get()
    if (!existing) throw new Error('Settings not initialized')
    if (!existing.repos.includes(repo_full_name)) {
      throw new Error('Repo not configured')
    }

    const next_settings = build_settings_after_remove_repo(existing, repo_full_name)
    const next = await extra.repositories.settings.save({
      token: existing.token,
      repos: next_settings.repos,
      imported_repos: next_settings.imported_repos,
      dashboards: next_settings.dashboards,
      active_repo: next_settings.active_repo,
      active_dashboard_id: next_settings.active_dashboard_id,
      active_dashboard_by_repo: next_settings.active_dashboard_by_repo,
    })

    const repos = [repo_full_name]
    await extra.repositories.pr_facts.delete_by_repos(repos)
    await extra.repositories.pull_requests.delete_by_repos(repos)
    await extra.repositories.reviews.delete_by_repos(repos)
    await extra.repositories.pr_changed_files.delete_by_repos(repos)
    await extra.repositories.sync_state.delete_by_repos(repos)
    await extra.repositories.repo_settings.delete(repo_full_name)
    await extra.repositories.settings.delete_repo(repo_full_name)

    return next
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
      .addCase(save_dashboard_layout.fulfilled, (state, action) => {
        state.settings = action.payload
      })
      .addCase(save_dashboard_filters.fulfilled, (state, action) => {
        state.settings = action.payload
      })
      .addCase(create_dashboard.fulfilled, (state, action) => {
        state.settings = action.payload
      })
      .addCase(rename_dashboard.fulfilled, (state, action) => {
        state.settings = action.payload
      })
      .addCase(delete_dashboard.fulfilled, (state, action) => {
        state.settings = action.payload
      })
      .addCase(set_active_dashboard.fulfilled, (state, action) => {
        state.settings = action.payload
      })
      .addCase(set_active_repo.fulfilled, (state, action) => {
        state.settings = action.payload
      })
      .addCase(remove_repo.fulfilled, (state, action) => {
        state.settings = action.payload
        delete state.repo_settings_by_repo[action.meta.arg.repo_full_name]
      })
      .addCase(load_repo_settings.fulfilled, (state, action) => {
        state.repo_settings_by_repo = { ...state.repo_settings_by_repo, ...action.payload }
      })
      .addCase(save_repo_settings.fulfilled, (state, action) => {
        state.repo_settings_by_repo[action.payload.repo_full_name] = action.payload
      })
      .addCase(clear_all_data.fulfilled, (state) => {
        state.settings = null
        state.loading = false
        state.available_repos = []
        state.available_repos_loading = false
        state.available_repos_error = null
        state.available_repos_token = null
        state.repo_settings_by_repo = {}
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
