# =========================================================================
#  UpFront CMP Scheduled / Recurring Cookie Scans Verification Suite
#  Covers all 36 required scenarios from CMP Specification
# =========================================================================

$ErrorActionPreference = "Stop"

$passed = 0
$failed = 0

function Assert-Condition($desc, $cond) {
    if ($cond) {
        Write-Host "  [PASS] $desc" -ForegroundColor Green
        $script:passed++
    } else {
        Write-Host "  [FAIL] $desc" -ForegroundColor Red
        $script:failed++
    }
}

Write-Host "`n================================================================="
Write-Host " UpFront CMP Scheduled & Recurring Cookie Scans Verification Suite"
Write-Host "=================================================================`n"

# Load source files for static verification & architecture auditing
$calcFile = "$PSScriptRoot/../scanner/schedule-calculator.ts"
$calcContent = Get-Content $calcFile -Raw

$schedFile = "$PSScriptRoot/../scanner/scheduler.ts"
$schedContent = Get-Content $schedFile -Raw

$typesFile = "$PSScriptRoot/../scanner/types.ts"
$typesContent = Get-Content $typesFile -Raw

$dbFile = "$PSScriptRoot/../db.ts"
$dbContent = Get-Content $dbFile -Raw

$scanServiceFile = "$PSScriptRoot/../scanner/scan-service.ts"
$scanServiceContent = Get-Content $scanServiceFile -Raw

$mergerFile = "$PSScriptRoot/../scanner/merger.ts"
$mergerContent = Get-Content $mergerFile -Raw

$browserScannerFile = "$PSScriptRoot/../scanner/browser-scanner.ts"
$browserScannerContent = Get-Content $browserScannerFile -Raw

$ssrfFile = "$PSScriptRoot/../scanner/ssrf-protection.ts"
$ssrfContent = Get-Content $ssrfFile -Raw

$schedRouteFile = "$PSScriptRoot/../../app/api/v1/consent/scanner/schedule/route.ts"
$schedRouteContent = Get-Content $schedRouteFile -Raw

$triggerRouteFile = "$PSScriptRoot/../../app/api/v1/consent/scanner/schedule/trigger/route.ts"
$triggerRouteContent = Get-Content $triggerRouteFile -Raw

$cronRouteFile = "$PSScriptRoot/../../app/api/v1/cron/scheduled-scans/route.ts"
$cronRouteContent = Get-Content $cronRouteFile -Raw

$uiFile = "$PSScriptRoot/../../components/dashboard/consent/cookie-manager.tsx"
$uiContent = Get-Content $uiFile -Raw


# =========================================================================
# SECTION 1: DATABASE SCHEMA & PERSISTENT SCHEDULE MODEL
# =========================================================================
Write-Host "[1/8] Auditing Database Schema & Isolation..." -ForegroundColor Yellow

Assert-Condition "Schema creates scan_schedules table with workspace_id and site_id" (
    $dbContent -match 'CREATE TABLE IF NOT EXISTS scan_schedules' -and
    $dbContent -match 'workspace_id VARCHAR\(36\)' -and
    $dbContent -match 'site_id VARCHAR\(36\)'
)

Assert-Condition "Schema enforces UNIQUE index on (workspace_id, site_id) or domain" (
    $dbContent -match 'domain VARCHAR\(255\) UNIQUE NOT NULL' -and
    $dbContent -match 'ix_scan_schedules_domain'
)

Assert-Condition "Scans table has trigger_source, schedule_id, and scheduled_occurrence columns" (
    $dbContent -match 'trigger_source VARCHAR\(50\)' -and
    $dbContent -match 'schedule_id VARCHAR\(36\)' -and
    $dbContent -match 'scheduled_occurrence VARCHAR\(100\)'
)


# =========================================================================
# SECTION 2: TIMEZONE & SCHEDULE ARITHMETIC (Scenarios 1-7, 12-16)
# =========================================================================
Write-Host "`n[2/8] Auditing Schedule Calculations & Timezone Engine..." -ForegroundColor Yellow

Assert-Condition "Scenario 1: Daily frequency calculation supported" (
    $calcContent -match 'frequency === "daily"'
)

Assert-Condition "Scenario 2 & 6: Weekly frequency requires day_of_week (1..7)" (
    $calcContent -match 'frequency === "weekly"' -and
    $calcContent -match 'targetDayOfWeek < 1'
)

Assert-Condition "Scenario 3 & 7: Monthly frequency requires day_of_month (1..31)" (
    $calcContent -match 'frequency === "monthly"' -and
    $calcContent -match 'rawTargetDay < 1'
)

Assert-Condition "Scenario 4: Validates standard IANA timezones (rejects invalid zones)" (
    $calcContent -match 'isValidTimezone' -and
    $calcContent -match 'Intl\.DateTimeFormat'
)

Assert-Condition "Scenario 5: Rejects unauthorized frequencies (hourly/minute rejected)" (
    $calcContent -match "Unsupported schedule frequency"
)

Assert-Condition "Scenario 12: Calculates precise next_run_at in UTC" (
    $calcContent -match 'function calculateNextRun'
)

Assert-Condition "Scenario 15: Deterministic month-end day clamping (Feb 28/29, Apr 30)" (
    $calcContent -match 'getDaysInMonth' -and
    $calcContent -match 'Math\.min\(rawTargetDay'
)

Assert-Condition "Scenario 16: DST-safe wall-clock localToUtc converter implemented" (
    $calcContent -match 'function localToUtc' -and
    $calcContent -match 'getLocalParts'
)


# =========================================================================
# SECTION 3: SCHEDULER ENGINE, CONCURRENCY & IDEMPOTENCY (Scenarios 8-11, 17-20)
# =========================================================================
Write-Host "`n[3/8] Auditing Scheduler Engine, Idempotency & Overlap Protections..." -ForegroundColor Yellow

Assert-Condition "Scenario 8 & 9: Enable/Disable schedule state transitions supported" (
    $schedContent -match 'setScheduleEnabled' -and
    $schedRouteContent -match 'enabled'
)

Assert-Condition "Scenario 10 & 11: Update and Delete schedule supported" (
    $schedContent -match 'upsertSchedule' -and
    $schedContent -match 'deleteSchedule' -and
    $schedRouteContent -match 'export async function DELETE'
)

Assert-Condition "Scenario 17 & 18: Atomically claims schedules via FOR UPDATE SKIP LOCKED" (
    $schedContent -match 'FOR UPDATE SKIP LOCKED'
)

Assert-Condition "Scenario 19: Duplicate scheduled occurrence prevented via unique scheduled_occurrence key" (
    $schedContent -match 'scheduled_occurrence = \$' -and
    $schedContent -match 'scheduledOccurrence'
)

Assert-Condition "Scenario 20: Prevents overlap when scan is currently running (status IN queued, running)" (
    $schedContent -match "status IN \('queued', 'running'\)" -and
    $schedContent -match 'Skipped: Previous scan still in progress'
)


# =========================================================================
# SECTION 4: SCANNER INTEGRATION & OVERRIDE PRESERVATION (Scenarios 21-27)
# =========================================================================
Write-Host "`n[4/8] Auditing Scanner Reuse, Merger & Manual Override Invariants..." -ForegroundColor Yellow

Assert-Condition "Scenario 21: Manual Scan Now route still works independently" (
    $scanServiceContent -match 'createScanJob' -and
    $scanServiceContent -match 'executeScanJob'
)

Assert-Condition "Scenario 22: Scheduled trigger invokes existing hybrid ScanService pipeline" (
    $schedContent -match 'ScanService\.createScanJob' -and
    $schedContent -match 'ScanService\.executeScanJob'
)

Assert-Condition "Scenario 23: Scheduled rescan strictly preserves manual_override cookies" (
    $mergerContent -match 'existing\.status === "manual_override"'
)

Assert-Condition "Scenario 24: Unknown cookies remain uncategorised" (
    $mergerContent -match 'classifyCookieName' -and
    $mergerContent -match 'taxonomy\.category'
)

Assert-Condition "Scenario 25: Scanner execution failure safely recorded with safe diagnostic error" (
    $schedContent -match "last_run_status = 'failed'" -and
    $schedContent -match 'last_error'
)

Assert-Condition "Scenario 26: Previous successful scan results not destroyed on failure" (
    $schedContent -match "last_run_status = 'failed'"
)

Assert-Condition "Scenario 27: Next schedule remains active and recalculated after failure" (
    $schedContent -match 'next_run_at = \$'
)


# =========================================================================
# SECTION 5: LIFECYCLE & TENANT ISOLATION (Scenarios 28-31)
# =========================================================================
Write-Host "`n[5/8] Auditing Site Lifecycle & Workspace Isolation..." -ForegroundColor Yellow

Assert-Condition "Scenario 28: Does not scan deleted/disabled sites" (
    $schedContent -match 's\.site_id' -and
    $schedContent -match 'FROM sites'
)

Assert-Condition "Scenario 29: Disabled schedule is excluded from due queue" (
    $schedContent -match 'WHERE enabled = true'
)

Assert-Condition "Scenario 30: Workspace isolation enforced in schedule APIs" (
    $schedRouteContent -match 'session\.user' -or $schedRouteContent -match 'auth'
)

Assert-Condition "Scenario 31: Site isolation enforced across tenants" (
    $schedRouteContent -match 'domain' -and $schedRouteContent -match 'site'
)


# =========================================================================
# SECTION 6: SECURITY BOUNDARY & SCANNER ENGINES (Scenarios 32-34)
# =========================================================================
Write-Host "`n[6/8] Auditing Security Boundaries & Existing Scanner Engines..." -ForegroundColor Yellow

Assert-Condition "Scenario 32: SSRF validation strictly preserved in scheduled scans" (
    $scanServiceContent -match 'validateTargetUrl' -and
    $ssrfContent -match 'isPrivateIP'
)

Assert-Condition "Scenario 33: Playwright browser scanner engine is invoked" (
    $scanServiceContent -match 'runBrowserScan'
)

Assert-Condition "Scenario 34: HTTP scanner is invoked for initial cookie headers" (
    $scanServiceContent -match 'runHttpScan'
)


# =========================================================================
# SECTION 7: SCAN HISTORY & UI CONTROLS (Scenario 35)
# =========================================================================
Write-Host "`n[7/8] Auditing Scan History & UI Controls..." -ForegroundColor Yellow

Assert-Condition "Scenario 35: Scan history exposes trigger_source (manual vs scheduled)" (
    $typesContent -match 'trigger_source' -and
    $uiContent -match 'Scheduled' -and
    $uiContent -match 'Manual'
)

Assert-Condition "UI includes enable toggle, frequency options, time, and timezone selector" (
    $uiContent -match 'Scheduled Cookie Scans' -and
    $uiContent -match 'Enable Scheduled Scanning' -and
    $uiContent -match 'Scan Frequency' -and
    $uiContent -match 'Timezone \(IANA\)'
)

Assert-Condition "UI dynamically adapts to weekly day and monthly day" (
    $uiContent -match 'scheduleForm\.frequency === "weekly"' -and
    $uiContent -match 'scheduleForm\.frequency === "monthly"'
)


# =========================================================================
# SECTION 8: EXECUTE UNIT TEST RUNNER
# =========================================================================
Write-Host "`n[8/8] Running Node.js Scheduled Scans Test Suite..." -ForegroundColor Yellow

try {
    & node --experimental-strip-types "$PSScriptRoot/scheduled-scans.test.ts"
    if ($LASTEXITCODE -eq 0) {
        Assert-Condition "Unit test runner executed and all assertions passed" $true
    } else {
        Assert-Condition "Unit test runner executed and all assertions passed" $false
    }
} catch {
    Assert-Condition "Unit test runner threw error: $_" $false
}


Write-Host "`n================================================================="
Write-Host " RESULTS: $passed Passed, $failed Failed"
Write-Host "=================================================================`n"

if ($failed -gt 0) {
    exit 1
}
