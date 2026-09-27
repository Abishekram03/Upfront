import { chromium } from "playwright"
import http from "node:http"
import { GET } from "../../app/userly.js/route"

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[Multi-Language Test Failure] ${message}`)
  }
}

async function runMultilangVerification() {
  console.log("=========================================================================")
  console.log(" STARTING REAL PLAYWRIGHT RUNTIME VERIFICATION FOR MULTILINGUAL LAYER")
  console.log("=========================================================================\n")

  const response = await GET()
  const runtimeScript = await response.text()

  let currentConfig: any = {
    domain: "localhost",
    is_enabled: true,
    layout: "bottom_bar",
    enable_auto_language: true,
    default_language: "en",
    supported_languages: ["en", "de", "fr", "es", "pt", "it", "nl", "hi"],
    enable_consent_mode_v2: true,
    enable_gpc: true,
    consent_version: "1.0",
  }

  let consentLogs: any[] = []

  const server = http.createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")

    if (req.method === "OPTIONS") {
      res.writeHead(204)
      res.end()
      return
    }

    if (req.url?.startsWith("/userly.js")) {
      res.writeHead(200, { "Content-Type": "application/javascript; charset=utf-8" })
      res.end(runtimeScript, "utf-8")
      return
    }

    if (req.url?.startsWith("/api/v1/consent/config")) {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" })
      res.end(JSON.stringify(currentConfig), "utf-8")
      return
    }

    if (req.url?.startsWith("/api/v1/consent/log")) {
      let body = ""
      req.on("data", (chunk) => {
        body += chunk
      })
      req.on("end", () => {
        try {
          if (body) consentLogs.push(JSON.parse(body))
        } catch (e) {}
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" })
        res.end(JSON.stringify({ success: true }), "utf-8")
      })
      return
    }

    if (req.url === "/" || req.url?.startsWith("/index.html")) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
      res.end(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Multilingual CMP Test Suite</title>
</head>
<body>
  <h1>UpFront CMP Multilingual Runtime Test Bed</h1>
  <script src="/userly.js" data-domain="localhost" data-api="http://127.0.0.1:4001"></script>
</body>
</html>`, "utf-8")
      return
    }

    res.writeHead(404)
    res.end("Not Found")
  })

  await new Promise<void>((resolve) => server.listen(4001, "127.0.0.1", resolve))
  console.log("✓ Test server started on http://127.0.0.1:4001")

  // Scenario 1: Launch browser with German locale ('de-DE')
  console.log("\n[Test 1] Testing automatic browser language detection for German (de-DE)...")
  const browser = await chromium.launch({ headless: true })
  const germanContext = await browser.newContext({
    locale: "de-DE",
  })
  const germanPage = await germanContext.newPage()

  try {
    await germanPage.goto("http://127.0.0.1:4001/")
    await germanPage.waitForTimeout(600)

    // Check detected language API
    const detectedLang = await germanPage.evaluate(() => (window as any).Userly?.getLanguage())
    console.log("  Detected language:", detectedLang)
    assert(detectedLang === "de", `Expected language 'de' but got '${detectedLang}'`)

    // Query shadow DOM inside #usrly-cmp-root
    const bannerTitle = await germanPage.evaluate(() => {
      const root = document.querySelector("#usrly-cmp-root")?.shadowRoot
      return root?.querySelector(".usrly-banner-title")?.textContent?.trim()
    })
    console.log("  Banner Title in German:", bannerTitle)
    assert(
      bannerTitle === "Wir schätzen Ihre Privatsphäre",
      `Expected German banner title 'Wir schätzen Ihre Privatsphäre' but got '${bannerTitle}'`
    )

    const acceptBtnText = await germanPage.evaluate(() => {
      const root = document.querySelector("#usrly-cmp-root")?.shadowRoot
      return root?.querySelector("#usrly-btn-accept")?.textContent?.trim()
    })
    console.log("  Accept Button text in German:", acceptBtnText)
    assert(
      acceptBtnText === "Alle akzeptieren",
      `Expected 'Alle akzeptieren' but got '${acceptBtnText}'`
    )

    console.log("  ✓ Automatic German detection & translated banner verified")
    await germanContext.close()

    // Scenario 2: Customer Custom Copy Overrides with German Browser
    console.log("\n[Test 2] Testing customer custom copy override precedence with German browser...")
    currentConfig = {
      ...currentConfig,
      title: "My Custom Privacy Portal Title", // Custom non-default override
      // Other labels remain standard
    }

    const customContext = await browser.newContext({ locale: "de-DE" })
    const customPage = await customContext.newPage()
    await customPage.goto("http://127.0.0.1:4001/")
    await customPage.waitForTimeout(600)

    const customBannerTitle = await customPage.evaluate(() => {
      const root = document.querySelector("#usrly-cmp-root")?.shadowRoot
      return root?.querySelector(".usrly-banner-title")?.textContent?.trim()
    })
    console.log("  Custom banner title:", customBannerTitle)
    assert(
      customBannerTitle === "My Custom Privacy Portal Title",
      `Expected custom title to take precedence over German dictionary translation, got '${customBannerTitle}'`
    )

    const customAcceptBtn = await customPage.evaluate(() => {
      const root = document.querySelector("#usrly-cmp-root")?.shadowRoot
      return root?.querySelector("#usrly-btn-accept")?.textContent?.trim()
    })
    console.log("  Button text remains translated:", customAcceptBtn)
    assert(
      customAcceptBtn === "Alle akzeptieren",
      `Expected non-overridden button to remain translated to 'Alle akzeptieren', got '${customAcceptBtn}'`
    )

    console.log("  ✓ Custom title override preserved with translated remaining UI elements")
    await customContext.close()

    // Scenario 3: Dynamic Language Switcher (setLanguage('hi') -> Hindi)
    console.log("\n[Test 3] Testing dynamic runtime language switching (setLanguage)...")
    // Reset config to defaults
    currentConfig = {
      domain: "localhost",
      is_enabled: true,
      layout: "bottom_bar",
      enable_auto_language: true,
      default_language: "en",
      supported_languages: ["en", "de", "fr", "es", "pt", "it", "nl", "hi"],
      enable_consent_mode_v2: true,
      enable_gpc: true,
      consent_version: "1.0",
    }

    const switchContext = await browser.newContext({ locale: "en-US" })
    const switchPage = await switchContext.newPage()
    await switchPage.goto("http://127.0.0.1:4001/")
    await switchPage.waitForTimeout(600)

    const initialLang = await switchPage.evaluate(() => (window as any).Userly?.getLanguage())
    console.log("  Initial language:", initialLang)
    assert(initialLang === "en", "Expected initial language to be 'en'")

    // Dynamically switch to Hindi
    console.log("  Calling window.Userly.setLanguage('hi')...")
    await switchPage.evaluate(() => (window as any).Userly?.setLanguage("hi"))
    await switchPage.waitForTimeout(200)

    const newLang = await switchPage.evaluate(() => (window as any).Userly?.getLanguage())
    assert(newLang === "hi", `Expected language to be 'hi' after switch, got '${newLang}'`)

    const hindiTitle = await switchPage.evaluate(() => {
      const root = document.querySelector("#usrly-cmp-root")?.shadowRoot
      return root?.querySelector(".usrly-banner-title")?.textContent?.trim()
    })
    console.log("  Hindi banner title:", hindiTitle)
    assert(
      hindiTitle === "हम आपकी गोपनीयता का सम्मान करते हैं",
      `Expected Hindi banner title, got '${hindiTitle}'`
    )

    const hindiAccept = await switchPage.evaluate(() => {
      const root = document.querySelector("#usrly-cmp-root")?.shadowRoot
      return root?.querySelector("#usrly-btn-accept")?.textContent?.trim()
    })
    console.log("  Hindi accept button:", hindiAccept)
    assert(hindiAccept === "सभी स्वीकार करें", `Expected 'सभी स्वीकार करें', got '${hindiAccept}'`)

    // Verify localStorage persistence
    const persistedLang = await switchPage.evaluate(() =>
      localStorage.getItem("usrly_lang_localhost")
    )
    console.log("  Persisted language in localStorage:", persistedLang)
    assert(
      persistedLang === "hi",
      `Expected localStorage to store 'hi', got '${persistedLang}'`
    )

    // Reload page to verify persistence across page loads
    console.log("  Reloading page to verify persistence across page reloads...")
    await switchPage.reload()
    await switchPage.waitForTimeout(600)

    const reloadedLang = await switchPage.evaluate(() => (window as any).Userly?.getLanguage())
    assert(
      reloadedLang === "hi",
      `Expected reloaded language to be 'hi', got '${reloadedLang}'`
    )

    console.log("  ✓ Dynamic language switching & persistence verified")

    // Scenario 4: Preference Center Translation (French 'fr')
    console.log("\n[Test 4] Testing Preference Center translations in French (fr)...")
    await switchPage.evaluate(() => (window as any).Userly?.setLanguage("fr"))
    await switchPage.waitForTimeout(200)

    // Open Preferences Modal
    console.log("  Opening Preferences Modal...")
    await switchPage.evaluate(() => {
      const root = document.querySelector("#usrly-cmp-root")?.shadowRoot
      const prefBtn = root?.querySelector("#usrly-btn-customise") as HTMLButtonElement
      prefBtn?.click()
    })
    await switchPage.waitForTimeout(300)

    const modalTitle = await switchPage.evaluate(() => {
      const root = document.querySelector("#usrly-cmp-root")?.shadowRoot
      return root?.querySelector(".usrly-modal-title")?.textContent?.trim()
    })
    console.log("  Modal Title in French:", modalTitle)
    assert(
      modalTitle === "Personnaliser les préférences de consentement",
      `Expected French modal title, got '${modalTitle}'`
    )

    const categoryTitles = await switchPage.evaluate(() => {
      const root = document.querySelector("#usrly-cmp-root")?.shadowRoot
      const titles = Array.from(root?.querySelectorAll(".usrly-cat-title") || [])
      return titles.map((t) => t.textContent?.trim())
    })
    console.log("  Category titles in French:", categoryTitles)
    assert(
      categoryTitles.includes("Nécessaire"),
      `Expected category titles to include 'Nécessaire', got '${categoryTitles.join(", ")}'`
    )

    // Scenario 5: User action does not mutate language and completes consent
    console.log("\n[Test 5] Interacting with translated preference modal...")
    await switchPage.evaluate(() => {
      const root = document.querySelector("#usrly-cmp-root")?.shadowRoot
      const saveBtn = root?.querySelector("#usrly-modal-save") as HTMLButtonElement
      saveBtn?.click()
    })
    await switchPage.waitForTimeout(400)

    const storedConsent = await switchPage.evaluate(() => (window as any).Userly?.getConsent())
    console.log("  Stored consent after modal save:", storedConsent)
    assert(storedConsent?.necessary === true, "Consent necessary must be true")

    console.log("  ✓ Preference modal translated strings and consent flow verified")
    await switchContext.close()
  } finally {
    await browser.close()
    server.close()
  }

  console.log("\n=========================================================================")
  console.log(" ALL REAL PLAYWRIGHT MULTILINGUAL BROWSER TESTS PASSED (5/5 Scenarios) ")
  console.log("=========================================================================\n")
}

runMultilangVerification().catch((err) => {
  console.error("\n❌ Playwright verification failed:", err)
  process.exit(1)
})
