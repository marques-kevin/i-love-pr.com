import { GitHubApiError, GitHubClient, parseRepoFullName } from './github-client'
import type { AppSettings, RateLimitInfo, SyncProgress, SyncState } from './types'
import type { Repositories } from '@/repositories'
import { persist_normalized_page } from '@/repositories'

export type SyncProgressCallback = (progress: SyncProgress) => void

function hours_since(iso: string | null): number | null {
  if (!iso) return null
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60)
}

export async function sync_all_repos(options: {
  repositories: Repositories
  force?: boolean
  /** When set, only these repos are synced (default: all configured repos). */
  repos?: string[]
  on_progress?: SyncProgressCallback
}): Promise<{ rate_limit: RateLimitInfo | null; sync_completed: boolean }> {
  const settings = await options.repositories.settings.get()
  if (!settings?.token) {
    throw new Error('Missing GitHub token')
  }

  const client = new GitHubClient(settings.token)
  let last_rate_limit: RateLimitInfo | null = null
  let sync_completed = false
  const repos =
    options.repos && options.repos.length > 0
      ? options.repos.filter((repo) => settings.repos.includes(repo))
      : settings.repos

  for (const full_name of repos) {
    const result = await sync_repo(full_name, {
      repositories: options.repositories,
      client,
      settings,
      force: options.force ?? false,
      on_progress: options.on_progress,
    })
    last_rate_limit = result.rate_limit ?? last_rate_limit
    if (result.sync_completed) {
      sync_completed = true
    }
  }

  return { rate_limit: last_rate_limit ?? client.getRateLimit(), sync_completed }
}

async function sync_repo(
  full_name: string,
  ctx: {
    repositories: Repositories
    client: GitHubClient
    settings: AppSettings
    force: boolean
    on_progress?: SyncProgressCallback
  },
): Promise<{ rate_limit: RateLimitInfo | null; sync_completed: boolean }> {
  const { repositories } = ctx
  const parsed = parseRepoFullName(full_name)
  if (!parsed) {
    await repositories.sync_state.update(full_name, {
      last_error: `Invalid repo format: ${full_name}`,
      mode: 'idle',
    })
    return { rate_limit: ctx.client.getRateLimit(), sync_completed: false }
  }

  let state =
    (await repositories.sync_state.get(full_name)) ??
    (await repositories.sync_state.update(full_name, {
      mode: 'idle',
      cursor_updated_at: null,
      page_cursor: null,
      last_synced_at: null,
      last_error: null,
      total_fetched: 0,
      backfill_fetched: 0,
    }))

  const age_hours = hours_since(state.last_synced_at)
  const interval = ctx.settings.sync_interval_hours
  const batch_size = Math.max(1, ctx.settings.backfill_limit ?? 200)
  const has_data = (await repositories.pull_requests.count_by_repo(full_name)) > 0
  const resume_paused = state.mode === 'paused' || state.mode === 'backfill'
  const continue_deeper = Boolean(ctx.force && state.page_cursor && state.mode === 'idle')

  let mode: SyncState['mode'] = 'idle'
  if (ctx.force || resume_paused || !has_data || !state.cursor_updated_at) {
    mode = 'backfill'
  } else if (age_hours === null || age_hours >= interval) {
    mode = 'incremental'
  } else {
    ctx.on_progress?.({
      repo_full_name: full_name,
      mode: 'idle',
      fetched: state.total_fetched,
      message: `Cache fresh (< ${interval}h). Skipping ${full_name}.`,
      rate_limit: ctx.client.getRateLimit(),
    })
    return { rate_limit: ctx.client.getRateLimit(), sync_completed: false }
  }

  const stop_before =
    mode === 'incremental' && state.cursor_updated_at ? state.cursor_updated_at : null

  const resume_mid_batch = mode === 'backfill' && resume_paused
  let page_cursor: string | null =
    mode === 'backfill' ? (resume_mid_batch || continue_deeper ? state.page_cursor : null) : null
  let fetched_this_run = 0
  let batch_fetched = resume_mid_batch ? (state.backfill_fetched ?? 0) : 0
  let newest_updated_at = state.cursor_updated_at
  let more_pages_available = false

  await repositories.sync_state.update(full_name, {
    mode,
    page_cursor,
    backfill_fetched: batch_fetched,
    last_error: null,
  })

  if (!state.remote_oldest_created_at) {
    try {
      const oldest = await ctx.client.fetchOldestPullRequestCreatedAt(parsed.owner, parsed.name)
      state = await repositories.sync_state.update(full_name, {
        remote_oldest_created_at: oldest.created_at,
      })
    } catch {
      // Progress % stays unavailable until a later sync succeeds at probing.
    }
  }

  ctx.on_progress?.({
    repo_full_name: full_name,
    mode,
    fetched: batch_fetched,
    message:
      mode === 'backfill'
        ? continue_deeper || resume_mid_batch
          ? `Continuing ${full_name} (batch ${batch_fetched}/${batch_size})…`
          : `Backfilling ${full_name} (batch of ${batch_size} PRs)…`
        : `Refreshing ${full_name}…`,
    rate_limit: ctx.client.getRateLimit(),
  })

  try {
    let has_next_page = true
    let hit_batch_limit = false

    while (has_next_page) {
      const page = await ctx.client.fetchPullRequestsPage(parsed.owner, parsed.name, page_cursor)

      let page_items = page.items
      let reached_cursor = false

      if (stop_before) {
        const filtered = []
        for (const item of page_items) {
          if (item.pull_request.updated_at <= stop_before) {
            reached_cursor = true
            break
          }
          filtered.push(item)
        }
        page_items = filtered
      }

      if (mode === 'backfill') {
        const remaining = batch_size - batch_fetched
        if (remaining <= 0) {
          page_items = []
          hit_batch_limit = true
        } else if (page_items.length > remaining) {
          page_items = page_items.slice(0, remaining)
          hit_batch_limit = true
        }
      }

      await persist_normalized_page(repositories, page_items)
      fetched_this_run += page_items.length
      if (mode === 'backfill') {
        batch_fetched += page_items.length
        if (batch_fetched >= batch_size) hit_batch_limit = true
      }

      for (const item of page_items) {
        if (!newest_updated_at || item.pull_request.updated_at > newest_updated_at) {
          newest_updated_at = item.pull_request.updated_at
        }
      }

      page_cursor = page.pageInfo.endCursor
      more_pages_available = page.pageInfo.hasNextPage && !reached_cursor
      has_next_page = more_pages_available && !hit_batch_limit

      const persist_cursor =
        has_next_page || (hit_batch_limit && more_pages_available) ? page_cursor : null

      await repositories.sync_state.update(full_name, {
        mode,
        page_cursor: persist_cursor,
        cursor_updated_at: newest_updated_at,
        total_fetched: (state.total_fetched ?? 0) + fetched_this_run,
        backfill_fetched: mode === 'backfill' ? batch_fetched : (state.backfill_fetched ?? 0),
        last_error: null,
      })

      state = (await repositories.sync_state.get(full_name))!

      ctx.on_progress?.({
        repo_full_name: full_name,
        mode,
        fetched: mode === 'backfill' ? batch_fetched : state.total_fetched,
        message:
          mode === 'backfill'
            ? `${full_name}: ${batch_fetched}/${batch_size} this batch`
            : `${full_name}: ${fetched_this_run} PRs this run`,
        rate_limit: page.rateLimit,
      })

      if (hit_batch_limit) break

      if (page.rateLimit.remaining < 20) {
        await repositories.sync_state.update(full_name, {
          mode: 'paused',
          page_cursor,
          cursor_updated_at: newest_updated_at,
          backfill_fetched: batch_fetched,
          last_error: 'Paused: rate limit low. Sync history again once it resets to continue.',
          total_fetched: state.total_fetched,
        })
        ctx.on_progress?.({
          repo_full_name: full_name,
          mode: 'paused',
          fetched: batch_fetched,
          message: `Paused ${full_name}: ${batch_fetched}/${batch_size} this batch (rate limit). Retry later.`,
          rate_limit: page.rateLimit,
        })
        return { rate_limit: page.rateLimit, sync_completed: false }
      }
    }

    const kept_cursor = hit_batch_limit && more_pages_available ? page_cursor : null

    await repositories.sync_state.update(full_name, {
      mode: 'idle',
      page_cursor: kept_cursor,
      cursor_updated_at: newest_updated_at,
      last_synced_at: new Date().toISOString(),
      last_error: null,
      total_fetched: state.total_fetched,
      backfill_fetched: 0,
    })

    ctx.on_progress?.({
      repo_full_name: full_name,
      mode: 'idle',
      fetched: mode === 'backfill' ? batch_fetched : state.total_fetched,
      message:
        mode === 'backfill'
          ? kept_cursor
            ? `Synced ${full_name}: +${batch_fetched} PRs. More history left — Sync history again after rate limit resets.`
            : `Synced ${full_name}: +${batch_fetched} PRs (end of history)`
          : `Synced ${full_name}`,
      rate_limit: ctx.client.getRateLimit(),
    })

    return { rate_limit: ctx.client.getRateLimit(), sync_completed: true }
  } catch (error) {
    const message =
      error instanceof GitHubApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Unknown sync error'

    const rate_limit = error instanceof GitHubApiError ? error.rateLimit : ctx.client.getRateLimit()

    await repositories.sync_state.update(full_name, {
      mode: 'paused',
      page_cursor,
      cursor_updated_at: newest_updated_at,
      backfill_fetched: batch_fetched,
      last_error: message,
      total_fetched:
        (await repositories.sync_state.get(full_name))?.total_fetched ?? state.total_fetched,
    })

    ctx.on_progress?.({
      repo_full_name: full_name,
      mode: 'paused',
      fetched: batch_fetched || state.total_fetched + fetched_this_run,
      message: `Interrupted ${full_name}: ${message}`,
      rate_limit,
    })

    return { rate_limit, sync_completed: false }
  }
}
