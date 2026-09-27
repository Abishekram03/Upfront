/**
 * UpFront CMP - Timezone-Aware Schedule Calculator
 *
 * Implements deterministic calculation for recurring cookie scans:
 * - Daily: Runs every day at specified HH:mm in target IANA timezone
 * - Weekly: Runs weekly on specified day-of-week (1=Mon..7=Sun) at HH:mm
 * - Monthly: Runs monthly on specified day-of-month (1..31) at HH:mm, safely clamping
 *   to the month's last valid day (e.g., Feb 28/29, Apr 30) rather than skipping.
 *
 * Fully preserves wall-clock time across DST (Daylight Saving Time) shifts.
 */

export type ScheduleFrequency = "daily" | "weekly" | "monthly"

export interface ScheduleOptions {
  frequency: ScheduleFrequency
  timeOfDay?: string // HH:mm format, 24h
  time_of_day?: string
  timezone: string // IANA timezone identifier, e.g. "Asia/Kolkata", "America/New_York"
  dayOfWeek?: number // 1 (Mon) to 7 (Sun)
  day_of_week?: number
  dayOfMonth?: number // 1 to 31
  day_of_month?: number
  fromDate?: Date // Reference start date (defaults to new Date())
}

export interface NextRunCalculation {
  nextRunAt: Date
  occurrenceKey: string
  formattedLocal: string
}

/**
 * Validates whether a given string is a valid IANA timezone.
 */
export function isValidTimezone(tz: string): boolean {
  if (!tz || typeof tz !== "string") return false
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz })
    return true
  } catch {
    return false
  }
}

export const isValidIanaTimezone = isValidTimezone

/**
 * Validates full schedule configuration.
 */
export function validateScheduleConfig(config: {
  frequency: string
  time_of_day?: string
  timeOfDay?: string
  timezone: string
  day_of_week?: number | null
  dayOfWeek?: number | null
  day_of_month?: number | null
  dayOfMonth?: number | null
}): { valid: boolean; error?: string } {
  const freq = config.frequency
  if (freq !== "daily" && freq !== "weekly" && freq !== "monthly") {
    return { valid: false, error: `Invalid frequency '${freq}'. Must be 'daily', 'weekly', or 'monthly'.` }
  }

  const tz = config.timezone
  if (!isValidTimezone(tz)) {
    return { valid: false, error: `Invalid IANA timezone: '${tz}'` }
  }

  const time = config.time_of_day || config.timeOfDay || "09:00"
  if (!isValidTimeOfDay(time)) {
    return { valid: false, error: `Invalid time format '${time}'. Expected 'HH:mm' (24-hour).` }
  }

  const dow = config.day_of_week ?? config.dayOfWeek
  if (freq === "weekly") {
    if (dow === undefined || dow === null || dow < 1 || dow > 7) {
      return { valid: false, error: "Weekly frequency requires day_of_week (1 to 7)." }
    }
  }

  const dom = config.day_of_month ?? config.dayOfMonth
  if (freq === "monthly") {
    if (dom === undefined || dom === null || dom < 1 || dom > 31) {
      return { valid: false, error: "Monthly frequency requires day_of_month (1 to 31)." }
    }
  }

  return { valid: true }
}

/**
 * Validates HH:mm time format (24-hour clock).
 */
export function isValidTimeOfDay(timeStr: string): boolean {
  if (!timeStr || typeof timeStr !== "string") return false
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(timeStr.trim())
}

/**
 * Gets days in a given year and month (1-indexed month: 1=Jan..12=Dec).
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

interface LocalTimeParts {
  year: number
  month: number // 1-indexed (1=Jan..12=Dec)
  day: number // 1..31
  hour: number // 0..23
  minute: number // 0..59
  second: number
  dayOfWeek: number // 1 (Mon) .. 7 (Sun)
}

/**
 * Extracts local date/time parts for a given Date in a specific IANA timezone.
 */
export function getLocalParts(date: Date, timezone: string): LocalTimeParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  })

  const parts = formatter.formatToParts(date)
  const map: Record<string, number> = {}

  for (const p of parts) {
    if (p.type !== "literal") {
      map[p.type] = parseInt(p.value, 10)
    }
  }

  // Handle 24:00 edge case from some engines
  const hour = map.hour === 24 ? 0 : (map.hour ?? 0)
  const year = map.year ?? 1970
  const month = map.month ?? 1
  const day = map.day ?? 1
  const minute = map.minute ?? 0
  const second = map.second ?? 0

  // Calculate day of week (1=Mon..7=Sun)
  // Formatter for weekday
  const dayFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
  })
  const weekdayStr = dayFormatter.format(date).toLowerCase()
  const weekdayMap: Record<string, number> = {
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
    sun: 7,
  }
  const dayOfWeek = weekdayMap[weekdayStr] || 1

  return { year, month, day, hour, minute, second, dayOfWeek }
}

/**
 * Converts local wall-clock components in a given timezone into an exact UTC Date.
 */
export function localToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timezone: string
): Date {
  // 1. Initial UTC guess
  let utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0))

  // 2. Converge using local offset difference
  for (let i = 0; i < 3; i++) {
    const local = getLocalParts(utcGuess, timezone)
    const localTimeMs =
      Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, local.second)
    const targetTimeMs = Date.UTC(year, month - 1, day, hour, minute, 0)
    const diff = targetTimeMs - localTimeMs
    if (diff === 0) break
    utcGuess = new Date(utcGuess.getTime() + diff)
  }

  return utcGuess
}

export const utcToLocalParts = getLocalParts

/**
 * Calculates the next occurrence strictly after `fromDate`.
 */
export function calculateNextRun(
  options: ScheduleOptions,
  explicitFromDate?: Date
): Date & NextRunCalculation {
  const frequency = options.frequency
  const timeOfDay = options.time_of_day || options.timeOfDay || "09:00"
  const timezone = options.timezone
  const fromDate = explicitFromDate || options.fromDate || new Date()

  if (!isValidTimezone(timezone)) {
    throw new Error(`Invalid IANA timezone: '${timezone}'`)
  }

  if (!isValidTimeOfDay(timeOfDay)) {
    throw new Error(`Invalid time format '${timeOfDay}'. Expected 'HH:mm' (24-hour).`)
  }

  const [targetHour, targetMinute] = timeOfDay.split(":").map((v) => parseInt(v, 10)) as [number, number]
  const currentLocal = getLocalParts(fromDate, timezone)

  let nextYear = currentLocal.year
  let nextMonth = currentLocal.month
  let nextDay = currentLocal.day

  if (frequency === "daily") {
    // Check if today at target time is still in the future
    const todayCandidate = localToUtc(nextYear, nextMonth, nextDay, targetHour, targetMinute, timezone)
    if (todayCandidate.getTime() > fromDate.getTime()) {
      // Today is valid
    } else {
      // Advance by 1 day
      const tomorrowGuess = new Date(todayCandidate.getTime() + 24 * 3600 * 1000)
      const tomorrowLocal = getLocalParts(tomorrowGuess, timezone)
      nextYear = tomorrowLocal.year
      nextMonth = tomorrowLocal.month
      nextDay = tomorrowLocal.day
    }
  } else if (frequency === "weekly") {
    const targetDayOfWeek = options.day_of_week ?? options.dayOfWeek ?? 1
    if (targetDayOfWeek < 1 || targetDayOfWeek > 7) {
      throw new Error(`Invalid dayOfWeek '${targetDayOfWeek}'. Expected 1 (Monday) to 7 (Sunday).`)
    }

    let daysToAdd = (targetDayOfWeek - currentLocal.dayOfWeek + 7) % 7
    if (daysToAdd === 0) {
      const todayCandidate = localToUtc(nextYear, nextMonth, nextDay, targetHour, targetMinute, timezone)
      if (todayCandidate.getTime() <= fromDate.getTime()) {
        daysToAdd = 7
      }
    }

    if (daysToAdd > 0) {
      const futureDate = new Date(fromDate.getTime() + daysToAdd * 24 * 3600 * 1000)
      const futureLocal = getLocalParts(futureDate, timezone)
      nextYear = futureLocal.year
      nextMonth = futureLocal.month
      nextDay = futureLocal.day
    }
  } else if (frequency === "monthly") {
    const rawTargetDay = options.day_of_month ?? options.dayOfMonth ?? 1
    if (rawTargetDay < 1 || rawTargetDay > 31) {
      throw new Error(`Invalid dayOfMonth '${rawTargetDay}'. Expected 1 to 31.`)
    }

    // Check current month (with day clamping)
    const maxDaysInCurrentMonth = getDaysInMonth(nextYear, nextMonth)
    const clampedDayCurrentMonth = Math.min(rawTargetDay, maxDaysInCurrentMonth)
    const currentMonthCandidate = localToUtc(
      nextYear,
      nextMonth,
      clampedDayCurrentMonth,
      targetHour,
      targetMinute,
      timezone
    )

    if (currentMonthCandidate.getTime() > fromDate.getTime()) {
      nextDay = clampedDayCurrentMonth
    } else {
      // Advance to next month
      if (nextMonth === 12) {
        nextYear += 1
        nextMonth = 1
      } else {
        nextMonth += 1
      }
      const maxDaysInNextMonth = getDaysInMonth(nextYear, nextMonth)
      nextDay = Math.min(rawTargetDay, maxDaysInNextMonth)
    }
  } else {
    throw new Error(`Unsupported schedule frequency: '${frequency}'. Must be 'daily', 'weekly', or 'monthly'.`)
  }

  const nextRunAt = localToUtc(nextYear, nextMonth, nextDay, targetHour, targetMinute, timezone)

  // Derive human-readable local string and deterministic occurrence key
  const yyyy = String(nextYear).padStart(4, "0")
  const mm = String(nextMonth).padStart(2, "0")
  const dd = String(nextDay).padStart(2, "0")
  const hh = String(targetHour).padStart(2, "0")
  const min = String(targetMinute).padStart(2, "0")

  const occurrenceKey = `${yyyy}-${mm}-${dd}T${hh}:${min}:00_${timezone}`
  const formattedLocal = `${yyyy}-${mm}-${dd} ${hh}:${min} (${timezone})`

  return Object.assign(nextRunAt, {
    nextRunAt,
    occurrenceKey,
    formattedLocal,
  })
}
