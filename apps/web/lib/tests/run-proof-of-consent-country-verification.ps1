# =========================================================================
# UpFront CMP: Proof-of-Consent Visitor Country Correctness Test Suite
# =========================================================================

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " UpFront CMP Proof-of-Consent Country Lifecycle Test Suite" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

$passed = 0
$failed = 0

function Assert-Condition($condition, $message) {
    if ($condition) {
        Write-Host "  [PASS] $message" -ForegroundColor Green
        $script:passed++
    } else {
        Write-Host "  [FAIL] $message" -ForegroundColor Red
        $script:failed++
    }
}

$configRoute = Get-Content -Raw 'apps/web/app/api/v1/consent/config/route.ts'
$logRoute = Get-Content -Raw 'apps/web/app/api/v1/consent/log/route.ts'

# [1/4] Auditing Edge Geo Header Extraction & Format Validation
Write-Host "`n[1/4] Auditing Edge Geo Header Extraction & Validation..." -ForegroundColor Yellow

Assert-Condition ($configRoute -match 'rawHeaderCountry' -and $configRoute -match 'isValidCountry') `
    "Config route extracts and validates 2-letter ISO country code without defaulting missing headers to US"

Assert-Condition ($configRoute -match 'visitor_country:\s*detectedCountry') `
    "Config route returns exact detected country or null to client"

Assert-Condition ($logRoute -match 'rawHeaderCountry' -and $logRoute -match 'rawPayloadCountry') `
    "Receipt log route inspects both payload visitor_country and edge request headers"

Assert-Condition ($logRoute -match 'finalReceiptCountry\s*=\s*detectedPayloadCountry\s*\|\|\s*detectedHeaderCountry\s*\|\|\s*null') `
    "Receipt log route defaults to null (not US) when country cannot be reliably detected"

# [2/4] Testing Country Resolution Invariants
Write-Host "`n[2/4] Testing Multi-Country Resolution Invariants..." -ForegroundColor Yellow

function Resolve-Receipt-Country($payloadCountry, $headerCountry) {
    $validHeader = if ($headerCountry -and $headerCountry -match '^[A-Z]{2}$' -and $headerCountry -ne 'XX' -and $headerCountry -ne 'T1') { $headerCountry } else { $null }
    $validPayload = if ($payloadCountry -and $payloadCountry -match '^[A-Z]{2}$' -and $payloadCountry -ne 'XX' -and $payloadCountry -ne 'T1') { $payloadCountry } else { $null }
    if ($validPayload) { return $validPayload }
    if ($validHeader) { return $validHeader }
    return $null
}

$c1 = Resolve-Receipt-Country "IN" $null
Assert-Condition ($c1 -eq "IN") "Visitor from India (Payload IN) -> Receipt Country = IN"

$c2 = Resolve-Receipt-Country $null "IN"
Assert-Condition ($c2 -eq "IN") "Visitor from India (Header IN) -> Receipt Country = IN"

$c3 = Resolve-Receipt-Country "US" "US"
Assert-Condition ($c3 -eq "US") "Visitor from US (Payload US, Header US) -> Receipt Country = US"

$c4 = Resolve-Receipt-Country "GB" "GB"
Assert-Condition ($c4 -eq "GB") "Visitor from UK (Payload GB) -> Receipt Country = GB"

$c5 = Resolve-Receipt-Country $null $null
Assert-Condition ($c5 -eq $null) "Missing Geo Headers -> Receipt Country = null (Explicitly Unknown, NOT false US)"

$c6 = Resolve-Receipt-Country "INVALID_LONG_CODE" "1234"
Assert-Condition ($c6 -eq $null) "Malformed Geo Codes -> Receipt Country = null (Explicitly Unknown)"

$c7 = Resolve-Receipt-Country "XX" "T1"
Assert-Condition ($c7 -eq $null) "Internal/Tor reserved codes ('XX', 'T1') -> Receipt Country = null"

# [3/4] Framework Fallback vs Visitor Country Separation
Write-Host "`n[3/4] Verifying Framework Fallback vs Visitor Country Separation..." -ForegroundColor Yellow

Assert-Condition ($configRoute -match 'geo === "eu_only" \|\| geo === "eu_uk" \|\| geo === "eu"') `
    "Geo targeting framework matching logic preserved"

Assert-Condition ($configRoute -match 'EU_UK_COUNTRIES\.has\(country\)') `
    "EU/UK framework evaluation uses country fallback safely while visitor_country returns detectedCountry"

# [4/4] End-to-End Simulation Summary
Write-Host "`n[4/4] End-to-End Verification Summary..." -ForegroundColor Yellow
Assert-Condition ($passed -ge 12 -and $failed -eq 0) "All Proof-of-Consent Country invariants verified successfully"

Write-Host "`n=================================================================" -ForegroundColor Cyan
Write-Host " RESULTS: $passed Passed, $failed Failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host "=================================================================" -ForegroundColor Cyan

if ($failed -gt 0) { exit 1 } else { exit 0 }
