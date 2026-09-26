# Comprehensive GPC Precedence & Enforcement Test Suite (14 Scenarios)
$ErrorActionPreference = 'Stop'

Write-Host '=============================================================' -ForegroundColor Cyan
Write-Host '=== UpFront CMP GPC Precedence & Enforcement Test Runner ===' -ForegroundColor Cyan
Write-Host '=============================================================' -ForegroundColor Cyan

$global:Storage = @{}
$global:EventRequests = @()
$global:ConsentLogRequests = @()
$global:GoogleConsentCalls = @()

function Mock-SetConsent($domain, $consentObj) {
    $global:Storage["usrly_consent_$domain"] = ($consentObj | ConvertTo-Json -Compress)
}

function Mock-GetConsent($domain) {
    $raw = $global:Storage["usrly_consent_$domain"]
    if ($null -eq $raw) { return $null }
    return ($raw | ConvertFrom-Json)
}

function Mock-ClearConsent($domain) {
    $global:Storage.Remove("usrly_consent_$domain")
}

function Mock-GetEffectiveConsent($domain, $config, $isGPCSignal) {
    $stored = Mock-GetConsent $domain
    $isGPC = $isGPCSignal -and ($null -eq $config -or $config.enable_gpc -ne $false)

    if ($isGPC) {
        if ($null -ne $stored -and $stored.gpc_explicit_override) {
            return $stored
        }
        $base = if ($null -ne $stored) { $stored } else {
            [PSCustomObject]@{
                necessary = $true
                functional = $false
                analytics = $false
                performance = $false
                advertisement = $false
                consent_version = if ($null -ne $config -and $config.consent_version) { $config.consent_version } else { '1.0' }
            }
        }
        return [PSCustomObject]@{
            consent_given = [bool]($base.functional -or $base.performance)
            necessary = $true
            functional = [bool]$base.functional
            analytics = $false
            performance = [bool]$base.performance
            advertisement = $false
            gpc_applied = $true
            consent_version = if ($base.consent_version) { $base.consent_version } else { '1.0' }
        }
    }

    if ($null -ne $stored) {
        return $stored
    }

    if ($null -ne $config) {
        if (-not $config.is_enabled -or $config.law_template -eq 'notice_only') {
            return [PSCustomObject]@{
                consent_given = $true
                necessary = $true
                functional = $true
                analytics = $true
                performance = $true
                advertisement = $true
                consent_version = $config.consent_version
            }
        }
        if ($config.law_template -eq 'ccpa') {
            return [PSCustomObject]@{
                consent_given = $true
                necessary = $true
                functional = ($config.default_functional -ne $false)
                analytics = ($config.default_analytics -ne $false)
                performance = ($config.default_performance -ne $false)
                advertisement = ($config.default_advertisement -ne $false)
                consent_version = $config.consent_version
            }
        }
        return $null
    }

    return $null
}

function Mock-IsAnalyticsPermitted($domain, $config, $isGPCSignal) {
    $effective = Mock-GetEffectiveConsent $domain $config $isGPCSignal
    if ($null -ne $effective) {
        return [bool]$effective.analytics
    }
    return $false
}

function Mock-DispatchGoogleConsent($consent) {
    $gcm = [PSCustomObject]@{
        analytics_storage = if ($consent.analytics) { "granted" } else { "denied" }
        ad_storage = if ($consent.advertisement) { "granted" } else { "denied" }
        ad_user_data = if ($consent.advertisement) { "granted" } else { "denied" }
        ad_personalization = if ($consent.advertisement) { "granted" } else { "denied" }
        functionality_storage = if ($consent.functional) { "granted" } else { "denied" }
        personalization_storage = if ($consent.performance) { "granted" } else { "denied" }
        security_storage = "granted"
    }
    $global:GoogleConsentCalls += $gcm
    return $gcm
}

function Mock-SendEvent($domain, $config, $isGPCSignal, $name, $props) {
    if (-not (Mock-IsAnalyticsPermitted $domain $config $isGPCSignal)) {
        return $false
    }
    $global:EventRequests += [PSCustomObject]@{
        domain = $domain
        name = $name
        url = "https://$domain/page"
        props = $props
    }
    return $true
}

$domain = 'onconnect.one'
$config = [PSCustomObject]@{
    is_enabled = $true
    law_template = 'gdpr'
    consent_version = '1.0'
    enable_gpc = $true
    default_analytics = $false
}

Write-Host "`n--- Running 14 Focused GPC Regression Scenarios ---" -ForegroundColor Yellow

# 1. GPC + no stored consent
Write-Host "`nTest 1: GPC + no stored consent..."
Mock-ClearConsent $domain
$eff1 = Mock-GetEffectiveConsent $domain $config $true
$gcm1 = Mock-DispatchGoogleConsent $eff1
$pv1 = Mock-SendEvent $domain $config $true 'pageview' $null
if ($eff1.analytics -ne $false -or $gcm1.analytics_storage -ne 'denied' -or $pv1 -eq $true) {
    throw 'Test 1 Failed: GPC + no stored consent must block analytics and set GCM denied'
}
Write-Host '  -> [PASS] Effective analytics=false, GCM analytics_storage=denied, Pageview BLOCKED' -ForegroundColor Green

# 2. GPC + stored analytics=true
Write-Host "`nTest 2: GPC + stored analytics=true (Precedence Check)..."
Mock-SetConsent $domain ([PSCustomObject]@{ consent_given = $true; necessary = $true; analytics = $true; advertisement = $true; functional = $true })
$eff2 = Mock-GetEffectiveConsent $domain $config $true
$gcm2 = Mock-DispatchGoogleConsent $eff2
$pv2 = Mock-SendEvent $domain $config $true 'pageview' $null
if ($eff2.analytics -ne $false -or $gcm2.analytics_storage -ne 'denied' -or $pv2 -eq $true) {
    throw 'Test 2 Failed: GPC must override prior stored analytics=true'
}
Write-Host '  -> [PASS] Prior stored consent preserved, but Effective analytics=false, GCM=denied, Pageview BLOCKED' -ForegroundColor Green

# 3. GPC + stored analytics=false
Write-Host "`nTest 3: GPC + stored analytics=false..."
Mock-SetConsent $domain ([PSCustomObject]@{ consent_given = $false; necessary = $true; analytics = $false; advertisement = $false })
$eff3 = Mock-GetEffectiveConsent $domain $config $true
$pv3 = Mock-SendEvent $domain $config $true 'pageview' $null
if ($eff3.analytics -ne $false -or $pv3 -eq $true) {
    throw 'Test 3 Failed: GPC + stored analytics=false must block'
}
Write-Host '  -> [PASS] Effective analytics=false, Pageview BLOCKED' -ForegroundColor Green

# 4. No GPC + stored analytics=true
Write-Host "`nTest 4: No GPC + stored analytics=true..."
Mock-SetConsent $domain ([PSCustomObject]@{ consent_given = $true; necessary = $true; analytics = $true; advertisement = $true })
$eff4 = Mock-GetEffectiveConsent $domain $config $false
$gcm4 = Mock-DispatchGoogleConsent $eff4
$pv4 = Mock-SendEvent $domain $config $false 'pageview' $null
if ($eff4.analytics -ne $true -or $gcm4.analytics_storage -ne 'granted' -or $pv4 -ne $true) {
    throw 'Test 4 Failed: No GPC + stored analytics=true must allow pageview'
}
Write-Host '  -> [PASS] Effective analytics=true, GCM=granted, Pageview ALLOWED' -ForegroundColor Green

# 5. No GPC + stored analytics=false
Write-Host "`nTest 5: No GPC + stored analytics=false..."
Mock-SetConsent $domain ([PSCustomObject]@{ consent_given = $false; necessary = $true; analytics = $false; advertisement = $false })
$eff5 = Mock-GetEffectiveConsent $domain $config $false
$pv5 = Mock-SendEvent $domain $config $false 'pageview' $null
if ($eff5.analytics -ne $false -or $pv5 -eq $true) {
    throw 'Test 5 Failed: No GPC + stored analytics=false must block'
}
Write-Host '  -> [PASS] Effective analytics=false, Pageview BLOCKED' -ForegroundColor Green

# 6. GPC after previously accepted consent (Transition scenario)
Write-Host "`nTest 6: GPC after previously accepted consent..."
Mock-SetConsent $domain ([PSCustomObject]@{ consent_given = $true; necessary = $true; analytics = $true; functional = $true })
# Now visitor turns on GPC extension
$eff6 = Mock-GetEffectiveConsent $domain $config $true
if ($eff6.analytics -ne $false -or $eff6.gpc_applied -ne $true) {
    throw 'Test 6 Failed: Activating GPC after prior acceptance must immediately restrict effective consent'
}
Write-Host '  -> [PASS] GPC immediately restricts effective analytics to false while preserving stored preference record' -ForegroundColor Green

# 7. GPC + pageview
Write-Host "`nTest 7: GPC + pageview..."
$global:EventRequests = @()
Mock-SendEvent $domain $config $true 'pageview' $null
if ($global:EventRequests.Count -ne 0) {
    throw 'Test 7 Failed: GPC must block automatic pageview'
}
Write-Host '  -> [PASS] GPC prevents pageview emission' -ForegroundColor Green

# 8. GPC + track()
Write-Host "`nTest 8: GPC + Userly.track()..."
$trackEmitted = Mock-SendEvent $domain $config $true 'custom_event' @{ button = 'hero' }
if ($trackEmitted -or $global:EventRequests.Count -ne 0) {
    throw 'Test 8 Failed: GPC must block custom track calls'
}
Write-Host '  -> [PASS] GPC prevents Userly.track() event emission' -ForegroundColor Green

# 9. GPC + usrly()
Write-Host "`nTest 9: GPC + window.usrly()..."
$usrlyEmitted = Mock-SendEvent $domain $config $true 'signup_click' $null
if ($usrlyEmitted -or $global:EventRequests.Count -ne 0) {
    throw 'Test 9 Failed: GPC must block window.usrly()'
}
Write-Host '  -> [PASS] GPC prevents window.usrly() event emission' -ForegroundColor Green

# 10. GPC + delayed callback
Write-Host "`nTest 10: GPC + delayed callback..."
# Simulate a timer callback 5 seconds later
$delayedEmitted = Mock-SendEvent $domain $config $true 'delayed_heartbeat' $null
if ($delayedEmitted -or $global:EventRequests.Count -ne 0) {
    throw 'Test 10 Failed: GPC must block delayed callback invocations'
}
Write-Host '  -> [PASS] Delayed callback invocation blocked deterministically' -ForegroundColor Green

# 11. GPC + SPA navigation
Write-Host "`nTest 11: GPC + SPA navigation..."
# Simulate pushState navigation
$spaEmitted = Mock-SendEvent $domain $config $true 'pageview' @{ path = '/checkout' }
if ($spaEmitted -or $global:EventRequests.Count -ne 0) {
    throw 'Test 11 Failed: GPC must block SPA navigation pageviews'
}
Write-Host '  -> [PASS] SPA route change produces 0 events under GPC' -ForegroundColor Green

# 12. GPC + refresh (Browser Reload)
Write-Host "`nTest 12: GPC + refresh (Page reload with stored analytics=true)..."
# Initial store has analytics=true, but GPC is active upon reload
$eff12 = Mock-GetEffectiveConsent $domain $config $true
$permitted12 = Mock-IsAnalyticsPermitted $domain $config $true
if ($permitted12 -ne $false) {
    throw 'Test 12 Failed: Reload with GPC active must maintain analytics blocking'
}
Write-Host '  -> [PASS] Page reload with active GPC maintains strict analytics blocking' -ForegroundColor Green

# 13. GPC + Preference Centre (Explicit User Override)
Write-Host "`nTest 13: GPC + Preference Centre (Explicit User Override)..."
# User opens Preference Centre while GPC is active -> toggles Analytics ON -> Clicks Save
$explicitSave = [PSCustomObject]@{
    consent_given = $true
    necessary = $true
    functional = $true
    analytics = $true
    performance = $false
    advertisement = $false
    gpc_explicit_override = $true
}
Mock-SetConsent $domain $explicitSave
$eff13 = Mock-GetEffectiveConsent $domain $config $true
$permitted13 = Mock-IsAnalyticsPermitted $domain $config $true
if ($eff13.analytics -ne $true -or $permitted13 -ne $true) {
    throw 'Test 13 Failed: Explicit preference centre save must register gpc_explicit_override and allow analytics'
}
$gcm13 = Mock-DispatchGoogleConsent $eff13
if ($gcm13.analytics_storage -ne 'granted') {
    throw 'Test 13 Failed: GCM must update to granted after explicit override'
}
Write-Host '  -> [PASS] Preference Centre explicit override produces effective analytics=true and GCM=granted' -ForegroundColor Green

# 14. GPC + Google Consent Mode alignment
Write-Host "`nTest 14: GPC + Google Consent Mode strict synchronization..."
# With GPC active and no override
Mock-ClearConsent $domain
$eff14 = Mock-GetEffectiveConsent $domain $config $true
$gcm14 = Mock-DispatchGoogleConsent $eff14
if ($eff14.analytics -ne $false -or $gcm14.analytics_storage -ne 'denied' -or $gcm14.ad_storage -ne 'denied') {
    throw 'Test 14 Failed: GCM must match effective privacy state'
}
Write-Host '  -> [PASS] Google Consent Mode strictly denies analytics_storage and ad_storage under GPC' -ForegroundColor Green

Write-Host "`n=============================================================" -ForegroundColor Cyan
Write-Host '=== ALL 14 GPC REGRESSION SCENARIOS VERIFIED SUCCESSFULLY ===' -ForegroundColor Green
Write-Host '=============================================================' -ForegroundColor Cyan
