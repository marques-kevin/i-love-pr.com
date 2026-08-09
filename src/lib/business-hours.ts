/** 0 = Sunday … 6 = Saturday (JS Date.getDay / ISO weekday via Intl) */
export interface BusinessHoursConfig {
  enabled: boolean
  timeZone: string
  workdays: number[]
  /** Minutes from midnight, inclusive start of the work window */
  startMinutes: number
  /** Minutes from midnight, exclusive end of the work window */
  endMinutes: number
}

export const DEFAULT_BUSINESS_HOURS: BusinessHoursConfig = {
  enabled: false,
  timeZone:
    typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' : 'UTC',
  workdays: [1, 2, 3, 4, 5],
  startMinutes: 9 * 60,
  endMinutes: 18 * 60,
}

export const WEEKDAY_LABELS = [
  { day: 1, label: 'Mon' },
  { day: 2, label: 'Tue' },
  { day: 3, label: 'Wed' },
  { day: 4, label: 'Thu' },
  { day: 5, label: 'Fri' },
  { day: 6, label: 'Sat' },
  { day: 0, label: 'Sun' },
] as const

export function minutesToTimeInput(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function timeInputToMinutes(value: string): number {
  const [h, m] = value.split(':').map(Number)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 9 * 60
  return Math.min(24 * 60, Math.max(0, h * 60 + m))
}

interface ZonedParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
  weekday: number
}

const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

const formatter_cache = new Map<string, Intl.DateTimeFormat>()

function get_formatter(time_zone: string): Intl.DateTimeFormat {
  let fmt = formatter_cache.get(time_zone)
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: time_zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
      weekday: 'short',
    })
    formatter_cache.set(time_zone, fmt)
  }
  return fmt
}

function get_zoned_parts(date: Date, time_zone: string): ZonedParts {
  const parts = get_formatter(time_zone).formatToParts(date)
  let year = 0
  let month = 0
  let day = 0
  let hour = 0
  let minute = 0
  let second = 0
  let weekday = 0
  for (const part of parts) {
    switch (part.type) {
      case 'year':
        year = Number(part.value)
        break
      case 'month':
        month = Number(part.value)
        break
      case 'day':
        day = Number(part.value)
        break
      case 'hour':
        hour = Number(part.value)
        break
      case 'minute':
        minute = Number(part.value)
        break
      case 'second':
        second = Number(part.value)
        break
      case 'weekday':
        weekday = WEEKDAY_MAP[part.value] ?? 0
        break
    }
  }
  return { year, month, day, hour, minute, second, weekday }
}

/** Approximate UTC instant for a wall-clock time in `timeZone`. */
function zoned_time_to_utc(
  year: number,
  month: number,
  day: number,
  minutes_of_day: number,
  time_zone: string,
): number {
  const hour = Math.floor(minutes_of_day / 60)
  const minute = minutes_of_day % 60
  const desired = Date.UTC(year, month - 1, day, hour, minute, 0)
  let utc = desired
  for (let i = 0; i < 3; i++) {
    const parts = get_zoned_parts(new Date(utc), time_zone)
    const as_utc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    )
    utc += desired - as_utc
  }
  return utc
}

function add_calendar_days(
  year: number,
  month: number,
  day: number,
  delta: number,
): { year: number; month: number; day: number } {
  const d = new Date(Date.UTC(year, month - 1, day + delta))
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  }
}

type DayWindow = {
  window_start_ms: number
  window_end_ms: number
  weekday: number
}

export type ElapsedHoursFn = (start_iso: string, end_iso: string) => number

/**
 * Build a reuseable elapsed-hours function for one metrics pass.
 * Caches per-day work windows so thousands of PRs sharing the same calendar
 * days don't re-run Intl conversions.
 */
export function create_elapsed_hours_fn(
  config: BusinessHoursConfig | null | undefined,
): ElapsedHoursFn {
  if (!config?.enabled) {
    return (start_iso, end_iso) => {
      const start = new Date(start_iso).getTime()
      const end = new Date(end_iso).getTime()
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0
      return (end - start) / (1000 * 60 * 60)
    }
  }

  const { timeZone, workdays, startMinutes, endMinutes } = config
  if (endMinutes <= startMinutes || workdays.length === 0) {
    return create_elapsed_hours_fn({ ...config, enabled: false })
  }

  const workday_set = new Set(workdays)
  const day_cache = new Map<string, DayWindow>()

  function day_window(year: number, month: number, day: number, weekday: number): DayWindow {
    const key = `${year}-${month}-${day}`
    const cached = day_cache.get(key)
    if (cached) return cached

    const window: DayWindow = {
      weekday,
      window_start_ms: zoned_time_to_utc(year, month, day, startMinutes, timeZone),
      window_end_ms: zoned_time_to_utc(year, month, day, endMinutes, timeZone),
    }
    day_cache.set(key, window)
    return window
  }

  return (start_iso, end_iso) => {
    const start_ms = new Date(start_iso).getTime()
    const end_ms = new Date(end_iso).getTime()
    if (!Number.isFinite(start_ms) || !Number.isFinite(end_ms) || end_ms <= start_ms) return 0

    const start_parts = get_zoned_parts(new Date(start_ms), timeZone)
    const end_parts = get_zoned_parts(new Date(end_ms), timeZone)

    let cursor = {
      year: start_parts.year,
      month: start_parts.month,
      day: start_parts.day,
    }
    let weekday = start_parts.weekday
    let total_ms = 0

    // Safety: max ~2 years of day iteration
    for (let i = 0; i < 800; i++) {
      const window = day_window(cursor.year, cursor.month, cursor.day, weekday)
      if (workday_set.has(window.weekday)) {
        const overlap_start = Math.max(start_ms, window.window_start_ms)
        const overlap_end = Math.min(end_ms, window.window_end_ms)
        if (overlap_end > overlap_start) {
          total_ms += overlap_end - overlap_start
        }
      }

      if (
        cursor.year === end_parts.year &&
        cursor.month === end_parts.month &&
        cursor.day === end_parts.day
      ) {
        break
      }
      cursor = add_calendar_days(cursor.year, cursor.month, cursor.day, 1)
      weekday = (weekday + 1) % 7
    }

    return total_ms / (1000 * 60 * 60)
  }
}

/**
 * Elapsed hours between two instants.
 * When business hours are disabled → calendar hours.
 * When enabled → only counts overlapping work windows in the configured timezone.
 */
export function elapsedHours(
  startIso: string,
  endIso: string,
  config: BusinessHoursConfig | null | undefined,
): number {
  return create_elapsed_hours_fn(config)(startIso, endIso)
}

export function normalizeBusinessHours(
  value: Partial<BusinessHoursConfig> | null | undefined,
): BusinessHoursConfig {
  return {
    enabled: value?.enabled ?? DEFAULT_BUSINESS_HOURS.enabled,
    timeZone: value?.timeZone || DEFAULT_BUSINESS_HOURS.timeZone,
    workdays:
      value?.workdays && value.workdays.length > 0
        ? [...value.workdays]
        : [...DEFAULT_BUSINESS_HOURS.workdays],
    startMinutes: value?.startMinutes ?? DEFAULT_BUSINESS_HOURS.startMinutes,
    endMinutes: value?.endMinutes ?? DEFAULT_BUSINESS_HOURS.endMinutes,
  }
}
