import { addWeeks, isWithinInterval, parseISO, startOfWeek, subDays, subWeeks } from 'date-fns'
import type { PrFactRecord } from './types'

export const GALLERY_WINDOW_DAYS = 30
export const GALLERY_SPARKLINE_WEEKS = 8

export type GalleryRowStats = {
  merged_count: number | null
  open_count: number | null
  weekly_merged: number[] | null
  avg_cycle_hours: number | null
  avg_first_review_hours: number | null
}

export const EMPTY_GALLERY_ROW_STATS: GalleryRowStats = {
  merged_count: null,
  open_count: null,
  weekly_merged: null,
  avg_cycle_hours: null,
  avg_first_review_hours: null,
}

function avg(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function monday_week_starts(now: Date): Date[] {
  const current_week_start = startOfWeek(now, { weekStartsOn: 1 })
  const weeks: Date[] = []
  for (let offset = GALLERY_SPARKLINE_WEEKS - 1; offset >= 0; offset -= 1) {
    weeks.push(subWeeks(current_week_start, offset))
  }
  return weeks
}

function is_merged_in_window(fact: PrFactRecord, window_start: Date, now: Date): boolean {
  if (fact.state !== 'MERGED' || !fact.merged_at) return false
  const merged_at = parseISO(fact.merged_at)
  return isWithinInterval(merged_at, { start: window_start, end: now })
}

export function compute_gallery_row_stats(facts: PrFactRecord[], now: Date): GalleryRowStats {
  const human_facts = facts.filter((fact) => !fact.is_bot)
  if (human_facts.length === 0) return EMPTY_GALLERY_ROW_STATS

  const window_start = subDays(now, GALLERY_WINDOW_DAYS)
  const merged_in_window = human_facts.filter((fact) =>
    is_merged_in_window(fact, window_start, now),
  )

  const weekly_merged = monday_week_starts(now).map((week_start) => {
    const week_end = addWeeks(week_start, 1)
    return human_facts.filter((fact) => {
      if (fact.state !== 'MERGED' || !fact.merged_at) return false
      const merged_at = parseISO(fact.merged_at)
      return merged_at >= week_start && merged_at < week_end
    }).length
  })

  const has_sparkline = weekly_merged.some((count) => count > 0)
  const cycle_hours = merged_in_window
    .map((fact) => fact.cycle.time_from_creation_to_merged)
    .filter((hours): hours is number => hours != null)
  const first_review_hours = merged_in_window
    .map((fact) => fact.cycle.time_from_asked_for_review_to_first_review)
    .filter((hours): hours is number => hours != null)

  return {
    merged_count: merged_in_window.length,
    open_count: human_facts.filter((fact) => fact.state === 'OPEN').length,
    weekly_merged: has_sparkline ? weekly_merged : null,
    avg_cycle_hours: avg(cycle_hours),
    avg_first_review_hours: avg(first_review_hours),
  }
}
