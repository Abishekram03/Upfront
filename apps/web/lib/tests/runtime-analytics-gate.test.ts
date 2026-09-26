import vm from "node:vm"
import { GET } from "../../app/userly.js/route"

function assert(condition: boolean, message?: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message || "condition failed"}`)
  }
}

interface RequestRecord {
  url: string
  method: string
  body?: string
}

async function getScriptCode(): Promise<string> {
  const response = await GET()
  return await response.text()
}

function createBrowserEnvironment(options: {
  initialLocalStorage?: Record<string, string>
  isGPCSignal?: boolean
  configResponse?: Record<string, any> | null
  configStatus?: number
}) {
  const requests: RequestRecord[] = []
  const storage: Record<string, string> = { ...(options.initialLocalStorage || {}) }

  const localStorageMock = {
    getItem(key: string) {
      return storage[key] !== undefined ? storage[key] : null
    },
    setItem(key: string, value: string) {
      storage[key] = String(value)
    },
    removeItem(key: string) {
      delete storage[key]
    },
    clear() {
      for (const k of Object.keys(storage)) {
        delete storage[k]
      }
    },
  }

  const listeners: Record<string, Function[]> = {}

  const windowMock: any = {
    location: {
      hostname: "onconnect.one",
      origin: "https://onconnect.one",
      href: "https://onconnect.one/dashboard",
    },
    innerWidth: 1280,
    dataLayer: [],
    addEventListener(event: string, cb: Function) {
      if (!listeners[event]) listeners[event] = []
      listeners[event].push(cb)
    },
    history: {
      pushState(state: any, title: string, url: string) {
        if (url) windowMock.location.href = url
      },
      replaceState(state: any, title: string, url: string) {
        if (url) windowMock.location.href = url
      },
    },
  }

  const documentMock: any = {
    currentScript: {
      getAttribute(attr: string) {
        if (attr === "data-domain") return "onconnect.one"
        if (attr === "data-api") return "https://onconnect.one"
        return null
      },
      src: "https://onconnect.one/userly.js",
    },
    referrer: "https://google.com",
    readyState: "complete",
    getElementById() {
      return null
    },
    querySelectorAll() {
      return []
    },
    createElement(tag: string) {
      return {
        tagName: tag.toUpperCase(),
        style: {},
        setAttribute() {},
        appendChild() {},
        attachShadow() {
          return {
            appendChild() {},
            querySelector() {
              return null
            },
            querySelectorAll() {
              return []
            },
          }
        },
      }
    },
    body: {
      appendChild() {},
    },
    addEventListener(event: string, cb: Function) {
      if (!listeners[event]) listeners[event] = []
      listeners[event].push(cb)
    },
  }

  const navigatorMock: any = {
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    globalPrivacyControl: Boolean(options.isGPCSignal),
    sendBeacon(url: string, data: string) {
      requests.push({ url, method: "POST", body: data })
      return true
    },
  }

  class MockXMLHttpRequest {
    readyState = 0
    status = 200
    responseText = ""
    onreadystatechange: (() => void) | null = null
    onload: (() => void) | null = null
    private _url = ""
    private _method = "GET"

    open(method: string, url: string) {
      this._method = method
      this._url = url
    }
    setRequestHeader() {}
    send(body?: string) {
      requests.push({ url: this._url, method: this._method, body })
      if (this._url.includes("/api/v1/consent/config")) {
        this.readyState = 4
        this.status = options.configStatus !== undefined ? options.configStatus : 200
        this.responseText = options.configResponse ? JSON.stringify(options.configResponse) : JSON.stringify({
          is_enabled: true,
          law_template: "gdpr",
          enable_analytics_category: true, // Configuration flag (category is enabled/configured in CMP)
          default_analytics: false,
        })
        if (this.onreadystatechange) this.onreadystatechange()
        if (this.onload) this.onload()
      }
    }
  }

  const sandbox = {
    window: windowMock,
    document: documentMock,
    navigator: navigatorMock,
    localStorage: localStorageMock,
    XMLHttpRequest: MockXMLHttpRequest,
    setTimeout: (fn: Function) => fn(),
    console: console,
    Date: Date,
    JSON: JSON,
    encodeURIComponent: encodeURIComponent,
    Object: Object,
  }

  return { sandbox, requests, storage, windowMock }
}

async function runTests() {
  console.log("=== UpFront CMP Runtime Analytics Consent Gate Verification Tests ===\n")

  const scriptCode = await getScriptCode()
  assert(scriptCode.length > 0, "Tracker script must not be empty")

  // TEST 1: No consent on first visit (Opt-in / GDPR) -> ZERO pageviews emitted
  {
    console.log("Test 1: First visit without consent (GDPR opt-in) -> No pageview emitted...")
    const { sandbox, requests } = createBrowserEnvironment({
      configResponse: {
        is_enabled: true,
        law_template: "gdpr",
        enable_analytics_category: true,
        default_analytics: false,
      },
    })
    vm.runInNewContext(scriptCode, sandbox)

    const pageviews = requests.filter((r) => r.url.includes("/api/v1/event"))
    assert(pageviews.length === 0, `Expected 0 pageviews, got ${pageviews.length}`)
    console.log("✓ No analytics request emitted prior to opt-in consent.")
  }

  // TEST 2: Reject All -> ZERO pageviews emitted, but consent receipt logged to /api/v1/consent/log
  {
    console.log("\nTest 2: Visitor selects Reject All -> Analytics blocked, receipt logged...")
    const { sandbox, requests, windowMock } = createBrowserEnvironment({})
    vm.runInNewContext(scriptCode, sandbox)

    // Simulate Reject All via SDK updateConsent or modal action
    windowMock.Userly.updateConsent({
      necessary: true,
      functional: false,
      analytics: false,
      performance: false,
      advertisement: false,
    })

    const pageviews = requests.filter((r) => r.url.includes("/api/v1/event"))
    const consentLogs = requests.filter((r) => r.url.includes("/api/v1/consent/log"))

    assert(pageviews.length === 0, `Expected 0 pageviews after Reject All, got ${pageviews.length}`)
    assert(consentLogs.length === 1, `Expected 1 consent log receipt, got ${consentLogs.length}`)
    assert(windowMock.Userly.isAnalyticsAllowed() === false, "isAnalyticsAllowed() must return false")
    console.log("✓ Reject All correctly prevented pageview and successfully logged consent receipt.")
  }

  // TEST 3: Custom Consent with Analytics OFF -> ZERO pageviews emitted
  {
    console.log("\nTest 3: Custom consent with Functional=ON, Analytics=OFF -> No pageview emitted...")
    const { sandbox, requests, windowMock } = createBrowserEnvironment({})
    vm.runInNewContext(scriptCode, sandbox)

    windowMock.Userly.updateConsent({
      necessary: true,
      functional: true,
      analytics: false,
      performance: true,
      advertisement: false,
    })

    const pageviews = requests.filter((r) => r.url.includes("/api/v1/event"))
    assert(pageviews.length === 0, `Expected 0 pageviews when Analytics is OFF, got ${pageviews.length}`)
    assert(windowMock.Userly.hasConsent("functional") === true, "Functional consent should be true")
    assert(windowMock.Userly.hasConsent("analytics") === false, "Analytics consent should be false")
    console.log("✓ Custom consent with Analytics OFF correctly blocks analytics.")
  }

  // TEST 4: Custom Consent with Analytics ON -> Pageview allowed
  {
    console.log("\nTest 4: Custom consent with Analytics=ON -> Pageview emitted...")
    const { sandbox, requests, windowMock } = createBrowserEnvironment({})
    vm.runInNewContext(scriptCode, sandbox)

    windowMock.Userly.updateConsent({
      necessary: true,
      functional: false,
      analytics: true,
      performance: false,
      advertisement: false,
    })

    const pageviews = requests.filter((r) => r.url.includes("/api/v1/event"))
    assert(pageviews.length === 1, `Expected 1 pageview when Analytics is ON, got ${pageviews.length}`)
    assert(windowMock.Userly.hasConsent("analytics") === true, "Analytics consent should be true")
    console.log("✓ Custom consent with Analytics ON correctly emits pageview.")
  }

  // TEST 5: Accept All -> Pageview allowed
  {
    console.log("\nTest 5: Accept All -> Pageview allowed...")
    const { sandbox, requests, windowMock } = createBrowserEnvironment({})
    vm.runInNewContext(scriptCode, sandbox)

    windowMock.Userly.updateConsent({
      necessary: true,
      functional: true,
      analytics: true,
      performance: true,
      advertisement: true,
    })

    const pageviews = requests.filter((r) => r.url.includes("/api/v1/event"))
    assert(pageviews.length === 1, `Expected 1 pageview after Accept All, got ${pageviews.length}`)
    console.log("✓ Accept All correctly emits pageview.")
  }

  // TEST 6: Refresh after Reject All (Stored consent with analytics=false) -> ZERO pageviews emitted
  {
    console.log("\nTest 6: Page refresh / reload after Reject All -> ZERO pageviews emitted...")
    const domain = "onconnect.one"
    const rejectedStorage = {
      [`usrly_consent_${domain}`]: JSON.stringify({
        consent_given: false,
        necessary: true,
        functional: false,
        analytics: false,
        performance: false,
        advertisement: false,
        consent_version: "1.0",
      }),
    }

    const { sandbox, requests, windowMock } = createBrowserEnvironment({
      initialLocalStorage: rejectedStorage,
    })
    vm.runInNewContext(scriptCode, sandbox)

    const pageviews = requests.filter((r) => r.url.includes("/api/v1/event"))
    assert(pageviews.length === 0, `Expected 0 pageviews on refresh after Reject All, got ${pageviews.length}`)
    assert(windowMock.Userly.isAnalyticsAllowed() === false, "isAnalyticsAllowed() must be false on refresh")
    console.log("✓ Page refresh with stored Reject All consent correctly remains blocked.")
  }

  // TEST 7: SPA Navigation after Reject All -> ZERO pageviews emitted
  {
    console.log("\nTest 7: SPA Navigation (pushState / replaceState / popstate) after Reject All -> ZERO pageviews...")
    const domain = "onconnect.one"
    const rejectedStorage = {
      [`usrly_consent_${domain}`]: JSON.stringify({
        consent_given: false,
        necessary: true,
        functional: false,
        analytics: false,
        performance: false,
        advertisement: false,
        consent_version: "1.0",
      }),
    }

    const { sandbox, requests, windowMock } = createBrowserEnvironment({
      initialLocalStorage: rejectedStorage,
    })
    vm.runInNewContext(scriptCode, sandbox)

    // Simulate SPA route changes
    windowMock.history.pushState({}, "", "https://onconnect.one/analytics")
    windowMock.history.pushState({}, "", "https://onconnect.one/settings")
    windowMock.history.replaceState({}, "", "https://onconnect.one/profile")

    const pageviews = requests.filter((r) => r.url.includes("/api/v1/event"))
    assert(pageviews.length === 0, `Expected 0 pageviews on SPA navigation, got ${pageviews.length}`)
    console.log("✓ SPA navigation after Reject All produces zero unauthorized pageviews.")
  }

  // TEST 8: window.Userly.track and usrly() blocked when analytics === false
  {
    console.log("\nTest 8: SDK track() calls while analytics consent is denied -> ZERO requests...")
    const domain = "onconnect.one"
    const rejectedStorage = {
      [`usrly_consent_${domain}`]: JSON.stringify({
        consent_given: false,
        necessary: true,
        functional: false,
        analytics: false,
        performance: false,
        advertisement: false,
      }),
    }

    const { sandbox, requests, windowMock } = createBrowserEnvironment({
      initialLocalStorage: rejectedStorage,
    })
    vm.runInNewContext(scriptCode, sandbox)

    windowMock.Userly.track("custom_button_click", { buttonId: "signup" })
    windowMock.usrly("download_report", { reportId: "123" })

    const events = requests.filter((r) => r.url.includes("/api/v1/event"))
    assert(events.length === 0, `Expected 0 events, got ${events.length}`)
    console.log("✓ Direct SDK track calls correctly blocked when analytics consent is false.")
  }

  // TEST 9: Notice-Only regime -> Pageview allowed immediately without blocking
  {
    console.log("\nTest 9: Notice-Only legal template -> Pageview allowed by default...")
    const { sandbox, requests } = createBrowserEnvironment({
      configResponse: {
        is_enabled: true,
        law_template: "notice_only",
        enable_analytics_category: true,
        default_analytics: true,
      },
    })
    vm.runInNewContext(scriptCode, sandbox)

    const pageviews = requests.filter((r) => r.url.includes("/api/v1/event"))
    assert(pageviews.length === 1, `Expected 1 pageview for Notice-Only, got ${pageviews.length}`)
    console.log("✓ Notice-Only template correctly fires pageview as designed.")
  }

  // TEST 10: GPC Signal active with opt-in model -> Analytics blocked
  {
    console.log("\nTest 10: Global Privacy Control (GPC) signal detected -> Analytics blocked...")
    const { sandbox, requests, windowMock } = createBrowserEnvironment({
      isGPCSignal: true,
      configResponse: {
        is_enabled: true,
        enable_gpc: true,
        law_template: "gdpr",
        enable_analytics_category: true,
        default_analytics: false,
      },
    })
    vm.runInNewContext(scriptCode, sandbox)

    const pageviews = requests.filter((r) => r.url.includes("/api/v1/event"))
    assert(pageviews.length === 0, `Expected 0 pageviews with GPC signal, got ${pageviews.length}`)
    assert(windowMock.Userly.isGPC() === true, "isGPC() must return true")
    console.log("✓ GPC signal correctly blocks analytics tracking.")
  }

  // TEST 11: FULL LIFECYCLE: Accept All -> Revisit -> Turn Analytics OFF -> Save -> Verify Blocked
  {
    console.log("\nTest 11: Lifecycle: Accept All -> Revisit Consent -> Turn Analytics OFF -> Save...")
    const { sandbox, requests, windowMock, storage } = createBrowserEnvironment({})
    vm.runInNewContext(scriptCode, sandbox)

    // 1. Initial: Accept All
    windowMock.Userly.updateConsent({
      necessary: true,
      functional: true,
      analytics: true,
      performance: true,
      advertisement: true,
    })

    const initialEvents = requests.filter((r) => r.url.includes("/api/v1/event"))
    assert(initialEvents.length === 1, `Expected 1 pageview after Accept All, got ${initialEvents.length}`)
    assert(windowMock.Userly.isAnalyticsAllowed() === true, "Analytics must be allowed after Accept All")

    // Clear event history for next phase
    const postAcceptCount = requests.length

    // 2. User Re-opens Preferences, turns Analytics OFF, and saves
    windowMock.Userly.updateConsent({
      necessary: true,
      functional: true,
      analytics: false,
      performance: true,
      advertisement: true,
    })

    // 3. Verify Persisted Storage
    const domain = "onconnect.one"
    const storedJson = storage[`usrly_consent_${domain}`]
    assert(storedJson !== undefined, "Consent must be persisted in localStorage")
    const parsedConsent = JSON.parse(storedJson || "{}")
    assert(parsedConsent.necessary === true, "Persisted necessary must be true")
    assert(parsedConsent.analytics === false, "Persisted analytics must be false")
    assert(windowMock.Userly.hasConsent("analytics") === false, "hasConsent('analytics') must be false")
    assert(windowMock.Userly.isAnalyticsAllowed() === false, "isAnalyticsAllowed() must be false")

    // 4. Verify no new /api/v1/event was emitted on save
    const eventsAfterWithdrawal = requests.filter((r) => r.url.includes("/api/v1/event"))
    assert(eventsAfterWithdrawal.length === 1, `Expected still 1 total pageview (0 new), got ${eventsAfterWithdrawal.length}`)

    // 5. Verify Consent Receipt logged with analytics=false
    const receipts = requests.filter((r) => r.url.includes("/api/v1/consent/log"))
    assert(receipts.length >= 2, `Expected at least 2 consent receipts, got ${receipts.length}`)
    const lastReceipt = receipts[receipts.length - 1]
    const latestReceipt = JSON.parse((lastReceipt && lastReceipt.body) || "{}")
    assert(latestReceipt.necessary === true, "Receipt necessary must be true")
    assert(latestReceipt.analytics === false, "Receipt analytics must be false")

    // 6. Test Delayed Callback after withdrawal
    sandbox.setTimeout(() => {
      windowMock.Userly.track("delayed_timer_event")
      windowMock.usrly("async_custom_action")
    })
    const eventsAfterDelayed = requests.filter((r) => r.url.includes("/api/v1/event"))
    assert(eventsAfterDelayed.length === 1, `Expected 0 events from delayed callbacks, got ${eventsAfterDelayed.length - 1}`)

    // 7. Test SPA Navigation after withdrawal
    windowMock.history.pushState({}, "", "https://onconnect.one/dashboard/reports")
    windowMock.history.replaceState({}, "", "https://onconnect.one/dashboard/settings")
    const eventsAfterSPA = requests.filter((r) => r.url.includes("/api/v1/event"))
    assert(eventsAfterSPA.length === 1, `Expected 0 events from SPA navigation, got ${eventsAfterSPA.length - 1}`)

    console.log("✓ Consent withdrawal lifecycle successfully verified (storage, receipts, delayed callbacks, SPA).")
  }

  // TEST 12: LIFECYCLE CONTINUATION: Refresh Page after Analytics Withdrawal
  {
    console.log("\nTest 12: Lifecycle: Refresh page after Analytics withdrawal -> Verify still blocked on boot...")
    const domain = "onconnect.one"
    const withdrawnStorage = {
      [`usrly_consent_${domain}`]: JSON.stringify({
        consent_given: true,
        necessary: true,
        functional: true,
        analytics: false,
        performance: true,
        advertisement: true,
        consent_version: "1.0",
        timestamp: new Date().toISOString(),
      }),
    }

    const { sandbox, requests, windowMock } = createBrowserEnvironment({
      initialLocalStorage: withdrawnStorage,
    })
    vm.runInNewContext(scriptCode, sandbox)

    const bootEvents = requests.filter((r) => r.url.includes("/api/v1/event"))
    assert(bootEvents.length === 0, `Expected 0 pageviews on boot after withdrawal, got ${bootEvents.length}`)
    assert(windowMock.Userly.isAnalyticsAllowed() === false, "isAnalyticsAllowed() must be false on boot")

    // Further navigation
    windowMock.history.pushState({}, "", "https://onconnect.one/analytics-overview")
    const navEvents = requests.filter((r) => r.url.includes("/api/v1/event"))
    assert(navEvents.length === 0, `Expected 0 pageviews on nav after reload, got ${navEvents.length}`)
    console.log("✓ Full page refresh retains analytics=false and completely blocks all pageviews.")
  }

  // TEST 13: LIFECYCLE RE-OPT-IN: Analytics OFF -> Analytics ON
  {
    console.log("\nTest 13: Lifecycle: Re-enable Analytics (Analytics OFF -> Analytics ON)...")
    const domain = "onconnect.one"
    const withdrawnStorage = {
      [`usrly_consent_${domain}`]: JSON.stringify({
        consent_given: true,
        necessary: true,
        functional: true,
        analytics: false,
        performance: true,
        advertisement: true,
        consent_version: "1.0",
      }),
    }

    const { sandbox, requests, windowMock, storage } = createBrowserEnvironment({
      initialLocalStorage: withdrawnStorage,
    })
    vm.runInNewContext(scriptCode, sandbox)

    // Verify initially blocked
    assert(requests.filter((r) => r.url.includes("/api/v1/event")).length === 0)

    // User re-enables analytics in preferences and saves
    windowMock.Userly.updateConsent({
      necessary: true,
      functional: true,
      analytics: true,
      performance: true,
      advertisement: true,
    })

    const eventsAfterReEnable = requests.filter((r) => r.url.includes("/api/v1/event"))
    assert(eventsAfterReEnable.length === 1, `Expected 1 pageview emitted upon re-enabling, got ${eventsAfterReEnable.length}`)
    assert(windowMock.Userly.isAnalyticsAllowed() === true, "isAnalyticsAllowed() must be true after re-enabling")

    // Verify updated storage
    const storedUpdated = storage[`usrly_consent_${domain}`]
    assert(storedUpdated !== undefined, "Storage must exist after update")
    const updated = JSON.parse(storedUpdated || "{}")
    assert(updated.analytics === true, "Storage must reflect analytics=true")
    console.log("✓ Re-enabling analytics cleanly triggers pageview and permits future events.")
  }

  // TEST 14: Multiple Preference Centre toggles and idempotent state
  {
    console.log("\nTest 14: Multiple modal saves without state corruption...")
    const { sandbox, requests, windowMock } = createBrowserEnvironment({})
    vm.runInNewContext(scriptCode, sandbox)

    windowMock.Userly.updateConsent({ necessary: true, analytics: true })
    assert(requests.filter((r) => r.url.includes("/api/v1/event")).length === 1, "Expected 1 pageview")

    // Save with no change (analytics remains true)
    windowMock.Userly.updateConsent({ necessary: true, analytics: true })
    assert(requests.filter((r) => r.url.includes("/api/v1/event")).length === 1, "Should not emit duplicate pageview")

    // Turn analytics off
    windowMock.Userly.updateConsent({ necessary: true, analytics: false })
    assert(requests.filter((r) => r.url.includes("/api/v1/event")).length === 1, "Should not emit new pageview when turning off")

    // Save with no change (analytics remains false)
    windowMock.Userly.updateConsent({ necessary: true, analytics: false })
    assert(requests.filter((r) => r.url.includes("/api/v1/event")).length === 1, "Should not emit pageview when remaining false")

    console.log("✓ Repeated saves are idempotent and produce no duplicate or leaked events.")
  }

  console.log("\n🎉 ALL 14 RUNTIME CONSENT GATE & LIFECYCLE REGRESSION TESTS PASSED SUCCESSFULLY!")
}

runTests().catch((err) => {
  console.error("Test failure:", err)
  process.exit(1)
})
