/** Format hours for dashboard-style stat display (< 24h → hours, else days). */
export function format_hours(hours: number | null): string {
  if (hours == null) return '—'
  if (hours < 24) return `${hours.toFixed(1)}h`
  return `${(hours / 24).toFixed(1)}d`
}
