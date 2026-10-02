# =========================================================================
#  UpFront Consent Configuration Initialization & Schema Integrity Suite
# =========================================================================

$ErrorActionPreference = "Stop"

$passCount = 0
$failCount = 0

function Test-Assertion($description, $condition) {
    if ($condition) {
        Write-Host "  [PASS] $description" -ForegroundColor Green
        $script:passCount++
    } else {
        Write-Host "  [FAIL] $description" -ForegroundColor Red
        $script:failCount++
    }
}

Write-Host "`n================================================================="
Write-Host " UpFront Consent Configuration Schema & Initialization Suite"
Write-Host "=================================================================`n"

$configRoutePath = "$PSScriptRoot/../../app/api/v1/consent/config/route.ts"
$dbPath = "$PSScriptRoot/../db.ts"

$configRouteContent = Get-Content $configRoutePath -Raw
$dbContent = Get-Content $dbPath -Raw

# [1/4] Auditing GET SQL Query Column/Value Alignment
Write-Host "[1/4] Auditing GET /api/v1/consent/config Column & Expression Counts..." -ForegroundColor Yellow

Test-Assertion "GET query includes enable_analytics_category in column list" ($configRouteContent -match 'INSERT INTO consent_configs[^\)]+enable_analytics_category')
Test-Assertion "GET query includes enable_performance_category in column list" ($configRouteContent -match 'INSERT INTO consent_configs[^\)]+enable_performance_category')
Test-Assertion "GET query includes enable_advertisement_category in column list" ($configRouteContent -match 'INSERT INTO consent_configs[^\)]+enable_advertisement_category')
Test-Assertion "GET query includes preferences_label in column list" ($configRouteContent -match 'INSERT INTO consent_configs[^\)]+preferences_label')
Test-Assertion "GET query includes custom_css in column list" ($configRouteContent -match 'INSERT INTO consent_configs[^\)]+custom_css')
Test-Assertion "GET query includes law_template in column list" ($configRouteContent -match 'INSERT INTO consent_configs[^\)]+law_template')

# [2/4] Auditing POST SQL Query Column/Value Alignment
Write-Host "`n[2/4] Auditing POST /api/v1/consent/config Column & Expression Counts..." -ForegroundColor Yellow

Test-Assertion "POST query includes all 5 category flags in column list" (
    $configRouteContent -match 'enable_necessary_category,\s*enable_functional_category,\s*enable_analytics_category,\s*enable_performance_category,\s*enable_advertisement_category'
)
Test-Assertion "POST query has exact 41 target columns and 41 values" (
    $configRouteContent -match '\$35,\s*\$36,\s*\$37,\s*\$38,\s*\$39,\s*NOW\(\),\s*NOW\(\)'
)

# [3/4] Auditing Database Schema Migrations in db.ts
Write-Host "`n[3/4] Auditing Safe Idempotent Schema Migrations in db.ts..." -ForegroundColor Yellow

Test-Assertion "db.ts includes ALTER TABLE for enable_necessary_category" ($dbContent -match 'ALTER TABLE consent_configs ADD COLUMN IF NOT EXISTS enable_necessary_category')
Test-Assertion "db.ts includes ALTER TABLE for enable_analytics_category" ($dbContent -match 'ALTER TABLE consent_configs ADD COLUMN IF NOT EXISTS enable_analytics_category')
Test-Assertion "db.ts includes ALTER TABLE for enable_performance_category" ($dbContent -match 'ALTER TABLE consent_configs ADD COLUMN IF NOT EXISTS enable_performance_category')
Test-Assertion "db.ts includes ALTER TABLE for enable_advertisement_category" ($dbContent -match 'ALTER TABLE consent_configs ADD COLUMN IF NOT EXISTS enable_advertisement_category')
Test-Assertion "db.ts includes ALTER TABLE for geo_targeting" ($dbContent -match 'ALTER TABLE consent_configs ADD COLUMN IF NOT EXISTS geo_targeting')

# [4/4] Auditing Node.js Integration Suite
Write-Host "`n[4/4] Auditing Node.js Integration Test Suite..." -ForegroundColor Yellow

Test-Assertion "consent-config-initialization.test.ts present and verified" (Test-Path "$PSScriptRoot/consent-config-initialization.test.ts")

Write-Host "`n================================================================="
Write-Host " RESULTS: $passCount Passed, $failCount Failed"
Write-Host "=================================================================`n"

if ($failCount -gt 0) {
    exit 1
}
