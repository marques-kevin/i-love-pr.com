export type PrCreatedAtBounds = {
  oldest_created_at: string
  newest_created_at: string
  count: number
}

export function compute_created_at_bounds(created_at_values: string[]): PrCreatedAtBounds | null {
  if (created_at_values.length === 0) return null

  let oldest_created_at = created_at_values[0]
  let newest_created_at = created_at_values[0]

  for (const created_at of created_at_values) {
    if (created_at < oldest_created_at) oldest_created_at = created_at
    if (created_at > newest_created_at) newest_created_at = created_at
  }

  return {
    oldest_created_at,
    newest_created_at,
    count: created_at_values.length,
  }
}

/**
 * How far local history has walked from newest toward the remote oldest PR.
 * Returns 0..1, or null when progress cannot be computed yet.
 *
 * Visual intent: fill grows from the right (newest) toward the left (oldest).
 */
export function compute_sync_depth_progress(input: {
  local_oldest_created_at: string | null
  local_newest_created_at: string | null
  remote_oldest_created_at: string | null
  history_complete: boolean
}): number | null {
  if (input.history_complete) return 1

  const local_oldest = input.local_oldest_created_at
  const local_newest = input.local_newest_created_at
  const remote_oldest = input.remote_oldest_created_at
  if (!local_oldest || !local_newest || !remote_oldest) return null

  const newest_ms = Date.parse(local_newest)
  const local_oldest_ms = Date.parse(local_oldest)
  const remote_oldest_ms = Date.parse(remote_oldest)
  if (
    !Number.isFinite(newest_ms) ||
    !Number.isFinite(local_oldest_ms) ||
    !Number.isFinite(remote_oldest_ms)
  ) {
    return null
  }

  const total_span = newest_ms - remote_oldest_ms
  if (total_span <= 0) return 1

  const covered_span = newest_ms - local_oldest_ms
  return Math.min(1, Math.max(0, covered_span / total_span))
}

/** Oldest remote createdAt across repo sync states (ISO string min). */
export function min_remote_oldest_created_at(
  values: Array<string | null | undefined>,
): string | null {
  let oldest: string | null = null
  for (const value of values) {
    if (!value) continue
    if (!oldest || value < oldest) oldest = value
  }
  return oldest
}
