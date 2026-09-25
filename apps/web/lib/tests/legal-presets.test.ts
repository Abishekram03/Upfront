import {
  LAW_PRESETS,
  getPresetById,
  applyPresetToConfig,
  gdprPreset,
  ccpaPreset,
  dpdpPreset,
  lgpdPreset,
  noticeOnlyPreset,
} from "@/components/dashboard/consent/studio/presets"

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`)
  }
}

console.log("Starting Legal Presets Audit Verification Tests...\n")

// Test 1: Registry Completeness
console.log("1. Testing Preset Registry Completeness...")
assert(LAW_PRESETS.length === 5, "Expected exactly 5 legal presets in registry")
const ids = LAW_PRESETS.map((p) => p.id)
assert(ids.includes("gdpr"), "Missing GDPR preset")
assert(ids.includes("ccpa"), "Missing CCPA preset")
assert(ids.includes("dpdp"), "Missing DPDP preset")
assert(ids.includes("lgpd"), "Missing LGPD preset")
assert(ids.includes("notice_only"), "Missing Notice Only preset")
console.log("✓ All 5 presets registered correctly.")

// Test 2: GDPR Invariants
console.log("\n2. Testing GDPR Preset Invariants...")
assert(gdprPreset.consentModel === "opt_in", "GDPR must be opt_in model")
assert(gdprPreset.defaultCategories.necessary === true, "GDPR necessary must be active")
assert(gdprPreset.defaultCategories.functional === false, "GDPR functional must be false by default")
assert(gdprPreset.defaultCategories.analytics === false, "GDPR analytics must be false by default")
assert(gdprPreset.defaultCategories.performance === false, "GDPR performance must be false by default")
assert(gdprPreset.defaultCategories.advertisement === false, "GDPR advertisement must be false by default")
assert(gdprPreset.bannerData.accept_all_label === "Accept All", "GDPR accept all label mismatch")
assert(gdprPreset.bannerData.reject_all_label === "Reject All", "GDPR reject all label mismatch")
assert(gdprPreset.runtimeConfig.prior_blocking === true, "GDPR prior_blocking must be true")
assert(gdprPreset.runtimeConfig.enable_gpc === true, "GDPR GPC must be enabled")
console.log("✓ GDPR preset invariants verified.")

// Test 3: CCPA Invariants
console.log("\n3. Testing CCPA / CPRA Preset Invariants...")
assert(ccpaPreset.consentModel === "opt_out", "CCPA must be opt_out model")
assert(ccpaPreset.bannerData.reject_all_label === "Do Not Sell or Share My Info", "CCPA reject must represent Do Not Sell")
assert(ccpaPreset.bannerData.accept_all_label === "Accept & Continue", "CCPA accept must not be conflated with dismissal")
assert(ccpaPreset.categories.advertisement.title.includes("Sale") || ccpaPreset.categories.advertisement.title.includes("Targeted"), "CCPA advertisement title must mention Sale/Targeted Ads")
assert(ccpaPreset.runtimeConfig.enable_gpc === true, "CCPA must enable GPC")
console.log("✓ CCPA preset invariants verified.")

// Test 4: DPDP Invariants
console.log("\n4. Testing DPDP Act Preset Invariants...")
assert(dpdpPreset.consentModel === "opt_in", "DPDP must be opt_in model")
assert(dpdpPreset.defaultCategories.functional === false, "DPDP functional must start unchecked")
assert(dpdpPreset.defaultCategories.analytics === false, "DPDP analytics must start unchecked")
assert(dpdpPreset.categories.necessary.title.includes("Core Platform Operation") || dpdpPreset.categories.necessary.title.includes("Security"), "DPDP necessary title must be purpose-oriented")
assert(dpdpPreset.categories.analytics.title.includes("Product Analytics") || dpdpPreset.categories.analytics.title.includes("Service Quality"), "DPDP analytics title must be purpose-oriented")
assert(dpdpPreset.preferenceCenterData.description.includes("withdraw"), "DPDP description must note statutory withdrawal right")
console.log("✓ DPDP preset invariants verified.")

// Test 5: LGPD Localization Invariants
console.log("\n5. Testing LGPD Portuguese Localization Invariants...")
assert(lgpdPreset.consentModel === "opt_in", "LGPD must be opt_in model")
assert(lgpdPreset.defaultCategories.advertisement === false, "LGPD optional categories must start unchecked")
assert(lgpdPreset.bannerData.title === "Gerenciamento de Privacidade e Cookies", "LGPD banner title must be in Portuguese")
assert(lgpdPreset.bannerData.accept_all_label === "Aceitar Todos", "LGPD accept button must be Portuguese")
assert(lgpdPreset.bannerData.reject_all_label === "Rejeitar Não Essenciais", "LGPD reject button must be Portuguese")
assert(lgpdPreset.preferenceCenterData.title === "Central de Preferências de Privacidade", "LGPD preference center title must be in Portuguese")
assert(lgpdPreset.preferenceCenterData.always_active_label === "Sempre Ativo", "LGPD always active label must be Portuguese")
assert(lgpdPreset.categories.necessary.title === "Essenciais e Segurança", "LGPD necessary category must be Portuguese")
assert(lgpdPreset.categories.functional.title === "Funcionalidades e Preferências", "LGPD functional category must be Portuguese")
assert(lgpdPreset.categories.analytics.title === "Estatísticas e Análise de Tráfego", "LGPD analytics category must be Portuguese")
assert(lgpdPreset.cookieTableLabels?.cookie_column_label === "Cookie", "LGPD cookie table label must be localized")
assert(lgpdPreset.cookieTableLabels?.duration_column_label === "Duração", "LGPD duration table label must be localized")
console.log("✓ LGPD Portuguese localization invariants verified.")

// Test 6: Notice Only Invariants
console.log("\n6. Testing Notice Only Preset Invariants...")
assert(noticeOnlyPreset.consentModel === "notice_only", "Notice Only must be notice_only model")
assert(noticeOnlyPreset.bannerData.show_reject_button === false, "Notice Only should not have misleading reject button on primary banner")
assert(noticeOnlyPreset.bannerData.accept_all_label === "Got it!", "Notice Only primary action should be acknowledgment")
assert(noticeOnlyPreset.runtimeConfig.prior_blocking === false, "Notice Only should not block trackers prior to consent")
console.log("✓ Notice Only preset invariants verified.")

// Test 7: applyPresetToConfig Pure Mutation Invariant
console.log("\n7. Testing applyPresetToConfig Function...")
const mockInitialConfig = {
  domain: "example.com",
  consent_version: "1.2",
  primary_color: "#1868db",
  is_enabled: true,
}
const appliedGDPR = applyPresetToConfig(mockInitialConfig, gdprPreset)
assert(appliedGDPR.domain === "example.com", "applyPresetToConfig must preserve domain")
assert(appliedGDPR.consent_version === "1.2", "applyPresetToConfig must preserve consent_version")
assert(appliedGDPR.law_template === "gdpr", "applyPresetToConfig must set law_template")
assert(appliedGDPR.accept_all_label === "Accept All", "applyPresetToConfig must apply bannerData")
assert(appliedGDPR.preference_title === "Customise Consent Preferences", "applyPresetToConfig must apply preferenceCenterData")
assert(appliedGDPR.necessary_title === "Necessary & Security", "applyPresetToConfig must apply category titles")
assert(appliedGDPR.default_analytics === false, "applyPresetToConfig must apply default category states")

const appliedLGPD = applyPresetToConfig(mockInitialConfig, lgpdPreset)
assert(appliedLGPD.cookie_column_label === "Cookie", "applyPresetToConfig must apply cookie table labels")
assert(appliedLGPD.duration_column_label === "Duração", "applyPresetToConfig must apply duration column label")
console.log("✓ applyPresetToConfig pure transformation verified.")

console.log("\n🎉 ALL 7 LEGAL PRESET VERIFICATION TEST SUITES PASSED SUCCESSFULLY!")
