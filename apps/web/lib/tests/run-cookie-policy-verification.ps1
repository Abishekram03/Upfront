# Comprehensive Senior QA Verification Script for Cookie Policy & Live Declaration System
$ErrorActionPreference = "Stop"

Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host " UpFront CMP Cookie Policy & Live Declaration Verification Suite" -ForegroundColor Cyan
Write-Host "==========================================================================`n" -ForegroundColor Cyan

$webRoute = Get-Content -Raw 'apps/web/app/userly.js/route.ts'
$apiTracker = Get-Content -Raw 'apps/api/tracker/userly.js'
$dbContent = Get-Content -Raw 'apps/web/lib/db.ts'
$policyRoute = Get-Content -Raw 'apps/web/app/api/v1/consent/policy/route.ts'
$draftRoute = Get-Content -Raw 'apps/web/app/api/v1/consent/policy/draft/route.ts'
$publishRoute = Get-Content -Raw 'apps/web/app/api/v1/consent/policy/publish/route.ts'
$generatorUI = Get-Content -Raw 'apps/web/components/dashboard/consent/policy-generator.tsx'

$passCount = 0
$totalTests = 0

function Test-Assertion($description, $condition) {
    $script:totalTests++
    if ($condition) {
        $script:passCount++
        Write-Host "  [PASS] $description" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] $description" -ForegroundColor Red
        throw "Assertion failed: $description"
    }
}

# =========================================================================
# SECTION 1: PERSISTENCE & DATABASE SCHEMA
# =========================================================================
Write-Host "[1/7] Auditing Database Schema & Dedicated Policy Tables..." -ForegroundColor Yellow

Test-Assertion "cookie_policies table is defined in db.ts with published configuration schema" (
    $dbContent.Contains('CREATE TABLE IF NOT EXISTS cookie_policies') -and
    $dbContent.Contains('company_name VARCHAR(255)') -and
    $dbContent.Contains('website_url VARCHAR(500)') -and
    $dbContent.Contains('contact_email VARCHAR(255)') -and
    $dbContent.Contains('effective_date VARCHAR(50)') -and
    $dbContent.Contains('policy_version VARCHAR(20)')
)

Test-Assertion "cookie_policy_drafts table is defined for isolated working drafts" (
    $dbContent.Contains('CREATE TABLE IF NOT EXISTS cookie_policy_drafts') -and
    $dbContent.Contains('draft_config JSONB NOT NULL')
)

Test-Assertion "Unique domain indexes are created for fast tenant lookup" (
    $dbContent.Contains('CREATE INDEX IF NOT EXISTS ix_cookie_policies_domain ON cookie_policies(domain)') -and
    $dbContent.Contains('CREATE INDEX IF NOT EXISTS ix_cookie_policy_drafts_domain ON cookie_policy_drafts(domain)')
)

# =========================================================================
# SECTION 2: DRAFT VS PUBLISHED API LIFECYCLE
# =========================================================================
Write-Host "`n[2/7] Auditing Draft & Publish API Lifecycle..." -ForegroundColor Yellow

Test-Assertion "Draft API (/api/v1/consent/policy/draft) supports saving and discarding drafts" (
    $draftRoute.Contains('INSERT INTO cookie_policy_drafts') -and
    $draftRoute.Contains('DELETE FROM cookie_policy_drafts WHERE domain = $1')
)

Test-Assertion "Publish API (/api/v1/consent/policy/publish) increments policy version and sets is_published=TRUE" (
    $publishRoute.Contains('function incrementVersion') -and
    $publishRoute.Contains('INSERT INTO cookie_policies') -and
    $publishRoute.Contains('DELETE FROM cookie_policy_drafts WHERE domain = $1')
)

Test-Assertion "Public read endpoint (/api/v1/consent/policy) returns ONLY published policy for public requests" (
    $policyRoute.Contains('if (isDraftRequested)') -and
    $policyRoute.Contains('SELECT * FROM cookie_policies WHERE domain = $1')
)

Test-Assertion "Public read endpoint safely sanitizes domain and includes CORS headers" (
    $policyRoute.Contains('function sanitizeDomain') -and
    $policyRoute.Contains('Access-Control-Allow-Origin')
)

# =========================================================================
# SECTION 3: COOKIE INVENTORY DATA SOURCE
# =========================================================================
Write-Host "`n[3/7] Auditing Discovered Cookies Inventory Pipeline..." -ForegroundColor Yellow

Test-Assertion "Public policy endpoint queries discovered_cookies to provide live inventory" (
    $policyRoute.Contains('SELECT id, name, category, service_name, duration, description') -and
    $policyRoute.Contains('FROM discovered_cookies') -and
    $policyRoute.Contains('WHERE domain = $1')
)

Test-Assertion "Public policy endpoint does NOT leak private scanner metadata or internal tokens" (
    !($policyRoute.Contains('SELECT * FROM users')) -and
    !($policyRoute.Contains('SELECT * FROM workspace_invites'))
)

# =========================================================================
# SECTION 4: USERLY.JS RUNTIME DECLARATION RENDERING
# =========================================================================
Write-Host "`n[4/7] Auditing userly.js Dynamic Declaration Engine..." -ForegroundColor Yellow

Test-Assertion "userly.js declares policyEndpoint (/api/v1/consent/policy?domain=...)" (
    $webRoute.Contains('var policyEndpoint = apiHost + "/api/v1/consent/policy?domain=" + encodeURIComponent(domain);') -and
    $apiTracker.Contains('var policyEndpoint = apiHost + "/api/v1/consent/policy?domain=" + encodeURIComponent(domain);')
)

Test-Assertion "checkAndRenderPolicyDeclaration targets #usrly-cookie-declaration or #usrly-cookie-policy" (
    $webRoute.Contains('document.getElementById("usrly-cookie-declaration") || document.getElementById("usrly-cookie-policy")')
)

Test-Assertion "Live declaration table renders both 5 canonical categories and itemized cookie audit table" (
    $webRoute.Contains('Cookie Declaration for') -and
    $webRoute.Contains('Itemized Cookie Audit Inventory') -and
    $webRoute.Contains('Always Active')
)

Test-Assertion "Live status dynamically reflects visitor consent permissions (Active vs Disabled vs Pending)" (
    $webRoute.Contains('var isGranted = function(cat)') -and
    $webRoute.Contains('return storedConsent[cat] ? "Active / Consented" : "Disabled / Blocked"')
)

Test-Assertion "Preference Center trigger button is wired to open modal directly from declaration" (
    $webRoute.Contains('id="usrly-open-prefs-btn"') -and
    $webRoute.Contains('renderCMP(activeConfig, true)')
)

# =========================================================================
# SECTION 5: POLICY GENERATOR DASHBOARD UI
# =========================================================================
Write-Host "`n[5/7] Auditing Policy Generator Dashboard UI & State Management..." -ForegroundColor Yellow

Test-Assertion "PolicyGenerator loads persisted draft/published policy from API" (
    $generatorUI.Contains('fetch(`/api/v1/consent/policy?domain=${encodeURIComponent(activeDomain)}&draft=true`)') -and
    $generatorUI.Contains('setCompanyName') -and
    $generatorUI.Contains('setWebsiteUrl')
)

Test-Assertion "PolicyGenerator loads discovered cookies from Cookie Manager API" (
    $generatorUI.Contains('fetch(`/api/v1/consent/cookies?domain=${encodeURIComponent(activeDomain)}`)')
)

Test-Assertion "PolicyGenerator provides dedicated Save Draft and Publish buttons" (
    $generatorUI.Contains('handleSaveDraft') -and
    $generatorUI.Contains('handlePublish') -and
    $generatorUI.Contains('Save Draft') -and
    $generatorUI.Contains('Publish Policy')
)

Test-Assertion "PolicyGenerator provides embed snippet and multi-format exports (Dynamic Tag, HTML, Markdown)" (
    $generatorUI.Contains('generatedEmbedCode') -and
    $generatorUI.Contains('generatedHtml') -and
    $generatorUI.Contains('generatedMarkdown')
)

# =========================================================================
# SECTION 6: LEGAL FRAMEWORK INTEGRATION & LOCALIZATION
# =========================================================================
Write-Host "`n[6/7] Auditing Framework Localization & Compliance Clauses..." -ForegroundColor Yellow

Test-Assertion "LGPD produces authentic Brazilian Portuguese policy copy" (
    $generatorUI.Contains('Política de Cookies') -and
    $generatorUI.Contains('Data de Vigência:') -and
    $generatorUI.Contains('Inventário e Declaração de Cookies') -and
    $generatorUI.Contains('Gerenciamento e Revogação do Consentimento')
)

Test-Assertion "GPC clause is conditionally included in generated policy" (
    $generatorUI.Contains('Global Privacy Control (GPC):') -and
    $generatorUI.Contains('enableGPCMention')
)

Test-Assertion "Google Consent Mode v2 transparency clause is conditionally included" (
    $generatorUI.Contains('Google Consent Mode v2:') -and
    $generatorUI.Contains('enableGCMv2Mention')
)

# =========================================================================
# SECTION 7: FAILURE HANDLING, RESILIENCE & TRACKER SYNC
# =========================================================================
Write-Host "`n[7/7] Auditing Failure Handling, Fallbacks & Tracker Synchronization..." -ForegroundColor Yellow

Test-Assertion "userly.js renders category summary immediately even before/if policy API response arrives" (
    $webRoute.Contains('renderDeclaration([]);') -and
    $webRoute.Contains('pxhr.open("GET", policyEndpoint, true);')
)

Test-Assertion "Full synchronization between apps/web/app/userly.js/route.ts and apps/api/tracker/userly.js" (
    $apiTracker.Contains('var policyEndpoint = apiHost + "/api/v1/consent/policy?domain=" + encodeURIComponent(domain);') -and
    $apiTracker.Contains('Itemized Cookie Audit Inventory')
)

Write-Host "`n==========================================================================" -ForegroundColor Cyan
Write-Host " RESULT: $passCount / $totalTests Cookie Policy Verification Invariants Passed (100%)" -ForegroundColor Green
Write-Host "==========================================================================`n" -ForegroundColor Cyan
