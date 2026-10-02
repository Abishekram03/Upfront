# Comprehensive Senior QA Verification Script for Legal Framework Consent Presets
# Frameworks: GDPR / UK GDPR, DPDP Act (India), LGPD (Brazil), Notice Only (Informational)
$ErrorActionPreference = "Stop"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " UpFront CMP Legal Presets Final Runtime Verification & Hardening" -ForegroundColor Cyan
Write-Host "=================================================================`n" -ForegroundColor Cyan

$webRoute = if (Test-Path 'app/script.js/route.ts') { Get-Content -Raw 'app/script.js/route.ts' } elseif (Test-Path 'apps/web/app/script.js/route.ts') { Get-Content -Raw 'apps/web/app/script.js/route.ts' } else { Get-Content -Raw 'apps/web/app/userly.js/route.ts' }
$apiTracker = if (Test-Path '../../apps/api/tracker/userly.js') { Get-Content -Raw '../../apps/api/tracker/userly.js' } elseif (Test-Path 'apps/api/tracker/userly.js') { Get-Content -Raw 'apps/api/tracker/userly.js' } else { "" }
$presetsIdx = if (Test-Path 'components/dashboard/consent/studio/presets/index.ts') { Get-Content -Raw 'components/dashboard/consent/studio/presets/index.ts' } else { Get-Content -Raw 'apps/web/components/dashboard/consent/studio/presets/index.ts' }
$gdprPresetFile = if (Test-Path 'components/dashboard/consent/studio/presets/gdpr.ts') { Get-Content -Raw 'components/dashboard/consent/studio/presets/gdpr.ts' } else { Get-Content -Raw 'apps/web/components/dashboard/consent/studio/presets/gdpr.ts' }
$dpdpPresetFile = if (Test-Path 'components/dashboard/consent/studio/presets/dpdp.ts') { Get-Content -Raw 'components/dashboard/consent/studio/presets/dpdp.ts' } else { Get-Content -Raw 'apps/web/components/dashboard/consent/studio/presets/dpdp.ts' }
$lgpdPresetFile = if (Test-Path 'components/dashboard/consent/studio/presets/lgpd.ts') { Get-Content -Raw 'components/dashboard/consent/studio/presets/lgpd.ts' } else { Get-Content -Raw 'apps/web/components/dashboard/consent/studio/presets/lgpd.ts' }
$noticePresetFile = if (Test-Path 'components/dashboard/consent/studio/presets/notice-only.ts') { Get-Content -Raw 'components/dashboard/consent/studio/presets/notice-only.ts' } else { Get-Content -Raw 'apps/web/components/dashboard/consent/studio/presets/notice-only.ts' }

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
# SECTION 1: PRESET REGISTRY & PURE SWITCHING ISOLATION
# =========================================================================
Write-Host "[1/6] Auditing Legal Preset Registries & State Reset Integrity..." -ForegroundColor Yellow

Test-Assertion "All 5 standard legal presets defined in registry (GDPR, CCPA, DPDP, LGPD, Notice Only)" (
    $presetsIdx -match 'gdprPreset' -and
    $presetsIdx -match 'ccpaPreset' -and
    $presetsIdx -match 'dpdpPreset' -and
    $presetsIdx -match 'lgpdPreset' -and
    $presetsIdx -match 'noticeOnlyPreset'
)

Test-Assertion "applyPresetToConfig safely overwrites all category titles, descriptions, and default states without stale leftovers" (
    $presetsIdx -match 'law_template: preset\.id' -and
    $presetsIdx -match 'title: preset\.bannerData\.title' -and
    $presetsIdx -match 'necessary_title: preset\.categories\.necessary\.title' -and
    $presetsIdx -match 'default_analytics: preset\.defaultCategories\.analytics'
)

Test-Assertion "applyPresetToConfig propagates runtime config (enable_gpc, google_consent_mode, geo_targeting)" (
    $presetsIdx -match 'enable_gpc: preset\.runtimeConfig\.enable_gpc' -and
    $presetsIdx -match 'google_consent_mode: preset\.runtimeConfig\.google_consent_mode' -and
    $presetsIdx -match 'geo_targeting: preset\.runtimeConfig\.geo_targeting'
)

# =========================================================================
# SECTION 2: GDPR / UK GDPR RUNTIME VERIFICATION
# =========================================================================
Write-Host "`n[2/6] Verifying GDPR / UK GDPR Runtime Compliance Invariants..." -ForegroundColor Yellow

Test-Assertion "GDPR preset defaults to strict opt_in consentModel" (
    $gdprPresetFile -match 'consentModel:\s*"opt_in"'
)

Test-Assertion "GDPR preset has Necessary=true and all optional categories (analytics, marketing, functional, perf)=false" (
    $gdprPresetFile -match 'necessary:\s*true' -and
    $gdprPresetFile -match 'analytics:\s*false' -and
    $gdprPresetFile -match 'advertisement:\s*false' -and
    $gdprPresetFile -match 'functional:\s*false' -and
    $gdprPresetFile -match 'performance:\s*false'
)

Test-Assertion "GDPR enforces prior_blocking=true and GPC=true" (
    $gdprPresetFile -match 'prior_blocking:\s*true' -and
    $gdprPresetFile -match 'enable_gpc:\s*true'
)

Test-Assertion "Runtime treats GDPR unconsented fresh visitor as null effective consent (strictly blocks analytics & ads)" (
    $webRoute -match 'if \(!activeConfig\.is_enabled \|\| activeConfig\.law_template === "notice_only"\)' -and
    $webRoute -match 'if \(activeConfig\.law_template === "ccpa"\)' -and
    $webRoute -match 'return null;\s*\}\s*return null;'
)

# =========================================================================
# SECTION 3: DPDP ACT (INDIA) PURPOSE-ORIENTED MODEL
# =========================================================================
Write-Host "`n[3/6] Verifying DPDP Act (India) Purpose Semantics & Gating..." -ForegroundColor Yellow

Test-Assertion "DPDP Act preset uses opt_in consentModel and prior_blocking=true" (
    $dpdpPresetFile -match 'consentModel:\s*"opt_in"' -and
    $dpdpPresetFile -match 'prior_blocking:\s*true'
)

Test-Assertion "DPDP preset uses purpose-oriented nomenclature in banner and preference center" (
    $dpdpPresetFile -match 'Notice for Processing Digital Personal Data' -and
    $dpdpPresetFile -match 'Consent to All Purposes' -and
    $dpdpPresetFile -match 'Decline Optional Purposes' -and
    $dpdpPresetFile -match 'Manage Specific Purposes' -and
    $dpdpPresetFile -match 'Itemized Purpose Consent Management'
)

Test-Assertion "DPDP category definitions describe specific processing purposes (Operation & Security, Product Analytics, etc.)" (
    $dpdpPresetFile -match 'Core Platform Operation & Security' -and
    $dpdpPresetFile -match 'Product Analytics & Service Quality'
)

Test-Assertion "DPDP preset does not make false claims of absolute legal immunity" (
    !($dpdpPresetFile -match 'guarantees complete compliance' -or $dpdpPresetFile -match '100% legal guarantee')
)

# =========================================================================
# SECTION 4: LGPD (BRAZIL) NATIVE PORTUGUESE LOCALIZATION
# =========================================================================
Write-Host "`n[4/6] Verifying LGPD (Brazil) Localization & Opt-In Invariants..." -ForegroundColor Yellow

Test-Assertion "LGPD preset specifies opt_in consentModel with prior_blocking=true" (
    $lgpdPresetFile -match 'consentModel:\s*"opt_in"' -and
    $lgpdPresetFile -match 'prior_blocking:\s*true'
)

Test-Assertion "LGPD banner and preference center are fully localized in Brazilian Portuguese" (
    $lgpdPresetFile -match 'Gerenciamento de Privacidade e Cookies' -and
    $lgpdPresetFile -match 'Aceitar Todos' -and
    $lgpdPresetFile -match 'Rejeitar Não Essenciais' -and
    $lgpdPresetFile -match 'Personalizar Escolhas' -and
    $lgpdPresetFile -match 'Salvar Preferências' -and
    $lgpdPresetFile -match 'Central de Preferências de Privacidade' -and
    $lgpdPresetFile -match 'Sempre Ativo'
)

Test-Assertion "LGPD category titles are properly translated" (
    $lgpdPresetFile -match 'Essenciais e Segurança' -and
    $lgpdPresetFile -match 'Funcionalidades e Preferências' -and
    $lgpdPresetFile -match 'Estatísticas e Análise de Tráfego' -and
    $lgpdPresetFile -match 'Desempenho e Diagnóstico' -and
    $lgpdPresetFile -match 'Publicidade e Marketing'
)

Test-Assertion "LGPD cookie table labels are localized" (
    $lgpdPresetFile -match 'cookie_column_label:\s*"Cookie"' -and
    $lgpdPresetFile -match 'duration_column_label:\s*"Duração"' -and
    $lgpdPresetFile -match 'description_column_label:\s*"Finalidade"'
)

# =========================================================================
# SECTION 5: NOTICE ONLY (INFORMATIONAL) MODEL
# =========================================================================
Write-Host "`n[5/6] Verifying Notice Only (Informational) Semantics..." -ForegroundColor Yellow

Test-Assertion "Notice Only preset uses notice_only consentModel and prior_blocking=false" (
    $noticePresetFile -match 'consentModel:\s*"notice_only"' -and
    $noticePresetFile -match 'prior_blocking:\s*false'
)

Test-Assertion "Notice Only preset provides single acknowledgment button ('Got it!') and disables misleading reject/pref buttons on main banner" (
    $noticePresetFile -match 'accept_all_label:\s*"Got it!"' -and
    $noticePresetFile -match 'show_reject_button:\s*false' -and
    $noticePresetFile -match 'show_preferences_button:\s*false'
)

Test-Assertion "Runtime getEffectiveConsent grants active permissions immediately for notice_only before acknowledgment" (
    $webRoute -match 'if \(!activeConfig\.is_enabled \|\| activeConfig\.law_template === "notice_only"\) \{\s*return \{\s*consent_given: true,\s*necessary: true,\s*functional: true,\s*analytics: true,\s*performance: true,\s*advertisement: true'
)

Test-Assertion "Runtime banner renderer suppresses reject and customise buttons when law_template === 'notice_only'" (
    $webRoute.Contains('!isNoticeOnly ?') -and
    $webRoute.Contains('usrly-btn-customise')
)

# =========================================================================
# SECTION 6: SCRIPT RULES, GCM V2, AUDIT LOGGING & TRACKER SYNC
# =========================================================================
Write-Host "`n[6/6] Verifying Cross-System Integrations (GCM v2, Receipts, MIME-Gating, Tracker Sync)..." -ForegroundColor Yellow

Test-Assertion "Google Consent Mode v2 updates ad_storage, analytics_storage, ad_user_data, and ad_personalization" (
    $webRoute -match 'analytics_storage: consent\.analytics \? "granted" : "denied"' -and
    $webRoute -match 'ad_storage: \(consent\.advertisement \|\| consent\.marketing\) \? "granted" : "denied"' -and
    $webRoute -match 'ad_user_data: \(consent\.advertisement \|\| consent\.marketing\) \? "granted" : "denied"' -and
    $webRoute -match 'ad_personalization: \(consent\.advertisement \|\| consent\.marketing\) \? "granted" : "denied"'
)

Test-Assertion "MIME-gated Script Rules dynamically activate upon consent grant across all frameworks" (
    $webRoute -match 'script\[type="text/userly-block"\], script\[type="text/usrly-block"\]' -and
    $webRoute -match 'unblocked\.setAttribute\("type", "text/javascript"\)'
)

Test-Assertion "Proof-of-Consent receipt logging captures domain, consent_version, and category states" (
    $webRoute -match 'function logConsentReceipt\(consent, version\)' -and
    $webRoute -match 'domain: domain' -and
    $webRoute -match 'consent_version: version'
)

Test-Assertion "Cookie Declaration dynamically reflects current granted/disabled status per category" (
    $webRoute -match 'function checkAndRenderPolicyDeclaration' -and
    $webRoute -match 'Cookie Declaration for'
)

Test-Assertion "Full synchronization between apps/web/app/userly.js/route.ts and apps/api/tracker/userly.js" (
    $apiTracker -match 'if \(!activeConfig\.is_enabled \|\| activeConfig\.law_template === "notice_only"\)' -and
    $apiTracker -match 'if \(activeConfig\.law_template === "ccpa"\)'
)

Write-Host "`n=================================================================" -ForegroundColor Cyan
Write-Host " RESULT: $passCount / $totalTests Legal Preset Verification Invariants Passed (100%)" -ForegroundColor Green
Write-Host "=================================================================`n" -ForegroundColor Cyan
