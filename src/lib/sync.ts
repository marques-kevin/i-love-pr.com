import { GitHubApiError, GitHubClient, parseRepoFullName } from './github-client'
import type {
  AppSettings,
  RateLimitInfo,
  SyncProgress,
  SyncState,
} from './types'
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
  on_progress?: SyncProgressCallback
}): Promise<{ rate_limit: RateLimitInfo | null }> {
  const settings = await options.repositories.settings.get()
  if (!settings?.token) {
    throw new Error('Missing GitHub token')
  }

  const client = new GitHubClient(settings.token)
  let last_rate_limit: RateLimitInfo | null = null

  for (const full_name of settings.repos) {
    const result = await sync_repo(full_name, {
      repositories: options.repositories,
      client,
      settings,
      force: options.force ?? false,
      on_progress: options.on_progress,
    })
    last_rate_limit = result.rate_limit ?? last_rate_limit
  }

  return { rate_limit: last_rate_limit ?? client.getRateLimit() }
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
): Promise<{ rate_limit: RateLimitInfo | null }> {
  const { repositories } = ctx
  const parsed = parseRepoFullName(full_name)
  if (!parsed) {
    await repositories.sync_state.update(full_name, {
      lastError: `Invalid repo format: ${full_name}`,
      mode: 'idle',
    })
    return { rate_limit: ctx.client.getRateLimit() }
  }

  let state =
    (await repositories.sync_state.get(full_name)) ??
    (await repositories.sync_state.update(full_name, {
      mode: 'idle',
      cursorUpdatedAt: null,
      pageCursor: null,
      lastSyncedAt: null,
      lastError: null,
      totalFetched: 0,
      backfillFetched: 0,
    }))

  const age_hours = hours_since(state.lastSyncedAt)
  const interval = ctx.settings.syncIntervalHours
  const batch_size = Math.max(1, ctx.settings.backfillLimit ?? 200)
  const has_data = (await repositories.pull_requests.count_by_repo(full_name)) > 0
  const resume_paused = state.mode === 'paused' || state.mode === 'backfill'
  const continue_deeper = Boolean(ctx.force && state.pageCursor && state.mode === 'idle')

  let mode: SyncState['mode'] = 'idle'
  if (ctx.force || resume_paused || !has_data || !state.cursorUpdatedAt) {
    mode = 'backfill'
  } else if (age_hours === null || age_hours >= interval) {
    mode = 'incremental'
  } else {
    ctx.on_progress?.({
      repoFullName: full_name,
      mode: 'idle',
      fetched: state.totalFetched,
      message: `Cache fresh (< ${interval}h). Skipping ${full_name}.`,
      rateLimit: ctx.client.getRateLimit(),
    })
    return { rate_limit: ctx.client.getRateLimit() }
  }

  const stop_before =
    mode === 'incremental' && state.cursorUpdatedAt ? state.cursorUpdatedAt : null

  const resume_mid_batch = mode === 'backfill' && resume_paused
  let page_cursor: string | null =
    mode === 'backfill'
      ? resume_mid_batch || continue_deeper
        ? state.pageCursor
        : null
      : null
  let fetched_this_run = 0
  let batch_fetched = resume_mid_batch ? (state.backfillFetched ?? 0) : 0
  let newest_updated_at = state.cursorUpdatedAt
  let more_pages_available = false

  await repositories.sync_state.update(full_name, {
    mode,
    pageCursor: page_cursor,
    backfillFetched: batch_fetched,
    lastError: null,
  })

  ctx.on_progress?.({
    repoFullName: full_name,
    mode,
    fetched: batch_fetched,
    message:
      mode === 'backfill'
        ? continue_deeper || resume_mid_batch
          ? `Continuing ${full_name} (batch ${batch_fetched}/${batch_size})…`
          : `Backfilling ${full_name} (batch of ${batch_size} PRs)…`
        : `Refreshing ${full_name}…`,
    rateLimit: ctx.client.getRateLimit(),
  })

  try {
    let has_next_page = true
    let hit_batch_limit = false

    while (has_next_page) {
      const page = await ctx.client.fetchPullRequestsPage(
        parsed.owner,
        parsed.name,
        page_cursor,
      )

      let page_items = page.items
      let reached_cursor = false

      if (stop_before) {
        const filtered = []
        for (const item of page_items) {
          if (item.pullRequest.updatedAt <= stop_before) {
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
        if (!newest_updated_at || item.pullRequest.updatedAt > newest_updated_at) {
          newest_updated_at = item.pullRequest.updatedAt
        }
      }

      page_cursor = page.pageInfo.endCursor
      more_pages_available = page.pageInfo.hasNextPage && !reached_cursor
      has_next_page = more_pages_available && !hit_batch_limit

      const persist_cursor =
        has_next_page || (hit_batch_limit && more_pages_available) ? page_cursor : null

      await repositories.sync_state.update(full_name, {
        mode,
        pageCursor: persist_cursor,
        cursorUpdatedAt: newest_updated_at,
        totalFetched: (state.totalFetched ?? 0) + fetched_this_run,
        backfillFetched: mode === 'backfill' ? batch_fetched : (state.backfillFetched ?? 0),
        lastError: null,
      })

      state = (await repositories.sync_state.get(full_name))!

      ctx.on_progress?.({
        repoFullName: full_name,
        mode,
        fetched: mode === 'backfill' ? batch_fetched : state.totalFetched,
        message:
          mode === 'backfill'
            ? `${full_name}: ${batch_fetched}/${batch_size} this batch`
            : `${full_name}: ${fetched_this_run} PRs this run`,
        rateLimit: page.rateLimit,
      })

      if (hit_batch_limit) break

      if (page.rateLimit.remaining < 20) {
        await repositories.sync_state.update(full_name, {
          mode: 'paused',
          pageCursor: page_cursor,
          cursorUpdatedAt: newest_updated_at,
          backfillFetched: batch_fetched,
          lastError:
            'Paused: rate limit low. Sync history again once it resets to continue.',
          totalFetched: state.totalFetched,
        })
        ctx.on_progress?.({
          repoFullName: full_name,
          mode: 'paused',
          fetched: batch_fetched,
          message: `Paused ${full_name}: ${batch_fetched}/${batch_size} this batch (rate limit). Retry later.`,
          rateLimit: page.rateLimit,
        })
        return { rate_limit: page.rateLimit }
      }
    }

    const kept_cursor = hit_batch_limit && more_pages_available ? page_cursor : null

    await repositories.sync_state.update(full_name, {
      mode: 'idle',
      pageCursor: kept_cursor,
      cursorUpdatedAt: newest_updated_at,
      lastSyncedAt: new Date().toISOString(),
      lastError: null,
      totalFetched: state.totalFetched,
      backfillFetched: 0,
    })

    ctx.on_progress?.({
      repoFullName: full_name,
      mode: 'idle',
      fetched: mode === 'backfill' ? batch_fetched : state.totalFetched,
      message:
        mode === 'backfill'
          ? kept_cursor
            ? `Synced ${full_name}: +${batch_fetched} PRs. More history left — Sync history again after rate limit resets.`
            : `Synced ${full_name}: +${batch_fetched} PRs (end of history)`
          : `Synced ${full_name}`,
      rateLimit: ctx.client.getRateLimit(),
    })

    return { rate_limit: ctx.client.getRateLimit() }
  } catch (error) {
    const message =
      error instanceof GitHubApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Unknown sync error'

    const rate_limit =
      error instanceof GitHubApiError ? error.rateLimit : ctx.client.getRateLimit()

    await repositories.sync_state.update(full_name, {
      mode: 'paused',
      pageCursor: page_cursor,
      cursorUpdatedAt: newest_updated_at,
      backfillFetched: batch_fetched,
      lastError: message,
      totalFetched:
        (await repositories.sync_state.get(full_name))?.totalFetched ?? state.totalFetched,
    })

    ctx.on_progress?.({
      repoFullName: full_name,
      mode: 'paused',
      fetched: batch_fetched || state.totalFetched + fetched_this_run,
      message: `Interrupted ${full_name}: ${message}`,
      rateLimit: rate_limit,
    })

    return { rate_limit }
  }
}
