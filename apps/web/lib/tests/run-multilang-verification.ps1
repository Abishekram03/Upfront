# =========================================================================
#  UpFront CMP Multilingual Consent Content Layer Verification Suite
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
Write-Host " UpFront CMP Multilingual Layer Specification Verification"
Write-Host "=================================================================`n"

# [1/7] Auditing Translation Dictionary Module (translations.ts)
Write-Host "[1/7] Auditing Translation Dictionary Module..." -ForegroundColor Yellow
$transFile = "$PSScriptRoot/../i18n/translations.ts"
Assert-Condition "translations.ts exists" (Test-Path $transFile)
$transContent = Get-Content $transFile -Raw

$requiredLangs = @("en", "de", "fr", "es", "pt", "it", "nl", "hi")
foreach ($lang in $requiredLangs) {
    Assert-Condition "Dictionary defines language '$lang'" ($transContent -match "$lang\s*:\s*\{")
}

$requiredKeys = @(
    "title", "description", "accept_all_label", "reject_all_label",
    "preferences_label", "preferences_title", "preferences_description",
    "save_preferences_label", "pref_accept_all_label", "pref_reject_all_label",
    "always_active_label", "no_cookies_to_display_label", "cookie_column_label",
    "duration_column_label", "description_column_label", "necessary_title",
    "necessary_description", "functional_title", "functional_description",
    "analytics_title", "analytics_description", "performance_title",
    "performance_description", "advertisement_title", "advertisement_description",
    "revisit_button_label"
)

foreach ($k in $requiredKeys) {
    Assert-Condition "Dictionary key '$k' exists in translation definitions" ($transContent -match "$k\s*:")
}

Assert-Condition "Implements resolveCMPText helper function" ($transContent -match "function resolveCMPText")
Assert-Condition "Implements detectVisitorLanguage helper function" ($transContent -match "function detectVisitorLanguage")

# [2/7] Auditing userly.js Runtime Script
Write-Host "`n[2/7] Auditing userly.js Runtime Script..." -ForegroundColor Yellow
$userlyFile = "$PSScriptRoot/../../app/userly.js/route.ts"
$userlyContent = Get-Content $userlyFile -Raw

Assert-Condition "userly.js bundles TRANSLATIONS dictionary" ($userlyContent -match "var TRANSLATIONS = \{")
Assert-Condition "userly.js implements detectVisitorLanguage(config)" ($userlyContent -match "function detectVisitorLanguage\(config\)")
Assert-Condition "userly.js implements resolveText(key, config, customLang)" ($userlyContent -match "function resolveText\(key, config, customLang\)")
Assert-Condition "userly.js checks customVal !== enDefault for customer overrides" ($userlyContent -match "customVal !== enDefault")
Assert-Condition "userly.js exposes window.Userly.getLanguage()" ($userlyContent -match "getLanguage:\s*function")
Assert-Condition "userly.js exposes window.Userly.setLanguage(lang)" ($userlyContent -match "setLanguage:\s*function")
Assert-Condition "userly.js exposes window.Userly.getSupportedLanguages()" ($userlyContent -match "getSupportedLanguages:\s*function")
Assert-Condition "userly.js exposes window.Userly.resolveText(key, lang)" ($userlyContent -match "resolveText:\s*function")
Assert-Condition "userly.js stores selected language in localStorage['usrly_lang_' + domain]" ($userlyContent -match 'localStorage\.setItem\("usrly_lang_" \+ domain')

# [3/7] Auditing consentos.js Runtime Script
Write-Host "`n[3/7] Auditing consentos.js Runtime Script..." -ForegroundColor Yellow
$consentosFile = "$PSScriptRoot/../../app/consentos.js/route.ts"
$consentosContent = Get-Content $consentosFile -Raw

Assert-Condition "consentos.js bundles TRANSLATIONS dictionary" ($consentosContent -match "var TRANSLATIONS = \{")
Assert-Condition "consentos.js implements detectVisitorLanguage" ($consentosContent -match "function detectVisitorLanguage")
Assert-Condition "consentos.js implements resolveText with custom-copy precedence" ($consentosContent -match "function resolveText")
Assert-Condition "consentos.js default config has enable_auto_language: true" ($consentosContent -match "enable_auto_language:\s*true")
Assert-Condition "consentos.js default config has default_language: 'en'" ($consentosContent -match 'default_language:\s*"en"')
Assert-Condition "consentos.js exports window.ConsentOS / window.Userly language APIs" ($consentosContent -match "window\.ConsentOS = window\.Userly =")

# [4/7] Auditing Database Schema & Migrations
Write-Host "`n[4/7] Auditing Database Schema & Migrations..." -ForegroundColor Yellow
$dbFile = "$PSScriptRoot/../db.ts"
$dbContent = Get-Content $dbFile -Raw

Assert-Condition "db.ts contains enable_auto_language migration" ($dbContent -match "enable_auto_language BOOLEAN DEFAULT TRUE")
Assert-Condition "db.ts contains default_language migration" ($dbContent -match "default_language VARCHAR\(10\) DEFAULT 'en'")
Assert-Condition "db.ts contains supported_languages migration" ($dbContent -match "supported_languages TEXT\[\] DEFAULT")

# [5/7] Auditing API Endpoints & Types
Write-Host "`n[5/7] Auditing API Endpoints & Types..." -ForegroundColor Yellow
$apiFile = "$PSScriptRoot/../api.ts"
$apiContent = Get-Content $apiFile -Raw

Assert-Condition "ConsentConfig type contains enable_auto_language" ($apiContent -match "enable_auto_language\?: boolean")
Assert-Condition "ConsentConfig type contains default_language" ($apiContent -match "default_language\?: string")
Assert-Condition "ConsentConfig type contains supported_languages" ($apiContent -match "supported_languages\?: string\[\]")

$configRouteFile = "$PSScriptRoot/../../app/api/v1/consent/config/route.ts"
$configRouteContent = Get-Content $configRouteFile -Raw
Assert-Condition "config/route.ts persists enable_auto_language on POST" ($configRouteContent -match "enable_auto_language = EXCLUDED\.enable_auto_language")
Assert-Condition "config/route.ts persists default_language on POST" ($configRouteContent -match "default_language = EXCLUDED\.default_language")
Assert-Condition "config/route.ts persists supported_languages on POST" ($configRouteContent -match "supported_languages = EXCLUDED\.supported_languages")

$publishRouteFile = "$PSScriptRoot/../../app/api/v1/consent/publish/route.ts"
$publishRouteContent = Get-Content $publishRouteFile -Raw
Assert-Condition "publish/route.ts records diff for enable_auto_language" ($publishRouteContent -match "enable_auto_language")
Assert-Condition "publish/route.ts records diff for default_language" ($publishRouteContent -match "default_language")

$versionsRouteFile = "$PSScriptRoot/../../app/api/v1/consent/versions/route.ts"
$versionsRouteContent = Get-Content $versionsRouteFile -Raw
Assert-Condition "versions/route.ts rollbacks preserve language settings" ($versionsRouteContent -match "enable_auto_language")

# [6/7] Auditing Banner Studio UI Integration
Write-Host "`n[6/7] Auditing Banner Studio UI Integration..." -ForegroundColor Yellow
$studioFile = "$PSScriptRoot/../../components/dashboard/consent/banner-studio.tsx"
$studioContent = Get-Content $studioFile -Raw

Assert-Condition "Banner studio includes Preview Lang switcher in canvas header" ($studioContent -match "Preview Lang:")
Assert-Condition "Banner studio includes Auto-Detect Browser Language toggle" ($studioContent -match "Auto-Detect Browser Language")
Assert-Condition "Banner studio includes Default Language Fallback dropdown" ($studioContent -match "Default Language Fallback")
Assert-Condition "Banner studio uses getText(key) for preview resolution" ($studioContent -match "getText\(")

# [7/7] Zero External Runtime Network Dependencies Audit
Write-Host "`n[7/7] Zero External Runtime Translation API Audit..." -ForegroundColor Yellow
$externalApiMatches = Select-String -Path "$PSScriptRoot/../../app/userly.js/route.ts", "$PSScriptRoot/../../app/consentos.js/route.ts" -Pattern "googleapis\.com/translate|deepl\.com|libretranslate"
Assert-Condition "Zero external translation API network calls in runtime scripts" ($null -eq $externalApiMatches -or $externalApiMatches.Count -eq 0)

Write-Host "`n================================================================="
Write-Host " RESULTS: $passed Passed, $failed Failed"
Write-Host "=================================================================`n"

if ($failed -gt 0) {
    exit 1
}
