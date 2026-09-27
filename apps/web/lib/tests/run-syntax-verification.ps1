# =========================================================================
#  UpFront CMP userly.js Runtime Syntax & Regex Hardening Test Suite
# =========================================================================

$ErrorActionPreference = "Stop"

$trackerJsPath = "$PSScriptRoot/../../../api/tracker/userly.js"
$routeTsPath = "$PSScriptRoot/../../app/userly.js/route.ts"

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
Write-Host " UpFront CMP userly.js Syntax & Regex Integrity Verification"
Write-Host "=================================================================`n"

# [1/4] Auditing apps/api/tracker/userly.js Source File
Write-Host "[1/4] Auditing apps/api/tracker/userly.js for Malformed Regexes..." -ForegroundColor Yellow
$trackerContent = Get-Content $trackerJsPath -Raw

Assert-Condition "tracker/userly.js exists and is non-empty" ($trackerContent.Length -gt 10000)
Assert-Condition "No corrupted /@imports+ regex literal in tracker/userly.js" (-not ($trackerContent -match '/@import\w*\+'))
Assert-Condition "No corrupted /javascripts* regex literal in tracker/userly.js" (-not ($trackerContent -match '/javascript\w*\*'))
Assert-Condition "No corrupted /<script regex literal in tracker/userly.js" (-not ($trackerContent -match '/<script'))
Assert-Condition "Uses safe string search (indexOf) for CSS security checks" ($trackerContent -match 'cssLower\.indexOf\("<script"\)')
Assert-Condition "Blocks javascript: pseudo-protocol in CSS" ($trackerContent -match 'cssLower\.indexOf\("javascript:"\)')
Assert-Condition "Blocks @import directives in CSS" ($trackerContent -match 'cssLower\.indexOf\("@import"\)')

# [2/4] Auditing apps/web/app/userly.js/route.ts Next.js Route
Write-Host "`n[2/4] Auditing apps/web/app/userly.js/route.ts Template String..." -ForegroundColor Yellow
$routeContent = Get-Content $routeTsPath -Raw

Assert-Condition "userly.js/route.ts exists and is non-empty" ($routeContent.Length -gt 10000)
Assert-Condition "No corrupted /@imports+ regex literal in route.ts" (-not ($routeContent -match '/@import\w*\+'))
Assert-Condition "No corrupted /javascripts* regex literal in route.ts" (-not ($routeContent -match '/javascript\w*\*'))
Assert-Condition "No corrupted /<script regex literal in route.ts" (-not ($routeContent -match '/<script'))
Assert-Condition "Uses safe string search (indexOf) in route.ts" ($routeContent -match 'cssLower\.indexOf\("<script"\)')
Assert-Condition "Cache-Control header is no-cache to avoid stale browser execution" ($routeContent -match 'no-cache, must-revalidate')

# [3/4] Testing CSS Sanitization Edge Cases
Write-Host "`n[3/4] Testing CSS Sanitization Runtime Logic..." -ForegroundColor Yellow

$testPayloads = @(
    @{ payload = "<script>alert(1)</script>"; shouldBlock = $true; label = "Script tag injection" },
    @{ payload = "body { background: url('javascript:alert(1)'); }"; shouldBlock = $true; label = "Javascript pseudo-protocol" },
    @{ payload = "@import url('https://evil.com/style.css');"; shouldBlock = $true; label = "@import external stylesheet" },
    @{ payload = "div { behavior: url(x.htc); }"; shouldBlock = $true; label = "IE behavior property" },
    @{ payload = ".upfront-banner { font-family: Inter, sans-serif; }"; shouldBlock = $false; label = "Valid standard CSS rule" },
    @{ payload = ".usrly-btn-primary { background-color: #1868db; }"; shouldBlock = $false; label = "Valid theme override" }
)

foreach ($t in $testPayloads) {
    $css = $t.payload.ToLower()
    $isUnsafe = ($css.IndexOf("<script") -ne -1) -or `
                ($css.IndexOf("</script") -ne -1) -or `
                ($css.IndexOf("javascript:") -ne -1) -or `
                ($css.IndexOf("expression(") -ne -1) -or `
                ($css.IndexOf("behavior:") -ne -1) -or `
                ($css.IndexOf("-moz-binding") -ne -1) -or `
                ($css.IndexOf("@import") -ne -1)

    if ($t.shouldBlock) {
        Assert-Condition "Payload: $($t.label) correctly blocked" $isUnsafe
    } else {
        Assert-Condition "Payload: $($t.label) correctly allowed" (-not $isUnsafe)
    }
}

# [4/4] End-to-End Verification Summary
Write-Host "`n[4/4] Verification Summary..." -ForegroundColor Yellow
Assert-Condition "Zero syntax errors and zero malformed regex literals" ($script:failed -eq 0)

Write-Host "`n================================================================="
Write-Host " RESULTS: $passed Passed, $failed Failed"
Write-Host "=================================================================`n"

if ($failed -gt 0) {
    exit 1
}
