export const EMPTY_STAT = '—'

export function format_hours(hours: number | null): string {
  if (hours == null) return EMPTY_STAT
  if (hours < 24) return `${hours.toFixed(1)}h`
  return `${(hours / 24).toFixed(1)}d`
}

export function format_count(count: number | null): string {
  if (count == null) return EMPTY_STAT
  return String(count)
}
