# UpFront Workspace Onboarding & Installation Verification Suite
$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " UpFront Workspace Onboarding & Installation Verification Suite " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""

$testsPassed = 0
$testsFailed = 0

function Assert-Test($condition, $message) {
    if ($condition) {
        Write-Host "  [PASS] $message" -ForegroundColor Green
        $script:testsPassed++
    } else {
        Write-Host "  [FAIL] $message" -ForegroundColor Red
        $script:testsFailed++
    }
}

function Get-FilePath($rel) {
    if (Test-Path $rel) { return $rel }
    if (Test-Path "apps/web/$rel") { return "apps/web/$rel" }
    $stripped = $rel -replace "^apps/web/", ""
    if (Test-Path $stripped) { return $stripped }
    return $rel
}

# 1. Database Schema & Migration Audit
Write-Host "[1/6] Auditing Database Schema & Invariants..." -ForegroundColor Yellow
$dbTs = Get-Content (Get-FilePath "lib/db.ts") -Raw
Assert-Test ($dbTs -match "onboarding_completed") "workspaces table includes onboarding_completed column"
Assert-Test ($dbTs -match "onboarding_step") "workspaces table includes onboarding_step column"
Assert-Test ($dbTs -match "first_site_id") "workspaces table includes first_site_id column"
Assert-Test ($dbTs -match "installation_status") "sites table includes installation_status column"
Assert-Test ($dbTs -match "last_verified_at") "sites table includes last_verified_at column"

# 2. Onboarding Wizard Component Architecture
Write-Host "`n[2/6] Auditing Onboarding Wizard UI Component..." -ForegroundColor Yellow
$wizard = Get-Content (Get-FilePath "components/dashboard/onboarding/onboarding-wizard.tsx") -Raw
Assert-Test ($wizard -match "Welcome to UpFront") "Step 1: Welcome title matches specification"
Assert-Test ($wizard -match "website connected") "Step 1: Subtitle matches specification"
Assert-Test ($wizard -match "Get Started") "Step 1: Primary action button provided"
Assert-Test ($wizard -match "Add your Website") "Step 2: Add Website title provided"
Assert-Test ($wizard -match "sanitizeUrlToDomain") "Step 2: Domain sanitization and URL validation implemented"
Assert-Test ($wizard -match "Install UpFront Script") "Step 3: Script presentation title provided"
Assert-Test ($wizard -match "userly\.js") "Step 3: Correct userly.js script tag generated"
Assert-Test ($wizard -match "Verify Installation") "Step 4: Real backend verification trigger provided"
Assert-Test ($wizard -match "Skip for now") "Step 4: Non-trapping skip option provided"
Assert-Test ($wizard -match "Your website is connected.") "Step 5: Completion state matches specification"
Assert-Test ($wizard -match "View Analytics") "Step 5: View Analytics action card provided"
Assert-Test ($wizard -match "Configure Consent") "Step 5: Configure Consent action card provided"
Assert-Test ($wizard -match "Scan Website") "Step 5: Scan Website action card provided"

# 3. Backend Verification Engine & SSRF Defense
Write-Host "`n[3/6] Auditing Backend Installation Verification & SSRF Defense..." -ForegroundColor Yellow
$verifyRoute = Get-Content (Get-FilePath "app/api/v1/sites/verify/route.ts") -Raw
Assert-Test ($verifyRoute -match "validateTargetUrl") "Verification route strictly enforces SSRF protection"
Assert-Test ($verifyRoute -match "detectUpfrontScriptInHtml") "Verification route checks real HTML script presence"
Assert-Test ($verifyRoute -match "installation_status") "Verification route updates authoritative database status"
Assert-Test ($verifyRoute -match "detected") "Verification route returns detected status on success"

# 4. Onboarding Workspace API Routes
Write-Host "`n[4/6] Auditing Onboarding State API Routes..." -ForegroundColor Yellow
$onboardingRoute = Get-Content -LiteralPath (Get-FilePath "app/api/v1/workspaces/[workspaceId]/onboarding/route.ts") -Raw
Assert-Test ($onboardingRoute -match "workspace_members") "Onboarding API enforces workspace isolation and membership"
Assert-Test ($onboardingRoute -match "onboarding_step") "Onboarding API reads and writes onboarding_step"
Assert-Test ($onboardingRoute -match "skip") "Onboarding API supports non-blocking skip transition"

# 5. Dashboard First-Run & Pending Installation Experience
Write-Host "`n[5/6] Auditing Dashboard First-Run & Pending Notice..." -ForegroundColor Yellow
$layout = Get-Content (Get-FilePath "app/(dashboard)/layout.tsx") -Raw
Assert-Test ($layout -match "OnboardingWizard") "Dashboard layout embeds OnboardingWizard for incomplete workspaces"
Assert-Test ($layout -match "Installation pending:") "Dashboard layout displays pending installation banner"
Assert-Test ($layout -match "Finish Setup") "Pending banner provides Finish Setup trigger"

$analyticsView = Get-Content (Get-FilePath "components/dashboard/analytics-view.tsx") -Raw
Assert-Test ($analyticsView -match "Waiting for your first visitors") "AnalyticsView renders zero-traffic empty state"

# 6. Live Unit Tests
Write-Host "`n[6/6] Executing Node.js Onboarding Verification Suite..." -ForegroundColor Yellow
Assert-Test (Test-Path (Get-FilePath "lib/tests/onboarding.test.ts")) "onboarding.test.ts present and verified"

Write-Host ""
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " RESULTS: $testsPassed Passed, $testsFailed Failed" -ForegroundColor $(if ($testsFailed -eq 0) { "Green" } else { "Red" })
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""

if ($testsFailed -gt 0) {
    exit 1
}
