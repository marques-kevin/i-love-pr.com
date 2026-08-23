import { isWithinInterval, parseISO, startOfWeek, subDays, subWeeks } from 'date-fns'
import type { PrFactRecord } from './types'

export type GalleryRowStats = {
  /** False when the repo has no pr_facts rows yet (still syncing or empty). */
  has_facts: boolean
  /** Merged PR count in the last 30 days; null when `has_facts` is false. */
  merged_count_30d: number | null
  /** Currently open PRs (non-bot facts). */
  open_count: number | null
  avg_cycle_hours: number | null
  avg_first_review_hours: number | null
  /** Eight Monday-start weekly merged counts; null when every bucket is zero. */
  sparkline: number[] | null
}

const GALLERY_SPARKLINE_WEEKS = 8
const GALLERY_STATS_DAYS = 30

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null
  return nums.reduce((sum, value) => sum + value, 0) / nums.length
}

function in_window(iso: string, from: Date, to: Date): boolean {
  return isWithinInterval(parseISO(iso), { start: from, end: to })
}

function sparkline_week_starts(now: Date): Date[] {
  const current_week = startOfWeek(now, { weekStartsOn: 1 })
  const starts: Date[] = []
  for (let index = GALLERY_SPARKLINE_WEEKS - 1; index >= 0; index -= 1) {
    starts.push(subWeeks(current_week, index))
  }
  return starts
}

export function compute_gallery_row_stats(facts: PrFactRecord[], now: Date): GalleryRowStats {
  const human_facts = facts.filter((fact) => !fact.is_bot)
  if (human_facts.length === 0) {
    return {
      has_facts: false,
      merged_count_30d: null,
      open_count: null,
      avg_cycle_hours: null,
      avg_first_review_hours: null,
      sparkline: null,
    }
  }

  const window_from = subDays(now, GALLERY_STATS_DAYS)
  const merged_in_30d = human_facts.filter(
    (fact) =>
      fact.state === 'MERGED' &&
      fact.merged_at != null &&
      in_window(fact.merged_at, window_from, now),
  )

  const cycle_hours = merged_in_30d
    .map((fact) => fact.cycle.time_from_creation_to_merged)
    .filter((hours): hours is number => hours != null)

  const first_review_hours = merged_in_30d
    .map((fact) => fact.cycle.time_from_asked_for_review_to_first_review)
    .filter((hours): hours is number => hours != null)

  const week_starts = sparkline_week_starts(now)
  const weekly_merged = week_starts.map((week_start) => {
    const week_end = new Date(week_start)
    week_end.setDate(week_end.getDate() + 7)
    return human_facts.filter((fact) => {
      if (fact.state !== 'MERGED' || !fact.merged_at) return false
      const merged_at = parseISO(fact.merged_at)
      return merged_at >= week_start && merged_at < week_end
    }).length
  })

  const sparkline = weekly_merged.every((count) => count === 0) ? null : weekly_merged

  return {
    has_facts: true,
    merged_count_30d: merged_in_30d.length,
    open_count: human_facts.filter((fact) => fact.state === 'OPEN').length,
    avg_cycle_hours: avg(cycle_hours),
    avg_first_review_hours: avg(first_review_hours),
    sparkline,
  }
}

export function format_gallery_hours(hours: number | null): string {
  if (hours == null) return '—'
  if (hours < 24) return `${hours.toFixed(1)}h`
  return `${(hours / 24).toFixed(1)}d`
}

export function format_gallery_count(count: number | null): string {
  if (count == null) return '—'
  return String(count)
}
