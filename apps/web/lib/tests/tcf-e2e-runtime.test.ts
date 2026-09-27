import { chromium } from "playwright"
import http from "node:http"
import { GET } from "../../app/userly.js/route"

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[TCF Test Failure] ${message}`)
  }
}

async function runTCFVerification() {
  console.log("=========================================================================")
  console.log(" STARTING REAL PLAYWRIGHT RUNTIME VERIFICATION FOR IAB TCF v2.3")
  console.log("=========================================================================\n")

  // Read tracker script via GET() handler
  const response = await GET()
  const runtimeScript = await response.text()

  // Setup minimal local HTTP server to host the test page and mock API responses
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
      res.writeHead(200, { "Content-Type": "application/javascript" })
      res.end(runtimeScript)
      return
    }

    if (req.url?.startsWith("/api/v1/consent/config")) {
      res.writeHead(200, { "Content-Type": "application/json" })
      res.end(
        JSON.stringify({
          domain: "localhost",
          is_enabled: true,
          layout: "bottom_bar",
          enable_consent_mode_v2: true,
          enable_iab_tcf: true,
          enable_gpc: true,
          law_template: "gdpr",
          consent_version: "1.0",
        })
      )
      return
    }

    if (req.url?.startsWith("/api/v1/consent/log") || req.url?.startsWith("/api/v1/event")) {
      res.writeHead(200, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ success: true }))
      return
    }

    if (req.url === "/" || req.url?.startsWith("/index.html")) {
      res.writeHead(200, { "Content-Type": "text/html" })
      res.end(`<!DOCTYPE html>
<html>
<head>
  <title>IAB TCF v2.3 Test Suite</title>
</head>
<body>
  <h1>UpFront CMP IAB TCF v2.3 Runtime Test Bed</h1>
  <script src="/userly.js" data-domain="localhost" data-api="http://127.0.0.1:3999"></script>
</body>
</html>`)
      return
    }

    res.writeHead(404)
    res.end("Not Found")
  })

  await new Promise<void>((resolve) => server.listen(3999, "127.0.0.1", resolve))
  console.log("✓ Test server started on http://127.0.0.1:3999")

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  page.on("console", (msg) => console.log("  [Browser Console]:", msg.text()))
  page.on("pageerror", (err) => console.log("  [Browser Page Error]:", err))

  try {
    console.log(">> Navigating to test page with real runtime...")
    await page.goto("http://127.0.0.1:3999/")
    await page.waitForTimeout(500)

    // 1. Verify window.__tcfapi exists
    console.log("\n[Test 1] Checking window.__tcfapi existence and locator iframe...")
    const hasTcfApi = await page.evaluate(() => typeof (window as any).__tcfapi === "function")
    assert(hasTcfApi, "window.__tcfapi must be exposed on window")
    console.log("  ✓ window.__tcfapi exists as a function")

    const hasLocatorIframe = await page.evaluate(() => Boolean((window as any).frames["__tcfapiLocator"]))
    assert(hasLocatorIframe, "__tcfapiLocator iframe must exist for cross-frame signaling")
    console.log("  ✓ __tcfapiLocator iframe confirmed")

    // 2. Test ping command
    console.log("\n[Test 2] Testing 'ping' command...")
    const pingResult = await page.evaluate(() => {
      return new Promise<any>((resolve) => {
        (window as any).__tcfapi("ping", 2, (data: any, success: boolean) => {
          resolve({ data, success })
        })
      })
    })
    assert(pingResult.success === true, "ping command must return success: true")
    assert(pingResult.data.cmpLoaded === true, "ping.cmpLoaded must be true")
    assert(pingResult.data.apiVersion === "2.3", "ping.apiVersion must be '2.3'")
    assert(pingResult.data.tcfPolicyVersion === 4, "ping.tcfPolicyVersion must be 4 for TCF v2.2/v2.3")
    assert(pingResult.data.gdprApplies === true, "ping.gdprApplies must be true")
    console.log("  ✓ 'ping' command returned valid TCF v2.3 metadata:", pingResult.data)

    // 3. Test getTCData command
    console.log("\n[Test 3] Testing 'getTCData' command...")
    const tcDataResult = await page.evaluate(() => {
      return new Promise<any>((resolve) => {
        (window as any).__tcfapi("getTCData", 2, (data: any, success: boolean) => {
          resolve({ data, success })
        })
      })
    })
    assert(tcDataResult.success === true, "getTCData must return success: true")
    assert(typeof tcDataResult.data.tcString === "string", "tcData.tcString must be string")
    assert(tcDataResult.data.tcString.length >= 30, "tcData.tcString must be a genuine base64url encoded bitfield")
    assert(tcDataResult.data.tcString !== "CP123456789.YAAAAAAAAA", "Mock TCString must NOT be returned")
    console.log("  ✓ Initial TCString generated dynamically:", tcDataResult.data.tcString)

    // 4. Test addEventListener and reactive updates on Accept All
    console.log("\n[Test 4] Testing 'addEventListener' and Accept All transition...")
    const acceptEvents = await page.evaluate(() => {
      return new Promise<any[]>((resolve) => {
        const events: any[] = []
        ;(window as any).__tcfapi("addEventListener", 2, (data: any, success: boolean) => {
          events.push({ tcString: data.tcString, eventStatus: data.eventStatus, purpose: data.purpose })
          if (data.eventStatus === "useractioncomplete") {
            resolve(events)
          }
        })

        // Simulate user clicking Accept All / updating consent
        setTimeout(() => {
          ;(window as any).Userly.updateConsent({
            consent_given: true,
            necessary: true,
            functional: true,
            analytics: true,
            performance: true,
            advertisement: true,
          })
        }, 100)
      })
    })

    assert(acceptEvents.length >= 2, "Listener must receive initial status and useractioncomplete event")
    const lastEvent = acceptEvents[acceptEvents.length - 1]
    assert(lastEvent.eventStatus === "useractioncomplete", "Event status must be 'useractioncomplete'")
    assert(lastEvent.purpose.consents[1] === true, "Purpose 1 (Storage) must be true after Accept All")
    assert(lastEvent.purpose.consents[2] === true, "Purpose 2 (Ads) must be true after Accept All")
    assert(lastEvent.purpose.consents[3] === true, "Purpose 3 (Personalised Ads) must be true after Accept All")
    assert(lastEvent.purpose.consents[7] === true, "Purpose 7 (Ad Measurement) must be true after Accept All")
    assert(lastEvent.purpose.consents[8] === true, "Purpose 8 (Content Measurement) must be true after Accept All")
    console.log("  ✓ Accept All updated TCF purposes and fired listener. New TCString:", lastEvent.tcString)

    // 5. Test Reject All transition
    console.log("\n[Test 5] Testing Reject All transition...")
    const rejectEvent = await page.evaluate(() => {
      return new Promise<any>((resolve) => {
        ;(window as any).__tcfapi("addEventListener", 2, (data: any, success: boolean) => {
          if (data.eventStatus === "useractioncomplete" && data.purpose.consents[2] === false) {
            resolve(data)
          }
        })

        setTimeout(() => {
          ;(window as any).Userly.updateConsent({
            consent_given: false,
            necessary: true,
            functional: false,
            analytics: false,
            performance: false,
            advertisement: false,
          })
        }, 100)
      })
    })

    assert(rejectEvent.purpose.consents[2] === false, "Purpose 2 (Ads) must be false after Reject All")
    assert(rejectEvent.purpose.consents[3] === false, "Purpose 3 (Personalised Ads) must be false after Reject All")
    assert(rejectEvent.purpose.consents[8] === false, "Purpose 8 (Content Measurement) must be false after Reject All")
    console.log("  ✓ Reject All updated TCF purposes and fired listener. New TCString:", rejectEvent.tcString)

    // 6. Test removeEventListener
    console.log("\n[Test 6] Testing 'removeEventListener'...")
    const removeResult = await page.evaluate(() => {
      return new Promise<any>((resolve) => {
        let listenerId = 0
        let callCount = 0
        ;(window as any).__tcfapi("addEventListener", 2, (data: any) => {
          callCount++
          listenerId = data.listenerId
        })

        setTimeout(() => {
          ;(window as any).__tcfapi("removeEventListener", 2, (success: boolean) => {
            const countBefore = callCount
            // Fire another consent change
            ;(window as any).Userly.updateConsent({ functional: true })
            setTimeout(() => {
              resolve({ removeSuccess: success, callCountBefore: countBefore, callCountAfter: callCount })
            }, 100)
          }, listenerId)
        }, 50)
      })
    })

    assert(removeResult.removeSuccess === true, "removeEventListener must report success: true")
    assert(removeResult.callCountBefore === removeResult.callCountAfter, "Removed listener must not receive further events")
    console.log("  ✓ removeEventListener successfully deregistered listener.")

    // 7. Test cross-frame postMessage support
    console.log("\n[Test 7] Testing iframe postMessage bridge...")
    const postMessageResult: any = await page.evaluate(`
      new Promise(function(resolve) {
        var callId = "test-call-42";
        function onMsg(event) {
          var ret = event.data && event.data.__tcfapiReturn;
          if (ret && ret.callId === callId) {
            window.removeEventListener("message", onMsg);
            resolve(ret);
          }
        }
        window.addEventListener("message", onMsg);
        window.postMessage({
          __tcfapiCall: {
            command: "ping",
            version: 2,
            callId: callId
          }
        }, "*");
      })
    `)

    assert(postMessageResult.success === true, "postMessage __tcfapiCall must return success: true")
    assert(postMessageResult.returnValue.apiVersion === "2.3", "postMessage returnValue must match TCF ping data")
    console.log("  ✓ postMessage bridge successfully answered cross-frame call.")

    console.log("\n=========================================================================")
    console.log(" ALL 7 IAB TCF v2.3 PLAYWRIGHT RUNTIME TESTS PASSED PERFECTLY")
    console.log("=========================================================================\n")
  } finally {
    await browser.close()
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
}

runTCFVerification().catch((err) => {
  console.error("\n[FATAL ERROR in TCF Verification]:", err)
  process.exit(1)
})
