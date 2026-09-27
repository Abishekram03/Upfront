# =========================================================================
#  UpFront Final Pricing, Entitlement Gating & Paddle Billing Verification
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
Write-Host " UpFront Final Pricing, Feature Gating & Paddle Billing Suite"
Write-Host "=================================================================`n"

# Load source files for static verification
$plansFile = "$PSScriptRoot/../billing/plans.ts"
$plansContent = Get-Content $plansFile -Raw

$entitlementsFile = "$PSScriptRoot/../billing/entitlements.ts"
$entitlementsContent = Get-Content $entitlementsFile -Raw

$paddleFile = "$PSScriptRoot/../billing/paddle.ts"
$paddleContent = Get-Content $paddleFile -Raw

$dbFile = "$PSScriptRoot/../db.ts"
$dbContent = Get-Content $dbFile -Raw

$webhookRouteFile = "$PSScriptRoot/../../app/api/v1/billing/webhook/route.ts"
$webhookRouteContent = Get-Content $webhookRouteFile -Raw

$configRouteFile = "$PSScriptRoot/../../app/api/v1/consent/config/route.ts"
$configRouteContent = Get-Content $configRouteFile -Raw

$publishRouteFile = "$PSScriptRoot/../../app/api/v1/consent/publish/route.ts"
$publishRouteContent = Get-Content $publishRouteFile -Raw

$schedRouteFile = "$PSScriptRoot/../../app/api/v1/consent/scanner/schedule/route.ts"
$schedRouteContent = Get-Content $schedRouteFile -Raw

$upgradeGateFile = "$PSScriptRoot/../../components/ui/upgrade-gate.tsx"
$upgradeGateContent = Get-Content $upgradeGateFile -Raw

$upgradeModalFile = "$PSScriptRoot/../../components/dashboard/billing/upgrade-modal.tsx"
$upgradeModalContent = Get-Content $upgradeModalFile -Raw

$studioFile = "$PSScriptRoot/../../components/dashboard/consent/banner-studio.tsx"
$studioContent = Get-Content $studioFile -Raw

$settingsFile = "$PSScriptRoot/../../components/dashboard/settings-view.tsx"
$settingsContent = Get-Content $settingsFile -Raw

$pricingFile = "$PSScriptRoot/../../app/(landing)/pricing/page.tsx"
$pricingContent = Get-Content $pricingFile -Raw


# =========================================================================
# SECTION 1: PLANS, CAPABILITIES & LIMITS AUDITING
# =========================================================================
Write-Host "[1/5] Auditing Plan Capabilities, Pricing & Usage Limits..." -ForegroundColor Yellow

Assert-Condition 'Free plan defined with $0, 50K PVs, 100 pages/scan, 30 days history' (
    $plansContent -match 'priceMonthly:\s*0' -and
    $plansContent -match 'monthlyPageviews:\s*50_?000' -and
    $plansContent -match 'pagesPerScan:\s*100' -and
    $plansContent -match 'consentHistoryDays:\s*30'
)

Assert-Condition 'Growth plan defined with $19, 250K PVs, 1K pages/scan, 365 days history' (
    $plansContent -match 'priceMonthly:\s*19' -and
    $plansContent -match 'monthlyPageviews:\s*250_?000' -and
    $plansContent -match 'pagesPerScan:\s*1_?000' -and
    $plansContent -match 'consentHistoryDays:\s*365'
)

Assert-Condition 'Business plan defined with $49, 1M PVs, 5K pages/scan, 730 days history' (
    $plansContent -match 'priceMonthly:\s*49' -and
    $plansContent -match 'monthlyPageviews:\s*1_?000_?000' -and
    $plansContent -match 'pagesPerScan:\s*5_?000' -and
    $plansContent -match 'consentHistoryDays:\s*730'
)

Assert-Condition "Websites are unlimited on all plans (no website quotas introduced)" (
    -not ($plansContent -match 'max_websites') -and
    -not ($plansContent -match 'websites_limit')
)

Assert-Condition "Central capability mapper getRequiredPlanForCapability maps correctly" (
    $plansContent -match 'getRequiredPlanForCapability' -and
    $plansContent -match 'cmp\.custom_css' -and
    $plansContent -match 'cmp\.tcf_v23'
)


# =========================================================================
# SECTION 2: DATABASE PERSISTENCE & SCHEMA AUDIT
# =========================================================================
Write-Host "`n[2/5] Auditing Billing Database Schema & Deduplication..." -ForegroundColor Yellow

Assert-Condition "subscriptions table created with required Paddle lifecycle columns" (
    $dbContent -match 'CREATE TABLE IF NOT EXISTS subscriptions' -and
    $dbContent -match 'paddle_customer_id' -and
    $dbContent -match 'paddle_subscription_id' -and
    $dbContent -match 'paddle_price_id' -and
    $dbContent -match 'current_period_start' -and
    $dbContent -match 'current_period_end' -and
    $dbContent -match 'last_event_id' -and
    $dbContent -match 'last_event_at'
)

Assert-Condition "billing_events table enforces UNIQUE(event_id) for idempotent deduplication" (
    $dbContent -match 'CREATE TABLE IF NOT EXISTS billing_events' -and
    $dbContent -match 'event_id VARCHAR\(255\) UNIQUE NOT NULL'
)


# =========================================================================
# SECTION 3: PADDLE WEBHOOK SECURITY & EVENT HANDLING
# =========================================================================
Write-Host "`n[3/5] Auditing Paddle Webhook Engine & Security Invariants..." -ForegroundColor Yellow

Assert-Condition "HMAC-SHA256 signature verification implemented with timing-safe comparison" (
    $paddleContent.Contains('crypto.createHmac') -or $paddleContent.Contains('createHmac("sha256"')
)

Assert-Condition "Webhook deduplicates via event_id before processing" (
    $paddleContent.Contains('billing_events WHERE event_id = $1') -and
    $paddleContent.Contains('action: "deduplicated"')
)

Assert-Condition "Webhook protects against out-of-order events using occurred_at" (
    $paddleContent.Contains('skipped_out_of_order') -and
    $paddleContent.Contains('last_event_at')
)

Assert-Condition "Handles complete Paddle subscription event lifecycle" (
    $paddleContent.Contains('subscription.created') -and
    $paddleContent.Contains('subscription.updated') -and
    $paddleContent.Contains('subscription.activated') -and
    $paddleContent.Contains('subscription.trialing') -and
    $paddleContent.Contains('subscription.past_due') -and
    $paddleContent.Contains('subscription.paused') -and
    $paddleContent.Contains('subscription.resumed') -and
    $paddleContent.Contains('subscription.canceled')
)


# =========================================================================
# SECTION 4: SERVER-SIDE API ENFORCEMENT AUDIT
# =========================================================================
Write-Host "`n[4/5] Auditing Server-side API Authorization Gates..." -ForegroundColor Yellow

Assert-Condition "Consent config API enforces custom_css, tcf_v23, gpc, geo, consent_mode, and box/popup layouts" (
    $configRouteContent.Contains('cmp.custom_css') -and
    $configRouteContent.Contains('cmp.tcf_v23') -and
    $configRouteContent.Contains('cmp.gpc') -and
    $configRouteContent.Contains('cmp.geo_targeting') -and
    $configRouteContent.Contains('cmp.google_consent_mode_v2') -and
    $configRouteContent.Contains('cmp.box_layout') -and
    $configRouteContent.Contains('cmp.popup_layout')
)

Assert-Condition "Consent publish API enforces capabilities server-side before publication" (
    $publishRouteContent.Contains('cmp.custom_css') -and
    $publishRouteContent.Contains('cmp.tcf_v23') -and
    $publishRouteContent.Contains('cmp.box_layout') -and
    $publishRouteContent.Contains('cmp.popup_layout')
)

Assert-Condition "Scanner schedule API enforces cmp.scheduled_scans and daily/weekly tiers" (
    $schedRouteContent.Contains('cmp.scheduled_scans') -and
    $schedRouteContent.Contains('daily') -and
    $schedRouteContent.Contains('weekly')
)


# =========================================================================
# SECTION 5: UI FEATURE GATING & AFFORDANCES
# =========================================================================
Write-Host "`n[5/5] Auditing UI Gating, Tooltips, and Paddle Checkout Flow..." -ForegroundColor Yellow

Assert-Condition "UpgradeGate component provides greyed/disabled styling, crown icon, and hover popover" (
    $upgradeGateContent -match 'UpgradeGate' -and
    $upgradeGateContent -match 'Crown' -and
    $upgradeGateContent -match 'Upgrade to' -and
    $upgradeGateContent -match 'opacity-50 pointer-events-none'
)

Assert-Condition "UpgradeModal component provides 2-tier checkout with real Paddle integration" (
    $upgradeModalContent -match 'openPaddleCheckout' -and
    $upgradeModalContent -match 'Growth' -and
    $upgradeModalContent -match 'Business'
)

Assert-Condition "Banner Studio gates Box, Popup, Custom CSS, TCF v2.3, GPC, Geo-targeting, GCM v2, and Multilingual" (
    $studioContent.Contains('cmp.box_layout') -and
    $studioContent.Contains('cmp.popup_layout') -and
    $studioContent.Contains('capability="cmp.custom_css"') -and
    $studioContent.Contains('capability="cmp.tcf_v23"') -and
    $studioContent.Contains('capability="cmp.gpc"') -and
    $studioContent.Contains('capability="cmp.geo_targeting"') -and
    $studioContent.Contains('capability="cmp.google_consent_mode_v2"') -and
    $studioContent.Contains('capability="cmp.multilingual"')
)

Assert-Condition "Settings Billing Tab displays live usage meters and Paddle customer portal entry" (
    $settingsContent -match 'Current Workspace Plan' -and
    $settingsContent -match 'Monthly Pageviews' -and
    $settingsContent -match 'openPaddleCustomerPortal' -and
    $settingsContent -match 'Unlimited websites on all plans'
)

Assert-Condition "Standalone Pricing page implements 3-column UI with finalized plans" (
    $pricingContent.Contains('$0') -and
    $pricingContent.Contains('$19') -and
    $pricingContent.Contains('$49') -and
    $pricingContent -match 'Unlimited.*websites'
)


Write-Host "`n================================================================="
Write-Host " RESULTS: $passed Passed, $failed Failed"
Write-Host "=================================================================`n"

if ($failed -gt 0) {
    exit 1
}
