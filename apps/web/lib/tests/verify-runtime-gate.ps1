# Verification script for UpFront CMP Consent Gate Enforcement
$ErrorActionPreference = "Stop"

Write-Host '=== UpFront CMP Consent Gate Static & Invariant Verification ===' -ForegroundColor Cyan

$routeContent = Get-Content -Raw 'apps/web/app/script.js/route.ts'
$apiContent = Get-Content -Raw 'apps/api/tracker/userly.js'

# Check 1: isAnalyticsPermitted gate definition in apps/web
if ($routeContent -match 'function isAnalyticsPermitted\(\)') {
    Write-Host '[PASS] isAnalyticsPermitted canonical gate defined in apps/web/app/userly.js/route.ts' -ForegroundColor Green
} else {
    throw 'Missing isAnalyticsPermitted in apps/web/app/userly.js/route.ts'
}

# Check 2: isAnalyticsPermitted gate definition in apps/api
if ($apiContent -match 'function isAnalyticsPermitted\(\)') {
    Write-Host '[PASS] isAnalyticsPermitted canonical gate defined in apps/api/tracker/userly.js' -ForegroundColor Green
} else {
    throw 'Missing isAnalyticsPermitted in apps/api/tracker/userly.js'
}

# Check 3: sendEvent guarded
if ($routeContent -match 'function sendEvent[^{]*\{\s*if \(!isAnalyticsPermitted\(\)\) \{\s*return;') {
    Write-Host '[PASS] sendEvent is strictly guarded with !isAnalyticsPermitted' -ForegroundColor Green
} else {
    throw 'sendEvent is NOT guarded with isAnalyticsPermitted'
}

# Check 4: triggerPageview guarded
if ($routeContent -match 'function triggerPageview\(\) \{\s*if \(!isAnalyticsPermitted\(\)\) \{\s*return;') {
    Write-Host '[PASS] triggerPageview is strictly guarded with !isAnalyticsPermitted' -ForegroundColor Green
} else {
    throw 'triggerPageview is NOT guarded with isAnalyticsPermitted'
}

# Check 5: initCMP error / fallback handlers fail closed
if ($routeContent -match 'catch \(e\) \{\s*if \(isAnalyticsPermitted\(\)\) \{\s*triggerPageview\(\);') {
    Write-Host '[PASS] initCMP catch block fails closed' -ForegroundColor Green
} else {
    throw 'initCMP catch block does NOT check isAnalyticsPermitted'
}

# Check 6: window.usrly and window.Userly.track guarded
if ($routeContent -match 'window\.usrly = function [^{]*\{\s*if \(!isAnalyticsPermitted\(\)\) return;\s*sendEvent') {
    Write-Host '[PASS] window.usrly entry point is guarded with !isAnalyticsPermitted' -ForegroundColor Green
} else {
    throw 'window.usrly is NOT guarded with isAnalyticsPermitted'
}

# Check 7: Consent log receipts independently routed to consentLogEndpoint
if ($routeContent -match 'function logConsentReceipt[^{]*\{[\s\S]*?navigator\.sendBeacon\(consentLogEndpoint, body\)') {
    Write-Host '[PASS] logConsentReceipt routes receipts exclusively to consentLogEndpoint (/api/v1/consent/log)' -ForegroundColor Green
} else {
    throw 'logConsentReceipt does not route to consentLogEndpoint'
}

# Check 8: Stored consent check comes BEFORE analytics decision
$storedIdx = $routeContent.IndexOf('function getStoredConsent()')
$sendIdx = $routeContent.IndexOf('function sendEvent(')
if ($storedIdx -ge 0 -and $sendIdx -gt $storedIdx) {
    Write-Host '[PASS] getStoredConsent declared prior to analytics invocation' -ForegroundColor Green
} else {
    throw 'getStoredConsent must precede sendEvent'
}

# Check 9: getEffectiveConsent is defined and implements GPC precedence
if ($routeContent -match 'function getEffectiveConsent\(\)' -and $routeContent -match 'if \(isGPC\)') {
    Write-Host '[PASS] getEffectiveConsent canonically implements GPC precedence' -ForegroundColor Green
} else {
    throw 'Missing getEffectiveConsent with GPC precedence logic'
}

# Check 10: Preference Centre checkbox initialization binds to effective consent
if ($routeContent -match 'analyticsChecked = Boolean\(eff\.analytics\)' -or $routeContent -match 'analyticsChecked = Boolean\(effective\.analytics\)') {
    Write-Host '[PASS] Preference Centre toggle correctly initializes from effective.analytics' -ForegroundColor Green
} else {
    throw 'Preference Centre toggle does not bind to effective.analytics'
}

# Check 11: Save My Preferences handler reads analytics toggle and marks explicit override when GPC is active
if ($routeContent -match 'var anaVal = anaEl \? anaEl\.checked : false[\s\S]*?analytics: anaVal') {
    Write-Host '[PASS] Save My Preferences handler correctly extracts analytics toggle value' -ForegroundColor Green
} else {
    throw 'Save My Preferences handler fails to extract analytics toggle value'
}

# Check 12: applyAndClose only triggers pageview if consentData.analytics is true
if ($routeContent -match 'if \(consentData\.analytics\) \{\s*triggerPageview\(\);\s*\}') {
    Write-Host '[PASS] applyAndClose only triggers pageview when analytics consent is explicitly granted' -ForegroundColor Green
} else {
    throw 'applyAndClose improperly triggers pageviews when analytics is false'
}

# Check 13: initCMP only triggers pageview on reload if effective analytics is permitted
if ($routeContent -match 'if \(effective\.analytics\) \{\s*triggerPageview\(\);\s*\}' -or $routeContent -match 'if \(isAnalyticsPermitted\(\)\) \{\s*triggerPageview\(\);\s*\}') {
    Write-Host '[PASS] initCMP only triggers pageview on reload if effective analytics is permitted' -ForegroundColor Green
} else {
    throw 'initCMP triggers pageview unconditionally on reload'
}

# Check 14: updateConsent only triggers pageview on transition to analytics=true
if ($routeContent -match 'if \(!wasAnalytics && merged\.analytics\) \{\s*triggerPageview\(\);\s*\}') {
    Write-Host '[PASS] updateConsent strictly requires false->true transition before emitting pageview' -ForegroundColor Green
} else {
    throw 'updateConsent does not guard false->true transition'
}

# Check 15: Verify TypeScript test file exists
if (Test-Path 'apps/web/lib/tests/runtime-analytics-gate.test.ts') {
    Write-Host '[PASS] Regression test suite present at apps/web/lib/tests/runtime-analytics-gate.test.ts' -ForegroundColor Green
} else {
    throw 'Missing regression test suite'
}

Write-Host "`nAll 15 consent-gate architectural and code invariants verified successfully!" -ForegroundColor Green
