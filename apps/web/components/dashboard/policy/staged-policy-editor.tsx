"use client"

import { useState, useMemo } from "react"
import { PolicyDefinition, DomainPolicyRecord } from "./policy-types"
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Plus,
  Trash2,
  Shield,
  Scale,
  Loader2,
  Cookie,
  Globe,
  Sliders,
  ShieldCheck,
  Info,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/sonner"
import { useCMPCookiePolicy } from "./use-cmp-cookie-policy"

interface StagedPolicyEditorProps {
  policy: PolicyDefinition
  domain: string
  existingRecord?: DomainPolicyRecord
  onBack: () => void
  onSaveDraft: (record: DomainPolicyRecord) => void
  onPublish: (record: DomainPolicyRecord) => void
}

export function StagedPolicyEditor({
  policy,
  domain,
  existingRecord,
  onBack,
  onSaveDraft,
  onPublish,
}: StagedPolicyEditorProps) {
  const isPrivacy = policy.id === "privacy"
  const isCookies = policy.id === "cookies"
  const isTerms = !isPrivacy && !isCookies

  const totalSteps = isCookies ? 6 : 8
  const [activeStep, setActiveStep] = useState<number>(1)
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false)
  const [copiedType, setCopiedType] = useState<string | null>(null)
  const [publishModalTab, setPublishModalTab] = useState<"html" | "script">("html")
  const [isSaving, setIsSaving] = useState(false)

  // Live CMP scanner sync
  const cmpData = useCMPCookiePolicy(domain)

  const cfg = existingRecord?.config || {}

  // -------------------------------------------------------------
  // SHARED ENTITY STATE
  // -------------------------------------------------------------
  const [companyName, setCompanyName] = useState(cfg.companyName || "Acme Technologies Inc.")
  const [websiteUrl, setWebsiteUrl] = useState(cfg.websiteUrl || `https://${domain || "example.com"}`)
  const [supportEmail, setSupportEmail] = useState(cfg.supportEmail || `privacy@${domain || "example.com"}`)
  const [country, setCountry] = useState(cfg.country || "United States")
  const [stateRegion, setStateRegion] = useState(cfg.stateRegion || "California")
  const [effectiveDate, setEffectiveDate] = useState(
    cfg.effectiveDate ||
      new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
  )

  // -------------------------------------------------------------
  // 1. PRIVACY POLICY QUESTIONNAIRE STATE
  // -------------------------------------------------------------
  const [platforms, setPlatforms] = useState<string[]>(
    cfg.platforms || ["Website", "Mobile App (iOS/Android)"]
  )
  const [targetAudience, setTargetAudience] = useState<string>(cfg.targetAudience || "general")
  const [directData, setDirectData] = useState<string[]>(
    cfg.directData || [
      "Names",
      "Email addresses",
      "Phone numbers",
      "Billing addresses",
      "Usernames",
      "Passwords",
      "Contact preferences",
    ]
  )
  const [customDataInput, setCustomDataInput] = useState("")
  const [autoData, setAutoData] = useState<string[]>(
    cfg.autoData || [
      "IP address and device geolocation",
      "Browser type, version, and operating system",
      "Log files, timestamps, and page engagement data",
    ]
  )
  const [purposes, setPurposes] = useState<string[]>(
    cfg.purposes || [
      "To facilitate account creation and logon process",
      "To fulfill and manage orders, payments, and subscriptions",
      "To deliver administrative, security, and service notices",
      "To protect our services from malicious activities, spam, and fraud",
      "To analyze web metrics and improve platform performance",
    ]
  )
  const [disclosures, setDisclosures] = useState<string[]>(
    cfg.disclosures || [
      "Cloud hosting and database infrastructure (AWS, Vercel, Google Cloud)",
      "Payment processors (Stripe, PayPal, Paddle)",
      "Web analytics engines (Cookieless Analytics)",
      "Customer support and live ticketing desks",
      "Legal authorities and regulators when required by statutory law",
    ]
  )
  const [useCookies, setUseCookies] = useState(cfg.useCookies !== undefined ? cfg.useCookies : true)
  const [useAnalytics, setUseAnalytics] = useState(cfg.useAnalytics !== undefined ? cfg.useAnalytics : true)
  const [useAds, setUseAds] = useState(cfg.useAds !== undefined ? cfg.useAds : false)
  const [includeGdpr, setIncludeGdpr] = useState(cfg.includeGdpr !== undefined ? cfg.includeGdpr : true)
  const [includeCcpa, setIncludeCcpa] = useState(cfg.includeCcpa !== undefined ? cfg.includeCcpa : true)
  const [includeCoppa, setIncludeCoppa] = useState(cfg.includeCoppa !== undefined ? cfg.includeCoppa : true)
  const [minAge, setMinAge] = useState(cfg.minAge || "13")
  const [dpoEmail, setDpoEmail] = useState(cfg.dpoEmail || `dpo@${domain || "example.com"}`)
  const [retentionPeriod, setRetentionPeriod] = useState(cfg.retentionPeriod || "account_active")

  // -------------------------------------------------------------
  // 2. TERMS OF SERVICE QUESTIONNAIRE STATE
  // -------------------------------------------------------------
  const [tosPlatforms, setTosPlatforms] = useState<string[]>(
    cfg.tosPlatforms || ["Website", "SaaS Web Application", "Mobile App (iOS/Android)"]
  )
  const [tosUserAge, setTosUserAge] = useState(cfg.tosUserAge || "13")
  const [accountRequired, setAccountRequired] = useState(cfg.accountRequired !== undefined ? cfg.accountRequired : true)
  const [allowUgc, setAllowUgc] = useState(cfg.allowUgc !== undefined ? cfg.allowUgc : true)
  const [ugcModeration, setUgcModeration] = useState(cfg.ugcModeration !== undefined ? cfg.ugcModeration : true)
  const [prohibitedList, setProhibitedList] = useState<string[]>(
    cfg.prohibitedList || [
      "Automated scraping, crawling, or extracting data without authorization",
      "Reverse engineering, decompiling, or attempting to discover source code",
      "Transmitting viruses, malware, or attempting denial-of-service attacks",
      "Impersonating other users or misrepresenting entity affiliations",
      "Harassing, defaming, or abusing other members or staff",
      "Commercial reselling or exploiting services without permission",
    ]
  )
  const [customProhibitedInput, setCustomProhibitedInput] = useState("")
  const [dmcaEmail, setDmcaEmail] = useState(cfg.dmcaEmail || `legal@${domain || "example.com"}`)
  const [monetizationType, setMonetizationType] = useState<string>(cfg.monetizationType || "paid_subscriptions")
  const [billingCycle, setBillingCycle] = useState(cfg.billingCycle || "monthly_annual")
  const [autoRenewalNotice, setAutoRenewalNotice] = useState(cfg.autoRenewalNotice !== undefined ? cfg.autoRenewalNotice : true)
  const [refundPolicySummary, setRefundPolicySummary] = useState(
    cfg.refundPolicySummary || "30-day money-back guarantee for subscription fees upon written request."
  )
  const [warrantyDisclaimer, setWarrantyDisclaimer] = useState(cfg.warrantyDisclaimer !== undefined ? cfg.warrantyDisclaimer : true)
  const [liabilityLimit, setLiabilityLimit] = useState(
    cfg.liabilityLimit || "Amount paid by user in preceding 12 months"
  )
  const [arbitrationClause, setArbitrationClause] = useState(
    cfg.arbitrationClause !== undefined ? cfg.arbitrationClause : true
  )
  const [classActionWaiver, setClassActionWaiver] = useState(
    cfg.classActionWaiver !== undefined ? cfg.classActionWaiver : true
  )

  // -------------------------------------------------------------
  // 3. COOKIE POLICY EXACT QUESTIONNAIRE STATE
  // -------------------------------------------------------------
  const [cookiePlatforms, setCookiePlatforms] = useState<string[]>(
    cfg.cookiePlatforms || ["Main Website", "Subdomains", "Web Application Portal"]
  )
  const [autoSyncScanTable, setAutoSyncScanTable] = useState(
    cfg.autoSyncScanTable !== undefined ? cfg.autoSyncScanTable : true
  )
  const [allowConsentRevisit, setAllowConsentRevisit] = useState(
    cfg.allowConsentRevisit !== undefined ? cfg.allowConsentRevisit : true
  )
  const [cookieBrowserGuides, setCookieBrowserGuides] = useState<string[]>(
    cfg.cookieBrowserGuides || ["Chrome", "Safari", "Firefox", "Microsoft Edge"]
  )

  // Discovered Cookies for Cookie Policy
  const displayCookies = useMemo(() => {
    return cmpData.cookies.length > 0 ? cmpData.cookies : [
      { name: "_ga", category: "analytics", service_name: "Google Analytics", duration: "2 years" },
      { name: "_gid", category: "analytics", service_name: "Google Analytics", duration: "24 hours" },
      { name: "upfront_test_functional", category: "functional", service_name: "Uncatalogued Provider", duration: "12 months" },
      { name: "consentos_consent", category: "necessary", service_name: "Consent Management", duration: "12 months" },
      { name: "session", category: "necessary", service_name: "Session Management", duration: "Session" },
    ]
  }, [cmpData.cookies])

  // Exact standard texts requested by user
  const aboutHeading = "What are cookies?"
  const aboutDescription = `This Cookie Policy explains what cookies are, how we use them, the types of cookies we use (i.e., the information we collect using cookies and how that information is used), and how to manage your cookie settings.\n\nCookies are small text files used to store small pieces of information. They are stored on your device when a website loads in your browser. These cookies help ensure that the website functions properly, enhance security, provide a better user experience, and analyse performance to identify what works and where improvements are needed.`

  const useHeading = "How do we use cookies?"
  const useDescription = `Like most online services, our website uses both first-party and third-party cookies for various purposes. First-party cookies are primarily necessary for the website to function properly and do not collect any personally identifiable data.\n\nThe third-party cookies used on our website primarily help us understand how the website performs, track how you interact with it, keep our services secure, deliver relevant advertisements, and enhance your overall user experience while improving the speed of your future interactions with our website.`

  const typesHeading = "Types of cookies we use"

  const prefHeading = "Manage cookie preferences"
  const prefDescription = `You can modify your cookie settings anytime by clicking the 'Consent Preferences' button above. This will allow you to revisit the cookie consent banner and update your preferences or withdraw your consent immediately.\n\nAdditionally, different browsers offer various methods to block and delete cookies used by websites. You can adjust your browser settings to block or delete cookies. Below are links to support documents on how to manage and delete cookies in major web browsers:\n\nChrome: https://support.google.com/accounts/answer/32050\nSafari: https://support.apple.com/en-in/guide/safari/sfri11471/mac\nFirefox: https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox\nMicrosoft Edge: https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09\n\nIf you are using a different web browser, please refer to its official support documentation.`

  // -------------------------------------------------------------
  // Steps Configuration
  // -------------------------------------------------------------
  const privacySteps = [
    { step: 1, label: "1. Privacy Policy Uses" },
    { step: 2, label: "2. User Information" },
    { step: 3, label: "3. Collection of Information" },
    { step: 4, label: "4. Use of Information" },
    { step: 5, label: "5. Disclosure of Information" },
    { step: 6, label: "6. Tracking Technologies" },
    { step: 7, label: "7. User Rights" },
    { step: 8, label: "8. Final Review" },
  ]

  const termsSteps = [
    { step: 1, label: "1. Agreement & Platform Scope" },
    { step: 2, label: "2. User Accounts & Eligibility" },
    { step: 3, label: "3. User-Generated Content" },
    { step: 4, label: "4. Prohibited Activities" },
    { step: 5, label: "5. Intellectual Property & DMCA" },
    { step: 6, label: "6. Subscriptions & Billing" },
    { step: 7, label: "7. Liability & Dispute Resolution" },
    { step: 8, label: "8. Final Review" },
  ]

  const cookieSteps = [
    { step: 1, label: "1. Scope & Website Details" },
    { step: 2, label: "2. What Are Cookies?" },
    { step: 3, label: "3. How We Use Cookies" },
    { step: 4, label: "4. Types of Cookies (Live Table)" },
    { step: 5, label: "5. Manage Cookie Preferences" },
    { step: 6, label: "6. Review & Publish" },
  ]

  const currentSteps = isPrivacy ? privacySteps : isCookies ? cookieSteps : termsSteps
  const progressPct = Math.round((activeStep / totalSteps) * 100)

  // Custom handlers
  const handleAddCustomData = () => {
    if (!customDataInput.trim()) return
    if (!directData.includes(customDataInput.trim())) {
      setDirectData([...directData, customDataInput.trim()])
    }
    setCustomDataInput("")
  }

  const handleAddCustomProhibited = () => {
    if (!customProhibitedInput.trim()) return
    if (!prohibitedList.includes(customProhibitedInput.trim())) {
      setProhibitedList([...prohibitedList, customProhibitedInput.trim()])
    }
    setCustomProhibitedInput("")
  }

  // -------------------------------------------------------------
  // Markdown & HTML Generators
  // -------------------------------------------------------------
  const generateMarkdown = (): string => {
    if (isPrivacy) {
      return `# Privacy Policy for ${domain}

**Effective Date:** ${effectiveDate}  
**Website:** [${websiteUrl}](${websiteUrl})  
**Entity:** ${companyName} (${country}${stateRegion ? `, ${stateRegion}` : ""})  
**Support Email:** ${supportEmail}  

---

## 1. Scope & Platforms
This Privacy Policy applies to personal data collected across the following platforms operated by **${companyName}**:
${platforms.map((p) => `- ${p}`).join("\n")}

## 2. Personal Information Collected Directly
We collect personal information that you voluntarily provide to us when you register on the website, express an interest in obtaining information about us or our products and services, or otherwise contact us:
${directData.map((d) => `- **${d}**`).join("\n")}

## 3. Automatically Collected Telemetry
When you visit our platforms, certain diagnostic metadata is recorded automatically:
${autoData.map((a) => `- ${a}`).join("\n")}

## 4. Purpose and Lawful Grounds for Processing
We process your personal information for the following legitimate business purposes:
${purposes.map((p) => `- ${p}`).join("\n")}

## 5. Third-Party Disclosures & Processors
We share information with service providers subject to strict confidentiality agreements:
${disclosures.map((d) => `- ${d}`).join("\n")}

## 6. International Compliance & Privacy Rights
${includeGdpr ? `### General Data Protection Regulation (GDPR - EEA / UK):
- **Lawful Basis:** Contractual necessity, legitimate business interests, and user consent.
- **Your Statutory Rights:** You have the right to request access, rectification, portability, and erasure of your personal data, or submit an inquiry to our DPO at **${dpoEmail}**.` : ""}

${includeCcpa ? `### California Consumer Privacy Act (CCPA / CPRA):
- We do not sell or share consumer personal data for monetary or other valuable consideration.
- California residents retain the right to request notice at collection and disclosure of categories of personal info collected in the preceding 12 months.` : ""}

${includeCoppa ? `### Children's Online Privacy Protection (COPPA):
- Our services are strictly intended for users aged **${minAge}** and above. We do not knowingly collect personal data from minors.` : ""}

## 7. Data Retention & Subject Access Requests
We retain personal data for as long as your account remains active or as required by law. To request data deletion or account closure, contact our compliance desk at **${supportEmail}**.
`
    } else if (isCookies) {
      let md = `# Cookie Policy for ${domain}\n`
      md += `*Last updated: ${effectiveDate}*\n\n`

      md += `## ${aboutHeading}\n`
      md += `${aboutDescription}\n\n`

      md += `## ${useHeading}\n`
      md += `${useDescription}\n\n`

      md += `## ${typesHeading}\n`
      md += `**Live Cookie Table**  \n`
      md += `*${displayCookies.length} active cookies*  \n`
      md += `*Automatically rendered and synchronized from your website scans.*\n\n`

      md += `| Cookie Name | Category | Provider | Duration |\n`
      md += `| :--- | :--- | :--- | :--- |\n`
      displayCookies.forEach((c) => {
        md += `| \`${c.name}\` | ${c.category} | ${c.service_name || domain || "First Party"} | ${c.duration || "Session"} |\n`
      })
      md += `\n`

      md += `## ${prefHeading}\n`
      md += `[Consent Preferences](javascript:void(0))\n\n`
      md += `${prefDescription}\n`

      return md
    } else {
      return `# Terms and Conditions for ${domain}

**Effective Date:** ${effectiveDate}  
**Website:** [${websiteUrl}](${websiteUrl})  
**Entity:** ${companyName} (${country}${stateRegion ? `, ${stateRegion}` : ""})  
**Contact:** ${supportEmail}

---

## 1. Agreement to Terms
These Terms and Conditions constitute a legally binding agreement between you and **${companyName}**. By accessing or using \`${websiteUrl}\` across **${tosPlatforms.join(", ")}**, you agree that you are at least **${tosUserAge}** years of age and agree to comply with these terms.

## 2. User Accounts & Registration
${accountRequired ? "You are required to register an account to access core platform features. You are responsible for maintaining the confidentiality of your login credentials and are fully liable for all activities that occur under your account." : "Access to our public website does not require account registration."}

## 3. User-Generated Content & Contributions
${allowUgc ? `Users may submit, post, or upload content (including comments, reviews, or media). By submitting content, you grant **${companyName}** a worldwide, royalty-free, non-exclusive license to host, display, and distribute such contributions.` : "Users are not permitted to submit or publish user-generated content on the platform."}
${ugcModeration ? `We reserve the unilateral right to monitor, edit, or remove any content that violates these Terms or applicable statutory law without prior notice.` : ""}

## 4. Prohibited Activities
You agree not to engage in any of the following unauthorized activities on our platform:
${prohibitedList.map((p) => `- ${p}`).join("\n")}

## 5. Intellectual Property & DMCA Copyright Notice
All source code, platform architecture, databases, UI designs, software, trademarks, graphics, and logos are the proprietary intellectual property of **${companyName}**. Users receive a revocable, non-exclusive license solely to access the platform.
For copyright infringement inquiries under the DMCA, contact our designated agent at **${dmcaEmail}**.

## 6. Subscriptions, Billing & Cancellations
${monetizationType === "paid_subscriptions" ? `We offer recurring subscription plans billed on a ${billingCycle.replace("_", " & ")} basis.` : monetizationType === "one_time" ? "We offer paid one-time products and digital purchases." : "Our services are provided on a complimentary free basis."}
${autoRenewalNotice ? "Subscriptions automatically renew at the end of each billing cycle unless cancelled prior to renewal." : ""}
${refundPolicySummary}

## 7. Warranty Disclaimer, Limitation of Liability & Dispute Resolution
${warrantyDisclaimer ? `Our services are provided strictly on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind.` : ""}
To the maximum extent permitted by applicable law, our aggregate liability shall not exceed **${liabilityLimit}**.
${arbitrationClause ? `Any legal controversy or claim shall be resolved through binding arbitration in ${country}${stateRegion ? `, ${stateRegion}` : ""}.` : ""}
${classActionWaiver ? "You agree to resolve disputes solely on an individual basis and waive any right to participate in a class-action lawsuit." : ""}
`
    }
  }

  const generateHtml = (): string => {
    if (isCookies) {
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Cookie Policy - ${domain}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 840px; margin: 0 auto; padding: 32px 16px; }
    h1 { font-size: 26px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
    h2 { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 24px; margin-bottom: 8px; }
    p, li { font-size: 14px; color: #334155; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
    th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; }
    th { background-color: #f8fafc; font-weight: 600; color: #0f172a; }
    .btn-revisit { display: inline-block; padding: 8px 16px; background: #1868db; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 13px; margin: 12px 0; }
    ul { padding-left: 20px; margin-bottom: 16px; }
    a { color: #1868db; text-decoration: underline; }
    .meta { font-size: 13px; color: #64748b; margin-bottom: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; }
  </style>
</head>
<body>
  <h1>Cookie Policy for ${domain}</h1>
  <div class="meta"><strong>Effective Date:</strong> ${effectiveDate} | <strong>Domain:</strong> https://${domain}</div>

  <h2>What are cookies?</h2>
  <p>This Cookie Policy explains what cookies are, how we use them, the types of cookies we use (i.e., the information we collect using cookies and how that information is used), and how to manage your cookie settings.</p>
  <p>Cookies are small text files used to store small pieces of information. They are stored on your device when a website loads in your browser. These cookies help ensure that the website functions properly, enhance security, provide a better user experience, and analyse performance to identify what works and where improvements are needed.</p>

  <h2>How do we use cookies?</h2>
  <p>Like most online services, our website uses both first-party and third-party cookies for various purposes. First-party cookies are primarily necessary for the website to function properly and do not collect any personally identifiable data.</p>
  <p>The third-party cookies used on our website primarily help us understand how the website performs, track how you interact with it, keep our services secure, deliver relevant advertisements, and enhance your overall user experience while improving the speed of your future interactions with our website.</p>

  <h2>Types of cookies we use</h2>
  <p><strong>Live Cookie Table</strong><br />
  <em>${displayCookies.length} active cookies</em><br />
  Automatically rendered and synchronized from your website scans.</p>

  <table>
    <thead>
      <tr>
        <th>Cookie Name</th>
        <th>Category</th>
        <th>Provider</th>
        <th>Duration</th>
      </tr>
    </thead>
    <tbody>
      ${displayCookies
        .map(
          (c) => `<tr>
        <td><code>${c.name}</code></td>
        <td>${c.category}</td>
        <td>${c.service_name || domain || "First Party"}</td>
        <td>${c.duration || "Session"}</td>
      </tr>`
        )
        .join("\n      ")}
    </tbody>
  </table>

  <h2>Manage cookie preferences</h2>
  <p><a href="javascript:void(0)" class="btn-revisit">Consent Preferences</a></p>
  <p>You can modify your cookie settings anytime by clicking the 'Consent Preferences' button above. This will allow you to revisit the cookie consent banner and update your preferences or withdraw your consent immediately.</p>
  <p>Additionally, different browsers offer various methods to block and delete cookies used by websites. You can adjust your browser settings to block or delete cookies. Below are links to support documents on how to manage and delete cookies in major web browsers:</p>
  <ul>
    <li><strong>Chrome:</strong> <a href="https://support.google.com/accounts/answer/32050" target="_blank" rel="noopener noreferrer">https://support.google.com/accounts/answer/32050</a></li>
    <li><strong>Safari:</strong> <a href="https://support.apple.com/en-in/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">https://support.apple.com/en-in/guide/safari/sfri11471/mac</a></li>
    <li><strong>Firefox:</strong> <a href="https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox" target="_blank" rel="noopener noreferrer">https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox</a></li>
    <li><strong>Microsoft Edge:</strong> <a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09</a></li>
  </ul>
  <p>If you are using a different web browser, please refer to its official support documentation.</p>
</body>
</html>`
    }

    const md = generateMarkdown()
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${policy.name} - ${domain}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 820px; margin: 0 auto; padding: 32px 16px; }
    h1 { font-size: 26px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
    h2 { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 24px; margin-bottom: 8px; }
    p, li { font-size: 14px; color: #334155; margin-bottom: 10px; }
    ul { padding-left: 20px; margin-bottom: 16px; }
    .meta { font-size: 13px; color: #64748b; margin-bottom: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; }
  </style>
</head>
<body>
  <h1>${policy.name} for ${domain}</h1>
  <div class="meta"><strong>Effective Date:</strong> ${effectiveDate} | <strong>Domain:</strong> https://${domain}</div>
  ${md
    .split("\n\n")
    .map((chunk) => {
      if (chunk.startsWith("## ")) return `<h2>${chunk.replace("## ", "")}</h2>`
      if (chunk.startsWith("### ")) return `<h3>${chunk.replace("### ", "")}</h3>`
      if (chunk.startsWith("- ")) {
        const items = chunk.split("\n").map((line) => `<li>${line.replace(/^- \*\*(.*?)\*\*/, "<strong>$1</strong>").replace(/^- /, "")}</li>`).join("")
        return `<ul>${items}</ul>`
      }
      return `<p>${chunk.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\`(.*?)\`/g, "<code>$1</code>")}</p>`
    })
    .join("\n  ")}
</body>
</html>`
  }

  const dynamicScriptEmbed = isCookies
    ? `<div id="usrly-cookie-declaration" data-domain="${domain}"></div>\n<script defer src="https://usrly-five.vercel.app/script.js"></script>`
    : `<div id="usrly-${policy.id}-policy" data-domain="${domain}"></div>\n<script defer src="https://usrly-five.vercel.app/script.js"></script>`

  const getCurrentConfig = () => {
    if (isPrivacy) {
      return {
        platforms,
        targetAudience,
        companyName,
        websiteUrl,
        supportEmail,
        country,
        stateRegion,
        effectiveDate,
        directData,
        autoData,
        purposes,
        disclosures,
        useCookies,
        useAnalytics,
        useAds,
        includeGdpr,
        includeCcpa,
        includeCoppa,
        minAge,
        dpoEmail,
        retentionPeriod,
      }
    } else if (isCookies) {
      return {
        cookiePlatforms,
        companyName,
        websiteUrl,
        supportEmail,
        effectiveDate,
        autoSyncScanTable,
        allowConsentRevisit,
        cookieBrowserGuides,
      }
    } else {
      return {
        tosPlatforms,
        companyName,
        websiteUrl,
        supportEmail,
        country,
        stateRegion,
        effectiveDate,
        tosUserAge,
        accountRequired,
        allowUgc,
        ugcModeration,
        prohibitedList,
        dmcaEmail,
        monetizationType,
        billingCycle,
        autoRenewalNotice,
        refundPolicySummary,
        warrantyDisclaimer,
        liabilityLimit,
        arbitrationClause,
        classActionWaiver,
      }
    }
  }

  // -------------------------------------------------------------
  // Backend Action Handlers
  // -------------------------------------------------------------
  const handleSaveDraftAction = async () => {
    try {
      setIsSaving(true)
      const config = getCurrentConfig()
      const markdown = generateMarkdown()
      const html = generateHtml()

      const res = await fetch("/api/v1/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain,
          policyId: policy.id,
          status: "draft",
          customTitle: policy.name,
          version: existingRecord?.version || "0.1",
          config,
          contentMarkdown: markdown,
          contentHtml: html,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || "Failed to save draft")
      }

      const savedData: DomainPolicyRecord = await res.json()
      onSaveDraft(savedData)
      toast.success(`${policy.name} draft saved successfully!`)
      onBack()
    } catch (err: any) {
      console.error("Save draft error:", err)
      toast.error(err.message || "Failed to save draft")
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublishAction = async () => {
    try {
      setIsSaving(true)
      const config = getCurrentConfig()
      const markdown = generateMarkdown()
      const html = generateHtml()

      const res = await fetch("/api/v1/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain,
          policyId: policy.id,
          status: "published",
          customTitle: policy.name,
          version: "1.0",
          config,
          contentMarkdown: markdown,
          contentHtml: html,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || "Failed to publish policy")
      }

      const savedData: DomainPolicyRecord = await res.json()
      onPublish(savedData)
      setIsPublishModalOpen(true)
    } catch (err: any) {
      console.error("Publish error:", err)
      toast.error(err.message || "Failed to publish policy")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopiedType(type)
    toast.success("Copied to clipboard!")
    setTimeout(() => setCopiedType(null), 2000)
  }

  const isFinalStep = activeStep === totalSteps

  return (
    <div className="w-full bg-[#fcfcfd] min-h-[calc(100vh-140px)] flex flex-col pb-16">
      {/* 2-Column Questionnaire Layout matching Termly */}
      <div className="w-full flex-1 flex flex-col md:flex-row border border-slate-200/90 rounded-lg bg-white shadow-2xs overflow-hidden min-h-[680px]">
        {/* ========================================================= */}
        {/* LEFT RAIL (NAVIGATION STEPS & PROGRESS) */}
        {/* ========================================================= */}
        <div className="w-full md:w-[280px] shrink-0 border-r border-slate-200/80 bg-white p-6 flex flex-col justify-between select-none">
          <div className="space-y-6">
            {/* Top Back to Dashboard Link */}
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-wider cursor-pointer"
            >
              <ChevronLeft className="size-4" />
              <span>BACK TO DASHBOARD</span>
            </button>

            {/* Progress Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-500 tracking-wider uppercase text-[11px]">PROGRESS</span>
                <span className="text-slate-800 font-mono text-xs">{progressPct}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                <div
                  className="h-full bg-[#10b981] rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(progressPct, 4)}%` }}
                />
              </div>
            </div>

            {/* Step Items List */}
            <nav className="space-y-1 pt-2">
              {currentSteps.map((item) => {
                const isActive = activeStep === item.step
                const isCompleted = activeStep > item.step
                return (
                  <button
                    key={item.step}
                    type="button"
                    onClick={() => setActiveStep(item.step)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-xs font-medium rounded-md transition-all flex items-center justify-between cursor-pointer",
                      isActive
                        ? "text-[#1868db] font-bold bg-blue-50/70 border-l-3 border-[#1868db]"
                        : isCompleted
                        ? "text-slate-800 hover:bg-slate-50 font-semibold"
                        : "text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    <span>{item.label}</span>
                    {isCompleted && <Check className="size-3.5 text-emerald-600 stroke-[2.5]" />}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Quick Draft Save on Bottom Left */}
          <div className="pt-6 border-t border-slate-100">
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveDraftAction}
              className="w-full py-2 px-3 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isSaving && <Loader2 className="size-3.5 animate-spin" />}
              <span>Save Progress as Draft</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MAIN QUESTIONNAIRE AREA */}
        {/* ========================================================= */}
        <div className="flex-1 flex flex-col justify-between p-8 sm:p-12 overflow-y-auto bg-white">
          <div className="max-w-3xl space-y-6">
            {/* Top Page Title */}
            <div className="border-b border-slate-100 pb-4">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                {isCookies && <Cookie className="size-6 text-amber-600" />}
                {isPrivacy && <Shield className="size-6 text-blue-600" />}
                {isTerms && <Scale className="size-6 text-indigo-600" />}
                <span>{policy.name}</span>
              </h1>
            </div>

            {/* TOP ACTIONS BAR ON THE FINAL STEP (SAVE DRAFT | PUBLISH) */}
            {isFinalStep && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-50/90 border border-slate-200 rounded-lg animate-in fade-in duration-200">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    Ready to save or publish?
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Save your changes as a draft or publish immediately to get embed codes.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleSaveDraftAction}
                    className="px-4 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSaving && <Loader2 className="size-3.5 animate-spin" />}
                    <span>Save Draft</span>
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handlePublishAction}
                    className="inline-flex items-center gap-1.5 px-5 py-1.5 rounded-md bg-[#10b981] hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-4" />}
                    <span>Publish Policy</span>
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* 1. COOKIE POLICY 6 STEPS QUESTIONNAIRE */}
            {/* ========================================================= */}
            {isCookies && (
              <>
                {/* STEP 1: Scope & Website Details */}
                {activeStep === 1 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Scope & Website Identity
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Identify your website and operating entity for this Cookie Policy:
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Company / Organization Legal Name</label>
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="w-full px-3.5 py-2 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db]"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">Primary Website Domain / URL</label>
                          <input
                            type="text"
                            value={websiteUrl}
                            onChange={(e) => setWebsiteUrl(e.target.value)}
                            className="w-full px-3.5 py-2 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db]"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">Privacy / DPO Contact Email</label>
                          <input
                            type="email"
                            value={supportEmail}
                            onChange={(e) => setSupportEmail(e.target.value)}
                            className="w-full px-3.5 py-2 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">Effective Date</label>
                          <input
                            type="text"
                            value={effectiveDate}
                            onChange={(e) => setEffectiveDate(e.target.value)}
                            className="w-full px-3.5 py-2 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db]"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">Governing Country</label>
                          <input
                            type="text"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="w-full px-3.5 py-2 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db]"
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <label className="text-xs font-semibold text-slate-700 block mb-2">Scope of Deployment</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {[
                            "Main Website",
                            "Subdomains (*.yourdomain.com)",
                            "Web Application Portal",
                            "E-Commerce Storefront",
                            "Blog & Documentation",
                            "Client Dashboard",
                          ].map((p) => {
                            const isChecked = cookiePlatforms.includes(p)
                            return (
                              <label
                                key={p}
                                className={cn(
                                  "flex items-center gap-2 p-2.5 rounded-md border text-xs cursor-pointer transition-colors select-none",
                                  isChecked
                                    ? "border-[#1868db] bg-blue-50/60 font-semibold text-[#1868db]"
                                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) setCookiePlatforms([...cookiePlatforms, p])
                                    else setCookiePlatforms(cookiePlatforms.filter((item) => item !== p))
                                  }}
                                  className="rounded border-slate-300 text-[#1868db] size-3.5"
                                />
                                <span>{p}</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: What Are Cookies? */}
                {activeStep === 2 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {aboutHeading}
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Predefined legal disclosure explaining the mechanism and purpose of browser cookies:
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3 text-xs text-slate-700 leading-relaxed">
                      <p>
                        This Cookie Policy explains what cookies are, how we use them, the types of cookies we use (i.e., the information we collect using cookies and how that information is used), and how to manage your cookie settings.
                      </p>
                      <p>
                        Cookies are small text files used to store small pieces of information. They are stored on your device when a website loads in your browser. These cookies help ensure that the website functions properly, enhance security, provide a better user experience, and analyse performance to identify what works and where improvements are needed.
                      </p>
                    </div>

                    <div className="space-y-3 pt-2">
                      <label className="text-xs font-semibold text-slate-700 block">Core Technical Distinctions Disclosed</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
                          <span className="font-bold text-slate-900">First-Party vs Third-Party</span>
                          <p className="text-[11px] text-slate-500">First-party cookies are set by our domain directly; third-party cookies are set by analytics/ad providers.</p>
                        </div>
                        <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
                          <span className="font-bold text-slate-900">Session vs Persistent</span>
                          <p className="text-[11px] text-slate-500">Session cookies expire when closing the browser; persistent cookies remain until deleted or expiration.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: How We Use Cookies */}
                {activeStep === 3 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {useHeading}
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Disclosures explaining operational purposes for first-party and third-party cookies:
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3 text-xs text-slate-700 leading-relaxed">
                      <p>
                        Like most online services, our website uses both first-party and third-party cookies for various purposes. First-party cookies are primarily necessary for the website to function properly and do not collect any personally identifiable data.
                      </p>
                      <p>
                        The third-party cookies used on our website primarily help us understand how the website performs, track how you interact with it, keep our services secure, deliver relevant advertisements, and enhance your overall user experience while improving the speed of your future interactions with our website.
                      </p>
                    </div>

                    <div className="space-y-2 pt-2">
                      <label className="text-xs font-semibold text-slate-700 block">Included Processing Purposes</label>
                      <div className="space-y-2 text-xs">
                        {[
                          "Strictly Necessary operations (proper function, session integrity, no personal tracking)",
                          "Performance analytics (speed, page load telemetry, error diagnostics)",
                          "User engagement & interaction measurement (clicks, scrolling, visitor counts)",
                          "Security safeguards (malicious activity protection, CSRF token validation)",
                          "Speed optimization for future user interactions",
                        ].map((purpose, i) => (
                          <div key={i} className="flex items-center gap-2 p-2.5 rounded border border-slate-200 bg-white font-medium text-slate-700">
                            <Check className="size-4 text-emerald-600" />
                            <span>{purpose}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: Types of Cookies (Live Table) */}
                {activeStep === 4 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div>
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-900">
                          {typesHeading}
                        </h2>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                          <CheckCircle2 className="size-3.5" />
                          <span>Live Synced Table</span>
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Active cookies discovered on your domain will be automatically rendered in the policy:
                      </p>
                    </div>

                    {/* Live Cookie Table Card */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xs font-bold text-slate-900">Live Cookie Table</h3>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Automatically rendered and synchronized from your website scans.
                          </p>
                        </div>
                        <span className="text-xs font-bold px-2.5 py-1 rounded bg-blue-50 text-[#1868db] border border-blue-200 font-mono">
                          {displayCookies.length} active cookies
                        </span>
                      </div>

                      <div className="rounded-md border border-slate-200 overflow-hidden bg-white mt-3">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                            <tr>
                              <th className="p-2.5">Cookie Name</th>
                              <th className="p-2.5">Category</th>
                              <th className="p-2.5">Provider</th>
                              <th className="p-2.5">Duration</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {displayCookies.map((c, i) => (
                              <tr key={i} className="hover:bg-slate-50/60">
                                <td className="p-2.5 font-mono font-bold text-[#1868db] text-[11px]">
                                  {c.name}
                                </td>
                                <td className="p-2.5">
                                  <span className={cn(
                                    "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                                    c.category.toLowerCase().includes("nec") ? "bg-slate-100 text-slate-700" :
                                    c.category.toLowerCase().includes("anal") ? "bg-blue-50 text-blue-700" :
                                    c.category.toLowerCase().includes("func") ? "bg-amber-50 text-amber-700" :
                                    "bg-purple-50 text-purple-700"
                                  )}>
                                    {c.category}
                                  </span>
                                </td>
                                <td className="p-2.5 text-slate-600 text-[11px]">
                                  {c.service_name || domain || "First Party"}
                                </td>
                                <td className="p-2.5 text-slate-500 text-[11px]">
                                  {c.duration || "Session"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <label className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoSyncScanTable}
                        onChange={(e) => setAutoSyncScanTable(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-[#1868db] size-4"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          Auto-Synchronize Monthly Scanner Updates
                        </p>
                        <p className="text-[11px] text-slate-500">
                          When new cookies are discovered on your website, update this table dynamically via the CMP script.
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                {/* STEP 5: Manage Cookie Preferences */}
                {activeStep === 5 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {prefHeading}
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Visitor consent re-opening button and browser cookie blocking instructions:
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3 text-xs text-slate-700 leading-relaxed">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="px-4 py-1.5 rounded-md bg-[#1868db] text-white font-bold text-xs shadow-2xs cursor-pointer hover:bg-blue-700 transition-colors"
                        >
                          Consent Preferences
                        </button>
                        <span className="text-[11px] text-slate-500">
                          (Interactive button embedded in your policy)
                        </span>
                      </div>
                      <p>
                        You can modify your cookie settings anytime by clicking the 'Consent Preferences' button above. This will allow you to revisit the cookie consent banner and update your preferences or withdraw your consent immediately.
                      </p>
                      <p>
                        Additionally, different browsers offer various methods to block and delete cookies used by websites. You can adjust your browser settings to block or delete cookies. Below are links to support documents on how to manage and delete cookies in major web browsers:
                      </p>
                    </div>

                    {/* Official Browser Support Guides */}
                    <div className="space-y-2 pt-2">
                      <label className="text-xs font-semibold text-slate-700 block">
                        Included Official Browser Management Documentation Links
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        {[
                          { name: "Chrome", url: "https://support.google.com/accounts/answer/32050" },
                          { name: "Safari", url: "https://support.apple.com/en-in/guide/safari/sfri11471/mac" },
                          { name: "Firefox", url: "https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox" },
                          { name: "Microsoft Edge", url: "https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" },
                        ].map((b) => (
                          <div key={b.name} className="p-3 rounded-md border border-slate-200 bg-white space-y-1">
                            <span className="font-bold text-slate-900 block">{b.name}</span>
                            <a
                              href={b.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-[#1868db] hover:underline truncate block"
                            >
                              {b.url}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 6: Review & Publish */}
                {activeStep === 6 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Review & Final Assembly
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Review your assembled Cookie Policy before saving as draft or publishing:
                      </p>
                    </div>

                    {/* Formatted Legal Document Paper View (Exact Match) */}
                    <div className="bg-white border border-slate-300 rounded-lg p-6 sm:p-10 shadow-xs text-xs text-slate-700 space-y-6 max-h-[500px] overflow-y-auto leading-relaxed">
                      <div>
                        <h1 className="text-xl font-extrabold text-slate-900">
                          Cookie Policy for {domain}
                        </h1>
                        <p className="text-[11px] text-slate-400 mt-1">
                          <em>Last updated: {effectiveDate}</em>
                        </p>
                      </div>

                      {/* 1. What are cookies? */}
                      <div className="space-y-2">
                        <h2 className="text-sm font-bold text-slate-900">{aboutHeading}</h2>
                        {aboutDescription.split("\n\n").map((p, i) => (
                          <p key={i} className="text-slate-600">{p}</p>
                        ))}
                      </div>

                      {/* 2. How do we use cookies? */}
                      <div className="space-y-2">
                        <h2 className="text-sm font-bold text-slate-900">{useHeading}</h2>
                        {useDescription.split("\n\n").map((p, i) => (
                          <p key={i} className="text-slate-600">{p}</p>
                        ))}
                      </div>

                      {/* 3. Types of cookies we use */}
                      <div className="space-y-3">
                        <h2 className="text-sm font-bold text-slate-900">{typesHeading}</h2>
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-xs">Live Cookie Table</span>
                            <span className="text-xs font-bold text-[#1868db]">{displayCookies.length} active cookies</span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Automatically rendered and synchronized from your website scans.
                          </p>

                          <div className="mt-2 rounded border border-slate-200 overflow-hidden bg-white">
                            <table className="w-full text-left text-[11px] border-collapse">
                              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                                <tr>
                                  <th className="p-2">Cookie Name</th>
                                  <th className="p-2">Category</th>
                                  <th className="p-2">Provider</th>
                                  <th className="p-2">Duration</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {displayCookies.map((c, i) => (
                                  <tr key={i} className="hover:bg-slate-50/60">
                                    <td className="p-2 font-mono font-semibold text-[#1868db]">{c.name}</td>
                                    <td className="p-2 capitalize">{c.category}</td>
                                    <td className="p-2 text-slate-600">{c.service_name || domain || "First Party"}</td>
                                    <td className="p-2 text-slate-500">{c.duration || "Session"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                      {/* 4. Manage cookie preferences */}
                      <div className="space-y-3 pt-2 border-t border-slate-100">
                        <h2 className="text-sm font-bold text-slate-900">{prefHeading}</h2>
                        <div>
                          <button
                            type="button"
                            className="px-4 py-1.5 rounded-md bg-[#1868db] text-white font-bold text-xs shadow-2xs"
                          >
                            Consent Preferences
                          </button>
                        </div>
                        <p className="text-slate-600">
                          You can modify your cookie settings anytime by clicking the 'Consent Preferences' button above. This will allow you to revisit the cookie consent banner and update your preferences or withdraw your consent immediately.
                        </p>
                        <p className="text-slate-600">
                          Additionally, different browsers offer various methods to block and delete cookies used by websites. You can adjust your browser settings to block or delete cookies. Below are links to support documents on how to manage and delete cookies in major web browsers:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-slate-600 text-[11px]">
                          <li><strong>Chrome:</strong> <a href="https://support.google.com/accounts/answer/32050" target="_blank" rel="noopener noreferrer" className="text-[#1868db] underline">https://support.google.com/accounts/answer/32050</a></li>
                          <li><strong>Safari:</strong> <a href="https://support.apple.com/en-in/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-[#1868db] underline">https://support.apple.com/en-in/guide/safari/sfri11471/mac</a></li>
                          <li><strong>Firefox:</strong> <a href="https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox" target="_blank" rel="noopener noreferrer" className="text-[#1868db] underline">https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox</a></li>
                          <li><strong>Microsoft Edge:</strong> <a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-[#1868db] underline">https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09</a></li>
                        </ul>
                        <p className="text-slate-600">
                          If you are using a different web browser, please refer to its official support documentation.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ========================================================= */}
            {/* 2. PRIVACY POLICY 8 STEPS QUESTIONNAIRE */}
            {/* ========================================================= */}
            {isPrivacy && (
              <>
                {/* STEP 1: Privacy Policy Uses */}
                {activeStep === 1 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Privacy Policy Platforms & Deployment
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Where will this privacy policy be displayed and enforced?
                      </p>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-semibold text-slate-700 block">Target Platforms</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          "Website",
                          "Mobile App (iOS/Android)",
                          "E-Commerce Storefront",
                          "SaaS Web Application",
                          "Browser Extension",
                          "Facebook / Social App",
                        ].map((platform) => {
                          const isChecked = platforms.includes(platform)
                          return (
                            <label
                              key={platform}
                              className={cn(
                                "flex items-center gap-3 p-3.5 rounded-lg border text-xs font-medium cursor-pointer transition-all",
                                isChecked
                                  ? "border-[#1868db] bg-blue-50/50 text-[#1868db] font-semibold"
                                  : "border-slate-200 hover:border-slate-300 text-slate-700"
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) setPlatforms([...platforms, platform])
                                  else setPlatforms(platforms.filter((p) => p !== platform))
                                }}
                                className="rounded border-slate-300 text-[#1868db] focus:ring-blue-500 size-4"
                              />
                              <span>{platform}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: User Information */}
                {activeStep === 2 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Company & Operational Entity
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Who is legally responsible for data processing?
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Company / Entity Name</label>
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="w-full px-3.5 py-2 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">Website URL</label>
                          <input
                            type="text"
                            value={websiteUrl}
                            onChange={(e) => setWebsiteUrl(e.target.value)}
                            className="w-full px-3.5 py-2 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db]"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">Privacy / Support Email</label>
                          <input
                            type="email"
                            value={supportEmail}
                            onChange={(e) => setSupportEmail(e.target.value)}
                            className="w-full px-3.5 py-2 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">Effective Date</label>
                          <input
                            type="text"
                            value={effectiveDate}
                            onChange={(e) => setEffectiveDate(e.target.value)}
                            className="w-full px-3.5 py-2 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db]"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">Governing Country</label>
                          <input
                            type="text"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="w-full px-3.5 py-2 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: Collection of Information */}
                {activeStep === 3 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Personal Information Collected Directly
                      </h2>
                      <div className="mt-1 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
                          <span>Please select the personal information you intend to collect directly from the user:</span>
                          <HelpCircle className="size-3.5 text-slate-400" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {[
                        "Names",
                        "Phone numbers",
                        "Email addresses",
                        "Mailing addresses",
                        "Job titles",
                        "Usernames",
                        "Passwords",
                        "Contact preferences",
                        "Authentication data",
                        "Billing addresses",
                        "Debit/credit card numbers",
                      ].map((item) => {
                        const isChecked = directData.includes(item)
                        return (
                          <label
                            key={item}
                            className="flex items-center gap-3 p-3 rounded-md border border-slate-200 hover:bg-slate-50/70 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) setDirectData([...directData, item])
                                else setDirectData(directData.filter((d) => d !== item))
                              }}
                              className="rounded border-slate-300 text-[#1868db] focus:ring-blue-500 size-4"
                            />
                            <span className="text-xs font-semibold text-slate-800">{item}</span>
                          </label>
                        )
                      })}
                    </div>

                    {/* Add your own info */}
                    <div className="pt-3 border-t border-slate-100 space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 block">Add other personal information</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={customDataInput}
                          onChange={(e) => setCustomDataInput(e.target.value)}
                          placeholder="e.g. Passport number"
                          className="flex-1 max-w-md px-3 py-1.5 text-xs rounded border border-slate-300 focus:outline-hidden focus:border-[#1868db]"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              handleAddCustomData()
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomData}
                          className="px-3 py-1.5 rounded bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Plus className="size-3.5" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: Use of Information */}
                {activeStep === 4 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Purpose and Lawful Grounds for Processing
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Select why you process personal data collected from visitors:
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      {[
                        "To facilitate account creation and logon process",
                        "To deliver and facilitate delivery of services to the user",
                        "To respond to user inquiries and offer support to users",
                        "To send administrative information to users",
                        "To fulfill and manage orders, payments, and subscriptions",
                        "To enable user-to-user communications",
                        "To request feedback and contact users about their use of our services",
                        "To protect our services from malicious activities, spam, and fraud",
                        "To analyze web metrics and improve platform performance",
                      ].map((item) => {
                        const isChecked = purposes.includes(item)
                        return (
                          <label
                            key={item}
                            className="flex items-center gap-3 p-3 rounded-md border border-slate-200 hover:bg-slate-50/70 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) setPurposes([...purposes, item])
                                else setPurposes(purposes.filter((p) => p !== item))
                              }}
                              className="rounded border-slate-300 text-[#1868db] focus:ring-blue-500 size-4"
                            />
                            <span className="text-xs font-semibold text-slate-800">{item}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 5: Disclosure of Information */}
                {activeStep === 5 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Third-Party Disclosures & Processors
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Who do you share or transfer collected data with?
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      {[
                        "Cloud hosting and database infrastructure (AWS, Vercel, Google Cloud)",
                        "Payment processors (Stripe, PayPal, Paddle)",
                        "Web analytics engines (Cookieless Analytics)",
                        "Customer support and live ticketing desks",
                        "Email newsletter and notification service providers",
                        "Legal authorities and regulators when required by statutory law",
                      ].map((item) => {
                        const isChecked = disclosures.includes(item)
                        return (
                          <label
                            key={item}
                            className="flex items-center gap-3 p-3 rounded-md border border-slate-200 hover:bg-slate-50/70 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) setDisclosures([...disclosures, item])
                                else setDisclosures(disclosures.filter((d) => d !== item))
                              }}
                              className="rounded border-slate-300 text-[#1868db] focus:ring-blue-500 size-4"
                            />
                            <span className="text-xs font-semibold text-slate-800">{item}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 6: Tracking Technologies */}
                {activeStep === 6 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Tracking Technologies & Cookies
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Specify if you use cookies or beacons on your site:
                      </p>
                    </div>

                    <div className="space-y-4">
                      <label className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useCookies}
                          onChange={(e) => setUseCookies(e.target.checked)}
                          className="mt-0.5 rounded border-slate-300 text-[#1868db] size-4"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            We use cookies and other tracking technologies
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Cookies are used to access or store session info and keep you logged in.
                          </p>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useAnalytics}
                          onChange={(e) => setUseAnalytics(e.target.checked)}
                          className="mt-0.5 rounded border-slate-300 text-[#1868db] size-4"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            We use web analytics (e.g., Google Analytics / Cookieless Analytics)
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Aggregated diagnostic data is recorded to improve site quality.
                          </p>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useAds}
                          onChange={(e) => setUseAds(e.target.checked)}
                          className="mt-0.5 rounded border-slate-300 text-[#1868db] size-4"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            We serve third-party targeted advertisements
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Discloses behavioral ad targeting and retargeting pixels.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* STEP 7: User Rights */}
                {activeStep === 7 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        International Frameworks & User Rights
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Select applicable privacy regulations to incorporate statutory clauses:
                      </p>
                    </div>

                    <div className="space-y-4">
                      <label className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeGdpr}
                          onChange={(e) => setIncludeGdpr(e.target.checked)}
                          className="mt-0.5 rounded border-slate-300 text-[#1868db] size-4"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-slate-900">
                              GDPR (European Economic Area & UK)
                            </p>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              RECOMMENDED
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Includes explicit statutory disclosures for data subject access, portability, and right to be forgotten.
                          </p>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeCcpa}
                          onChange={(e) => setIncludeCcpa(e.target.checked)}
                          className="mt-0.5 rounded border-slate-300 text-[#1868db] size-4"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-slate-900">
                              CCPA / CPRA (California Residents)
                            </p>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                              US STANDARD
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Notice at collection and disclosure that personal information is not sold for valuable consideration.
                          </p>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeCoppa}
                          onChange={(e) => setIncludeCoppa(e.target.checked)}
                          className="mt-0.5 rounded border-slate-300 text-[#1868db] size-4"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            COPPA (Children's Online Privacy Protection)
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Sets minimum user age requirement (default: 13+).
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* STEP 8: Final Review */}
                {activeStep === 8 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Final Review & Document Assembly
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Review your assembled Privacy Policy document before saving as draft or publishing live:
                      </p>
                    </div>

                    {/* Legal Document Paper Preview */}
                    <div className="bg-white border border-slate-300 rounded-lg p-6 sm:p-8 shadow-xs text-xs text-slate-700 space-y-5 max-h-[480px] overflow-y-auto leading-relaxed">
                      <div className="border-b border-slate-200 pb-4">
                        <h1 className="text-xl font-extrabold text-slate-900">
                          Privacy Policy for {domain}
                        </h1>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Effective Date: {effectiveDate} | Domain: {websiteUrl} | Entity: {companyName}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h2 className="text-sm font-bold text-slate-900">1. Scope & Platforms</h2>
                        <p className="text-slate-600">
                          This policy governs {companyName} across {platforms.join(", ")}.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h2 className="text-sm font-bold text-slate-900">2. Personal Information Collected</h2>
                        <ul className="list-disc pl-5 space-y-1 text-slate-600">
                          {directData.map((d, i) => (
                            <li key={i}>{d}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <h2 className="text-sm font-bold text-slate-900">3. Automatically Collected Telemetry</h2>
                        <ul className="list-disc pl-5 space-y-1 text-slate-600">
                          {autoData.map((a, i) => (
                            <li key={i}>{a}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <h2 className="text-sm font-bold text-slate-900">4. Processing Purposes</h2>
                        <ul className="list-disc pl-5 space-y-1 text-slate-600">
                          {purposes.map((p, i) => (
                            <li key={i}>{p}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <h2 className="text-sm font-bold text-slate-900">5. International Privacy Rights</h2>
                        <div className="space-y-1.5 text-slate-600">
                          {includeGdpr && (
                            <p>
                              <strong>GDPR (EEA/UK):</strong> You have statutory rights to access, rectify, port, or erase your data. Contact DPO at {dpoEmail}.
                            </p>
                          )}
                          {includeCcpa && (
                            <p>
                              <strong>CCPA / CPRA:</strong> California consumers may request notice at collection and disclosure of personal data categories collected in the preceding 12 months. We do not sell personal information.
                            </p>
                          )}
                          {includeCoppa && (
                            <p>
                              <strong>COPPA Children's Shield:</strong> Services are strictly for users aged {minAge} and older.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 border-t border-slate-100 pt-3">
                        <h2 className="text-sm font-bold text-slate-900">6. Data Retention & Inquiries</h2>
                        <p className="text-slate-600">
                          For data deletion requests or legal inquiries, please contact our compliance team at <strong className="text-[#1868db]">{supportEmail}</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ========================================================= */}
            {/* 3. TERMS OF SERVICE 8 FULL STEPS QUESTIONNAIRE */}
            {/* ========================================================= */}
            {isTerms && (
              <>
                {/* STEP 1: Agreement Scope & Platforms */}
                {activeStep === 1 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Agreement Scope & Operating Entity
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Identify where these Terms and Conditions will govern:
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Company Legal Name</label>
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="w-full px-3.5 py-2 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">Primary Website Domain / URL</label>
                          <input
                            type="text"
                            value={websiteUrl}
                            onChange={(e) => setWebsiteUrl(e.target.value)}
                            className="w-full px-3.5 py-2 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db]"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">Legal / Support Email</label>
                          <input
                            type="email"
                            value={supportEmail}
                            onChange={(e) => setSupportEmail(e.target.value)}
                            className="w-full px-3.5 py-2 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">Governing Country</label>
                          <input
                            type="text"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="w-full px-3.5 py-2 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db]"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">State / Province</label>
                          <input
                            type="text"
                            value={stateRegion}
                            onChange={(e) => setStateRegion(e.target.value)}
                            className="w-full px-3.5 py-2 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db]"
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <label className="text-xs font-semibold text-slate-700 block mb-2">Target Platforms</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {[
                            "Website",
                            "SaaS Web Application",
                            "Mobile App (iOS/Android)",
                            "E-Commerce Storefront",
                            "Online Marketplace",
                            "API Services",
                          ].map((p) => {
                            const isChecked = tosPlatforms.includes(p)
                            return (
                              <label
                                key={p}
                                className={cn(
                                  "flex items-center gap-2 p-2.5 rounded-md border text-xs cursor-pointer transition-colors select-none",
                                  isChecked
                                    ? "border-[#1868db] bg-blue-50/60 font-semibold text-[#1868db]"
                                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) setTosPlatforms([...tosPlatforms, p])
                                    else setTosPlatforms(tosPlatforms.filter((item) => item !== p))
                                  }}
                                  className="rounded border-slate-300 text-[#1868db] size-3.5"
                                />
                                <span>{p}</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: User Accounts & Eligibility */}
                {activeStep === 2 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        User Accounts & Age Eligibility
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Define account creation rules and user eligibility requirements:
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Minimum User Age</label>
                        <div className="grid grid-cols-3 gap-3">
                          {["13", "16", "18"].map((age) => (
                            <button
                              key={age}
                              type="button"
                              onClick={() => setTosUserAge(age)}
                              className={cn(
                                "py-2.5 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer",
                                tosUserAge === age
                                  ? "border-[#1868db] bg-blue-50 text-[#1868db] shadow-2xs"
                                  : "border-slate-200 text-slate-700 hover:bg-slate-50"
                              )}
                            >
                              {age}+ Years Old
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        <label className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={accountRequired}
                            onChange={(e) => setAccountRequired(e.target.checked)}
                            className="mt-0.5 rounded border-slate-300 text-[#1868db] size-4"
                          />
                          <div>
                            <p className="text-xs font-bold text-slate-900">
                              Account Registration Required
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Users must register an account to access core platform features and are liable for credential safeguarding.
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: User-Generated Content & Contributions */}
                {activeStep === 3 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        User-Generated Content & Contributions
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Do users upload content, post comments, or submit reviews on your platform?
                      </p>
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allowUgc}
                          onChange={(e) => setAllowUgc(e.target.checked)}
                          className="mt-0.5 rounded border-slate-300 text-[#1868db] size-4"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            Users can post or upload content (Comments, Reviews, Media, Files)
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Users grant your company a non-exclusive, royalty-free, worldwide license to host and display their contributions.
                          </p>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={ugcModeration}
                          onChange={(e) => setUgcModeration(e.target.checked)}
                          className="mt-0.5 rounded border-slate-300 text-[#1868db] size-4"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            Right to Moderate & Remove Content
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Grants administrators the unilateral right to delete or restrict content that violates platform standards or statutory law.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* STEP 4: Prohibited Conduct */}
                {activeStep === 4 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Prohibited Activities & Platform Abuse
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Select restricted behaviors that violate your terms and may lead to account termination:
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      {[
                        "Automated scraping, crawling, or extracting data without authorization",
                        "Reverse engineering, decompiling, or attempting to discover source code",
                        "Transmitting viruses, malware, or attempting denial-of-service attacks",
                        "Impersonating other users or misrepresenting entity affiliations",
                        "Harassing, defaming, or abusing other members or staff",
                        "Commercial reselling or exploiting services without permission",
                        "Bypassing security barriers, authentication limits, or access controls",
                      ].map((item) => {
                        const isChecked = prohibitedList.includes(item)
                        return (
                          <label
                            key={item}
                            className="flex items-center gap-3 p-3 rounded-md border border-slate-200 hover:bg-slate-50/70 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) setProhibitedList([...prohibitedList, item])
                                else setProhibitedList(prohibitedList.filter((p) => p !== item))
                              }}
                              className="rounded border-slate-300 text-[#1868db] focus:ring-blue-500 size-4"
                            />
                            <span className="text-xs font-semibold text-slate-800">{item}</span>
                          </label>
                        )
                      })}
                    </div>

                    {/* Add your own prohibited activity */}
                    <div className="pt-3 border-t border-slate-100 space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 block">Add custom restricted activity</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={customProhibitedInput}
                          onChange={(e) => setCustomProhibitedInput(e.target.value)}
                          placeholder="e.g. Using the platform for automated cryptocurrency trading"
                          className="flex-1 max-w-md px-3 py-1.5 text-xs rounded border border-slate-300 focus:outline-hidden focus:border-[#1868db]"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              handleAddCustomProhibited()
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomProhibited}
                          className="px-3 py-1.5 rounded bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Plus className="size-3.5" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 5: Intellectual Property & DMCA */}
                {activeStep === 5 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Intellectual Property & DMCA Copyright Notice
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Protect your trademarks and provide designated DMCA agent details:
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-200/60 text-xs text-blue-900 space-y-2">
                        <p className="font-semibold">Platform Intellectual Property Shield</p>
                        <p className="text-[11px] text-blue-800 leading-relaxed">
                          All proprietary source code, interface designs, logos, trademarks, and platform architecture are the exclusive property of <strong>{companyName}</strong>.
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Designated DMCA / Copyright Agent Email</label>
                        <input
                          type="email"
                          value={dmcaEmail}
                          onChange={(e) => setDmcaEmail(e.target.value)}
                          className="w-full px-3.5 py-2 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 6: Purchases, Subscriptions & Billing */}
                {activeStep === 6 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Purchases, Subscriptions & Billing
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Configure payment terms, billing cadence, and refund disclosures:
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Monetization Model</label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { id: "paid_subscriptions", label: "Recurring Subscriptions" },
                            { id: "one_time", label: "One-Time Purchases" },
                            { id: "free", label: "Completely Free Service" },
                          ].map((model) => (
                            <button
                              key={model.id}
                              type="button"
                              onClick={() => setMonetizationType(model.id)}
                              className={cn(
                                "p-3 rounded-lg border text-xs font-bold text-left transition-all cursor-pointer",
                                monetizationType === model.id
                                  ? "border-[#1868db] bg-blue-50 text-[#1868db] shadow-2xs"
                                  : "border-slate-200 text-slate-700 hover:bg-slate-50"
                              )}
                            >
                              {model.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {monetizationType === "paid_subscriptions" && (
                        <div className="space-y-3 pt-2">
                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">Billing Frequency</label>
                            <select
                              value={billingCycle}
                              onChange={(e) => setBillingCycle(e.target.value)}
                              className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db]"
                            >
                              <option value="monthly_annual">Monthly and Annual billing options</option>
                              <option value="monthly_only">Monthly billing only</option>
                              <option value="annual_only">Annual billing only</option>
                              <option value="weekly_monthly">Weekly or Monthly billing</option>
                            </select>
                          </div>

                          <label className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={autoRenewalNotice}
                              onChange={(e) => setAutoRenewalNotice(e.target.checked)}
                              className="mt-0.5 rounded border-slate-300 text-[#1868db] size-4"
                            />
                            <div>
                              <p className="text-xs font-bold text-slate-900">
                                Automatic Renewal Disclosure
                              </p>
                              <p className="text-[11px] text-slate-500">
                                Subscriptions renew automatically until cancelled by the user prior to next billing date.
                              </p>
                            </div>
                          </label>
                        </div>
                      )}

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Refund & Cancellation Policy Summary</label>
                        <textarea
                          rows={2}
                          value={refundPolicySummary}
                          onChange={(e) => setRefundPolicySummary(e.target.value)}
                          className="w-full px-3.5 py-2 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 7: Liability & Dispute Resolution */}
                {activeStep === 7 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Liability, Warranties & Dispute Resolution
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Protect your business from outsized liability and enforce arbitration:
                      </p>
                    </div>

                    <div className="space-y-4">
                      <label className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={warrantyDisclaimer}
                          onChange={(e) => setWarrantyDisclaimer(e.target.checked)}
                          className="mt-0.5 rounded border-slate-300 text-[#1868db] size-4"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            "AS IS" & "AS AVAILABLE" Warranty Disclaimer
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Disclaims implied warranties of merchantability, fitness for particular purpose, and non-infringement.
                          </p>
                        </div>
                      </label>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Maximum Aggregate Liability Cap</label>
                        <input
                          type="text"
                          value={liabilityLimit}
                          onChange={(e) => setLiabilityLimit(e.target.value)}
                          className="w-full px-3.5 py-2 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db]"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <label className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={arbitrationClause}
                            onChange={(e) => setArbitrationClause(e.target.checked)}
                            className="mt-0.5 rounded border-slate-300 text-[#1868db] size-4"
                          />
                          <div>
                            <p className="text-xs font-bold text-slate-900">
                              Mandatory Binding Arbitration
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Requires disputes to be resolved out of court via binding arbitration in {country}.
                            </p>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={classActionWaiver}
                            onChange={(e) => setClassActionWaiver(e.target.checked)}
                            className="mt-0.5 rounded border-slate-300 text-[#1868db] size-4"
                          />
                          <div>
                            <p className="text-xs font-bold text-slate-900">
                              Class Action Waiver
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Users agree to bring legal claims strictly on an individual basis.
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 8: Final Review & Assembly */}
                {activeStep === 8 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Review & Document Assembly
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Review your assembled Terms of Service document before saving as draft or publishing live:
                      </p>
                    </div>

                    {/* Legal Document Paper Preview */}
                    <div className="bg-white border border-slate-300 rounded-lg p-6 sm:p-8 shadow-xs text-xs text-slate-700 space-y-5 max-h-[480px] overflow-y-auto leading-relaxed">
                      <div className="border-b border-slate-200 pb-4">
                        <h1 className="text-xl font-extrabold text-slate-900">
                          Terms of Service for {domain}
                        </h1>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Effective Date: {effectiveDate} | Domain: {websiteUrl} | Entity: {companyName}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h2 className="text-sm font-bold text-slate-900">1. Agreement to Terms</h2>
                        <p className="text-slate-600">
                          These terms govern your access to {websiteUrl} across {tosPlatforms.join(", ")}. Minimum age requirement: <strong>{tosUserAge}+</strong> years old.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h2 className="text-sm font-bold text-slate-900">2. User Accounts</h2>
                        <p className="text-slate-600">
                          {accountRequired ? "Users must register an account to access core features and maintain password security." : "Account registration is optional for public access."}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h2 className="text-sm font-bold text-slate-900">3. User Contributions</h2>
                        <p className="text-slate-600">
                          {allowUgc ? `Users may submit or upload content on the platform. You grant ${companyName} a worldwide, royalty-free license to host and distribute such content.` : "Users cannot submit public content."}
                          {ugcModeration ? " We reserve the right to remove any violating content without prior notice." : ""}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h2 className="text-sm font-bold text-slate-900">4. Prohibited Activities</h2>
                        <ul className="list-disc pl-5 space-y-1 text-slate-600">
                          {prohibitedList.map((p, i) => (
                            <li key={i}>{p}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <h2 className="text-sm font-bold text-slate-900">5. Intellectual Property & DMCA Notice</h2>
                        <p className="text-slate-600">
                          All proprietary source code, trademarks, and design assets are owned by <strong>{companyName}</strong>. For copyright takedown requests, contact our DMCA agent at <strong className="text-[#1868db]">{dmcaEmail}</strong>.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h2 className="text-sm font-bold text-slate-900">6. Subscriptions & Billing</h2>
                        <p className="text-slate-600">
                          {monetizationType === "paid_subscriptions" ? `Services are billed on a ${billingCycle.replace("_", " & ")} basis.` : "Services are provided on a complimentary or per-purchase basis."} {autoRenewalNotice ? "Subscriptions automatically renew unless cancelled prior to billing." : ""} {refundPolicySummary}
                        </p>
                      </div>

                      <div className="space-y-2 border-t border-slate-100 pt-3">
                        <h2 className="text-sm font-bold text-slate-900">7. Limitation of Liability & Dispute Resolution</h2>
                        <p className="text-slate-600">
                          Our aggregate liability shall not exceed <strong>{liabilityLimit}</strong>. {arbitrationClause ? `Disputes shall be resolved through binding arbitration in ${country}${stateRegion ? `, ${stateRegion}` : ""}.` : ""} Inquiries should be sent to <strong className="text-[#1868db]">{supportEmail}</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ========================================================= */}
          {/* BOTTOM STEP NAVIGATION BUTTONS (BACK & NEXT) */}
          {/* ========================================================= */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between mt-8">
            <div>
              {activeStep > 1 && (
                <button
                  type="button"
                  onClick={() => setActiveStep(activeStep - 1)}
                  className="rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2 transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                >
                  <ChevronLeft className="size-4" />
                  <span>Back</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {activeStep < totalSteps ? (
                <button
                  type="button"
                  onClick={() => setActiveStep(activeStep + 1)}
                  className="rounded-md bg-[#1868db] hover:bg-blue-700 text-white text-xs font-bold px-5 py-2 shadow-2xs cursor-pointer inline-flex items-center gap-1.5 transition-colors"
                >
                  <span>Next Step</span>
                  <ChevronRight className="size-4" />
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleSaveDraftAction}
                    className="rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2 transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                  >
                    {isSaving && <Loader2 className="size-3.5 animate-spin" />}
                    <span>Save Draft</span>
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handlePublishAction}
                    className="inline-flex items-center gap-1.5 rounded-md bg-[#10b981] hover:bg-emerald-700 text-white text-xs font-bold px-6 py-2 shadow-xs cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                    <span>Publish Policy</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* PUBLISHED SUCCESS POPUP MODAL (STATIC HTML & SCRIPT TABS) */}
      {/* ========================================================= */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-0 duration-200">
          <div className="relative w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Check className="size-4 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {policy.name} Published Successfully!
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Your {policy.name.toLowerCase()} is saved to database and ready to be embedded on your website.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsPublishModalOpen(false)
                  onBack()
                }}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Tab Selector */}
            <div className="px-5 pt-3 border-b border-slate-100 flex items-center gap-2 bg-white text-xs">
              <button
                type="button"
                onClick={() => setPublishModalTab("html")}
                className={cn(
                  "pb-2.5 px-2 border-b-2 font-semibold transition-colors cursor-pointer",
                  publishModalTab === "html"
                    ? "border-[#1868db] text-[#1868db]"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                )}
              >
                1. Static HTML (Free)
              </button>
              <button
                type="button"
                onClick={() => setPublishModalTab("script")}
                className={cn(
                  "pb-2.5 px-2 border-b-2 font-semibold transition-colors cursor-pointer flex items-center gap-1.5",
                  publishModalTab === "script"
                    ? "border-[#1868db] text-[#1868db]"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                )}
              >
                <span>2. Auto-Updating Script (Growth)</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-[#1868db] border border-blue-200">
                  PRO
                </span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {publishModalTab === "html" ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600">
                    Copy the standard static HTML code and paste it directly into your website's <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">{isCookies ? "/cookie-policy" : isPrivacy ? "/privacy" : "/terms"}</code> page:
                  </p>
                  <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-emerald-400 overflow-x-auto max-h-[260px]">
                    <pre className="whitespace-pre-wrap">{generateHtml()}</pre>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600">
                    Paste this auto-updating container into your website. Whenever you edit details in this dashboard or scanner detects new cookies, your live website updates automatically:
                  </p>
                  <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-emerald-400 overflow-x-auto">
                    <pre className="whitespace-pre-wrap">{dynamicScriptEmbed}</pre>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span>Status: Active & Published in Database</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(publishModalTab === "html" ? generateHtml() : dynamicScriptEmbed, "publish_code")}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-[#1868db] hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                >
                  {copiedType === "publish_code" ? <Check className="size-3.5 text-white" /> : <Copy className="size-3.5" />}
                  <span>{copiedType === "publish_code" ? "Copied to Clipboard!" : "Copy Code"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPublishModalOpen(false)
                    onBack()
                  }}
                  className="px-3.5 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
