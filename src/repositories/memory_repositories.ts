import { DEFAULT_IGNORED_BOTS } from '@/lib/bots'
import { DEFAULT_BUSINESS_HOURS, normalizeBusinessHours } from '@/lib/business-hours'
import { DEFAULT_BACKFILL_LIMIT } from '@/lib/db'
import type {
  AppSettings,
  MemberTeam,
  PullRequestRecord,
  ReviewRecord,
  SyncState,
} from '@/lib/types'
import type {
  PullRequestRepository,
  Repositories,
  ReviewRepository,
  SettingsRepository,
  SyncStateRepository,
} from './types'

function empty_sync_state(repo_full_name: string): SyncState {
  return {
    repoFullName: repo_full_name,
    cursorUpdatedAt: null,
    pageCursor: null,
    mode: 'idle',
    lastSyncedAt: null,
    lastError: null,
    totalFetched: 0,
    backfillFetched: 0,
  }
}

function normalize_settings(settings: AppSettings): AppSettings {
  return {
    ...settings,
    teams: settings.teams ?? [],
    businessHours: normalizeBusinessHours(settings.businessHours),
  }
}

type MemoryBag = {
  settings: AppSettings | undefined
  pull_requests: Map<string, PullRequestRecord>
  reviews: Map<string, ReviewRecord>
  sync_states: Map<string, SyncState>
}

export function create_memory_repositories(seed?: {
  settings?: AppSettings
  pull_requests?: PullRequestRecord[]
  reviews?: ReviewRecord[]
  sync_states?: SyncState[]
}): Repositories {
  const bag: MemoryBag = {
    settings: seed?.settings ? normalize_settings(structuredClone(seed.settings)) : undefined,
    pull_requests: new Map((seed?.pull_requests ?? []).map((pr) => [pr.id, structuredClone(pr)])),
    reviews: new Map((seed?.reviews ?? []).map((r) => [r.id, structuredClone(r)])),
    sync_states: new Map(
      (seed?.sync_states ?? []).map((s) => [s.repoFullName, structuredClone(s)]),
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
      bag.settings = {
        id: 'settings',
        token: partial.token,
        repos: [...partial.repos],
        syncIntervalHours: partial.syncIntervalHours ?? existing?.syncIntervalHours ?? 24,
        backfillLimit: partial.backfillLimit ?? existing?.backfillLimit ?? DEFAULT_BACKFILL_LIMIT,
        ignoredBots: partial.ignoredBots ?? existing?.ignoredBots ?? [...DEFAULT_IGNORED_BOTS],
        teams: partial.teams ?? existing?.teams ?? [],
        businessHours: normalizeBusinessHours(
          partial.businessHours ?? existing?.businessHours ?? DEFAULT_BUSINESS_HOURS,
        ),
        onboardedAt: existing?.onboardedAt ?? new Date().toISOString(),
      }
      return normalize_settings(structuredClone(bag.settings))
    },
    save_teams,
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
          createdAt: new Date().toISOString(),
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
    },
    reset_sync_data: async () => {
      bag.pull_requests.clear()
      bag.reviews.clear()
      for (const key of bag.sync_states.keys()) {
        bag.sync_states.set(key, empty_sync_state(key))
      }
    },
  }

  const pull_requests: PullRequestRepository = {
    list_by_repos: async (repos) => {
      const set = new Set(repos)
      return [...bag.pull_requests.values()]
        .filter((pr) => set.has(pr.repoFullName))
        .map((pr) => structuredClone(pr))
    },
    count_by_repo: async (repo_full_name) =>
      [...bag.pull_requests.values()].filter((pr) => pr.repoFullName === repo_full_name).length,
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
      return [...bag.reviews.values()].filter((r) => set.has(r.prId)).map((r) => structuredClone(r))
    },
    list_by_repos: async (repos) => {
      const set = new Set(repos)
      return [...bag.reviews.values()]
        .filter((r) => set.has(r.repoFullName))
        .map((r) => structuredClone(r))
    },
    replace_for_pr: async (pr_id, next_reviews) => {
      for (const [id, review] of [...bag.reviews.entries()]) {
        if (review.prId === pr_id) bag.reviews.delete(id)
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
      bag.sync_states.set(state.repoFullName, structuredClone(state))
    },
    update: async (repo_full_name, patch) => {
      const current = bag.sync_states.get(repo_full_name)
      const next: SyncState = {
        ...empty_sync_state(repo_full_name),
        ...current,
        ...patch,
        repoFullName: repo_full_name,
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

  return { settings, pull_requests, reviews, sync_state }
}
