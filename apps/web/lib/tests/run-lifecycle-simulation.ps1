# End-to-end Consent Withdrawal Lifecycle Simulation in PowerShell
$ErrorActionPreference = 'Stop'

Write-Host '=== UpFront CMP Full Lifecycle Simulation Runner ===' -ForegroundColor Cyan

$global:Storage = @{}
$global:EventRequests = @()
$global:ConsentLogRequests = @()

function Mock-SetConsent($domain, $consentObj) {
    $global:Storage["usrly_consent_$domain"] = ($consentObj | ConvertTo-Json -Compress)
}

function Mock-GetConsent($domain) {
    $raw = $global:Storage["usrly_consent_$domain"]
    if ($null -eq $raw) { return $null }
    return ($raw | ConvertFrom-Json)
}

function Is-AnalyticsPermitted($domain, $config) {
    $stored = Mock-GetConsent $domain
    if ($null -ne $stored) {
        return [bool]$stored.analytics
    }
    if ($null -ne $config) {
        if (-not $config.is_enabled) { return $true }
        if ($config.law_template -eq 'notice_only') { return $true }
        if ($config.law_template -eq 'ccpa') {
            return $config.default_analytics -ne $false
        }
        return $false
    }
    return $false
}

function Mock-SendEvent($domain, $config, $name, $props) {
    if (-not (Is-AnalyticsPermitted $domain $config)) {
        return $false
    }
    $global:EventRequests += [PSCustomObject]@{
        domain = $domain
        name = $name
        url = "https://$domain/dashboard"
        props = $props
    }
    return $true
}

function Mock-LogConsentReceipt($domain, $consentObj, $version) {
    $global:ConsentLogRequests += [PSCustomObject]@{
        domain = $domain
        consent_given = $consentObj.consent_given
        necessary = $true
        functional = [bool]$consentObj.functional
        analytics = [bool]$consentObj.analytics
        performance = [bool]$consentObj.performance
        advertisement = [bool]$consentObj.advertisement
        consent_version = $version
    }
}

function Mock-ApplyAndClose($domain, $config, $consentData) {
    $consentData | Add-Member -NotePropertyName 'consent_version' -NotePropertyValue ($config.consent_version) -Force
    $consentData | Add-Member -NotePropertyName 'timestamp' -NotePropertyValue (Get-Date -Format 'o') -Force
    Mock-SetConsent $domain $consentData
    Mock-LogConsentReceipt $domain $consentData $config.consent_version
    
    if ($consentData.analytics) {
        Mock-SendEvent $domain $config 'pageview' $null
    }
}

$domain = 'onconnect.one'
$config = [PSCustomObject]@{
    is_enabled = $true
    law_template = 'gdpr'
    consent_version = '1.0'
    enable_analytics_category = $true
    default_analytics = $false
}

# PHASE 1: Initial Visit (GDPR opt-in)
Write-Host "`n1. Testing Initial Visit (No Consent)..." -ForegroundColor Yellow
$emitted = Mock-SendEvent $domain $config 'pageview' $null
if ($emitted -or $global:EventRequests.Count -ne 0) {
    throw 'FAIL: Initial visit without consent must NOT emit pageview'
}
Write-Host '[PASS] Initial visit produced 0 pageviews.' -ForegroundColor Green

# PHASE 2: Accept All
Write-Host "`n2. Testing Accept All..." -ForegroundColor Yellow
$acceptAllData = [PSCustomObject]@{
    consent_given = $true
    necessary = $true
    functional = $true
    analytics = $true
    performance = $true
    advertisement = $true
}
Mock-ApplyAndClose $domain $config $acceptAllData

if ($global:EventRequests.Count -ne 1) {
    throw "FAIL: Accept All must emit exactly 1 pageview. Got $($global:EventRequests.Count)"
}
if ($global:ConsentLogRequests.Count -ne 1 -or $global:ConsentLogRequests[0].analytics -ne $true) {
    throw 'FAIL: Consent receipt must log analytics=true'
}
Write-Host '[PASS] Accept All emitted 1 pageview and logged consent receipt (analytics=true).' -ForegroundColor Green

# PHASE 3: Revisit Consent -> Turn Analytics OFF -> Save
Write-Host "`n3. Testing Revisit Consent -> Analytics OFF -> Save..." -ForegroundColor Yellow
$withdrawData = [PSCustomObject]@{
    consent_given = $true
    necessary = $true
    functional = $true
    analytics = $false
    performance = $true
    advertisement = $true
}
Mock-ApplyAndClose $domain $config $withdrawData

if ($global:EventRequests.Count -ne 1) {
    throw "FAIL: Saving Analytics OFF must NOT emit any new pageviews. Total count: $($global:EventRequests.Count)"
}
if ($global:ConsentLogRequests.Count -ne 2 -or $global:ConsentLogRequests[1].analytics -ne $false) {
    throw 'FAIL: Consent receipt for withdrawal must log analytics=false'
}
$storedAfterWithdrawal = Mock-GetConsent $domain
if ($storedAfterWithdrawal.analytics -ne $false -or $storedAfterWithdrawal.necessary -ne $true) {
    throw 'FAIL: Stored consent must have necessary=true, analytics=false'
}
Write-Host '[PASS] Analytics withdrawal persisted (analytics=false) and logged receipt with 0 new pageviews.' -ForegroundColor Green

# PHASE 4: Delayed Callback / Async Execution during same page lifecycle
Write-Host "`n4. Testing Delayed/Asynchronous Callback after Withdrawal..." -ForegroundColor Yellow
$delayedEmitted = Mock-SendEvent $domain $config 'custom_track' @{ action = 'delayed' }
if ($delayedEmitted -or $global:EventRequests.Count -ne 1) {
    throw 'FAIL: Delayed callback must be blocked when analytics=false'
}
Write-Host '[PASS] Delayed callback was strictly blocked.' -ForegroundColor Green

# PHASE 5: SPA Navigation during same page lifecycle
Write-Host "`n5. Testing SPA Navigation after Withdrawal..." -ForegroundColor Yellow
$spaEmitted = Mock-SendEvent $domain $config 'pageview' @{ route = '/settings' }
if ($spaEmitted -or $global:EventRequests.Count -ne 1) {
    throw 'FAIL: SPA Navigation must be blocked when analytics=false'
}
Write-Host '[PASS] SPA route changes produced 0 pageviews.' -ForegroundColor Green

# PHASE 6: Full Page Refresh / Reload Simulation
Write-Host "`n6. Testing Full Page Refresh / Reload..." -ForegroundColor Yellow
$bootStored = Mock-GetConsent $domain
if ($null -ne $bootStored) {
    if ($bootStored.analytics) {
        Mock-SendEvent $domain $config 'pageview' $null
    }
}
if ($global:EventRequests.Count -ne 1) {
    throw 'FAIL: Reloading page with analytics=false must NOT trigger pageview'
}
Write-Host '[PASS] Full page reload with stored analytics=false emitted 0 pageviews.' -ForegroundColor Green

# PHASE 7: Re-Opt-In (Analytics OFF -> Analytics ON)
Write-Host "`n7. Testing Re-Enabling Analytics (OFF -> ON)..." -ForegroundColor Yellow
$reEnableData = [PSCustomObject]@{
    consent_given = $true
    necessary = $true
    functional = $true
    analytics = $true
    performance = $true
    advertisement = $true
}
Mock-ApplyAndClose $domain $config $reEnableData
if ($global:EventRequests.Count -ne 2) {
    throw "FAIL: Re-enabling Analytics must emit pageview. Expected total 2, got $($global:EventRequests.Count)"
}
$storedReEnabled = Mock-GetConsent $domain
if ($storedReEnabled.analytics -ne $true) {
    throw 'FAIL: Stored consent must reflect analytics=true'
}
Write-Host '[PASS] Re-enabling Analytics cleanly emitted pageview and updated persisted state.' -ForegroundColor Green

Write-Host "`nAll 7 lifecycle phases passed verification successfully!" -ForegroundColor Green
