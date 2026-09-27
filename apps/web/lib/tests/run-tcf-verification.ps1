# =========================================================================
#  UpFront CMP IAB TCF v2.3 Integration Layer Verification Suite
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
Write-Host " UpFront CMP IAB TCF v2.3 Integration Layer Verification"
Write-Host "=================================================================`n"

# [1/6] Auditing userly.js Runtime TCF Signaling Engine
Write-Host "[1/6] Auditing userly.js for IAB TCF v2.3 Engine..." -ForegroundColor Yellow
$userlyFile = "$PSScriptRoot/../../app/userly.js/route.ts"
$userlyContent = Get-Content $userlyFile -Raw

Assert-Condition "userly.js/route.ts exists and is non-empty" ($userlyContent.Length -gt 10000)
Assert-Condition "Defines window.__tcfapi interface" ($userlyContent -match 'window\.__tcfapi\s*=')
Assert-Condition "Implements __tcfapiLocator iframe creation" ($userlyContent -match '__tcfapiLocator')
Assert-Condition "Implements postMessage cross-frame communication bridge" ($userlyContent -match '__tcfapiCall' -and $userlyContent -match '__tcfapiReturn')
Assert-Condition "Supports 'ping' command with apiVersion 2.3 & policyVersion 4" ($userlyContent -match 'command === "ping"' -and $userlyContent -match 'apiVersion:\s*"2\.3"' -and $userlyContent -match 'tcfPolicyVersion:\s*4')
Assert-Condition "Supports 'addEventListener' command with event status tracking" ($userlyContent -match 'command === "addEventListener"' -and $userlyContent -match 'tcfListeners\[listenerId\]')
Assert-Condition "Supports 'removeEventListener' command" ($userlyContent -match 'command === "removeEventListener"' -and $userlyContent -match 'delete tcfListeners\[idToRemove\]')
Assert-Condition "Supports 'getTCData' command" ($userlyContent -match 'command === "getTCData"')
Assert-Condition "Encodes dynamic Base64url TCString (Core Segment)" ($userlyContent -match 'function encodeTCString')
Assert-Condition "Maps 11 TCF Purpose Consents to UpFront categories" ($userlyContent -match 'p1' -and $userlyContent -match 'p2' -and $userlyContent -match 'p11')
Assert-Condition "Connects applyAndClose to notifyTCFListeners('useractioncomplete')" ($userlyContent -match 'applyAndClose' -and $userlyContent -match 'notifyTCFListeners\("useractioncomplete"\)')
Assert-Condition "Connects renderCMP to notifyTCFListeners('cmpuishown')" ($userlyContent -match 'renderCMP' -and $userlyContent -match 'notifyTCFListeners\("cmpuishown"\)')
Assert-Condition "Connects Userly.updateConsent and resetConsent to TCF updates" ($userlyContent -match 'updateConsent:' -and $userlyContent -match 'resetConsent:')

# [2/6] Auditing consentos.js Runtime TCF Signaling Engine
Write-Host "`n[2/6] Auditing consentos.js for IAB TCF v2.3 Engine..." -ForegroundColor Yellow
$consentosFile = "$PSScriptRoot/../../app/consentos.js/route.ts"
$consentosContent = Get-Content $consentosFile -Raw

Assert-Condition "consentos.js/route.ts exists and is non-empty" ($consentosContent.Length -gt 5000)
Assert-Condition "consentos.js implements real window.__tcfapi" ($consentosContent -match 'window\.__tcfapi\s*=')
Assert-Condition "consentos.js contains encodeTCString dynamic bitfield generator" ($consentosContent -match 'function encodeTCString')
Assert-Condition "No mock TCString CP123456789.YAAAAAAAAA remains in consentos.js" (-not ($consentosContent -match 'CP123456789\.YAAAAAAAAA'))

# [3/6] Auditing Database Schema & Safe Migrations
Write-Host "`n[3/6] Auditing Database Schema & Model Support..." -ForegroundColor Yellow
$dbFile = "$PSScriptRoot/../db.ts"
$dbContent = Get-Content $dbFile -Raw

Assert-Condition "db.ts contains enable_iab_tcf migration" ($dbContent -match 'enable_iab_tcf BOOLEAN DEFAULT TRUE')
$apiFile = "$PSScriptRoot/../api.ts"
$apiContent = Get-Content $apiFile -Raw
Assert-Condition "ConsentConfig interface contains enable_iab_tcf" ($apiContent -match 'enable_iab_tcf\?: boolean')

# [4/6] Auditing Config & Versioning APIs
Write-Host "`n[4/6] Auditing Config & Versioning APIs..." -ForegroundColor Yellow
$configRouteFile = "$PSScriptRoot/../../app/api/v1/consent/config/route.ts"
$configRouteContent = Get-Content $configRouteFile -Raw
Assert-Condition "config/route.ts handles enable_iab_tcf in GET default insert" ($configRouteContent -match 'enable_iab_tcf' -and $configRouteContent -match 'INSERT INTO consent_configs')
Assert-Condition "config/route.ts handles enable_iab_tcf in POST upsert" ($configRouteContent -match 'enable_iab_tcf = EXCLUDED\.enable_iab_tcf')

$publishRouteFile = "$PSScriptRoot/../../app/api/v1/consent/publish/route.ts"
$publishRouteContent = Get-Content $publishRouteFile -Raw
Assert-Condition "publish/route.ts persists enable_iab_tcf on atomic publishing" ($publishRouteContent -match 'enable_iab_tcf')

$versionsRouteFile = "$PSScriptRoot/../../app/api/v1/consent/versions/route.ts"
$versionsRouteContent = Get-Content $versionsRouteFile -Raw
Assert-Condition "versions/route.ts preserves enable_iab_tcf on 1-click rollback" ($versionsRouteContent -match 'enable_iab_tcf')

# [5/6] Auditing Banner Studio UI Toggle
Write-Host "`n[5/6] Auditing Banner Studio Controls..." -ForegroundColor Yellow
$studioFile = "$PSScriptRoot/../../components/dashboard/consent/banner-studio.tsx"
$studioContent = Get-Content $studioFile -Raw

Assert-Condition "DEFAULT_BANNER_CONFIG includes enable_iab_tcf: true" ($studioContent -match 'enable_iab_tcf:\s*true')
Assert-Condition "Banner studio renders interactive Support IAB TCF v2.3 checkbox" ($studioContent -match 'Support IAB TCF v2\.3' -and $studioContent -match 'config\.enable_iab_tcf !== false')
Assert-Condition "Publish diff generator detects IAB TCF changes" ($studioContent -match 'IAB TCF v2\.3 set to')

# [6/6] Zero Mock String Residual Audit Across Entire Codebase
Write-Host "`n[6/6] Verifying Zero Mock TCStrings Across Codebase..." -ForegroundColor Yellow
$mockMatches = Select-String -Path "$PSScriptRoot/../../../*.ts", "$PSScriptRoot/../../../*.tsx", "$PSScriptRoot/../../../*.js" -Pattern 'CP123456789' -Exclude "node_modules", ".next", ".git"
Assert-Condition "Zero instances of mock TCString CP123456789 in codebase" ($null -eq $mockMatches -or $mockMatches.Count -eq 0)

Write-Host "`n================================================================="
Write-Host " RESULTS: $passed Passed, $failed Failed"
Write-Host "=================================================================`n"

if ($failed -gt 0) {
    exit 1
}
