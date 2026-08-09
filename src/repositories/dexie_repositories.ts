import { DEFAULT_IGNORED_BOTS } from '@/lib/bots'
import {
  DEFAULT_BUSINESS_HOURS,
  normalizeBusinessHours,
} from '@/lib/business-hours'
import { DEFAULT_BACKFILL_LIMIT, type IlovePrDatabase } from '@/lib/db'
import type { AppSettings, MemberTeam, SyncState } from '@/lib/types'
import type {
  PullRequestRepository,
  Repositories,
  ReviewRepository,
  SaveSettingsInput,
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

export function create_dexie_settings_repository(
  database: IlovePrDatabase,
): SettingsRepository {
  const get = async (): Promise<AppSettings | undefined> => {
    const settings = await database.settings.get('settings')
    if (!settings) return undefined
    return {
      ...settings,
      teams: settings.teams ?? [],
      businessHours: normalizeBusinessHours(settings.businessHours),
    }
  }

  const save = async (partial: SaveSettingsInput): Promise<AppSettings> => {
    const existing = await get()
    const next: AppSettings = {
      id: 'settings',
      token: partial.token,
      repos: partial.repos,
      syncIntervalHours: partial.syncIntervalHours ?? existing?.syncIntervalHours ?? 24,
      backfillLimit:
        partial.backfillLimit ?? existing?.backfillLimit ?? DEFAULT_BACKFILL_LIMIT,
      ignoredBots: partial.ignoredBots ?? existing?.ignoredBots ?? [...DEFAULT_IGNORED_BOTS],
      teams: partial.teams ?? existing?.teams ?? [],
      businessHours: normalizeBusinessHours(
        partial.businessHours ?? existing?.businessHours ?? DEFAULT_BUSINESS_HOURS,
      ),
      onboardedAt: existing?.onboardedAt ?? new Date().toISOString(),
    }
    await database.settings.put(next)
    return next
  }

  const save_teams = async (teams: MemberTeam[]): Promise<AppSettings> => {
    const existing = await get()
    if (!existing) throw new Error('Settings not initialized')
    const next: AppSettings = { ...existing, teams }
    await database.settings.put(next)
    return next
  }

  return {
    get,
    save,
    save_teams,
    upsert_team: async (input) => {
      const existing = await get()
      if (!existing) throw new Error('Settings not initialized')
      const name = input.name.trim()
      if (!name) throw new Error('Team name is required')
      if (input.members.length === 0) throw new Error('Select at least one member')

      const teams = [...(existing.teams ?? [])]
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
      const existing = await get()
      if (!existing) throw new Error('Settings not initialized')
      return save_teams((existing.teams ?? []).filter((t) => t.id !== id))
    },
    upsert_repos: async (full_names) => {
      const now = new Date().toISOString()
      await database.transaction('rw', database.repos, database.syncState, async () => {
        for (const full_name of full_names) {
          const [owner, name] = full_name.split('/')
          if (!owner || !name) continue
          const existing = await database.repos.get(full_name)
          if (!existing) {
            await database.repos.put({
              fullName: full_name,
              owner,
              name,
              addedAt: now,
            })
          }
          const sync = await database.syncState.get(full_name)
          if (!sync) {
            await database.syncState.put(empty_sync_state(full_name))
          }
        }
      })
    },
    clear_all_data: async () => {
      await database.transaction(
        'rw',
        database.pullRequests,
        database.reviews,
        database.syncState,
        database.repos,
        database.settings,
        async () => {
          await Promise.all([
            database.pullRequests.clear(),
            database.reviews.clear(),
            database.syncState.clear(),
            database.repos.clear(),
            database.settings.clear(),
          ])
        },
      )
    },
    reset_sync_data: async () => {
      await database.transaction(
        'rw',
        database.pullRequests,
        database.reviews,
        database.syncState,
        async () => {
          await database.pullRequests.clear()
          await database.reviews.clear()
          const states = await database.syncState.toArray()
          for (const state of states) {
            await database.syncState.put({
              ...empty_sync_state(state.repoFullName),
            })
          }
        },
      )
    },
  }
}

export function create_dexie_pull_request_repository(
  database: IlovePrDatabase,
): PullRequestRepository {
  return {
    list_by_repos: async (repos) => {
      if (repos.length === 0) return []
      if (repos.length === 1) {
        return database.pullRequests.where('repoFullName').equals(repos[0]).toArray()
      }
      return database.pullRequests.where('repoFullName').anyOf(repos).toArray()
    },
    count_by_repo: async (repo_full_name) =>
      database.pullRequests.where('repoFullName').equals(repo_full_name).count(),
    put_many: async (prs) => {
      await database.pullRequests.bulkPut(prs)
    },
    clear: async () => {
      await database.pullRequests.clear()
    },
  }
}

export function create_dexie_review_repository(
  database: IlovePrDatabase,
): ReviewRepository {
  return {
    list_by_pr_ids: async (pr_ids) => {
      let reviews = [] as Awaited<ReturnType<ReviewRepository['list_by_pr_ids']>>
      const chunk_size = 100
      for (let i = 0; i < pr_ids.length; i += chunk_size) {
        const chunk = pr_ids.slice(i, i + chunk_size)
        const part = await database.reviews.where('prId').anyOf(chunk).toArray()
        reviews = reviews.concat(part)
      }
      return reviews
    },
    list_by_repos: async (repos) => {
      if (repos.length === 0) return []
      return database.reviews.where('repoFullName').anyOf(repos).toArray()
    },
    replace_for_pr: async (pr_id, reviews) => {
      await database.transaction('rw', database.reviews, async () => {
        const existing = await database.reviews.where('prId').equals(pr_id).toArray()
        const incoming_ids = new Set(reviews.map((r) => r.id))
        for (const old of existing) {
          if (!incoming_ids.has(old.id)) {
            await database.reviews.delete(old.id)
          }
        }
        for (const review of reviews) {
          await database.reviews.put(review)
        }
      })
    },
    clear: async () => {
      await database.reviews.clear()
    },
  }
}

export function create_dexie_sync_state_repository(
  database: IlovePrDatabase,
): SyncStateRepository {
  return {
    get: async (repo_full_name) => database.syncState.get(repo_full_name),
    list: async () => database.syncState.toArray(),
    put: async (state) => {
      await database.syncState.put(state)
    },
    update: async (repo_full_name, patch) => {
      const current = await database.syncState.get(repo_full_name)
      const next: SyncState = {
        ...empty_sync_state(repo_full_name),
        ...current,
        ...patch,
        repoFullName: repo_full_name,
      }
      await database.syncState.put(next)
      return next
    },
    ensure: async (repo_full_name) => {
      const existing = await database.syncState.get(repo_full_name)
      if (existing) return existing
      const next = empty_sync_state(repo_full_name)
      await database.syncState.put(next)
      return next
    },
    reset_all: async () => {
      const states = await database.syncState.toArray()
      for (const state of states) {
        await database.syncState.put(empty_sync_state(state.repoFullName))
      }
    },
    clear: async () => {
      await database.syncState.clear()
    },
  }
}

export function create_dexie_repositories(database: IlovePrDatabase): Repositories {
  return {
    settings: create_dexie_settings_repository(database),
    pull_requests: create_dexie_pull_request_repository(database),
    reviews: create_dexie_review_repository(database),
    sync_state: create_dexie_sync_state_repository(database),
  }
}
