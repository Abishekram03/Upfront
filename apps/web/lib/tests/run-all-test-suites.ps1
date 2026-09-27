# =========================================================================
#  Master Test Runner: All UpFront CMP QA & Hardening Test Suites
# =========================================================================

$ErrorActionPreference = "Stop"

$suiteDir = $PSScriptRoot
$suites = @(
    "run-syntax-verification.ps1",
    "run-runtime-cookie-scanner.ps1",
    "run-ccpa-scenarios.ps1",
    "run-gpc-scenarios.ps1",
    "run-geo-targeting-verification.ps1",
    "run-legal-presets-verification.ps1",
    "run-cookie-policy-verification.ps1",
    "run-cookie-manager-verification.ps1",
    "run-duplicate-banner-verification.ps1",
    "run-lifecycle-simulation.ps1",
    "run-proof-of-consent-country-verification.ps1",
    "run-proof-of-consent-verification.ps1",
    "run-script-rules-verification.ps1",
    "verify-runtime-gate.ps1"
)

$totalSuites = $suites.Count
$passedSuites = 0
$failedSuites = 0

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " STARTING MASTER CMP REGRESSION RUN ($totalSuites Suites)" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

for ($i = 0; $i -lt $suites.Count; $i++) {
    $suite = $suites[$i]
    $suitePath = Join-Path $suiteDir $suite
    Write-Host ">> Running Suite [$($i+1)/$totalSuites]: $suite" -ForegroundColor Yellow
    try {
        & powershell -ExecutionPolicy Bypass -File $suitePath
        if ($LASTEXITCODE -eq 0) {
            $passedSuites++
        } else {
            $failedSuites++
            Write-Host "  [SUITE FAILED] $suite exited with code $LASTEXITCODE" -ForegroundColor Red
        }
    } catch {
        $failedSuites++
        Write-Host "  [SUITE ERROR] $_" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " MASTER SUMMARY: $passedSuites / $totalSuites Suites Passed" -ForegroundColor $(if ($failedSuites -eq 0) { "Green" } else { "Red" })
Write-Host "========================================================`n" -ForegroundColor Cyan

if ($failedSuites -gt 0) {
    exit 1
}
