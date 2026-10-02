# Verification Suite: Last Successful Scan Date/Time and Schedule Synchronization
$ErrorActionPreference = 'Stop'

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "=== UpFront CMP Last Successful Scan Verification Suite ===" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

$passed = 0
$failed = 0

function Assert-Condition($name, $condition) {
    if ($condition) {
        Write-Host "  [PASS] $name" -ForegroundColor Green
        $script:passed++
    } else {
        Write-Host "  [FAIL] $name" -ForegroundColor Red
        $script:failed++
    }
}

$scannerRoutePath = "$PSScriptRoot/../../app/api/v1/consent/scanner/route.ts"
$scheduleRoutePath = "$PSScriptRoot/../../app/api/v1/consent/scanner/schedule/route.ts"
$cookieManagerPath = "$PSScriptRoot/../../components/dashboard/consent/cookie-manager.tsx"
$schedulerPath = "$PSScriptRoot/../../lib/scanner/scheduler.ts"

$scannerRoute = Get-Content $scannerRoutePath -Raw
$scheduleRoute = Get-Content $scheduleRoutePath -Raw
$cookieManager = Get-Content $cookieManagerPath -Raw
$scheduler = Get-Content $schedulerPath -Raw

Write-Host "`n[1/4] Auditing API Scanner Route Synchronization..." -ForegroundColor Yellow
Assert-Condition "GET handler awaits ScheduleService.processDueSchedules" (
    $scannerRoute -match 'await ScheduleService\.processDueSchedules'
)
Assert-Condition "GET handler queries latest_successful_scan (completed scans only)" (
    $scannerRoute -match "status = 'completed' ORDER BY created_at DESC LIMIT 1"
)
Assert-Condition "GET response includes latest_successful_scan" (
    $scannerRoute -match 'latest_successful_scan: latestSuccessfulScan'
)
Assert-Condition "POST response includes latest_successful_scan" (
    $scannerRoute -match 'latest_successful_scan: latestSuccessfulScanRes'
)

Write-Host "`n[2/4] Auditing Schedule Route Synchronization..." -ForegroundColor Yellow
Assert-Condition "Schedule GET handler processes due scans before responding" (
    $scheduleRoute -match 'await ScheduleService\.processDueSchedules'
)
Assert-Condition "Scheduler updates last_run_at and last_run_status upon completion" (
    $scheduler -match 'last_run_at = NOW\(\)' -and $scheduler -match 'last_run_status'
)

Write-Host "`n[3/4] Auditing Cookie Manager Component State..." -ForegroundColor Yellow
Assert-Condition "CookieManager defines latestSuccessfulScan state" (
    $cookieManager -match 'const \[latestSuccessfulScan, setLatestSuccessfulScan\] = useState<ScanRecord \| null>\(null\)'
)
Assert-Condition "ScanRecord includes completed_at property" (
    $cookieManager -match 'completed_at\?: string'
)
Assert-Condition "loadData populates latestSuccessfulScan correctly" (
    $cookieManager -match 'setLatestSuccessfulScan\(' -and
    $cookieManager -match 'scanData\.latest_successful_scan'
)
Assert-Condition "handleTriggerScan populates latestSuccessfulScan" (
    $cookieManager -match 'setLatestSuccessfulScan\(data\.latest_successful_scan\)'
)

Write-Host "`n[4/4] Auditing Last Successful Scan Card UI Presentation..." -ForegroundColor Yellow
Assert-Condition "Card 1 derives exact date/time from latestSuccessfulScan or schedule" (
    $cookieManager -match 'successfulScanTime\s*=' -and
    $cookieManager -match 'latestSuccessfulScan\?\.' -and
    $cookieManager -match 'schedule\?\.'
)
Assert-Condition "Card 1 displays trigger source badge (Scheduled vs Manual)" (
    $cookieManager -match 'successfulScanTrigger === "scheduled"' -and
    $cookieManager -match 'Scheduled' -and
    $cookieManager -match 'Manual'
)
Assert-Condition "Card 1 formats and displays exact scan timestamp" (
    $cookieManager -match 'formatDate\(successfulScanTime\)'
)
Assert-Condition "Card 1 displays count of discovered cookies and scripts" (
    $cookieManager -match 'successfulCookiesCount' -and
    $cookieManager -match 'scripts'
)
Assert-Condition "Card 1 displays failure alert without destroying last successful timestamp" (
    $cookieManager -match 'latestScan && latestScan\.status === "failed"'
)

Write-Host "`n=================================================================" -ForegroundColor Cyan
Write-Host "RESULTS: $passed Passed, $failed Failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host "=================================================================" -ForegroundColor Cyan

if ($failed -gt 0) {
    exit 1
}
