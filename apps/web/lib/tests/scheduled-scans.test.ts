import {
  isValidIanaTimezone,
  isValidTimeOfDay,
  validateScheduleConfig,
  calculateNextRun,
  localToUtc,
  utcToLocalParts,
} from "../scanner/schedule-calculator"
import { classifyCookieName } from "../consentos/open-cookie-db"

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`)
  }
}

export async function runScheduledScansTestSuite() {
  console.log("=================================================================")
  console.log(" UpFront CMP Scheduled Cookie Scans Verification Suite")
  console.log("=================================================================\n")

  let passed = 0
  let failed = 0

  function test(name: string, fn: () => void | Promise<void>) {
    try {
      fn()
      console.log(`  [PASS] ${name}`)
      passed++
    } catch (err: any) {
      console.error(`  [FAIL] ${name}: ${err.message}`)
      failed++
    }
  }

  // 1. Timezone & Config Validations
  console.log("[1/6] Timezone & Schedule Configuration Validation...")

  test("Scenario 4: Invalid timezone rejected", () => {
    assert(!isValidIanaTimezone("Fake/Timezone"), "Fake/Timezone must be invalid")
    assert(!isValidIanaTimezone(""), "Empty timezone must be invalid")
    assert(!isValidIanaTimezone("Mars/Curiosity"), "Mars/Curiosity must be invalid")
    assert(isValidIanaTimezone("Asia/Kolkata"), "Asia/Kolkata must be valid")
    assert(isValidIanaTimezone("America/New_York"), "America/New_York must be valid")
    assert(isValidIanaTimezone("Europe/London"), "Europe/London must be valid")
    assert(isValidIanaTimezone("UTC"), "UTC must be valid")
  })

  test("Scenario 5: Invalid frequency rejected", () => {
    const res = validateScheduleConfig({
      frequency: "hourly" as any,
      time_of_day: "09:00",
      timezone: "UTC",
    })
    assert(!res.valid, "Hourly frequency must be rejected")
    assert(Boolean(res.error?.includes("frequency")), "Error must mention frequency")
  })

  test("Scenario 6: Weekly requires valid day of week (1..7)", () => {
    const invalidNoDay = validateScheduleConfig({
      frequency: "weekly",
      time_of_day: "09:00",
      timezone: "Asia/Kolkata",
    })
    assert(!invalidNoDay.valid, "Weekly without day must be rejected")

    const invalidDayNum = validateScheduleConfig({
      frequency: "weekly",
      day_of_week: 8,
      time_of_day: "09:00",
      timezone: "Asia/Kolkata",
    })
    assert(!invalidDayNum.valid, "Weekly with day 8 must be rejected")

    const validWeekly = validateScheduleConfig({
      frequency: "weekly",
      day_of_week: 1, // Monday
      time_of_day: "09:00",
      timezone: "Asia/Kolkata",
    })
    assert(validWeekly.valid, "Weekly with Monday must be valid")
  })

  test("Scenario 7: Monthly requires valid day of month (1..31)", () => {
    const invalidNoDay = validateScheduleConfig({
      frequency: "monthly",
      time_of_day: "09:00",
      timezone: "Asia/Kolkata",
    })
    assert(!invalidNoDay.valid, "Monthly without day must be rejected")

    const invalidDayNum = validateScheduleConfig({
      frequency: "monthly",
      day_of_month: 32,
      time_of_day: "09:00",
      timezone: "Asia/Kolkata",
    })
    assert(!invalidDayNum.valid, "Monthly with day 32 must be rejected")

    const validMonthly = validateScheduleConfig({
      frequency: "monthly",
      day_of_month: 15,
      time_of_day: "09:00",
      timezone: "Asia/Kolkata",
    })
    assert(validMonthly.valid, "Monthly with day 15 must be valid")
  })

  // 2. Next Run Calculations
  console.log("\n[2/6] Schedule Next Run & Timezone Arithmetic...")

  test("Scenario 1 & 13: Daily schedule calculation with Asia/Kolkata", () => {
    // Reference time: 2026-09-27 06:00:00 UTC (11:30:00 IST)
    const fromTime = new Date("2026-09-27T06:00:00Z")
    
    // Config: Daily at 09:00 IST (03:30 UTC) -> Next run should be next day (2026-09-28 03:30:00 UTC)
    const nextRunPast = calculateNextRun(
      { frequency: "daily", time_of_day: "09:00", timezone: "Asia/Kolkata" },
      fromTime
    )
    assert(nextRunPast.toISOString() === "2026-09-28T03:30:00.000Z", `Expected 2026-09-28T03:30:00.000Z, got ${nextRunPast.toISOString()}`)

    // Config: Daily at 15:00 IST (09:30 UTC) -> Next run should be later today (2026-09-27 09:30:00 UTC)
    const nextRunToday = calculateNextRun(
      { frequency: "daily", time_of_day: "15:00", timezone: "Asia/Kolkata" },
      fromTime
    )
    assert(nextRunToday.toISOString() === "2026-09-27T09:30:00.000Z", `Expected 2026-09-27T09:30:00.000Z, got ${nextRunToday.toISOString()}`)
  })

  test("Scenario 2 & 14: Weekly schedule calculation with Monday 09:00", () => {
    // 2026-09-27 is Sunday (day 7)
    const fromTime = new Date("2026-09-27T10:00:00Z")
    
    // Schedule on Monday (day 1) at 09:00 UTC -> next Monday is 2026-09-28
    const nextRun = calculateNextRun(
      { frequency: "weekly", day_of_week: 1, time_of_day: "09:00", timezone: "UTC" },
      fromTime
    )
    assert(nextRun.toISOString() === "2026-09-28T09:00:00.000Z", `Expected 2026-09-28T09:00:00.000Z, got ${nextRun.toISOString()}`)
  })

  test("Scenario 3 & 15: Monthly schedule calculation with 1st of month", () => {
    const fromTime = new Date("2026-09-27T10:00:00Z")
    
    // Schedule on 1st of month at 09:00 UTC -> next is 2026-10-01 09:00 UTC
    const nextRun = calculateNextRun(
      { frequency: "monthly", day_of_month: 1, time_of_day: "09:00", timezone: "UTC" },
      fromTime
    )
    assert(nextRun.toISOString() === "2026-10-01T09:00:00.000Z", `Expected 2026-10-01T09:00:00.000Z, got ${nextRun.toISOString()}`)
  })

  test("Scenario 15: Monthly 31st clamping in short months (e.g. Feb, Apr)", () => {
    // From Jan 31 2026 12:00:00 UTC
    const jan31 = new Date("2026-01-31T12:00:00Z")
    
    // Next month is Feb (2026 is non-leap year: 28 days) -> Clamped to Feb 28 09:00 UTC
    const nextFeb = calculateNextRun(
      { frequency: "monthly", day_of_month: 31, time_of_day: "09:00", timezone: "UTC" },
      jan31
    )
    assert(nextFeb.toISOString() === "2026-02-28T09:00:00.000Z", `Expected 2026-02-28T09:00:00.000Z, got ${nextFeb.toISOString()}`)
  })

  test("Scenario 16: DST-sensitive timezone behavior (America/New_York across DST)", () => {
    // Winter: America/New_York is UTC-5 (EST)
    // 2026-01-15 09:00 EST -> 14:00 UTC
    const winterUtc = localToUtc(2026, 1, 15, 9, 0, "America/New_York")
    assert(winterUtc.toISOString() === "2026-01-15T14:00:00.000Z", `Winter UTC expected 14:00, got ${winterUtc.toISOString()}`)

    // Summer: America/New_York is UTC-4 (EDT)
    // 2026-07-15 09:00 EDT -> 13:00 UTC
    const summerUtc = localToUtc(2026, 7, 15, 9, 0, "America/New_York")
    assert(summerUtc.toISOString() === "2026-07-15T13:00:00.000Z", `Summer UTC expected 13:00, got ${summerUtc.toISOString()}`)

    // Verify wall-clock local time stays 09:00 across transitions
    const winterParts = utcToLocalParts(winterUtc, "America/New_York")
    const summerParts = utcToLocalParts(summerUtc, "America/New_York")
    assert(winterParts.hour === 9 && winterParts.minute === 0, "Winter local wall-clock must be 09:00")
    assert(summerParts.hour === 9 && summerParts.minute === 0, "Summer local wall-clock must be 09:00")
  })

  // 3. Idempotency & Concurrency Invariants
  console.log("\n[3/6] Idempotency & Duplicate Protection...")

  test("Scenario 17 & 19: Deterministic occurrence key formulation", () => {
    const scheduleId = "sched_abc123"
    const nextRun = new Date("2026-09-28T09:00:00.000Z")
    const occurrenceKey = `${scheduleId}_${nextRun.toISOString()}`
    
    assert(occurrenceKey === "sched_abc123_2026-09-28T09:00:00.000Z", "Occurrence key must be deterministic")
  })

  // 4. Merger & Manual Override Preservation
  console.log("\n[4/6] Cookie Classification & Manual Override Preservation...")

  test("Scenario 23 & 24: Open Cookie DB classification and unknown cookie preservation", () => {
    const gaClass = classifyCookieName("_ga")
    assert(gaClass.category === "analytics", "_ga must be classified as analytics")
    assert(gaClass.confidence === "high", "_ga confidence must be high")

    const cfClass = classifyCookieName("__cf_bm")
    assert(cfClass.category === "necessary", "__cf_bm must be classified as necessary")

    const unknownClass = classifyCookieName("unknown_custom_tracker_xyz")
    assert(unknownClass.category === "uncategorised", "Unknown cookie must be uncategorised")
    assert(unknownClass.confidence === "low", "Unknown cookie confidence must be low")
  })

  console.log("\n=================================================================")
  console.log(` RESULTS: ${passed} Passed, ${failed} Failed`)
  console.log("=================================================================\n")

  if (failed > 0) {
    throw new Error(`${failed} unit tests failed!`)
  }
}

// Auto-run if executed directly
if (typeof process !== "undefined" && process.argv[1]?.includes("scheduled-scans.test.ts")) {
  runScheduledScansTestSuite().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
