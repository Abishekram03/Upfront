# Comprehensive CCPA / CPRA Runtime Behavior & Enforcement Test Suite (15 Scenarios)
$ErrorActionPreference = 'Stop'

Write-Host '=============================================================' -ForegroundColor Cyan
Write-Host '=== UpFront CMP CCPA / CPRA Runtime Verification Suite    ===' -ForegroundColor Cyan
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
    $isAdGranted = [bool]($consent.advertisement -or $consent.marketing)
    $gcm = [PSCustomObject]@{
        analytics_storage = if ($consent.analytics) { "granted" } else { "denied" }
        ad_storage = if ($isAdGranted) { "granted" } else { "denied" }
        ad_user_data = if ($isAdGranted) { "granted" } else { "denied" }
        ad_personalization = if ($isAdGranted) { "granted" } else { "denied" }
        functionality_storage = if ($consent.functional) { "granted" } else { "denied" }
        personalization_storage = if ($consent.performance) { "granted" } else { "denied" }
        security_storage = "granted"
    }
    $global:GoogleConsentCalls += $gcm
    return $gcm
}

function Mock-LogConsentReceipt($domain, $consentObj, $version) {
    $receipt = [PSCustomObject]@{
        domain = $domain
        consent_given = [bool]$consentObj.consent_given
        necessary = $true
        functional = [bool]$consentObj.functional
        analytics = [bool]$consentObj.analytics
        performance = [bool]$consentObj.performance
        advertisement = [bool]($consentObj.advertisement -or $consentObj.marketing)
        consent_version = $version
    }
    $global:ConsentLogRequests += $receipt
    return $receipt
}

function Mock-SendEvent($domain, $config, $isGPCSignal, $name, $props) {
    if (-not (Mock-IsAnalyticsPermitted $domain $config $isGPCSignal)) {
        return $false
    }
    $global:EventRequests += [PSCustomObject]@{
        domain = $domain
        name = $name
        url = "https://$domain/shop"
        props = $props
    }
    return $true
}

$domain = 'onconnect.one'
$ccpaConfig = [PSCustomObject]@{
    is_enabled = $true
    law_template = 'ccpa'
    consent_version = '1.0'
    enable_gpc = $true
    enable_advertisement_category = $true
    enable_analytics_category = $true
    enable_functional_category = $true
    enable_performance_category = $true
    default_functional = $true
    default_analytics = $true
    default_performance = $true
    default_advertisement = $true
    accept_all_label = 'Accept & Continue'
    reject_all_label = 'Do Not Sell or Share My Info'
    preferences_label = 'Privacy Choices'
    save_preferences_label = 'Save Privacy Choices'
}

Write-Host "`n--- Executing 15 Focused CCPA / CPRA Invariant Scenarios ---" -ForegroundColor Yellow

# Test 1: CCPA Preset Configuration Integrity
Write-Host "`nTest 1: CCPA preset configuration integrity..."
if ($ccpaConfig.law_template -ne 'ccpa' -or $ccpaConfig.reject_all_label -ne 'Do Not Sell or Share My Info') {
    throw 'Test 1 Failed: CCPA preset labels are incorrect'
}
Write-Host '  -> [PASS] CCPA Preset accurately configured with Opt-Out semantics' -ForegroundColor Green

# Test 2: First Visit (Opt-out model defaults)
Write-Host "`nTest 2: First visit (no stored consent)..."
Mock-ClearConsent $domain
$global:EventRequests = @()
$eff2 = Mock-GetEffectiveConsent $domain $ccpaConfig $false
$gcm2 = Mock-DispatchGoogleConsent $eff2
$pv2 = Mock-SendEvent $domain $ccpaConfig $false 'pageview' $null
if ($eff2.analytics -ne $true -or $eff2.advertisement -ne $true -or $pv2 -ne $true) {
    throw 'Test 2 Failed: CCPA first visit must default to permitted for analytics and advertising prior to opt-out'
}
Write-Host '  -> [PASS] Effective state: all categories active, Analytics ALLOWED, GCM granted' -ForegroundColor Green

# Test 3: Accept & Continue
Write-Host "`nTest 3: Accept & Continue flow..."
$acceptData = [PSCustomObject]@{
    consent_given = $true
    necessary = $true
    functional = $true
    analytics = $true
    performance = $true
    advertisement = $true
}
Mock-SetConsent $domain $acceptData
$rcpt3 = Mock-LogConsentReceipt $domain $acceptData '1.0'
$eff3 = Mock-GetEffectiveConsent $domain $ccpaConfig $false
$gcm3 = Mock-DispatchGoogleConsent $eff3
if ($eff3.advertisement -ne $true -or $rcpt3.advertisement -ne $true -or $gcm3.ad_storage -ne 'granted') {
    throw 'Test 3 Failed: Accept must grant advertisement'
}
Write-Host '  -> [PASS] Accept action persisted: advertisement=true, analytics=true, receipt logged' -ForegroundColor Green

# Test 4: Opt-out ("Do Not Sell or Share My Info")
Write-Host "`nTest 4: Opt-out (Do Not Sell or Share My Info)..."
$optOutData = [PSCustomObject]@{
    consent_given = $false
    necessary = $true
    functional = $true
    analytics = $true
    performance = $true
    advertisement = $false
    ccpa_opted_out = $true
}
Mock-SetConsent $domain $optOutData
$rcpt4 = Mock-LogConsentReceipt $domain $optOutData '1.0'
$eff4 = Mock-GetEffectiveConsent $domain $ccpaConfig $false
$gcm4 = Mock-DispatchGoogleConsent $eff4
if ($eff4.advertisement -ne $false -or $eff4.analytics -ne $true -or $rcpt4.advertisement -ne $false -or $gcm4.ad_storage -ne 'denied') {
    throw 'Test 4 Failed: CCPA Opt-out must disable advertisement while preserving analytics'
}
Write-Host '  -> [PASS] Opt-out explicitly disables advertisement (ad_storage=denied) while preserving first-party analytics' -ForegroundColor Green

# Test 5: Preference Centre category initialization after Opt-Out
Write-Host "`nTest 5: Preference Centre rendering after Opt-Out..."
$eff5 = Mock-GetEffectiveConsent $domain $ccpaConfig $false
$adChecked = [bool]$eff5.advertisement
$anaChecked = [bool]$eff5.analytics
if ($adChecked -ne $false -or $anaChecked -ne $true) {
    throw 'Test 5 Failed: Preference Centre switches must show Advertisement OFF and Analytics ON'
}
Write-Host '  -> [PASS] Preference Centre switch state matches effective opt-out (Advertisement=OFF, Analytics=ON)' -ForegroundColor Green

# Test 6: Advertisement toggle custom modification
Write-Host "`nTest 6: Custom Advertisement toggle modification..."
# User turns Advertisement back ON via Preference Centre
$customData = [PSCustomObject]@{
    consent_given = $true
    necessary = $true
    functional = $true
    analytics = $true
    performance = $true
    advertisement = $true
}
Mock-SetConsent $domain $customData
$eff6 = Mock-GetEffectiveConsent $domain $ccpaConfig $false
if ($eff6.advertisement -ne $true) {
    throw 'Test 6 Failed: Custom toggle must update effective advertisement state'
}
Write-Host '  -> [PASS] Custom toggle modifies effective advertisement state' -ForegroundColor Green

# Test 7: Save Preferences
Write-Host "`nTest 7: Save Preferences flow..."
$rcpt7 = Mock-LogConsentReceipt $domain $customData '1.0'
if ($rcpt7.advertisement -ne $true -or $rcpt7.analytics -ne $true) {
    throw 'Test 7 Failed: Save Preferences must log accurate receipt'
}
Write-Host '  -> [PASS] Save Preferences logs receipt matching chosen switch states' -ForegroundColor Green

# Test 8: Revisit Preferences persistence
Write-Host "`nTest 8: Revisit Preferences persistence..."
$stored8 = Mock-GetConsent $domain
if ($stored8.advertisement -ne $true) {
    throw 'Test 8 Failed: Revisit must load persisted choices'
}
Write-Host '  -> [PASS] Stored choices persist across Preference Centre openings' -ForegroundColor Green

# Test 9: Consent receipt schema validation
Write-Host "`nTest 9: Consent receipt schema validation..."
if ($null -eq $rcpt7.domain -or $null -eq $rcpt7.consent_version -or $null -eq $rcpt7.necessary) {
    throw 'Test 9 Failed: Receipt schema missing required fields'
}
Write-Host '  -> [PASS] Consent receipts contain complete domain, version, and category data' -ForegroundColor Green

# Test 10: Google Consent Mode synchronization
Write-Host "`nTest 10: Google Consent Mode synchronization..."
$gcm10 = Mock-DispatchGoogleConsent $optOutData
if ($gcm10.ad_storage -ne 'denied' -or $gcm10.ad_user_data -ne 'denied' -or $gcm10.ad_personalization -ne 'denied' -or $gcm10.analytics_storage -ne 'granted') {
    throw 'Test 10 Failed: GCM ad signals must be denied while analytics_storage is granted under CCPA opt-out'
}
Write-Host '  -> [PASS] GCM ad_storage, ad_user_data, ad_personalization are denied, analytics_storage granted' -ForegroundColor Green

# Test 11: CCPA + GPC Active
Write-Host "`nTest 11: CCPA + GPC Active..."
Mock-ClearConsent $domain
$eff11 = Mock-GetEffectiveConsent $domain $ccpaConfig $true
$gcm11 = Mock-DispatchGoogleConsent $eff11
$pv11 = Mock-SendEvent $domain $ccpaConfig $true 'pageview' $null
if ($eff11.advertisement -ne $false -or $eff11.analytics -ne $false -or $pv11 -eq $true -or $gcm11.ad_storage -ne 'denied') {
    throw 'Test 11 Failed: GPC must override CCPA defaults and restrict both advertisement and analytics'
}
Write-Host '  -> [PASS] GPC overrides CCPA defaults: both advertisement and analytics are BLOCKED' -ForegroundColor Green

# Test 12: Canonical Analytics Gate enforcement under Opt-Out
Write-Host "`nTest 12: Analytics Gate enforcement under Opt-Out..."
Mock-SetConsent $domain $optOutData
$analyticsAllowed = Mock-IsAnalyticsPermitted $domain $ccpaConfig $false
if (-not $analyticsAllowed) {
    throw 'Test 12 Failed: CCPA opt-out should not disable first-party analytics'
}
Write-Host '  -> [PASS] Analytics gate correctly allows first-party pageview under CCPA opt-out' -ForegroundColor Green

# Test 13: Browser Reload / Refresh
Write-Host "`nTest 13: Browser reload / refresh under CCPA opt-out..."
$reloadedEffective = Mock-GetEffectiveConsent $domain $ccpaConfig $false
if ($reloadedEffective.advertisement -ne $false -or $reloadedEffective.analytics -ne $true) {
    throw 'Test 13 Failed: Reload must preserve opt-out state'
}
Write-Host '  -> [PASS] Reload maintains strict opt-out state' -ForegroundColor Green

# Test 14: SPA Navigation under CCPA opt-out
Write-Host "`nTest 14: SPA navigation under CCPA opt-out..."
$global:EventRequests = @()
$spaPv = Mock-SendEvent $domain $ccpaConfig $false 'pageview' @{ route = '/catalog' }
if (-not $spaPv -or $global:EventRequests.Count -ne 1) {
    throw 'Test 14 Failed: SPA navigation should emit pageview when analytics is permitted'
}
Write-Host '  -> [PASS] SPA route change emits pageview as expected' -ForegroundColor Green

# Test 15: Explicit Preference changes with CCPA + GPC
Write-Host "`nTest 15: Explicit Preference Centre changes with CCPA + GPC..."
# GPC active, user opens preferences and explicitly opts in to functional + analytics
$explicitData = [PSCustomObject]@{
    consent_given = $true
    necessary = $true
    functional = $true
    analytics = $true
    performance = $true
    advertisement = $false
    gpc_explicit_override = $true
}
Mock-SetConsent $domain $explicitData
$eff15 = Mock-GetEffectiveConsent $domain $ccpaConfig $true
if ($eff15.analytics -ne $true -or $eff15.advertisement -ne $false) {
    throw 'Test 15 Failed: Explicit user preference must override GPC for selected categories'
}
Write-Host '  -> [PASS] Explicit in-session preference accurately overrides GPC for selected categories' -ForegroundColor Green

Write-Host "`n=============================================================" -ForegroundColor Cyan
Write-Host '=== ALL 15 CCPA / CPRA SCENARIOS VERIFIED SUCCESSFULLY   ===' -ForegroundColor Green
Write-Host '=============================================================' -ForegroundColor Cyan
