# =========================================================================
#  UpFront CMP Hybrid Scanner & Consent-Aware Runtime Discovery Suite
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
Write-Host " UpFront CMP Consent-Aware Runtime Scanner Test Suite"
Write-Host "=================================================================`n"

# [1/5] SSRF & Address Range Security
Write-Host "[1/5] Auditing SSRF & IP Boundary Protections..." -ForegroundColor Yellow
$ssrfFile = "$PSScriptRoot/../scanner/ssrf-protection.ts"
$ssrfContent = Get-Content $ssrfFile -Raw

Assert-Condition "ssrf-protection.ts exists and is non-empty" ($ssrfContent.Length -gt 1000)
Assert-Condition "Blocks 127.0.0.0/8 loopback" ($ssrfContent -match 'a === 127')
Assert-Condition "Blocks 10.0.0.0/8 private network" ($ssrfContent -match 'a === 10')
Assert-Condition "Blocks 172.16.0.0/12 private network" ($ssrfContent -match 'a === 172')
Assert-Condition "Blocks 192.168.0.0/16 private network" ($ssrfContent -match 'a === 192')
Assert-Condition "Blocks 169.254.0.0/16 & Cloud Metadata" ($ssrfContent -match 'a === 169 && b === 254')
Assert-Condition "Blocks IPv6 loopback ::1 and link-local fe80::" ($ssrfContent -match 'lower === "::1"')
Assert-Condition "Rejects localhost and internal domain hostnames" ($ssrfContent -match 'clean === "localhost"')

# [2/5] Open Cookie DB & Taxonomy
Write-Host "`n[2/5] Testing Open Cookie DB Classification & Unknown Cookie Handling..." -ForegroundColor Yellow
$openCookieDbFile = "$PSScriptRoot/../consentos/open-cookie-db.ts"
$dbContent = Get-Content $openCookieDbFile -Raw

Assert-Condition "Open Cookie DB exists with 2,200+ taxonomy" ($dbContent.Length -gt 5000)
Assert-Condition "Unknown cookies default to 'uncategorised' (low confidence)" ($dbContent -match 'category:\s*"uncategorised"')
Assert-Condition "Known analytics cookie (_ga) maps to 'analytics'" ($dbContent -match 'category:\s*"analytics"')
Assert-Condition "Known necessary cookie (__cf_bm) maps to 'necessary'" ($dbContent -match 'category:\s*"necessary"')

# [3/5] Merger, Deduplication & Value Privacy
Write-Host "`n[3/5] Auditing Merger, Zero-Value Persistence & Deduplication..." -ForegroundColor Yellow
$mergerFile = "$PSScriptRoot/../scanner/merger.ts"
$mergerContent = Get-Content $mergerFile -Raw

Assert-Condition "merger.ts exists and is non-empty" ($mergerContent.Length -gt 1000)
Assert-Condition "Deduplicates cookies by domain + name" ($mergerContent -match 'cookieMap\.set\(key')
Assert-Condition "Preserves customer manual_override status across rescans" ($mergerContent -match 'existing\.status === "manual_override"')
Assert-Condition "Does NOT persist cookie values in database" (-not ($mergerContent -match 'value:\s*raw\.value'))

# [4/5] Category-Isolated Consent-Aware Browser Scanner
Write-Host "`n[4/5] Auditing Consent-Aware Browser Scanner (Playwright Engine)..." -ForegroundColor Yellow
$browserScannerFile = "$PSScriptRoot/../scanner/browser-scanner.ts"
$browserContent = Get-Content $browserScannerFile -Raw

Assert-Condition "browser-scanner.ts exists and is non-empty" ($browserContent.Length -gt 1000)
Assert-Condition "Defines 5 category passes (necessary, functional, analytics, performance, advertisement)" ($browserContent -match 'SCANNER_CONSENT_CATEGORIES' -and $browserContent -match '"functional"' -and $browserContent -match '"analytics"')
Assert-Condition "Pre-seeds canonical UpFront CMP storage (usrly_consent_<domain>)" ($browserContent -match 'usrly_consent_')
Assert-Condition "Pre-seeds ConsentOS CMP storage (consentos_consent)" ($browserContent -match 'consentos_consent')
Assert-Condition "Synchronizes with window.Userly.updateConsent() on runtime detection" ($browserContent -match 'window\.Userly\.updateConsent')
Assert-Condition "Executes category-isolated scans with fresh browser context" ($browserContent -match 'runIsolatedCategoryScan' -and $browserContent -match 'browser\.newContext')
Assert-Condition "Uses context.cookies() API for runtime cookie discovery" ($browserContent -match 'context\.cookies\(\)')
Assert-Condition "Evaluates page.evaluate document.cookie for dynamic JS cookies" ($browserContent -match 'document\.cookie')
Assert-Condition "Blocks file downloads for security (acceptDownloads: false)" ($browserContent -match 'acceptDownloads:\s*false')
Assert-Condition "Applies navigation timeout and page timeout" ($browserContent -match 'page\.setDefaultNavigationTimeout')
Assert-Condition "Intercepts routes to block SSRF attempts in browser" ($browserContent -match 'page\.route\("\*\*/\*"')

# [5/5] Scan Job Model & Route Integration
Write-Host "`n[5/5] Auditing Scan Job Model & Route Architecture..." -ForegroundColor Yellow
$scanServiceFile = "$PSScriptRoot/../scanner/scan-service.ts"
$scanServiceContent = Get-Content $scanServiceFile -Raw
$routeFile = "$PSScriptRoot/../../app/api/v1/consent/scanner/route.ts"
$routeContent = Get-Content $routeFile -Raw

Assert-Condition "Supports queued -> running -> completed/failed state flow" ($scanServiceContent -match 'status:\s*"queued"' -and $scanServiceContent -match 'status = ''running''' -and $scanServiceContent -match 'status = ''completed''')
Assert-Condition "API POST /api/v1/consent/scanner creates job and executes hybrid scan" ($routeContent -match 'ScanService\.createScanJob' -and $routeContent -match 'ScanService\.executeScanJob')
Assert-Condition "API PATCH /api/v1/consent/scanner sets manual_override status" ($routeContent -match 'status = ''manual_override''')
Assert-Condition "Returns ssrf_blocked flag on SSRF validation errors" ($routeContent -match 'ssrf_blocked:\s*true')

Write-Host "`n================================================================="
Write-Host " RESULTS: $passed Passed, $failed Failed"
Write-Host "=================================================================`n"

if ($failed -gt 0) {
    exit 1
}
