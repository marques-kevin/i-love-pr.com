import {
  eachWeekOfInterval,
  endOfWeek,
  isWithinInterval,
  parseISO,
  startOfWeek,
  subDays,
  subWeeks,
} from 'date-fns'
import type { PrFactRecord } from '@/lib/types'

export type GalleryRowStats = {
  merged_count_30d: number | null
  open_count: number | null
  weekly_merged_counts: number[] | null
  avg_cycle_hours: number | null
  avg_time_to_first_review_hours: number | null
}

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null
  return nums.reduce((sum, value) => sum + value, 0) / nums.length
}

function weekly_merged_counts(facts: PrFactRecord[], now: Date): number[] {
  const week_end = endOfWeek(now, { weekStartsOn: 1 })
  const week_start = startOfWeek(subWeeks(now, 7), { weekStartsOn: 1 })
  const weeks = eachWeekOfInterval({ start: week_start, end: week_end }, { weekStartsOn: 1 })

  return weeks.map((week_start_date) => {
    const week_end_date = endOfWeek(week_start_date, { weekStartsOn: 1 })
    return facts.filter(
      (fact) =>
        fact.state === 'MERGED' &&
        fact.merged_at != null &&
        isWithinInterval(parseISO(fact.merged_at), {
          start: week_start_date,
          end: week_end_date,
        }),
    ).length
  })
}

export function compute_gallery_row_stats(facts: PrFactRecord[], now: Date): GalleryRowStats {
  const non_bot_facts = facts.filter((fact) => !fact.is_bot)
  if (non_bot_facts.length === 0) {
    return {
      merged_count_30d: null,
      open_count: null,
      weekly_merged_counts: null,
      avg_cycle_hours: null,
      avg_time_to_first_review_hours: null,
    }
  }

  const window_start = subDays(now, 30)
  const merged_in_30d = non_bot_facts.filter(
    (fact) =>
      fact.state === 'MERGED' &&
      fact.merged_at != null &&
      isWithinInterval(parseISO(fact.merged_at), { start: window_start, end: now }),
  )

  const weekly_counts = weekly_merged_counts(non_bot_facts, now)
  const has_sparkline_data = weekly_counts.some((count) => count > 0)
  const merged_count_30d =
    merged_in_30d.length === 0 && !has_sparkline_data ? null : merged_in_30d.length

  const cycle_hours = merged_in_30d
    .map((fact) => fact.cycle.time_from_creation_to_merged)
    .filter((value): value is number => value != null)
  const time_to_first_review_hours = merged_in_30d
    .map((fact) => fact.cycle.time_from_asked_for_review_to_first_review)
    .filter((value): value is number => value != null)

  return {
    merged_count_30d,
    open_count: non_bot_facts.filter((fact) => fact.state === 'OPEN').length,
    weekly_merged_counts: has_sparkline_data ? weekly_counts : null,
    avg_cycle_hours: avg(cycle_hours),
    avg_time_to_first_review_hours: avg(time_to_first_review_hours),
  }
}
