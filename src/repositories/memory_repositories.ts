import { DEFAULT_IGNORED_BOTS } from '@/lib/bots'
import { DEFAULT_BUSINESS_HOURS, normalizeBusinessHours } from '@/lib/business-hours'
import { DEFAULT_BACKFILL_LIMIT } from '@/lib/db'
import {
  create_dashboard_tab,
  normalize_dashboard_filters,
  normalize_dashboard_layout,
  normalize_settings_dashboards,
  type DashboardTabFilters,
} from '@/lib/dashboard_layout'
import { normalize_locale, normalize_stored_locale } from '@/lib/i18n'
import type {
  AppSettings,
  DashboardLayoutItem,
  MemberTeam,
  PrFactRecord,
  PullRequestRecord,
  ReviewRecord,
  SyncState,
} from '@/lib/types'
import type {
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
    sync_interval_hours: settings.sync_interval_hours,
    backfill_limit: settings.backfill_limit,
    ignored_bots: settings.ignored_bots,
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
}

export function create_memory_repositories(seed?: {
  settings?: AppSettings
  pull_requests?: PullRequestRecord[]
  reviews?: ReviewRecord[]
  sync_states?: SyncState[]
  pr_facts?: PrFactRecord[]
}): Repositories {
  const bag: MemoryBag = {
    settings: seed?.settings ? normalize_settings(structuredClone(seed.settings)) : undefined,
    pull_requests: new Map((seed?.pull_requests ?? []).map((pr) => [pr.id, structuredClone(pr)])),
    reviews: new Map((seed?.reviews ?? []).map((r) => [r.id, structuredClone(r)])),
    sync_states: new Map(
      (seed?.sync_states ?? []).map((s) => [s.repo_full_name, structuredClone(s)]),
    ),
    pr_facts: new Map((seed?.pr_facts ?? []).map((f) => [f.pr_id, structuredClone(f)])),
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
        dashboards: partial.dashboards ?? existing?.dashboards,
        active_dashboard_id: partial.active_dashboard_id ?? existing?.active_dashboard_id,
      })
      bag.settings = {
        id: 'settings',
        token: partial.token,
        repos: [...partial.repos],
        sync_interval_hours: partial.sync_interval_hours ?? existing?.sync_interval_hours ?? 24,
        backfill_limit:
          partial.backfill_limit ?? existing?.backfill_limit ?? DEFAULT_BACKFILL_LIMIT,
        ignored_bots: partial.ignored_bots ?? existing?.ignored_bots ?? [...DEFAULT_IGNORED_BOTS],
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
      const tab = create_dashboard_tab(name)
      if (!tab.name) throw new Error('Dashboard name is required')
      bag.settings = {
        ...bag.settings,
        dashboards: [...bag.settings.dashboards, tab],
        active_dashboard_id: tab.id,
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
      if (bag.settings.dashboards.length <= 1) {
        throw new Error('Cannot delete the last dashboard')
      }
      if (!bag.settings.dashboards.some((tab) => tab.id === dashboard_id)) {
        throw new Error('Dashboard not found')
      }
      const dashboards = bag.settings.dashboards.filter((tab) => tab.id !== dashboard_id)
      bag.settings = {
        ...bag.settings,
        dashboards,
        active_dashboard_id:
          bag.settings.active_dashboard_id === dashboard_id
            ? dashboards[0].id
            : bag.settings.active_dashboard_id,
      }
      return normalize_settings(structuredClone(bag.settings))
    },
    set_active_dashboard: async (dashboard_id: string) => {
      if (!bag.settings) throw new Error('Settings not initialized')
      if (!bag.settings.dashboards.some((tab) => tab.id === dashboard_id)) {
        throw new Error('Dashboard not found')
      }
      bag.settings = { ...bag.settings, active_dashboard_id: dashboard_id }
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
    },
    reset_sync_data: async () => {
      bag.pull_requests.clear()
      bag.reviews.clear()
      bag.pr_facts.clear()
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
      return state ? structuredClone(state) : undefined
    },
    list: async () => [...bag.sync_states.values()].map((s) => structuredClone(s)),
    put: async (state) => {
      bag.sync_states.set(state.repo_full_name, structuredClone(state))
    },
    update: async (repo_full_name, patch) => {
      const current = bag.sync_states.get(repo_full_name)
      const next: SyncState = {
        ...empty_sync_state(repo_full_name),
        ...current,
        ...patch,
        repo_full_name,
      }
      bag.sync_states.set(repo_full_name, next)
      return structuredClone(next)
    },
    ensure: async (repo_full_name) => {
      const existing = bag.sync_states.get(repo_full_name)
      if (existing) return structuredClone(existing)
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

  return { settings, pull_requests, reviews, sync_state, pr_facts }
}
