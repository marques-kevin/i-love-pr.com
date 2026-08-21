import { DEFAULT_IGNORED_BOTS } from '@/lib/bots'
import { DEFAULT_BUSINESS_HOURS, normalizeBusinessHours } from '@/lib/business-hours'
import { DEFAULT_BACKFILL_LIMIT } from '@/lib/db'
import { DEFAULT_TEST_FILE_GLOBS } from '@/lib/test_file_patterns'
import {
  create_dashboard_tab,
  normalize_dashboard_filters,
  normalize_dashboard_layout,
  normalize_settings_dashboards,
  type DashboardTabFilters,
} from '@/lib/dashboard_layout'
import { normalize_locale, normalize_stored_locale } from '@/lib/i18n'
import { merge_pat_repo_sources, normalize_repo_sources } from '@/lib/repo_sources'
import type {
  AppSettings,
  DashboardLayoutItem,
  MemberTeam,
  PrChangedFileRecord,
  PrFactRecord,
  PullRequestRecord,
  ReviewRecord,
  SyncState,
} from '@/lib/types'
import type {
  PrChangedFilesRepository,
  PrFactsRepository,
  PullRequestRepository,
  Repositories,
  ReviewRepository,
  SettingsRepository,
  SyncStateRepository,
} from './types'

function empty_sync_state(repo_full_name: string): SyncState {
  return {
    repo_full_name,
    cursor_updated_at: null,
    page_cursor: null,
    mode: 'idle',
    last_synced_at: null,
    last_error: null,
    total_fetched: 0,
    backfill_fetched: 0,
    remote_oldest_created_at: null,
  }
}

function normalize_sync_state(state: SyncState): SyncState {
  return {
    ...empty_sync_state(state.repo_full_name),
    ...state,
    remote_oldest_created_at: state.remote_oldest_created_at ?? null,
  }
}

function normalize_settings(
  settings: AppSettings & { dashboard_layout?: DashboardLayoutItem[] | null },
): AppSettings {
  const dashboards_fields = normalize_settings_dashboards(settings)
  return {
    id: settings.id,
    token: settings.token,
    repos: settings.repos,
    repo_sources: normalize_repo_sources(settings.repos, settings.repo_sources),
    sync_interval_hours: settings.sync_interval_hours,
    backfill_limit: settings.backfill_limit,
    ignored_bots: settings.ignored_bots,
    test_file_globs: settings.test_file_globs ?? [...DEFAULT_TEST_FILE_GLOBS],
    teams: settings.teams ?? [],
    business_hours: normalizeBusinessHours(settings.business_hours),
    ...dashboards_fields,
    locale: normalize_stored_locale(settings.locale),
    onboarded_at: settings.onboarded_at,
  }
}

type MemoryBag = {
  settings: AppSettings | undefined
  pull_requests: Map<string, PullRequestRecord>
  reviews: Map<string, ReviewRecord>
  sync_states: Map<string, SyncState>
  pr_facts: Map<string, PrFactRecord>
  pr_changed_files: Map<string, PrChangedFileRecord>
}

export function create_memory_repositories(seed?: {
  settings?: AppSettings
  pull_requests?: PullRequestRecord[]
  reviews?: ReviewRecord[]
  sync_states?: SyncState[]
  pr_facts?: PrFactRecord[]
  pr_changed_files?: PrChangedFileRecord[]
}): Repositories {
  const bag: MemoryBag = {
    settings: seed?.settings ? normalize_settings(structuredClone(seed.settings)) : undefined,
    pull_requests: new Map((seed?.pull_requests ?? []).map((pr) => [pr.id, structuredClone(pr)])),
    reviews: new Map((seed?.reviews ?? []).map((r) => [r.id, structuredClone(r)])),
    sync_states: new Map(
      (seed?.sync_states ?? []).map((s) => [s.repo_full_name, structuredClone(s)]),
    ),
    pr_facts: new Map((seed?.pr_facts ?? []).map((f) => [f.pr_id, structuredClone(f)])),
    pr_changed_files: new Map(
      (seed?.pr_changed_files ?? []).map((file) => [file.id, structuredClone(file)]),
    ),
  }

  const save_teams = async (teams: MemberTeam[]) => {
    if (!bag.settings) throw new Error('Settings not initialized')
    bag.settings = { ...bag.settings, teams: structuredClone(teams) }
    return normalize_settings(structuredClone(bag.settings))
  }

  const settings: SettingsRepository = {
    get: async () => (bag.settings ? normalize_settings(structuredClone(bag.settings)) : undefined),
    save: async (partial) => {
      const existing = bag.settings
      const dashboards_fields = normalize_settings_dashboards({
        repos: partial.repos,
        active_repo:
          partial.active_repo !== undefined ? partial.active_repo : existing?.active_repo,
        dashboards: partial.dashboards ?? existing?.dashboards,
        active_dashboard_id: partial.active_dashboard_id ?? existing?.active_dashboard_id,
        active_dashboard_by_repo:
          partial.active_dashboard_by_repo ?? existing?.active_dashboard_by_repo,
      })
      bag.settings = {
        id: 'settings',
        token: partial.token,
        repos: [...partial.repos],
        repo_sources: partial.repo_sources
          ? normalize_repo_sources(partial.repos, partial.repo_sources)
          : merge_pat_repo_sources(partial.repos, existing?.repo_sources),
        sync_interval_hours: partial.sync_interval_hours ?? existing?.sync_interval_hours ?? 24,
        backfill_limit:
          partial.backfill_limit ?? existing?.backfill_limit ?? DEFAULT_BACKFILL_LIMIT,
        ignored_bots: partial.ignored_bots ?? existing?.ignored_bots ?? [...DEFAULT_IGNORED_BOTS],
        test_file_globs: partial.test_file_globs ??
          existing?.test_file_globs ?? [...DEFAULT_TEST_FILE_GLOBS],
        teams: partial.teams ?? existing?.teams ?? [],
        business_hours: normalizeBusinessHours(
          partial.business_hours ?? existing?.business_hours ?? DEFAULT_BUSINESS_HOURS,
        ),
        ...dashboards_fields,
        locale:
          partial.locale !== undefined
            ? normalize_stored_locale(partial.locale)
            : normalize_stored_locale(existing?.locale),
        onboarded_at: existing?.onboarded_at ?? new Date().toISOString(),
      }
      return normalize_settings(structuredClone(bag.settings))
    },
    save_teams,
    save_dashboard_layout: async (layout: DashboardLayoutItem[]) => {
      if (!bag.settings) throw new Error('Settings not initialized')
      const normalized_layout = normalize_dashboard_layout(layout)
      bag.settings = {
        ...bag.settings,
        dashboards: bag.settings.dashboards.map((tab) =>
          tab.id === bag.settings!.active_dashboard_id
            ? { ...tab, layout: normalized_layout }
            : tab,
        ),
      }
      return normalize_settings(structuredClone(bag.settings))
    },
    save_dashboard_filters: async (input: DashboardTabFilters & { dashboard_id: string }) => {
      if (!bag.settings) throw new Error('Settings not initialized')
      if (!bag.settings.dashboards.some((tab) => tab.id === input.dashboard_id)) {
        throw new Error('Dashboard not found')
      }
      const filters = normalize_dashboard_filters(input)
      bag.settings = {
        ...bag.settings,
        dashboards: bag.settings.dashboards.map((tab) =>
          tab.id === input.dashboard_id ? { ...tab, ...filters } : tab,
        ),
      }
      return normalize_settings(structuredClone(bag.settings))
    },
    create_dashboard: async (name: string) => {
      if (!bag.settings) throw new Error('Settings not initialized')
      const repo = bag.settings.active_repo
      if (!repo) throw new Error('No active repo')
      const tab = create_dashboard_tab(name, repo)
      if (!tab.name) throw new Error('Dashboard name is required')
      bag.settings = {
        ...bag.settings,
        dashboards: [...bag.settings.dashboards, tab],
        active_dashboard_id: tab.id,
        active_dashboard_by_repo: {
          ...bag.settings.active_dashboard_by_repo,
          [repo]: tab.id,
        },
      }
      return normalize_settings(structuredClone(bag.settings))
    },
    rename_dashboard: async (input) => {
      if (!bag.settings) throw new Error('Settings not initialized')
      const name = input.name.trim()
      if (!name) throw new Error('Dashboard name is required')
      if (!bag.settings.dashboards.some((tab) => tab.id === input.dashboard_id)) {
        throw new Error('Dashboard not found')
      }
      bag.settings = {
        ...bag.settings,
        dashboards: bag.settings.dashboards.map((tab) =>
          tab.id === input.dashboard_id ? { ...tab, name } : tab,
        ),
      }
      return normalize_settings(structuredClone(bag.settings))
    },
    delete_dashboard: async (dashboard_id: string) => {
      if (!bag.settings) throw new Error('Settings not initialized')
      const tab = bag.settings.dashboards.find((item) => item.id === dashboard_id)
      if (!tab) throw new Error('Dashboard not found')
      const repo_tabs = bag.settings.dashboards.filter(
        (item) => item.repo_full_name === tab.repo_full_name,
      )
      if (repo_tabs.length <= 1) {
        throw new Error('Cannot delete the last dashboard')
      }
      const dashboards = bag.settings.dashboards.filter((item) => item.id !== dashboard_id)
      const remaining_repo_tabs = dashboards.filter(
        (item) => item.repo_full_name === tab.repo_full_name,
      )
      const fallback_id = remaining_repo_tabs[0].id
      const active_dashboard_by_repo = { ...bag.settings.active_dashboard_by_repo }
      if (active_dashboard_by_repo[tab.repo_full_name] === dashboard_id) {
        active_dashboard_by_repo[tab.repo_full_name] = fallback_id
      }
      bag.settings = {
        ...bag.settings,
        dashboards,
        active_dashboard_id:
          bag.settings.active_dashboard_id === dashboard_id
            ? fallback_id
            : bag.settings.active_dashboard_id,
        active_dashboard_by_repo,
      }
      return normalize_settings(structuredClone(bag.settings))
    },
    set_active_dashboard: async (dashboard_id: string) => {
      if (!bag.settings) throw new Error('Settings not initialized')
      const tab = bag.settings.dashboards.find((item) => item.id === dashboard_id)
      if (!tab) throw new Error('Dashboard not found')
      bag.settings = {
        ...bag.settings,
        active_dashboard_id: dashboard_id,
        active_dashboard_by_repo: {
          ...bag.settings.active_dashboard_by_repo,
          [tab.repo_full_name]: dashboard_id,
        },
      }
      return normalize_settings(structuredClone(bag.settings))
    },
    set_active_repo: async (repo_full_name: string) => {
      if (!bag.settings) throw new Error('Settings not initialized')
      if (!bag.settings.repos.includes(repo_full_name)) {
        throw new Error('Repo not configured')
      }
      const dashboards_fields = normalize_settings_dashboards({
        ...bag.settings,
        active_repo: repo_full_name,
        active_dashboard_id:
          bag.settings.active_dashboard_by_repo[repo_full_name] ?? bag.settings.active_dashboard_id,
      })
      bag.settings = { ...bag.settings, ...dashboards_fields }
      return normalize_settings(structuredClone(bag.settings))
    },
    save_locale: async (locale) => {
      if (!bag.settings) throw new Error('Settings not initialized')
      bag.settings = {
        ...bag.settings,
        locale: locale == null ? null : normalize_locale(locale),
      }
      return normalize_settings(structuredClone(bag.settings))
    },
    upsert_team: async (input) => {
      if (!bag.settings) throw new Error('Settings not initialized')
      const name = input.name.trim()
      if (!name) throw new Error('Team name is required')
      if (input.members.length === 0) throw new Error('Select at least one member')
      const teams = [...(bag.settings.teams ?? [])]
      const by_id = input.id ? teams.findIndex((t) => t.id === input.id) : -1
      const by_name = teams.findIndex((t) => t.name.toLowerCase() === name.toLowerCase())
      const idx = by_id >= 0 ? by_id : by_name
      if (idx >= 0) {
        teams[idx] = { ...teams[idx], name, members: [...input.members] }
      } else {
        teams.push({
          id: crypto.randomUUID(),
          name,
          members: [...input.members],
          created_at: new Date().toISOString(),
        })
      }
      return save_teams(teams)
    },
    delete_team: async (id) => {
      if (!bag.settings) throw new Error('Settings not initialized')
      return save_teams((bag.settings.teams ?? []).filter((t) => t.id !== id))
    },
    upsert_repos: async (full_names) => {
      for (const full_name of full_names) {
        const [owner, name] = full_name.split('/')
        if (!owner || !name) continue
        if (!bag.sync_states.has(full_name)) {
          bag.sync_states.set(full_name, empty_sync_state(full_name))
        }
      }
    },
    clear_all_data: async () => {
      bag.settings = undefined
      bag.pull_requests.clear()
      bag.reviews.clear()
      bag.sync_states.clear()
      bag.pr_facts.clear()
      bag.pr_changed_files.clear()
    },
    reset_sync_data: async () => {
      bag.pull_requests.clear()
      bag.reviews.clear()
      bag.pr_facts.clear()
      bag.pr_changed_files.clear()
      for (const key of bag.sync_states.keys()) {
        bag.sync_states.set(key, empty_sync_state(key))
      }
    },
  }

  const pull_requests: PullRequestRepository = {
    list_by_repos: async (repos) => {
      const set = new Set(repos)
      return [...bag.pull_requests.values()]
        .filter((pr) => set.has(pr.repo_full_name))
        .map((pr) => structuredClone(pr))
    },
    get_created_at_bounds_by_repos: async (repos) => {
      const set = new Set(repos)
      const { compute_created_at_bounds } = await import('@/lib/pr_coverage')
      const created_at_values = [...bag.pull_requests.values()]
        .filter((pr) => set.has(pr.repo_full_name))
        .map((pr) => pr.created_at)
      return compute_created_at_bounds(created_at_values)
    },
    count_by_repo: async (repo_full_name) =>
      [...bag.pull_requests.values()].filter((pr) => pr.repo_full_name === repo_full_name).length,
    put_many: async (prs) => {
      for (const pr of prs) {
        bag.pull_requests.set(pr.id, structuredClone(pr))
      }
    },
    clear: async () => {
      bag.pull_requests.clear()
    },
  }

  const reviews: ReviewRepository = {
    list_by_pr_ids: async (pr_ids) => {
      const set = new Set(pr_ids)
      return [...bag.reviews.values()]
        .filter((r) => set.has(r.pr_id))
        .map((r) => structuredClone(r))
    },
    list_by_repos: async (repos) => {
      const set = new Set(repos)
      return [...bag.reviews.values()]
        .filter((r) => set.has(r.repo_full_name))
        .map((r) => structuredClone(r))
    },
    replace_for_pr: async (pr_id, next_reviews) => {
      for (const [id, review] of [...bag.reviews.entries()]) {
        if (review.pr_id === pr_id) bag.reviews.delete(id)
      }
      for (const review of next_reviews) {
        bag.reviews.set(review.id, structuredClone(review))
      }
    },
    clear: async () => {
      bag.reviews.clear()
    },
  }

  const sync_state: SyncStateRepository = {
    get: async (repo_full_name) => {
      const state = bag.sync_states.get(repo_full_name)
      return state ? structuredClone(normalize_sync_state(state)) : undefined
    },
    list: async () =>
      [...bag.sync_states.values()].map((s) => structuredClone(normalize_sync_state(s))),
    put: async (state) => {
      bag.sync_states.set(state.repo_full_name, structuredClone(normalize_sync_state(state)))
    },
    update: async (repo_full_name, patch) => {
      const current = bag.sync_states.get(repo_full_name)
      const next = normalize_sync_state({
        ...empty_sync_state(repo_full_name),
        ...current,
        ...patch,
        repo_full_name,
      })
      bag.sync_states.set(repo_full_name, next)
      return structuredClone(next)
    },
    ensure: async (repo_full_name) => {
      const existing = bag.sync_states.get(repo_full_name)
      if (existing) return structuredClone(normalize_sync_state(existing))
      const next = empty_sync_state(repo_full_name)
      bag.sync_states.set(repo_full_name, next)
      return structuredClone(next)
    },
    reset_all: async () => {
      for (const key of bag.sync_states.keys()) {
        bag.sync_states.set(key, empty_sync_state(key))
      }
    },
    clear: async () => {
      bag.sync_states.clear()
    },
  }

  const pr_facts: PrFactsRepository = {
    list_by_repos: async (repos) => {
      const set = new Set(repos)
      return [...bag.pr_facts.values()]
        .filter((f) => set.has(f.repo_full_name))
        .map((f) => structuredClone(f))
    },
    put_many: async (facts) => {
      for (const fact of facts) {
        bag.pr_facts.set(fact.pr_id, structuredClone(fact))
      }
    },
    delete_many: async (pr_ids) => {
      for (const id of pr_ids) bag.pr_facts.delete(id)
    },
    delete_by_repos: async (repos) => {
      const set = new Set(repos)
      for (const [id, fact] of [...bag.pr_facts.entries()]) {
        if (set.has(fact.repo_full_name)) bag.pr_facts.delete(id)
      }
    },
    clear: async () => {
      bag.pr_facts.clear()
    },
  }

  const pr_changed_files: PrChangedFilesRepository = {
    list_by_pr_ids: async (pr_ids) => {
      const set = new Set(pr_ids)
      return [...bag.pr_changed_files.values()]
        .filter((file) => set.has(file.pr_id))
        .map((file) => structuredClone(file))
    },
    replace_for_pr: async (pr_id, files) => {
      for (const [id, file] of [...bag.pr_changed_files.entries()]) {
        if (file.pr_id === pr_id) bag.pr_changed_files.delete(id)
      }
      for (const file of files) {
        bag.pr_changed_files.set(file.id, structuredClone(file))
      }
    },
    delete_by_pr_ids: async (pr_ids) => {
      const set = new Set(pr_ids)
      for (const [id, file] of [...bag.pr_changed_files.entries()]) {
        if (set.has(file.pr_id)) bag.pr_changed_files.delete(id)
      }
    },
    clear: async () => {
      bag.pr_changed_files.clear()
    },
  }

  return { settings, pull_requests, reviews, sync_state, pr_facts, pr_changed_files }
}
