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
    typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      : 'UTC',
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

function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
    weekday: 'short',
  })
  const parts = Object.fromEntries(
    fmt.formatToParts(date).map((p) => [p.type, p.value]),
  ) as Record<string, string>

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
    weekday: weekdayMap[parts.weekday] ?? 0,
  }
}

/** Approximate UTC instant for a wall-clock time in `timeZone`. */
function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  minutesOfDay: number,
  timeZone: string,
): Date {
  const hour = Math.floor(minutesOfDay / 60)
  const minute = minutesOfDay % 60
  // Guess UTC, then correct by the zone offset observed for that instant
  let utc = Date.UTC(year, month - 1, day, hour, minute, 0)
  for (let i = 0; i < 3; i++) {
    const parts = getZonedParts(new Date(utc), timeZone)
    const asUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    )
    const desired = Date.UTC(year, month - 1, day, hour, minute, 0)
    utc += desired - asUtc
  }
  return new Date(utc)
}

function addCalendarDays(
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
  const start = new Date(startIso)
  const end = new Date(endIso)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0
  if (end <= start) return 0

  if (!config?.enabled) {
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60)
  }

  const { timeZone, workdays, startMinutes, endMinutes } = config
  if (endMinutes <= startMinutes || workdays.length === 0) {
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60)
  }

  const workdaySet = new Set(workdays)
  let totalMs = 0

  const startParts = getZonedParts(start, timeZone)
  const endParts = getZonedParts(end, timeZone)

  let cursor = {
    year: startParts.year,
    month: startParts.month,
    day: startParts.day,
  }

  // Safety: max ~2 years of day iteration
  for (let i = 0; i < 800; i++) {
    const weekdayDate = zonedTimeToUtc(cursor.year, cursor.month, cursor.day, 12 * 60, timeZone)
    const weekday = getZonedParts(weekdayDate, timeZone).weekday

    if (workdaySet.has(weekday)) {
      const windowStart = zonedTimeToUtc(
        cursor.year,
        cursor.month,
        cursor.day,
        startMinutes,
        timeZone,
      )
      const windowEnd = zonedTimeToUtc(
        cursor.year,
        cursor.month,
        cursor.day,
        endMinutes,
        timeZone,
      )
      const overlapStart = Math.max(start.getTime(), windowStart.getTime())
      const overlapEnd = Math.min(end.getTime(), windowEnd.getTime())
      if (overlapEnd > overlapStart) {
        totalMs += overlapEnd - overlapStart
      }
    }

    if (
      cursor.year === endParts.year &&
      cursor.month === endParts.month &&
      cursor.day === endParts.day
    ) {
      break
    }
    cursor = addCalendarDays(cursor.year, cursor.month, cursor.day, 1)
  }

  return totalMs / (1000 * 60 * 60)
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
