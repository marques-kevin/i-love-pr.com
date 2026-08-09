import { DEFAULT_IGNORED_BOTS } from '@/lib/bots'
import { DEFAULT_BUSINESS_HOURS, normalizeBusinessHours } from '@/lib/business-hours'
import { DEFAULT_BACKFILL_LIMIT, type IlovePrDatabase } from '@/lib/db'
import type { AppSettings, MemberTeam, SyncState } from '@/lib/types'
import { normalize_dashboard_layout } from '@/lib/dashboard_layout'
import { normalize_locale, normalize_stored_locale } from '@/lib/i18n'
import type {
  PullRequestRepository,
  PrFactsRepository,
  Repositories,
  ReviewRepository,
  SaveSettingsInput,
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

function normalize_settings(settings: AppSettings): AppSettings {
  return {
    ...settings,
    teams: settings.teams ?? [],
    business_hours: normalizeBusinessHours(settings.business_hours),
    dashboard_layout: normalize_dashboard_layout(settings.dashboard_layout),
    locale: normalize_stored_locale(settings.locale),
  }
}

export function create_dexie_settings_repository(database: IlovePrDatabase): SettingsRepository {
  const get = async (): Promise<AppSettings | undefined> => {
    const settings = await database.settings.get('settings')
    if (!settings) return undefined
    return normalize_settings(settings as AppSettings)
  }

  const save = async (partial: SaveSettingsInput): Promise<AppSettings> => {
    const existing = await get()
    const next: AppSettings = {
      id: 'settings',
      token: partial.token,
      repos: partial.repos,
      sync_interval_hours: partial.sync_interval_hours ?? existing?.sync_interval_hours ?? 24,
      backfill_limit: partial.backfill_limit ?? existing?.backfill_limit ?? DEFAULT_BACKFILL_LIMIT,
      ignored_bots: partial.ignored_bots ?? existing?.ignored_bots ?? [...DEFAULT_IGNORED_BOTS],
      teams: partial.teams ?? existing?.teams ?? [],
      business_hours: normalizeBusinessHours(
        partial.business_hours ?? existing?.business_hours ?? DEFAULT_BUSINESS_HOURS,
      ),
      dashboard_layout: normalize_dashboard_layout(
        partial.dashboard_layout ?? existing?.dashboard_layout,
      ),
      locale:
        partial.locale !== undefined
          ? normalize_stored_locale(partial.locale)
          : normalize_stored_locale(existing?.locale),
      onboarded_at: existing?.onboarded_at ?? new Date().toISOString(),
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

  const save_dashboard_layout = async (
    layout: AppSettings['dashboard_layout'],
  ): Promise<AppSettings> => {
    const existing = await get()
    if (!existing) throw new Error('Settings not initialized')
    const next: AppSettings = {
      ...existing,
      dashboard_layout: normalize_dashboard_layout(layout),
    }
    await database.settings.put(next)
    return next
  }

  const save_locale = async (locale: AppSettings['locale']): Promise<AppSettings> => {
    const existing = await get()
    if (!existing) throw new Error('Settings not initialized')
    const next: AppSettings = {
      ...existing,
      locale: locale == null ? null : normalize_locale(locale),
    }
    await database.settings.put(next)
    return next
  }

  return {
    get,
    save,
    save_teams,
    save_dashboard_layout,
    save_locale,
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
          created_at: new Date().toISOString(),
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
      await database.transaction('rw', database.repos, database.sync_state, async () => {
        for (const full_name of full_names) {
          const [owner, name] = full_name.split('/')
          if (!owner || !name) continue
          const existing = await database.repos.get(full_name)
          if (!existing) {
            await database.repos.put({
              full_name,
              owner,
              name,
              added_at: now,
            })
          }
          const sync = await database.sync_state.get(full_name)
          if (!sync) {
            await database.sync_state.put(empty_sync_state(full_name))
          }
        }
      })
    },
    clear_all_data: async () => {
      await database.transaction(
        'rw',
        [
          database.pull_requests,
          database.reviews,
          database.sync_state,
          database.repos,
          database.settings,
          database.pr_facts,
          database.chart_specs,
        ],
        async () => {
          await Promise.all([
            database.pull_requests.clear(),
            database.reviews.clear(),
            database.sync_state.clear(),
            database.repos.clear(),
            database.settings.clear(),
            database.pr_facts.clear(),
            database.chart_specs.clear(),
          ])
        },
      )
    },
    reset_sync_data: async () => {
      await database.transaction(
        'rw',
        [database.pull_requests, database.reviews, database.sync_state, database.pr_facts],
        async () => {
          await database.pull_requests.clear()
          await database.reviews.clear()
          await database.pr_facts.clear()
          const states = await database.sync_state.toArray()
          for (const state of states) {
            await database.sync_state.put({
              ...empty_sync_state(state.repo_full_name),
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
        return database.pull_requests.where('repo_full_name').equals(repos[0]).toArray()
      }
      return database.pull_requests.where('repo_full_name').anyOf(repos).toArray()
    },
    count_by_repo: async (repo_full_name) =>
      database.pull_requests.where('repo_full_name').equals(repo_full_name).count(),
    put_many: async (prs) => {
      await database.pull_requests.bulkPut(prs)
    },
    clear: async () => {
      await database.pull_requests.clear()
    },
  }
}

export function create_dexie_review_repository(database: IlovePrDatabase): ReviewRepository {
  return {
    list_by_pr_ids: async (pr_ids) => {
      let reviews = [] as Awaited<ReturnType<ReviewRepository['list_by_pr_ids']>>
      const chunk_size = 100
      for (let i = 0; i < pr_ids.length; i += chunk_size) {
        const chunk = pr_ids.slice(i, i + chunk_size)
        const part = await database.reviews.where('pr_id').anyOf(chunk).toArray()
        reviews = reviews.concat(part)
      }
      return reviews
    },
    list_by_repos: async (repos) => {
      if (repos.length === 0) return []
      return database.reviews.where('repo_full_name').anyOf(repos).toArray()
    },
    replace_for_pr: async (pr_id, reviews) => {
      await database.transaction('rw', database.reviews, async () => {
        const existing = await database.reviews.where('pr_id').equals(pr_id).toArray()
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

export function create_dexie_sync_state_repository(database: IlovePrDatabase): SyncStateRepository {
  return {
    get: async (repo_full_name) => database.sync_state.get(repo_full_name),
    list: async () => database.sync_state.toArray(),
    put: async (state) => {
      await database.sync_state.put(state)
    },
    update: async (repo_full_name, patch) => {
      const current = await database.sync_state.get(repo_full_name)
      const next: SyncState = {
        ...empty_sync_state(repo_full_name),
        ...current,
        ...patch,
        repo_full_name,
      }
      await database.sync_state.put(next)
      return next
    },
    ensure: async (repo_full_name) => {
      const existing = await database.sync_state.get(repo_full_name)
      if (existing) return existing
      const next = empty_sync_state(repo_full_name)
      await database.sync_state.put(next)
      return next
    },
    reset_all: async () => {
      const states = await database.sync_state.toArray()
      for (const state of states) {
        await database.sync_state.put(empty_sync_state(state.repo_full_name))
      }
    },
    clear: async () => {
      await database.sync_state.clear()
    },
  }
}

export function create_dexie_pr_facts_repository(database: IlovePrDatabase): PrFactsRepository {
  return {
    list_by_repos: async (repos) => {
      if (repos.length === 0) return []
      if (repos.length === 1) {
        return database.pr_facts.where('repo_full_name').equals(repos[0]).toArray()
      }
      return database.pr_facts.where('repo_full_name').anyOf(repos).toArray()
    },
    put_many: async (facts) => {
      await database.pr_facts.bulkPut(facts)
    },
    delete_many: async (pr_ids) => {
      await database.pr_facts.bulkDelete(pr_ids)
    },
    delete_by_repos: async (repos) => {
      if (repos.length === 0) return
      await database.pr_facts.where('repo_full_name').anyOf(repos).delete()
    },
    clear: async () => {
      await database.pr_facts.clear()
    },
  }
}

export function create_dexie_repositories(database: IlovePrDatabase): Repositories {
  return {
    settings: create_dexie_settings_repository(database),
    pull_requests: create_dexie_pull_request_repository(database),
    reviews: create_dexie_review_repository(database),
    sync_state: create_dexie_sync_state_repository(database),
    pr_facts: create_dexie_pr_facts_repository(database),
  }
}
