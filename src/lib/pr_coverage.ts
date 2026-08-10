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
