"use client"

import { useState, useMemo, useCallback } from "react"
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
  Eye,
  Calendar,
  Building2,
  MapPin,
  Mail,
  Phone,
  Bot,
  Layers,
  FileText,
  Save,
} from "lucide-react"
import {
  generatePrivacyPolicyMarkdown,
  generatePrivacyPolicyHtml,
  generateTermsOfServiceMarkdown,
  generateTermsOfServiceHtml,
} from "./policy-generator-template"
import { useCMPCookiePolicy, CMPCookieItem } from "./use-cmp-cookie-policy"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/sonner"

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

  const totalSteps = isPrivacy ? 8 : isCookies ? 6 : 7
  const [activeStep, setActiveStep] = useState<number>(1)
  const [step8SubStep, setStep8SubStep] = useState<number>(1) // Privacy Step 8 sub-steps
  const [termsStep7SubStep, setTermsStep7SubStep] = useState<number>(1) // Terms Step 7 sub-steps (1: Governing Law, 2: Contact, 3: Address, 4: Updates, 5: Title, 6: Version Date)
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [copiedType, setCopiedType] = useState<string | null>(null)
  const [publishModalTab, setPublishModalTab] = useState<"html" | "script">("html")
  const [previewModalTab, setPreviewModalTab] = useState<"rendered" | "html" | "markdown">("rendered")
  const [isSaving, setIsSaving] = useState(false)

  // Live CMP scanner sync for cookie policies
  const cmpData = useCMPCookiePolicy(domain)

  const cfg = existingRecord?.config || {}

  // -------------------------------------------------------------
  // SHARED ENTITY & PRIVACY POLICY QUESTIONNAIRE STATE
  // -------------------------------------------------------------
  const [companyName, setCompanyName] = useState(cfg.companyName || "")
  const [websiteUrl, setWebsiteUrl] = useState(cfg.websiteUrl || `https://${domain || "example.com"}`)
  const [supportEmail, setSupportEmail] = useState(cfg.supportEmail || "")
  const [country, setCountry] = useState(cfg.country || "")
  const [stateRegion, setStateRegion] = useState(cfg.stateRegion || "")
  const [effectiveDate, setEffectiveDate] = useState(
    new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })
  )

  // Step 1: Privacy Policy Uses
  const [platforms, setPlatforms] = useState<string[]>(
    cfg.platforms || ["Website"]
  )

  // Step 2: User Location
  const [hasUsUsers, setHasUsUsers] = useState<boolean>(
    cfg.hasUsUsers !== undefined ? cfg.hasUsUsers : true
  )
  const [hasEuUsers, setHasEuUsers] = useState<boolean>(
    cfg.hasEuUsers !== undefined ? cfg.hasEuUsers : true
  )
  const [hasCanadaUsers, setHasCanadaUsers] = useState<boolean>(
    cfg.hasCanadaUsers !== undefined ? cfg.hasCanadaUsers : true
  )

  // Step 3: Collection of Information
  const [directData, setDirectData] = useState<string[]>(
    cfg.directData || [
      "Names",
      "Email addresses",
      "Phone numbers",
      "Usernames",
      "Passwords",
      "Billing addresses",
    ]
  )
  const [customDataInput, setCustomDataInput] = useState("")

  // Step 4: Marketing Communications
  const [sendMarketing, setSendMarketing] = useState<boolean>(
    cfg.sendMarketing !== undefined ? cfg.sendMarketing : true
  )

  // Step 5: Artificial Intelligence
  const [offerAi, setOfferAi] = useState<boolean>(
    cfg.offerAi !== undefined ? cfg.offerAi : false
  )

  // Step 6: Tracking Technologies
  const [trackingTech, setTrackingTech] = useState<"both" | "cookies" | "maps" | "neither">(
    cfg.trackingTech || "both"
  )

  // Step 7: Data Protection Officer (DPO)
  const [hasDpo, setHasDpo] = useState<boolean>(
    cfg.hasDpo !== undefined ? cfg.hasDpo : false
  )
  const [dpoEmail, setDpoEmail] = useState(cfg.dpoEmail || "")

  // Step 8: Final Details (Sub-steps)
  const [extraRegions, setExtraRegions] = useState<string[]>(
    cfg.extraRegions || []
  )
  const [isDba, setIsDba] = useState<boolean>(
    cfg.isDba !== undefined ? cfg.isDba : false
  )
  const [dbaName, setDbaName] = useState(cfg.dbaName || "")
  const [phone, setPhone] = useState(cfg.phone || "")
  const [addressLine1, setAddressLine1] = useState(cfg.addressLine1 || "")
  const [addressLine2, setAddressLine2] = useState(cfg.addressLine2 || "")
  const [city, setCity] = useState(cfg.city || "")
  const [zipCode, setZipCode] = useState(cfg.zipCode || "")
  const [policyTitleChoice, setPolicyTitleChoice] = useState<"Privacy Policy" | "Privacy Notice" | "none" | "custom">(
    cfg.policyTitleChoice || "Privacy Policy"
  )
  const [customPolicyTitle, setCustomPolicyTitle] = useState(cfg.customPolicyTitle || "")

  // -------------------------------------------------------------
  // TERMS OF SERVICE (LEGAL TERMS) 7-STEP QUESTIONNAIRE STATE
  // -------------------------------------------------------------
  // Step 1: General (Platform Type - 4%)
  const [isWebsite, setIsWebsite] = useState<boolean>(cfg.isWebsite !== undefined ? cfg.isWebsite : true)
  const [isMobileApp, setIsMobileApp] = useState<boolean>(cfg.isMobileApp !== undefined ? cfg.isMobileApp : false)
  const [platformType, setPlatformType] = useState<"ecommerce" | "saas" | "other">(cfg.platformType || "ecommerce")
  const [otherPlatformType, setOtherPlatformType] = useState<string>(cfg.otherPlatformType || "")

  // Step 2: Platform Information (Hosting - 16%)
  const [hostingCountry, setHostingCountry] = useState<string>(cfg.hostingCountry || "United States")
  const [hostedOtherCountries, setHostedOtherCountries] = useState<boolean>(cfg.hostedOtherCountries !== undefined ? cfg.hostedOtherCountries : false)
  const [otherHostingCountries, setOtherHostingCountries] = useState<string[]>(cfg.otherHostingCountries || [])
  const [customHostingInput, setCustomHostingInput] = useState<string>("")

  // Step 3: Purchases and Payments (Subscription - 30%)
  const [hasSubscription, setHasSubscription] = useState<boolean>(cfg.hasSubscription !== undefined ? cfg.hasSubscription : false)
  const [subscriptionAutoRenew, setSubscriptionAutoRenew] = useState<boolean>(cfg.subscriptionAutoRenew !== undefined ? cfg.subscriptionAutoRenew : true)
  const [renewalFrequency, setRenewalFrequency] = useState<"monthly" | "annually" | "customer_chooses" | "custom">(cfg.renewalFrequency || "monthly")
  const [customRenewalFrequency, setCustomRenewalFrequency] = useState<string>(cfg.customRenewalFrequency || "")

  // Step 4: Platform Content (Prohibited Activities - 42%)
  const [prohibitCommercialAds, setProhibitCommercialAds] = useState<boolean>(cfg.prohibitCommercialAds !== undefined ? cfg.prohibitCommercialAds : false)
  const [prohibitTransferProfile, setProhibitTransferProfile] = useState<boolean>(cfg.prohibitTransferProfile !== undefined ? cfg.prohibitTransferProfile : false)
  const [customProhibitedActivities, setCustomProhibitedActivities] = useState<string[]>(cfg.customProhibitedActivities || [])
  const [customProhibitedInput, setCustomProhibitedInput] = useState<string>("")

  // Step 5: Disputes (Dispute Resolution - 61%)
  const [disputeResolution, setDisputeResolution] = useState<"litigation" | "arbitration" | "informal_then_arbitration">(cfg.disputeResolution || "informal_then_arbitration")
  const [disputeCountry, setDisputeCountry] = useState<string>(cfg.disputeCountry || "United States")
  const [disputeState, setDisputeState] = useState<string>(cfg.disputeState || "")
  const [mediationDays, setMediationDays] = useState<number>(cfg.mediationDays || 30)

  // Step 6: Other Considerations (Marketing & Promotional Communications - 69%)
  const [sendSms, setSendSms] = useState<boolean>(cfg.sendSms !== undefined ? cfg.sendSms : false)
  const [smsProgramName, setSmsProgramName] = useState<string>(cfg.smsProgramName || "")
  const [smsMessageTypes, setSmsMessageTypes] = useState<string>(cfg.smsMessageTypes || "Transactional updates and promotional alerts")
  const [smsOptOut, setSmsOptOut] = useState<"stop" | "other">(cfg.smsOptOut || "stop")
  const [customSmsOptOut, setCustomSmsOptOut] = useState<string>(cfg.customSmsOptOut || "")
  const [specifySmsFrequency, setSpecifySmsFrequency] = useState<boolean>(cfg.specifySmsFrequency !== undefined ? cfg.specifySmsFrequency : false)
  const [smsFrequencyDetails, setSmsFrequencyDetails] = useState<string>(cfg.smsFrequencyDetails || "")

  // Step 7: Final Details (Sub-steps 1-6)
  const [governingCountry, setGoverningCountry] = useState<string>(cfg.governingCountry || "United States")
  const [governingState, setGoverningState] = useState<string>(cfg.governingState || "")
  const [contactFax, setContactFax] = useState<string>(cfg.contactFax || "")
  const [hasRegisteredAddress, setHasRegisteredAddress] = useState<boolean>(cfg.hasRegisteredAddress !== undefined ? cfg.hasRegisteredAddress : false)
  const [registeredCountry, setRegisteredCountry] = useState<string>(cfg.registeredCountry || "")
  const [registeredAddressLine1, setRegisteredAddressLine1] = useState<string>(cfg.registeredAddressLine1 || "")
  const [registeredAddressLine2, setRegisteredAddressLine2] = useState<string>(cfg.registeredAddressLine2 || "")
  const [registeredCity, setRegisteredCity] = useState<string>(cfg.registeredCity || "")
  const [registeredZipCode, setRegisteredZipCode] = useState<string>(cfg.registeredZipCode || "")
  const [notifyUpdates, setNotifyUpdates] = useState<boolean>(cfg.notifyUpdates !== undefined ? cfg.notifyUpdates : false)
  const [updateNotificationMethod, setUpdateNotificationMethod] = useState<"email" | "before_effective" | "other">(cfg.updateNotificationMethod || "email")
  const [updateNotificationEmail, setUpdateNotificationEmail] = useState<string>(cfg.updateNotificationEmail || "")
  const [updateNotificationDaysAdvance, setUpdateNotificationDaysAdvance] = useState<number>(cfg.updateNotificationDaysAdvance || 30)
  const [updateImmediateTriggers, setUpdateImmediateTriggers] = useState<string[]>(cfg.updateImmediateTriggers || [])
  const [customUpdateDetails, setCustomUpdateDetails] = useState<string>(cfg.customUpdateDetails || "")
  const [termsTitleChoice, setTermsTitleChoice] = useState<"Terms of Use" | "Terms of Service" | "Terms and Conditions" | "custom">(cfg.termsTitleChoice || "Terms of Use")
  const [customTermsTitle, setCustomTermsTitle] = useState<string>(cfg.customTermsTitle || "")

  // -------------------------------------------------------------
  // COOKIE POLICY STATE
  // -------------------------------------------------------------
  const [cookiePlatforms, setCookiePlatforms] = useState<string[]>(
    cfg.cookiePlatforms || ["Main Website", "Subdomains"]
  )
  const [autoSyncScanTable, setAutoSyncScanTable] = useState(
    cfg.autoSyncScanTable !== undefined ? cfg.autoSyncScanTable : true
  )
  const [allowConsentRevisit, setAllowConsentRevisit] = useState(
    cfg.allowConsentRevisit !== undefined ? cfg.allowConsentRevisit : true
  )
  const [cookieBrowserGuides, setCookieBrowserGuides] = useState<string[]>(
    cfg.cookieBrowserGuides || ["Google Chrome", "Apple Safari", "Mozilla Firefox", "Microsoft Edge"]
  )

  const displayCookies = useMemo(() => {
    if (cmpData.cookies && cmpData.cookies.length > 0) {
      return cmpData.cookies
    }
    return [
      { name: "consentos_consent", category: "necessary", service_name: "Consent Management", duration: "12 months" },
      { name: "session", category: "necessary", service_name: "Session Management", duration: "Session" },
    ]
  }, [cmpData.cookies])

  // Exact standard texts
  const aboutHeading = "What are cookies?"
  const aboutDescription = `This Cookie Policy explains what cookies are, how we use them, the types of cookies we use (i.e., the information we collect using cookies and how that information is used), and how to manage your cookie settings.\n\nCookies are small text files used to store small pieces of information. They are stored on your device when a website loads in your browser. These cookies help ensure that the website functions properly, enhance security, provide a better user experience, and analyse performance to identify what works and where improvements are needed.`

  const useHeading = "How do we use cookies?"
  const useDescription = `Like most online services, our website uses both first-party and third-party cookies for various purposes. First-party cookies are primarily necessary for the website to function properly and do not collect any personally identifiable data.\n\nThe third-party cookies used on our website primarily help us understand how the website performs, track how you interact with it, keep our services secure, deliver relevant advertisements, and enhance your overall user experience while improving the speed of your future interactions with our website.`

  const typesHeading = "Types of cookies we use"
  const prefHeading = "Manage cookie preferences"
  const prefDescription = `You can modify your cookie settings anytime by clicking the 'Consent Preferences' button above. This will allow you to revisit the cookie consent banner and update your preferences or withdraw your consent immediately.\n\nAdditionally, different browsers offer various methods to block and delete cookies used by websites. You can adjust your browser settings to block or delete cookies.`

  // -------------------------------------------------------------
  // Steps Configuration
  // -------------------------------------------------------------
  const privacySteps = [
    { step: 1, label: "1. Privacy Policy Uses" },
    { step: 2, label: "2. User Information" },
    { step: 3, label: "3. Collection of Information" },
    { step: 4, label: "4. Use of Information" },
    { step: 5, label: "5. Disclosure of Information" },
    { step: 6, label: "6. Use of Tracking Technologies" },
    { step: 7, label: "7. User Rights" },
    { step: 8, label: "8. Final Details" },
  ]

  const termsSteps = [
    { step: 1, label: "1. General" },
    { step: 2, label: "2. Platform Information" },
    { step: 3, label: "3. Purchases and Payments" },
    { step: 4, label: "4. Platform Content" },
    { step: 5, label: "5. Disputes" },
    { step: 6, label: "6. Other Considerations" },
    { step: 7, label: "7. Final Details" },
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

  // Exact Progress Percentages based on screenshots
  const progressPct = useMemo(() => {
    if (isPrivacy) {
      if (activeStep === 1) return 3
      if (activeStep === 2) return 12
      if (activeStep === 3) return 22
      if (activeStep === 4) return 41
      if (activeStep === 5) return 45
      if (activeStep === 6) return 70
      if (activeStep === 7) return 77
      if (activeStep === 8) {
        if (step8SubStep === 1) return 83
        if (step8SubStep === 2) return 90
        if (step8SubStep === 3) return 93
        if (step8SubStep === 4) return 96
        return 100
      }
      return 100
    }
    if (isTerms) {
      if (activeStep === 1) return 4
      if (activeStep === 2) return 16
      if (activeStep === 3) return 30
      if (activeStep === 4) return 42
      if (activeStep === 5) return 61
      if (activeStep === 6) return 69
      if (activeStep === 7) {
        if (termsStep7SubStep === 1) return 80
        if (termsStep7SubStep === 2) return 88
        if (termsStep7SubStep === 3) return 92
        if (termsStep7SubStep === 4) return 94
        if (termsStep7SubStep === 5) return 96
        return 100
      }
      return 100
    }
    return Math.round((activeStep / totalSteps) * 100)
  }, [isPrivacy, isTerms, activeStep, step8SubStep, termsStep7SubStep, totalSteps])

  // Custom addition handlers
  const handleAddCustomData = () => {
    if (!customDataInput.trim()) return
    if (!directData.includes(customDataInput.trim())) {
      setDirectData([...directData, customDataInput.trim()])
    }
    setCustomDataInput("")
  }

  const handleAddOtherHostingCountry = () => {
    if (!customHostingInput.trim()) return
    if (!otherHostingCountries.includes(customHostingInput.trim())) {
      setOtherHostingCountries([...otherHostingCountries, customHostingInput.trim()])
    }
    setCustomHostingInput("")
  }

  const handleRemoveOtherHostingCountry = (item: string) => {
    setOtherHostingCountries(otherHostingCountries.filter((c) => c !== item))
  }

  const handleAddCustomProhibited = () => {
    if (!customProhibitedInput.trim()) return
    if (!customProhibitedActivities.includes(customProhibitedInput.trim())) {
      setCustomProhibitedActivities([...customProhibitedActivities, customProhibitedInput.trim()])
    }
    setCustomProhibitedInput("")
  }

  const handleRemoveCustomProhibited = (item: string) => {
    setCustomProhibitedActivities(customProhibitedActivities.filter((c) => c !== item))
  }

  // -------------------------------------------------------------
  // Markdown & HTML Compilers (Exact Standard Templates)
  // -------------------------------------------------------------
  const generateMarkdown = (): string => {
    if (isPrivacy) {
      return generatePrivacyPolicyMarkdown(
        {
          companyName,
          dbaName,
          isDba,
          websiteUrl,
          supportEmail,
          phone,
          country,
          addressLine1,
          addressLine2,
          city,
          zipCode,
          effectiveDate,
          platforms,
          hasUsUsers,
          hasEuUsers,
          hasCanadaUsers,
          directData,
          sendMarketing,
          offerAi,
          trackingTech,
          hasDpo,
          dpoEmail,
          extraRegions,
          policyTitleChoice,
          customPolicyTitle,
        },
        domain
      )
    } else if (isTerms) {
      return generateTermsOfServiceMarkdown(
        {
          companyName,
          isDba,
          dbaName,
          websiteUrl,
          isWebsite,
          isMobileApp,
          platformType,
          otherPlatformType,
          hostingCountry,
          hostedOtherCountries,
          otherHostingCountries,
          hasSubscription,
          subscriptionAutoRenew,
          renewalFrequency,
          customRenewalFrequency,
          prohibitCommercialAds,
          prohibitTransferProfile,
          customProhibitedActivities,
          disputeResolution,
          disputeCountry,
          disputeState,
          mediationDays,
          sendSms,
          smsProgramName,
          smsMessageTypes,
          smsOptOut,
          customSmsOptOut,
          specifySmsFrequency,
          smsFrequencyDetails,
          governingCountry,
          governingState,
          contactEmail: supportEmail,
          contactPhone: phone,
          contactFax,
          country,
          addressLine1,
          addressLine2,
          city,
          zipCode,
          hasRegisteredAddress,
          registeredCountry,
          registeredAddressLine1,
          registeredAddressLine2,
          registeredCity,
          registeredZipCode,
          notifyUpdates,
          updateNotificationMethod,
          updateNotificationEmail,
          updateNotificationDaysAdvance,
          updateImmediateTriggers,
          customUpdateDetails,
          policyTitleChoice: termsTitleChoice,
          customPolicyTitle: customTermsTitle,
          effectiveDate,
        },
        domain
      )
    } else if (isCookies) {
      let md = `# Cookie Policy for ${domain}\n`
      md += `*Last updated: ${effectiveDate}*\n\n`
      md += `## ${aboutHeading}\n${aboutDescription}\n\n`
      md += `## ${useHeading}\n${useDescription}\n\n`
      md += `## ${typesHeading}\n**Live Cookie Table**  \n*${displayCookies.length} active cookies*\n\n`
      md += `| Cookie Name | Category | Provider | Duration |\n| :--- | :--- | :--- | :--- |\n`
      displayCookies.forEach((c: CMPCookieItem) => {
        md += `| \`${c.name}\` | ${c.category} | ${c.service_name || domain || "First Party"} | ${c.duration || "Session"} |\n`
      })
      md += `\n## ${prefHeading}\n[Consent Preferences](javascript:void(0))\n\n${prefDescription}\n`
      return md
    } else {
      return ""
    }
  }

  const generateHtml = (): string => {
    if (isPrivacy) {
      return generatePrivacyPolicyHtml(
        {
          companyName,
          dbaName,
          isDba,
          websiteUrl,
          supportEmail,
          phone,
          country,
          addressLine1,
          addressLine2,
          city,
          zipCode,
          effectiveDate,
          platforms,
          hasUsUsers,
          hasEuUsers,
          hasCanadaUsers,
          directData,
          sendMarketing,
          offerAi,
          trackingTech,
          hasDpo,
          dpoEmail,
          extraRegions,
          policyTitleChoice,
          customPolicyTitle,
        },
        domain
      )
    } else if (isTerms) {
      return generateTermsOfServiceHtml(
        {
          companyName,
          isDba,
          dbaName,
          websiteUrl,
          isWebsite,
          isMobileApp,
          platformType,
          otherPlatformType,
          hostingCountry,
          hostedOtherCountries,
          otherHostingCountries,
          hasSubscription,
          subscriptionAutoRenew,
          renewalFrequency,
          customRenewalFrequency,
          prohibitCommercialAds,
          prohibitTransferProfile,
          customProhibitedActivities,
          disputeResolution,
          disputeCountry,
          disputeState,
          mediationDays,
          sendSms,
          smsProgramName,
          smsMessageTypes,
          smsOptOut,
          customSmsOptOut,
          specifySmsFrequency,
          smsFrequencyDetails,
          governingCountry,
          governingState,
          contactEmail: supportEmail,
          contactPhone: phone,
          contactFax,
          country,
          addressLine1,
          addressLine2,
          city,
          zipCode,
          hasRegisteredAddress,
          registeredCountry,
          registeredAddressLine1,
          registeredAddressLine2,
          registeredCity,
          registeredZipCode,
          notifyUpdates,
          updateNotificationMethod,
          updateNotificationEmail,
          updateNotificationDaysAdvance,
          updateImmediateTriggers,
          customUpdateDetails,
          policyTitleChoice: termsTitleChoice,
          customPolicyTitle: customTermsTitle,
          effectiveDate,
        },
        domain
      )
    }
    const md = generateMarkdown()
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${policy.name} - ${domain}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-weight: 300; line-height: 1.65; color: #475569; max-width: 820px; margin: 0 auto; padding: 32px 16px; -webkit-font-smoothing: antialiased; }
    h1 { font-size: 24px; font-weight: 500; color: #0f172a; margin-bottom: 12px; letter-spacing: -0.01em; }
    h2 { font-size: 16px; font-weight: 500; color: #0f172a; margin-top: 24px; margin-bottom: 8px; letter-spacing: -0.01em; }
    h3 { font-size: 13px; font-weight: 500; color: #1e293b; margin-top: 16px; margin-bottom: 6px; }
    p, li { font-size: 13px; font-weight: 300; color: #475569; margin-bottom: 10px; line-height: 1.65; }
    ul { padding-left: 20px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px; font-weight: 300; }
    th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
    th { background: #f8fafc; font-weight: 500; color: #0f172a; }
    hr { border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0; }
    strong { font-weight: 500; color: #0f172a; }
    .meta { font-size: 12px; font-weight: 300; color: #64748b; margin-bottom: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; }
  </style>
</head>
<body>
  ${md
    .split("\n\n")
    .map((chunk) => {
      if (chunk.startsWith("# ")) return `<h1>${chunk.replace("# ", "")}</h1>`
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
    return {
      platforms,
      hasUsUsers,
      hasEuUsers,
      hasCanadaUsers,
      directData,
      sendMarketing,
      offerAi,
      trackingTech,
      hasDpo,
      dpoEmail,
      extraRegions,
      companyName,
      isDba,
      dbaName,
      supportEmail,
      phone,
      country,
      addressLine1,
      addressLine2,
      city,
      zipCode,
      policyTitleChoice,
      customPolicyTitle,
      effectiveDate:
        effectiveDate ||
        new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }),
      cookiePlatforms,
      // Terms of Service configurations
      isWebsite,
      isMobileApp,
      platformType,
      otherPlatformType,
      hostingCountry,
      hostedOtherCountries,
      otherHostingCountries,
      hasSubscription,
      subscriptionAutoRenew,
      renewalFrequency,
      customRenewalFrequency,
      prohibitCommercialAds,
      prohibitTransferProfile,
      customProhibitedActivities,
      disputeResolution,
      disputeCountry,
      disputeState,
      mediationDays,
      sendSms,
      smsProgramName,
      smsMessageTypes,
      smsOptOut,
      customSmsOptOut,
      specifySmsFrequency,
      smsFrequencyDetails,
      governingCountry,
      governingState,
      contactFax,
      hasRegisteredAddress,
      registeredCountry,
      registeredAddressLine1,
      registeredAddressLine2,
      registeredCity,
      registeredZipCode,
      notifyUpdates,
      updateNotificationMethod,
      updateNotificationEmail,
      updateNotificationDaysAdvance,
      updateImmediateTriggers,
      customUpdateDetails,
      termsTitleChoice,
      customTermsTitle,
    }
  }

  // Backend Action Handlers
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

      const publishedData: DomainPolicyRecord = await res.json()
      onPublish(publishedData)
      toast.success(`${policy.name} published successfully!`)
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

  // Next Step / Publish navigation handler
  const handleNext = () => {
    if (isPrivacy) {
      if (activeStep < 8) {
        setActiveStep(activeStep + 1)
        if (activeStep + 1 === 8) {
          setStep8SubStep(1)
        }
      } else {
        // Step 8 sub-steps
        if (step8SubStep < 5) {
          setStep8SubStep(step8SubStep + 1)
        } else {
          // Final Publish trigger
          handlePublishAction()
        }
      }
    } else if (isTerms) {
      if (activeStep < 7) {
        setActiveStep(activeStep + 1)
        if (activeStep + 1 === 7) {
          setTermsStep7SubStep(1)
        }
      } else {
        // Step 7 sub-steps (1 to 6)
        if (termsStep7SubStep < 6) {
          setTermsStep7SubStep(termsStep7SubStep + 1)
        } else {
          handlePublishAction()
        }
      }
    } else {
      if (activeStep < totalSteps) {
        setActiveStep(activeStep + 1)
      } else {
        handlePublishAction()
      }
    }
  }

  const handleBack = () => {
    if (isPrivacy) {
      if (activeStep === 8 && step8SubStep > 1) {
        setStep8SubStep(step8SubStep - 1)
      } else if (activeStep > 1) {
        setActiveStep(activeStep - 1)
      } else {
        onBack()
      }
    } else if (isTerms) {
      if (activeStep === 7 && termsStep7SubStep > 1) {
        setTermsStep7SubStep(termsStep7SubStep - 1)
      } else if (activeStep > 1) {
        setActiveStep(activeStep - 1)
      } else {
        onBack()
      }
    } else {
      if (activeStep > 1) {
        setActiveStep(activeStep - 1)
      } else {
        onBack()
      }
    }
  }

  const isFinalScreen = isPrivacy
    ? activeStep === 8 && step8SubStep === 5
    : isTerms
    ? activeStep === 7 && termsStep7SubStep === 6
    : activeStep === totalSteps

  return (
    <div className="w-full bg-[#fcfcfd] min-h-[calc(100vh-140px)] flex flex-col pb-12 font-sans">
      {/* Top Header Bar matching screenshot with Back to preview */}
      <div className="w-full border-b border-slate-200/90 bg-white px-6 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5 transition-colors cursor-pointer py-1.5 px-2.5 rounded-md hover:bg-slate-100 border border-slate-200/80 bg-slate-50/50"
          >
            <ChevronLeft className="size-4" />
            <span>Back to preview</span>
          </button>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2 pl-2 border-l border-slate-200">
            <span>{policy.name}</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveDraftAction}
            className="text-xs font-bold text-slate-700 hover:text-slate-900 px-3 py-1.5 transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            <span>SAVE</span>
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={handlePublishAction}
            className="rounded-md bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-bold px-5 py-2 shadow-xs cursor-pointer transition-colors disabled:opacity-50 inline-flex items-center gap-1"
          >
            <span>PUBLISH...</span>
          </button>
        </div>
      </div>

      {/* 3-Column Studio Layout matching screenshots */}
      <div className="w-full flex-1 flex flex-col lg:flex-row bg-white overflow-hidden min-h-[680px]">
        {/* ========================================================= */}
        {/* 1. LEFT RAIL: PROGRESS & 8 STAGES */}
        {/* ========================================================= */}
        <div className="w-full lg:w-[240px] shrink-0 border-r border-slate-200/80 bg-white p-5 flex flex-col justify-between select-none">
          <div className="space-y-5">
            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-slate-600 uppercase tracking-wider text-[10px]">PROGRESS</span>
                <span className="text-slate-800 font-mono text-[11px]">{progressPct}%</span>
              </div>
              <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#10b981] rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(progressPct, 3)}%` }}
                />
              </div>
            </div>

            {/* 8 Stage Steps List */}
            <nav className="space-y-1 pt-2">
              {currentSteps.map((item) => {
                const isActive = activeStep === item.step
                return (
                  <button
                    key={item.step}
                    type="button"
                    onClick={() => {
                      setActiveStep(item.step)
                      if (item.step === 8) setStep8SubStep(1)
                    }}
                    className={cn(
                      "w-full text-left px-2.5 py-2 text-xs transition-all flex items-center justify-between cursor-pointer rounded-md",
                      isActive
                        ? "text-slate-900 font-bold bg-blue-50/50 border-l-3 border-[#2563eb]"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    )}
                  >
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. CENTER QUESTIONNAIRE AREA */}
        {/* ========================================================= */}
        <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 overflow-y-auto bg-white border-r border-slate-200/80">
          <div className="max-w-2xl space-y-6">
            {/* ------------------------------------------------------- */}
            {/* PRIVACY POLICY STAGE QUESTIONS */}
            {/* ------------------------------------------------------- */}
            {isPrivacy && (
              <>
                {/* STEP 1: Privacy Policy Uses (3%) */}
                {activeStep === 1 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <h2 className="text-xl font-bold text-slate-900">
                      Privacy Policy Uses
                    </h2>

                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-slate-800">
                        What will this Privacy Policy be used for?
                      </p>

                      <div className="space-y-2.5">
                        {[
                          "Website",
                          "Mobile application",
                          "Facebook application",
                        ].map((p) => {
                          const isChecked = platforms.includes(p)
                          return (
                            <label key={p} className="flex items-center gap-3 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) setPlatforms([...platforms, p])
                                  else setPlatforms(platforms.filter((x) => x !== p))
                                }}
                                className="rounded border-slate-300 text-[#2563eb] size-4 focus:ring-blue-500"
                              />
                              <span className="text-xs text-slate-800">{p}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: User Location (12%) */}
                {activeStep === 2 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <h2 className="text-xl font-bold text-slate-900">
                      User Location
                    </h2>

                    {/* Question 1 */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-semibold text-slate-800">
                          Do you have users in the United States?
                        </p>
                        <HelpCircle className="size-3.5 text-slate-400" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="radio"
                            name="hasUsUsers"
                            checked={hasUsUsers === true}
                            onChange={() => setHasUsUsers(true)}
                            className="size-3.5 text-[#2563eb]"
                          />
                          <span className="text-xs text-slate-800">Yes</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="radio"
                            name="hasUsUsers"
                            checked={hasUsUsers === false}
                            onChange={() => setHasUsUsers(false)}
                            className="size-3.5 text-[#2563eb]"
                          />
                          <span className="text-xs text-slate-800">No</span>
                        </label>
                      </div>
                    </div>

                    {/* Question 2 */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-semibold text-slate-800">
                          Do you have users in the EU, UK, Switzerland, Iceland, Liechtenstein, or Norway?
                        </p>
                        <HelpCircle className="size-3.5 text-slate-400" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="radio"
                            name="hasEuUsers"
                            checked={hasEuUsers === true}
                            onChange={() => setHasEuUsers(true)}
                            className="size-3.5 text-[#2563eb]"
                          />
                          <span className="text-xs text-slate-800">Yes</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="radio"
                            name="hasEuUsers"
                            checked={hasEuUsers === false}
                            onChange={() => setHasEuUsers(false)}
                            className="size-3.5 text-[#2563eb]"
                          />
                          <span className="text-xs text-slate-800">No</span>
                        </label>
                      </div>
                    </div>

                    {/* Question 3 */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-semibold text-slate-800">
                          Do you have users in Canada?
                        </p>
                        <HelpCircle className="size-3.5 text-slate-400" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="radio"
                            name="hasCanadaUsers"
                            checked={hasCanadaUsers === true}
                            onChange={() => setHasCanadaUsers(true)}
                            className="size-3.5 text-[#2563eb]"
                          />
                          <span className="text-xs text-slate-800">Yes</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="radio"
                            name="hasCanadaUsers"
                            checked={hasCanadaUsers === false}
                            onChange={() => setHasCanadaUsers(false)}
                            className="size-3.5 text-[#2563eb]"
                          />
                          <span className="text-xs text-slate-800">No</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: Collection of Information (22%) */}
                {activeStep === 3 && (
                  <div className="space-y-5 animate-in fade-in duration-150">
                    <h2 className="text-xl font-bold text-slate-900">
                      Personal Information Collected Directly
                    </h2>

                    <div>
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-semibold text-slate-800">
                          Please select the personal information you intend to collect directly from the user:
                        </p>
                        <HelpCircle className="size-3.5 text-slate-400" />
                      </div>
                      <p className="text-[11px] text-slate-500 italic mt-0.5">
                        &quot;Collect directly&quot; means the user directly provides you with this information. For example, a user may give you their name and email address when signing up for an account on your site.
                      </p>
                    </div>

                    <div className="space-y-2">
                      {[
                        "Names",
                        "Phone numbers",
                        "Email addresses",
                        "Mailing addresses",
                        "Job titles",
                        "Usernames",
                        "Passwords",
                        "Contact preferences",
                        "Contact or authentication data",
                        "Billing addresses",
                        "Debit/credit card numbers",
                      ].map((item) => {
                        const isChecked = directData.includes(item)
                        return (
                          <label key={item} className="flex items-center gap-2.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) setDirectData([...directData, item])
                                else setDirectData(directData.filter((d) => d !== item))
                              }}
                              className="rounded border-slate-300 text-[#2563eb] size-4"
                            />
                            <span className="text-xs text-slate-800">{item}</span>
                          </label>
                        )
                      })}
                    </div>

                    {/* Add your own */}
                    <div className="pt-2 space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 block">Add your own</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={customDataInput}
                          onChange={(e) => setCustomDataInput(e.target.value)}
                          placeholder="Enter custom data field"
                          className="w-full max-w-sm px-3 py-1.5 text-xs rounded border border-slate-300 focus:outline-hidden focus:border-[#2563eb]"
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
                          className="px-3 py-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wide cursor-pointer"
                        >
                          + ADD
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: Marketing Communications (41%) */}
                {activeStep === 4 && (
                  <div className="space-y-5 animate-in fade-in duration-150">
                    <h2 className="text-xl font-bold text-slate-900">
                      Marketing and Promotional Communications
                    </h2>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-800">
                        Do you send marketing or promotional communications to your users?
                      </p>
                      <p className="text-[11px] text-slate-500 italic">
                        If yes, make sure you have selected &quot;To send marketing and promotional communications&quot; as a reason for using your users&apos; personal information (on previous page).
                      </p>

                      <div className="space-y-1.5 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="radio"
                            name="sendMarketing"
                            checked={sendMarketing === true}
                            onChange={() => setSendMarketing(true)}
                            className="size-3.5 text-[#2563eb]"
                          />
                          <span className="text-xs text-slate-800">Yes</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="radio"
                            name="sendMarketing"
                            checked={sendMarketing === false}
                            onChange={() => setSendMarketing(false)}
                            className="size-3.5 text-[#2563eb]"
                          />
                          <span className="text-xs text-slate-800">No</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 5: Artificial Intelligence (45%) */}
                {activeStep === 5 && (
                  <div className="space-y-5 animate-in fade-in duration-150">
                    <h2 className="text-xl font-bold text-slate-900">
                      Artificial Intelligence
                    </h2>

                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-semibold text-slate-800">
                          Does your website or app offer AI-based services?
                        </p>
                        <HelpCircle className="size-3.5 text-slate-400" />
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="radio"
                            name="offerAi"
                            checked={offerAi === true}
                            onChange={() => setOfferAi(true)}
                            className="size-3.5 text-[#2563eb]"
                          />
                          <span className="text-xs text-slate-800">Yes</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="radio"
                            name="offerAi"
                            checked={offerAi === false}
                            onChange={() => setOfferAi(false)}
                            className="size-3.5 text-[#2563eb]"
                          />
                          <span className="text-xs text-slate-800">No</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 6: Tracking Technologies (70%) */}
                {activeStep === 6 && (
                  <div className="space-y-5 animate-in fade-in duration-150">
                    <h2 className="text-xl font-bold text-slate-900">
                      Tracking Technologies
                    </h2>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-800">
                        Which of the following does your website or app use or plan to use?
                      </p>

                      <div className="space-y-2 pt-1">
                        {[
                          { id: "cookies", label: "Cookies and/or web beacons" },
                          { id: "maps", label: "Google Maps APIs" },
                          { id: "both", label: "Both" },
                          { id: "neither", label: "Neither" },
                        ].map((t) => (
                          <label key={t.id} className="flex items-center gap-2.5 cursor-pointer select-none">
                            <input
                              type="radio"
                              name="trackingTech"
                              checked={trackingTech === t.id}
                              onChange={() => setTrackingTech(t.id as any)}
                              className="size-3.5 text-[#2563eb]"
                            />
                            <span className="text-xs text-slate-800">{t.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 7: Data Protection Officer (77%) */}
                {activeStep === 7 && (
                  <div className="space-y-5 animate-in fade-in duration-150">
                    <h2 className="text-xl font-bold text-slate-900">
                      Data Protection Officer (DPO)
                    </h2>

                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-semibold text-slate-800">
                          Have you, or will you, appoint a data protection officer (DPO)?
                        </p>
                        <HelpCircle className="size-3.5 text-slate-400" />
                      </div>
                      <p className="text-[11px] text-slate-500 italic leading-relaxed">
                        A data protection officer (DPO) oversees the company&apos;s compliance with US, EU and/or UK privacy laws. If you are targeting EU or UK users, you may be required to have a DPO. If you only target US users, we still highly recommend having a DPO or another individual responsible for all privacy issues at your company.
                      </p>

                      <div className="space-y-1.5 pt-1">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="radio"
                            name="hasDpo"
                            checked={hasDpo === true}
                            onChange={() => setHasDpo(true)}
                            className="size-3.5 text-[#2563eb]"
                          />
                          <span className="text-xs text-slate-800">Yes</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="radio"
                            name="hasDpo"
                            checked={hasDpo === false}
                            onChange={() => setHasDpo(false)}
                            className="size-3.5 text-[#2563eb]"
                          />
                          <span className="text-xs text-slate-800">No</span>
                        </label>
                      </div>

                      {hasDpo && (
                        <div className="pt-3">
                          <label className="text-xs font-semibold text-slate-700 block mb-1">DPO Email Address</label>
                          <input
                            type="email"
                            value={dpoEmail}
                            onChange={(e) => setDpoEmail(e.target.value)}
                            placeholder="dpo@yourdomain.com"
                            className="w-full max-w-sm px-3 py-2 text-xs rounded border border-slate-300 focus:outline-hidden focus:border-[#2563eb]"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 8: Final Details (83% -> 90% -> 93% -> 96% -> 100%) */}
                {activeStep === 8 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    {/* Sub-step 1: Review Your Policy Coverage (83%) */}
                    {step8SubStep === 1 && (
                      <div className="space-y-4">
                        <h2 className="text-xl font-bold text-slate-900">
                          Review Your Policy Coverage
                        </h2>

                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <p className="text-xs font-semibold text-slate-800">
                              Select any other regions you do business in and wish to add to your policy:
                            </p>
                            <HelpCircle className="size-3.5 text-slate-400" />
                          </div>

                          <div className="space-y-2 pt-1">
                            {[
                              "POPIA (South Africa)",
                              "Privacy Act (Australia)",
                              "The Privacy Act 2020 (New Zealand)",
                            ].map((region) => {
                              const isChecked = extraRegions.includes(region)
                              return (
                                <label key={region} className="flex items-center gap-2.5 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      if (e.target.checked) setExtraRegions([...extraRegions, region])
                                      else setExtraRegions(extraRegions.filter((r) => r !== region))
                                    }}
                                    className="rounded border-slate-300 text-[#2563eb] size-4"
                                  />
                                  <span className="text-xs text-slate-800">{region}</span>
                                </label>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sub-step 2: Company (90%) */}
                    {step8SubStep === 2 && (
                      <div className="space-y-5">
                        <h2 className="text-xl font-bold text-slate-900">
                          Company
                        </h2>

                        <div className="space-y-4">
                          <div>
                            <label className="text-xs font-semibold text-slate-800 block mb-0.5">
                              Full legal name of company
                            </label>
                            <p className="text-[11px] text-slate-500 italic mb-1.5">
                              Include corporate ending if applicable: Inc., LLC, etc.
                            </p>
                            <input
                              type="text"
                              value={companyName}
                              onChange={(e) => setCompanyName(e.target.value)}
                              placeholder="e.g., Apple Inc."
                              className="w-full px-3.5 py-2 text-xs rounded border border-slate-300 focus:outline-hidden focus:border-[#2563eb]"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1">
                              <label className="text-xs font-semibold text-slate-800 block">
                                Are you doing business under a short form or trade name (also known as a DBA)?
                              </label>
                              <HelpCircle className="size-3.5 text-slate-400" />
                            </div>
                            <div className="space-y-1">
                              <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                  type="radio"
                                  name="isDba"
                                  checked={isDba === true}
                                  onChange={() => setIsDba(true)}
                                  className="size-3.5 text-[#2563eb]"
                                />
                                <span className="text-xs text-slate-800">Yes</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                  type="radio"
                                  name="isDba"
                                  checked={isDba === false}
                                  onChange={() => setIsDba(false)}
                                  className="size-3.5 text-[#2563eb]"
                                />
                                <span className="text-xs text-slate-800">No</span>
                              </label>
                            </div>
                            {isDba && (
                              <input
                                type="text"
                                value={dbaName}
                                onChange={(e) => setDbaName(e.target.value)}
                                placeholder="Enter trade or DBA name"
                                className="w-full max-w-sm mt-2 px-3 py-1.5 text-xs rounded border border-slate-300 focus:outline-hidden focus:border-[#2563eb]"
                              />
                            )}
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-800 block mb-1">
                              Please provide an email address for privacy-related inquiries, (e.g., data subject access requests or questions related to this Privacy Policy)
                            </label>
                            <input
                              type="email"
                              value={supportEmail}
                              onChange={(e) => setSupportEmail(e.target.value)}
                              placeholder="privacy@example.com"
                              className="w-full px-3.5 py-2 text-xs rounded border border-slate-300 focus:outline-hidden focus:border-[#2563eb]"
                            />
                          </div>

                          <div>
                            <div className="flex items-center gap-1 mb-0.5">
                              <label className="text-xs font-semibold text-slate-800 block">
                                Phone number
                              </label>
                              <HelpCircle className="size-3.5 text-slate-400" />
                            </div>
                            <p className="text-[11px] text-slate-500 italic mb-1.5">
                              Include your office phone number or your personal phone number.
                            </p>
                            <input
                              type="text"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="e.g., 1-800-555-5555"
                              className="w-full px-3.5 py-2 text-xs rounded border border-slate-300 focus:outline-hidden focus:border-[#2563eb]"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sub-step 3: Corporate Address (93%) */}
                    {step8SubStep === 3 && (
                      <div className="space-y-4">
                        <h2 className="text-xl font-bold text-slate-900">
                          Corporate Address
                        </h2>

                        <div className="space-y-3.5">
                          <div>
                            <label className="text-xs font-semibold text-slate-800 block mb-1">Country</label>
                            <select
                              value={country}
                              onChange={(e) => setCountry(e.target.value)}
                              className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-hidden focus:border-[#2563eb] bg-white"
                            >
                              <option value="">Please select</option>
                              <option value="United States">United States</option>
                              <option value="United Kingdom">United Kingdom</option>
                              <option value="Canada">Canada</option>
                              <option value="Australia">Australia</option>
                              <option value="Germany">Germany</option>
                              <option value="France">France</option>
                              <option value="Netherlands">Netherlands</option>
                              <option value="Switzerland">Switzerland</option>
                              <option value="Ireland">Ireland</option>
                              <option value="India">India</option>
                              <option value="Singapore">Singapore</option>
                              <option value="New Zealand">New Zealand</option>
                              <option value="South Africa">South Africa</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-800 block mb-0.5">Address line 1</label>
                            <p className="text-[11px] text-slate-500 italic mb-1">
                              Provide the address where your company is registered or located.
                            </p>
                            <input
                              type="text"
                              value={addressLine1}
                              onChange={(e) => setAddressLine1(e.target.value)}
                              placeholder="Enter street address"
                              className="w-full px-3.5 py-2 text-xs rounded border border-slate-300 focus:outline-hidden focus:border-[#2563eb]"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-800 block mb-1">Address line 2</label>
                            <input
                              type="text"
                              value={addressLine2}
                              onChange={(e) => setAddressLine2(e.target.value)}
                              placeholder="Enter street address"
                              className="w-full px-3.5 py-2 text-xs rounded border border-slate-300 focus:outline-hidden focus:border-[#2563eb]"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-800 block mb-1">City / town</label>
                            <input
                              type="text"
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              placeholder="Enter city / town"
                              className="w-full px-3.5 py-2 text-xs rounded border border-slate-300 focus:outline-hidden focus:border-[#2563eb]"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-800 block mb-1">ZIP code / postal code</label>
                            <input
                              type="text"
                              value={zipCode}
                              onChange={(e) => setZipCode(e.target.value)}
                              placeholder="Enter ZIP code / postal code"
                              className="w-full px-3.5 py-2 text-xs rounded border border-slate-300 focus:outline-hidden focus:border-[#2563eb]"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sub-step 4: Name Your Policy (96%) */}
                    {step8SubStep === 4 && (
                      <div className="space-y-4">
                        <h2 className="text-xl font-bold text-slate-900">
                          Name Your Policy
                        </h2>

                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-slate-800">
                            What do you want to call your policy?
                          </p>
                          <p className="text-[11px] text-slate-500 italic mb-2">
                            This will be the title shown on the policy.
                          </p>

                          <div className="space-y-2.5">
                            {[
                              { id: "Privacy Policy", label: "Privacy Policy" },
                              { id: "Privacy Notice", label: "Privacy Notice" },
                              { id: "none", label: "I don't want to include a title" },
                            ].map((opt) => (
                              <label key={opt.id} className="flex items-center gap-2.5 cursor-pointer select-none">
                                <input
                                  type="radio"
                                  name="policyTitleChoice"
                                  checked={policyTitleChoice === opt.id}
                                  onChange={() => setPolicyTitleChoice(opt.id as any)}
                                  className="size-3.5 text-[#2563eb]"
                                />
                                <span className="text-xs text-slate-800">{opt.label}</span>
                              </label>
                            ))}

                            <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
                              <input
                                type="radio"
                                name="policyTitleChoice"
                                checked={policyTitleChoice === "custom"}
                                onChange={() => setPolicyTitleChoice("custom")}
                                className="size-3.5 text-[#2563eb]"
                              />
                              <input
                                type="text"
                                value={customPolicyTitle}
                                onChange={(e) => {
                                  setCustomPolicyTitle(e.target.value)
                                  setPolicyTitleChoice("custom")
                                }}
                                placeholder="Add your own here"
                                className="flex-1 max-w-sm px-3 py-1.5 text-xs rounded border border-slate-300 focus:outline-hidden focus:border-[#2563eb]"
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sub-step 5: Version Date (100%) */}
                    {step8SubStep === 5 && (
                      <div className="space-y-4">
                        <h2 className="text-xl font-bold text-slate-900">
                          Version Date
                        </h2>

                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-slate-800">
                            What is the effective date for this Privacy Policy?
                          </p>
                          <p className="text-[11px] text-slate-500 italic leading-relaxed mb-3">
                            The effective date on your Privacy Policy informs your users of when your Privacy Policy was originally published or last updated. When you make an update to your Privacy Policy that requires notifying your users, make sure the effective date is the same date you indicated in your notice communications.
                          </p>

                          <div className="relative max-w-xs">
                            <Calendar className="size-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                            <input
                              type="text"
                              value={effectiveDate}
                              onChange={(e) => setEffectiveDate(e.target.value)}
                              placeholder={new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })}
                              className="w-full pl-9 pr-3 py-2 text-xs rounded border border-slate-300 focus:outline-hidden focus:border-[#2563eb]"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ------------------------------------------------------- */}
            {/* COOKIE & TERMS POLICIES (FALLBACK / PRESERVED) */}
            {/* ------------------------------------------------------- */}
            {/* ------------------------------------------------------- */}
            {/* TERMS OF SERVICE (LEGAL TERMS) 7-STEP QUESTIONNAIRE */}
            {/* ------------------------------------------------------- */}
            {isTerms && (
              <>
                {/* STEP 1: General (Platform Type - 4%) */}
                {activeStep === 1 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <h2 className="text-xl font-bold text-slate-900">
                      Platform Type
                    </h2>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-800">
                          What will this Legal Terms be used for?
                        </p>
                        <div className="space-y-2.5">
                          <label className="flex items-center gap-3 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isWebsite}
                              onChange={(e) => setIsWebsite(e.target.checked)}
                              className="rounded border-slate-300 text-[#2563eb] size-4 focus:ring-blue-500"
                            />
                            <span className="text-xs text-slate-800">Website</span>
                          </label>

                          <label className="flex items-center gap-3 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isMobileApp}
                              onChange={(e) => setIsMobileApp(e.target.checked)}
                              className="rounded border-slate-300 text-[#2563eb] size-4 focus:ring-blue-500"
                            />
                            <span className="text-xs text-slate-800">Mobile application</span>
                          </label>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <p className="text-xs font-semibold text-slate-800">
                          What type of platform are you creating this Legal Terms for?
                        </p>
                        <div className="space-y-2.5">
                          {[
                            { id: "ecommerce", label: "E-commerce" },
                            { id: "saas", label: "Software as a Service (SaaS)" },
                            { id: "other", label: "Other" },
                          ].map((opt) => (
                            <label key={opt.id} className="flex items-center gap-2.5 cursor-pointer select-none">
                              <input
                                type="radio"
                                name="platformType"
                                checked={platformType === opt.id}
                                onChange={() => setPlatformType(opt.id as any)}
                                className="size-3.5 text-[#2563eb]"
                              />
                              <span className="text-xs text-slate-800">{opt.label}</span>
                            </label>
                          ))}

                          {platformType === "other" && (
                            <input
                              type="text"
                              value={otherPlatformType}
                              onChange={(e) => setOtherPlatformType(e.target.value)}
                              placeholder="Please specify your platform type"
                              className="w-full max-w-sm ml-6 px-3 py-1.5 text-xs rounded border border-slate-300 focus:outline-hidden focus:border-[#2563eb]"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Platform Information (Hosting - 16%) */}
                {activeStep === 2 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <h2 className="text-xl font-bold text-slate-900">
                      Hosting
                    </h2>

                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-800 block">
                          Where is your platform hosted?
                        </label>
                        <select
                          value={hostingCountry}
                          onChange={(e) => setHostingCountry(e.target.value)}
                          className="w-full max-w-md px-3 py-2 text-xs rounded border border-slate-300 focus:outline-hidden focus:border-[#2563eb] bg-white"
                        >
                          <option value="United States">United States</option>
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="Canada">Canada</option>
                          <option value="Germany">Germany</option>
                          <option value="France">France</option>
                          <option value="Ireland">Ireland</option>
                          <option value="Netherlands">Netherlands</option>
                          <option value="Singapore">Singapore</option>
                          <option value="Australia">Australia</option>
                          <option value="India">India</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="space-y-3 pt-2 border-t border-slate-100">
                        <p className="text-xs font-semibold text-slate-800">
                          Is your platform hosted in other countries as well?
                        </p>
                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="radio"
                              name="hostedOtherCountries"
                              checked={!hostedOtherCountries}
                              onChange={() => setHostedOtherCountries(false)}
                              className="size-3.5 text-[#2563eb]"
                            />
                            <span className="text-xs text-slate-800">No</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="radio"
                              name="hostedOtherCountries"
                              checked={hostedOtherCountries}
                              onChange={() => setHostedOtherCountries(true)}
                              className="size-3.5 text-[#2563eb]"
                            />
                            <span className="text-xs text-slate-800">Yes</span>
                          </label>
                        </div>

                        {hostedOtherCountries && (
                          <div className="space-y-3 pt-2">
                            <div className="flex gap-2 max-w-md">
                              <input
                                type="text"
                                value={customHostingInput}
                                onChange={(e) => setCustomHostingInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault()
                                    handleAddOtherHostingCountry()
                                  }
                                }}
                                placeholder="Add another hosting country"
                                className="flex-1 px-3 py-1.5 text-xs rounded border border-slate-300 focus:outline-hidden focus:border-[#2563eb]"
                              />
                              <button
                                type="button"
                                onClick={handleAddOtherHostingCountry}
                                className="px-3.5 py-1.5 bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-bold rounded cursor-pointer transition-colors"
                              >
                                + ADD
                              </button>
                            </div>

                            {otherHostingCountries.length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {otherHostingCountries.map((c) => (
                                  <span
                                    key={c}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium border border-slate-200"
                                  >
                                    {c}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveOtherHostingCountry(c)}
                                      className="text-slate-400 hover:text-red-500 cursor-pointer ml-1"
                                    >
                                      ✕
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: Purchases and Payments (Subscription - 30%) */}
                {activeStep === 3 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <h2 className="text-xl font-bold text-slate-900">
                      Subscription
                    </h2>

                    <div className="space-y-5">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-800">
                          Do you offer subscriptions?
                        </p>
                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="radio"
                              name="hasSubscription"
                              checked={hasSubscription}
                              onChange={() => setHasSubscription(true)}
                              className="size-3.5 text-[#2563eb]"
                            />
                            <span className="text-xs text-slate-800">Yes</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="radio"
                              name="hasSubscription"
                              checked={!hasSubscription}
                              onChange={() => setHasSubscription(false)}
                              className="size-3.5 text-[#2563eb]"
                            />
                            <span className="text-xs text-slate-800">No</span>
                          </label>
                        </div>
                      </div>

                      {hasSubscription && (
                        <div className="space-y-4 pt-3 border-t border-slate-100">
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-slate-800">
                              Do subscriptions automatically renew?
                            </p>
                            <div className="flex items-center gap-6">
                              <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                  type="radio"
                                  name="subscriptionAutoRenew"
                                  checked={subscriptionAutoRenew}
                                  onChange={() => setSubscriptionAutoRenew(true)}
                                  className="size-3.5 text-[#2563eb]"
                                />
                                <span className="text-xs text-slate-800">Yes</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                  type="radio"
                                  name="subscriptionAutoRenew"
                                  checked={!subscriptionAutoRenew}
                                  onChange={() => setSubscriptionAutoRenew(false)}
                                  className="size-3.5 text-[#2563eb]"
                                />
                                <span className="text-xs text-slate-800">No</span>
                              </label>
                            </div>
                          </div>

                          <div className="space-y-2 pt-2">
                            <p className="text-xs font-semibold text-slate-800">
                              How frequently do subscriptions renew?
                            </p>
                            <div className="space-y-2.5">
                              {[
                                { id: "monthly", label: "Monthly" },
                                { id: "annually", label: "Annually" },
                                { id: "customer_chooses", label: "The customer chooses their renewal schedule" },
                                { id: "custom", label: "Other" },
                              ].map((opt) => (
                                <label key={opt.id} className="flex items-center gap-2.5 cursor-pointer select-none">
                                  <input
                                    type="radio"
                                    name="renewalFrequency"
                                    checked={renewalFrequency === opt.id}
                                    onChange={() => setRenewalFrequency(opt.id as any)}
                                    className="size-3.5 text-[#2563eb]"
                                  />
                                  <span className="text-xs text-slate-800">{opt.label}</span>
                                </label>
                              ))}

                              {renewalFrequency === "custom" && (
                                <input
                                  type="text"
                                  value={customRenewalFrequency}
                                  onChange={(e) => setCustomRenewalFrequency(e.target.value)}
                                  placeholder="Specify custom renewal frequency (e.g. Quarterly)"
                                  className="w-full max-w-sm ml-6 px-3 py-1.5 text-xs rounded border border-slate-300 focus:outline-hidden focus:border-[#2563eb]"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 4: Platform Content (Prohibited Activities - 42%) */}
                {activeStep === 4 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <h2 className="text-xl font-bold text-slate-900">
                      Prohibited Activities
                    </h2>

                    <div className="space-y-4">
                      <p className="text-xs font-semibold text-slate-800">
                        Do you want to explicitly prohibit any of the following activities on your platform?
                      </p>

                      <div className="space-y-3">
                        <label className="flex items-start gap-3 cursor-pointer select-none p-3 border border-slate-200 rounded-lg hover:bg-slate-50/50">
                          <input
                            type="checkbox"
                            checked={prohibitCommercialAds}
                            onChange={(e) => setProhibitCommercialAds(e.target.checked)}
                            className="rounded border-slate-300 text-[#2563eb] size-4 focus:ring-blue-500 mt-0.5"
                          />
                          <div>
                            <span className="text-xs font-semibold text-slate-900 block">Prohibit Unauthorized Commercial Use</span>
                            <span className="text-[11px] text-slate-500">Use the Services for any revenue-generating endeavor or commercial enterprise not authorized by us.</span>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 cursor-pointer select-none p-3 border border-slate-200 rounded-lg hover:bg-slate-50/50">
                          <input
                            type="checkbox"
                            checked={prohibitTransferProfile}
                            onChange={(e) => setProhibitTransferProfile(e.target.checked)}
                            className="rounded border-slate-300 text-[#2563eb] size-4 focus:ring-blue-500 mt-0.5"
                          />
                          <div>
                            <span className="text-xs font-semibold text-slate-900 block">Prohibit Profile & Account Transfer</span>
                            <span className="text-[11px] text-slate-500">Sell, rent, license, or otherwise transfer your profile or registered account to any third party.</span>
                          </div>
                        </label>
                      </div>

                      <div className="space-y-2 pt-3 border-t border-slate-100">
                        <p className="text-xs font-semibold text-slate-800">
                          Do you want to prohibit any other specific activities?
                        </p>
                        <div className="flex gap-2 max-w-md">
                          <input
                            type="text"
                            value={customProhibitedInput}
                            onChange={(e) => setCustomProhibitedInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                handleAddCustomProhibited()
                              }
                            }}
                            placeholder="Add custom prohibited activity"
                            className="flex-1 px-3 py-1.5 text-xs rounded border border-slate-300 focus:outline-hidden focus:border-[#2563eb]"
                          />
                          <button
                            type="button"
                            onClick={handleAddCustomProhibited}
                            className="px-3.5 py-1.5 bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-bold rounded cursor-pointer transition-colors"
                          >
                            + ADD
                          </button>
                        </div>

                        {customProhibitedActivities.length > 0 && (
                          <div className="space-y-1.5 pt-2">
                            {customProhibitedActivities.map((act) => (
                              <div
                                key={act}
                                className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700"
                              >
                                <span>{act}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCustomProhibited(act)}
                                  className="text-slate-400 hover:text-red-500 cursor-pointer ml-2"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 5: Disputes (Dispute Resolution - 61%) */}
                {activeStep === 5 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <h2 className="text-xl font-bold text-slate-900">
                      Dispute Resolution
                    </h2>

                    <div className="space-y-5">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-800">
                          How do you want to resolve disputes?
                        </p>
                        <div className="space-y-2.5">
                          {[
                            { id: "informal_then_arbitration", label: "Informal negotiations, then binding arbitration" },
                            { id: "arbitration", label: "Binding arbitration directly" },
                            { id: "litigation", label: "Court litigation" },
                          ].map((opt) => (
                            <label key={opt.id} className="flex items-center gap-2.5 cursor-pointer select-none">
                              <input
                                type="radio"
                                name="disputeResolution"
                                checked={disputeResolution === opt.id}
                                onChange={() => setDisputeResolution(opt.id as any)}
                                className="size-3.5 text-[#2563eb]"
                              />
                              <span className="text-xs text-slate-800">{opt.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-slate-100">
                        <div>
                          <label className="text-xs font-semibold text-slate-800 block mb-1">
                            Dispute Country / Forum
                          </label>
                          <input
                            type="text"
                            value={disputeCountry}
                            onChange={(e) => setDisputeCountry(e.target.value)}
                            placeholder="e.g. United States"
                            className="w-full max-w-md px-3 py-2 text-xs rounded border border-slate-300 focus:outline-hidden focus:border-[#2563eb]"
                          />
                        </div>

                        {disputeCountry.toLowerCase().includes("united states") && (
                          <div>
                            <label className="text-xs font-semibold text-slate-800 block mb-1">
                              Dispute State / County
                            </label>
                            <input
                              type="text"
                              value={disputeState}
                              onChange={(e) => setDisputeState(e.target.value)}
                              placeholder="e.g. California / Delaware"
                              className="w-full max-w-md px-3 py-2 text-xs rounded border border-slate-300 focus:outline-hidden focus:border-[#2563eb]"
                            />
                          </div>
                        )}

                        {disputeResolution === "informal_then_arbitration" && (
                          <div>
                            <label className="text-xs font-semibold text-slate-800 block mb-1">
                              Informal Negotiation Duration (Days)
                            </label>
                            <input
                              type="number"
                              value={mediationDays}
                              onChange={(e) => setMediationDays(Number(e.target.value) || 30)}
                              className="w-32 px-3 py-2 text-xs rounded border border-slate-300 focus:outline-hidden focus:border-[#2563eb]"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 6: Other Considerations (Marketing & Promotional Communications - 69%) */}
                {activeStep === 6 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <h2 className="text-xl font-bold text-slate-900">
                      Marketing and Promotional Communications
                    </h2>

                    <div className="space-y-5">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-800">
                          Do you send marketing or promotional SMS text messages to users?
                        </p>
                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="radio"
                              name="sendSms"
                              checked={sendSms}
                              onChange={() => setSendSms(true)}
                              className="size-3.5 text-[#2563eb]"
                            />
                            <span className="text-xs text-slate-800">Yes</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="radio"
                              name="sendSms"
                              checked={!sendSms}
                              onChange={() => setSendSms(false)}
                              className="size-3.5 text-[#2563eb]"
                            />
                            <span className="text-xs text-slate-800">No</span>
                          </label>
                        </div>
                      </div>

                      {sendSms && (
                        <div className="space-y-4 pt-3 border-t border-slate-100">
                          <div>
                            <label className="text-xs font-semibold text-slate-800 block mb-1">SMS Program Name</label>
                            <input
                              type="text"
                              value={smsProgramName}
                              onChange={(e) => setSmsProgramName(e.target.value)}
                              placeholder="e.g. Syft Alerts"
                              className="w-full max-w-md px-3 py-2 text-xs rounded border border-slate-300 focus:outline-hidden focus:border-[#2563eb]"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-800 block mb-1">Types of SMS Messages</label>
                            <input
                              type="text"
                              value={smsMessageTypes}
                              onChange={(e) => setSmsMessageTypes(e.target.value)}
                              placeholder="e.g. Transactional alerts, 2FA codes, order tracking, and promotional offers"
                              className="w-full max-w-md px-3 py-2 text-xs rounded border border-slate-300 focus:outline-hidden focus:border-[#2563eb]"
                            />
                          </div>

                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-slate-800">How can users opt out of SMS messages?</p>
                            <div className="space-y-2">
                              <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                  type="radio"
                                  name="smsOptOut"
                                  checked={smsOptOut === "stop"}
                                  onChange={() => setSmsOptOut("stop")}
                                  className="size-3.5 text-[#2563eb]"
                                />
                                <span className="text-xs text-slate-800">Reply to any message with &quot;STOP&quot;</span>
                              </label>

                              <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                  type="radio"
                                  name="smsOptOut"
                                  checked={smsOptOut === "other"}
                                  onChange={() => setSmsOptOut("other")}
                                  className="size-3.5 text-[#2563eb]"
                                />
                                <span className="text-xs text-slate-800">Other</span>
                              </label>

                              {smsOptOut === "other" && (
                                <input
                                  type="text"
                                  value={customSmsOptOut}
                                  onChange={(e) => setCustomSmsOptOut(e.target.value)}
                                  placeholder="Specify custom opt-out procedure"
                                  className="w-full max-w-md ml-6 px-3 py-1.5 text-xs rounded border border-slate-300 focus:outline-hidden focus:border-[#2563eb]"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 7: Final Details (Sub-steps 1 to 6 - 80% to 100%) */}
                {activeStep === 7 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    {/* Sub-step 1: Governing Law (80%) */}
                    {termsStep7SubStep === 1 && (
                      <div className="space-y-4">
                        <h2 className="text-xl font-bold text-slate-900">
                          Governing Law
                        </h2>

                        <div className="space-y-4 max-w-md">
                          <div>
                            <label className="text-xs font-semibold text-slate-800 block mb-1">
                              Which jurisdiction&apos;s laws will govern these Legal Terms?
                            </label>
                            <select
                              value={governingCountry}
                              onChange={(e) => setGoverningCountry(e.target.value)}
                              className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-hidden focus:border-[#2563eb] bg-white"
                            >
                              <option value="United States">United States</option>
                              <option value="United Kingdom">United Kingdom</option>
                              <option value="Canada">Canada</option>
                              <option value="Germany">Germany</option>
                              <option value="France">France</option>
                              <option value="Ireland">Ireland</option>
                              <option value="Australia">Australia</option>
                              <option value="India">India</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>

                          {governingCountry.toLowerCase().includes("united states") && (
                            <div>
                              <label className="text-xs font-semibold text-slate-800 block mb-1">
                                Governing State
                              </label>
                              <input
                                type="text"
                                value={governingState}
                                onChange={(e) => setGoverningState(e.target.value)}
                                placeholder="e.g. California / Delaware / New York"
                                className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-hidden focus:border-[#2563eb]"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Sub-step 2: Contact Information (88%) */}
                    {termsStep7SubStep === 2 && (
                      <div className="space-y-4">
                        <h2 className="text-xl font-bold text-slate-900">
                          Contact Information
                        </h2>

                        <div className="space-y-4 max-w-md">
                          <div>
                            <label className="text-xs font-semibold text-slate-800 block mb-1">Company / Entity Legal Name</label>
                            <input
                              type="text"
                              value={companyName}
                              onChange={(e) => setCompanyName(e.target.value)}
                              placeholder="e.g. Acme Corp LLC"
                              className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-hidden focus:border-[#2563eb]"
                            />
                          </div>

                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-slate-800">Do you operate under a DBA (Doing Business As) name?</p>
                            <div className="flex items-center gap-6">
                              <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                  type="radio"
                                  name="isDbaTerms"
                                  checked={isDba}
                                  onChange={() => setIsDba(true)}
                                  className="size-3.5 text-[#2563eb]"
                                />
                                <span className="text-xs text-slate-800">Yes</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                  type="radio"
                                  name="isDbaTerms"
                                  checked={!isDba}
                                  onChange={() => setIsDba(false)}
                                  className="size-3.5 text-[#2563eb]"
                                />
                                <span className="text-xs text-slate-800">No</span>
                              </label>
                            </div>
                            {isDba && (
                              <input
                                type="text"
                                value={dbaName}
                                onChange={(e) => setDbaName(e.target.value)}
                                placeholder="Enter DBA trade name"
                                className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-hidden focus:border-[#2563eb]"
                              />
                            )}
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-800 block mb-1">Contact Email</label>
                            <input
                              type="email"
                              value={supportEmail}
                              onChange={(e) => setSupportEmail(e.target.value)}
                              placeholder="legal@example.com"
                              className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-hidden focus:border-[#2563eb]"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-800 block mb-1">Phone Number (Optional)</label>
                            <input
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="+1 (555) 000-0000"
                              className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-hidden focus:border-[#2563eb]"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-800 block mb-1">Fax Number (Optional)</label>
                            <input
                              type="text"
                              value={contactFax}
                              onChange={(e) => setContactFax(e.target.value)}
                              placeholder="+1 (555) 000-0001"
                              className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-hidden focus:border-[#2563eb]"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sub-step 3: Business Address (92%) */}
                    {termsStep7SubStep === 3 && (
                      <div className="space-y-4">
                        <h2 className="text-xl font-bold text-slate-900">
                          Business Address
                        </h2>

                        <div className="space-y-3.5 max-w-md">
                          <div>
                            <label className="text-xs font-semibold text-slate-800 block mb-1">Country</label>
                            <select
                              value={country}
                              onChange={(e) => setCountry(e.target.value)}
                              className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-hidden focus:border-[#2563eb] bg-white"
                            >
                              <option value="United States">United States</option>
                              <option value="United Kingdom">United Kingdom</option>
                              <option value="Canada">Canada</option>
                              <option value="Australia">Australia</option>
                              <option value="Germany">Germany</option>
                              <option value="France">France</option>
                              <option value="Ireland">Ireland</option>
                              <option value="India">India</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-800 block mb-1">Address Line 1</label>
                            <input
                              type="text"
                              value={addressLine1}
                              onChange={(e) => setAddressLine1(e.target.value)}
                              placeholder="Street address"
                              className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-hidden focus:border-[#2563eb]"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-800 block mb-1">Address Line 2 (Optional)</label>
                            <input
                              type="text"
                              value={addressLine2}
                              onChange={(e) => setAddressLine2(e.target.value)}
                              placeholder="Suite, unit, building"
                              className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-hidden focus:border-[#2563eb]"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-800 block mb-1">City / Town</label>
                            <input
                              type="text"
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              placeholder="City"
                              className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-hidden focus:border-[#2563eb]"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-800 block mb-1">ZIP / Postal Code</label>
                            <input
                              type="text"
                              value={zipCode}
                              onChange={(e) => setZipCode(e.target.value)}
                              placeholder="ZIP code"
                              className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-hidden focus:border-[#2563eb]"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sub-step 4: Updates to Your Legal Terms (94%) */}
                    {termsStep7SubStep === 4 && (
                      <div className="space-y-4">
                        <h2 className="text-xl font-bold text-slate-900">
                          Updates to Your Legal Terms
                        </h2>

                        <div className="space-y-4 max-w-md">
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-slate-800">
                              Will you notify users when you update these Legal Terms?
                            </p>
                            <div className="flex items-center gap-6">
                              <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                  type="radio"
                                  name="notifyUpdates"
                                  checked={notifyUpdates}
                                  onChange={() => setNotifyUpdates(true)}
                                  className="size-3.5 text-[#2563eb]"
                                />
                                <span className="text-xs text-slate-800">Yes</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                  type="radio"
                                  name="notifyUpdates"
                                  checked={!notifyUpdates}
                                  onChange={() => setNotifyUpdates(false)}
                                  className="size-3.5 text-[#2563eb]"
                                />
                                <span className="text-xs text-slate-800">No</span>
                              </label>
                            </div>
                          </div>

                          {notifyUpdates && (
                            <div className="space-y-3 pt-3 border-t border-slate-100">
                              <p className="text-xs font-semibold text-slate-800">Notification Method:</p>
                              <div className="space-y-2">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                  <input
                                    type="radio"
                                    name="updateNotificationMethod"
                                    checked={updateNotificationMethod === "email"}
                                    onChange={() => setUpdateNotificationMethod("email")}
                                    className="size-3.5 text-[#2563eb]"
                                  />
                                  <span className="text-xs text-slate-800">Via email notice</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                  <input
                                    type="radio"
                                    name="updateNotificationMethod"
                                    checked={updateNotificationMethod === "before_effective"}
                                    onChange={() => setUpdateNotificationMethod("before_effective")}
                                    className="size-3.5 text-[#2563eb]"
                                  />
                                  <span className="text-xs text-slate-800">Notice posted before changes take effect</span>
                                </label>
                              </div>

                              {updateNotificationMethod === "before_effective" && (
                                <div className="ml-6 flex items-center gap-2">
                                  <input
                                    type="number"
                                    value={updateNotificationDaysAdvance}
                                    onChange={(e) => setUpdateNotificationDaysAdvance(Number(e.target.value) || 30)}
                                    className="w-20 px-2 py-1 text-xs rounded border border-slate-300"
                                  />
                                  <span className="text-xs text-slate-600">days advance notice</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Sub-step 5: Name Your Legal Terms (96%) */}
                    {termsStep7SubStep === 5 && (
                      <div className="space-y-4">
                        <h2 className="text-xl font-bold text-slate-900">
                          Name Your Legal Terms
                        </h2>

                        <div className="space-y-3 max-w-md">
                          <p className="text-xs font-semibold text-slate-800">
                            What do you want to call your legal terms?
                          </p>

                          <div className="space-y-2.5">
                            {[
                              { id: "Terms of Use", label: "Terms of Use" },
                              { id: "Terms of Service", label: "Terms of Service" },
                              { id: "Terms and Conditions", label: "Terms and Conditions" },
                            ].map((opt) => (
                              <label key={opt.id} className="flex items-center gap-2.5 cursor-pointer select-none">
                                <input
                                  type="radio"
                                  name="termsTitleChoice"
                                  checked={termsTitleChoice === opt.id}
                                  onChange={() => setTermsTitleChoice(opt.id as any)}
                                  className="size-3.5 text-[#2563eb]"
                                />
                                <span className="text-xs text-slate-800">{opt.label}</span>
                              </label>
                            ))}

                            <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
                              <input
                                type="radio"
                                name="termsTitleChoice"
                                checked={termsTitleChoice === "custom"}
                                onChange={() => setTermsTitleChoice("custom")}
                                className="size-3.5 text-[#2563eb]"
                              />
                              <input
                                type="text"
                                value={customTermsTitle}
                                onChange={(e) => {
                                  setCustomTermsTitle(e.target.value)
                                  setTermsTitleChoice("custom")
                                }}
                                placeholder="Add custom title (e.g. Master Services Agreement)"
                                className="flex-1 px-3 py-1.5 text-xs rounded border border-slate-300 focus:outline-hidden focus:border-[#2563eb]"
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sub-step 6: Version Date (100%) */}
                    {termsStep7SubStep === 6 && (
                      <div className="space-y-4">
                        <h2 className="text-xl font-bold text-slate-900">
                          Version Date
                        </h2>

                        <div className="space-y-2 max-w-xs">
                          <p className="text-xs font-semibold text-slate-800">
                            What is the effective date for these Legal Terms?
                          </p>
                          <div className="relative">
                            <Calendar className="size-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                            <input
                              type="text"
                              value={effectiveDate}
                              onChange={(e) => setEffectiveDate(e.target.value)}
                              placeholder={new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })}
                              className="w-full pl-9 pr-3 py-2 text-xs rounded border border-slate-300 focus:outline-hidden focus:border-[#2563eb]"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* COOKIE POLICY CONFIG */}
            {isCookies && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900">Cookie Policy Configuration</h2>
                <p className="text-xs text-slate-600">Configures dynamic cookie categorization table synchronized with live website scans.</p>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* BOTTOM STEP NAVIGATION (BACK & NEXT / PUBLISH) */}
          {/* ========================================================= */}
          <div className="pt-8 border-t border-slate-100 flex items-center justify-between mt-8">
            <button
              type="button"
              onClick={handleBack}
              className="text-xs font-bold text-[#2563eb] hover:text-blue-800 transition-colors uppercase tracking-wider cursor-pointer"
            >
              BACK
            </button>

            {isFinalScreen ? (
              <button
                type="button"
                disabled={isSaving}
                onClick={handlePublishAction}
                className="rounded-md bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-bold px-7 py-2.5 shadow-xs cursor-pointer transition-colors disabled:opacity-50 uppercase tracking-wide"
              >
                {isSaving ? "PUBLISHING..." : "PUBLISH"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="rounded-md bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-bold px-7 py-2.5 shadow-xs cursor-pointer transition-colors uppercase tracking-wide"
              >
                NEXT
              </button>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. RIGHT RAIL: DOCUMENT PREVIEW THUMBNAIL & TIPS */}
        {/* ========================================================= */}
        <div className="w-full lg:w-[320px] shrink-0 p-6 bg-white space-y-6 select-none overflow-y-auto">
          {/* Paper Document Preview Thumbnail */}
          <div className="space-y-3">
            <div
              onClick={() => setIsPreviewModalOpen(true)}
              className="border border-slate-200 rounded-lg p-5 bg-slate-50/50 shadow-2xs hover:shadow-xs transition-shadow cursor-pointer relative group"
            >
              {isPrivacy && (
                <div className="bg-white border border-slate-200 rounded shadow-2xs p-3 space-y-2 h-44 overflow-hidden pointer-events-none select-none text-[8px] text-slate-400 font-serif leading-tight">
                  <div className="text-[10px] font-bold text-slate-900 font-sans border-b border-slate-100 pb-1 uppercase">
                    {policyTitleChoice === "none" ? "Privacy Notice" : policyTitleChoice === "custom" && customPolicyTitle ? customPolicyTitle : policyTitleChoice}
                  </div>
                  <p className="line-clamp-2">This Privacy Notice for {companyName || domain} describes how and why we access, collect, store, use personal information.</p>
                  <div className="text-[8px] font-bold text-slate-700 uppercase pt-1">1. WHAT INFORMATION DO WE COLLECT?</div>
                  <p className="line-clamp-2">We collect personal information voluntarily provided when you register: {directData.slice(0, 3).join(", ")}.</p>
                  <div className="text-[8px] font-bold text-slate-700 uppercase pt-1">2. HOW DO WE PROCESS YOUR INFORMATION?</div>
                  <p className="line-clamp-2">We process your information to provide, improve, and administer our Services, communicate with you.</p>
                </div>
              )}

              {isTerms && (
                <div className="bg-white border border-slate-200 rounded shadow-2xs p-3 space-y-2 h-44 overflow-hidden pointer-events-none select-none text-[8px] text-slate-400 font-serif leading-tight">
                  <div className="text-[10px] font-bold text-slate-900 font-sans border-b border-slate-100 pb-1 uppercase">
                    {termsTitleChoice === "custom" && customTermsTitle ? customTermsTitle : termsTitleChoice}
                  </div>
                  <p className="line-clamp-2">We are {companyName || domain}{isDba && dbaName ? ` (dba ${dbaName})` : ""}, operating the Services across {isWebsite ? "Website" : ""}{isMobileApp ? " and Mobile App" : ""}.</p>
                  <div className="text-[8px] font-bold text-slate-700 uppercase pt-1">1. OUR SERVICES</div>
                  <p className="line-clamp-2">The information provided when using the Services is not intended for distribution to or use by any person in any jurisdiction where prohibited.</p>
                  <div className="text-[8px] font-bold text-slate-700 uppercase pt-1">2. INTELLECTUAL PROPERTY RIGHTS</div>
                  <p className="line-clamp-2">We are the owner or licensee of all intellectual property rights in our Services.</p>
                </div>
              )}

              {isCookies && (
                <div className="bg-white border border-slate-200 rounded shadow-2xs p-3 space-y-2 h-44 overflow-hidden pointer-events-none select-none text-[8px] text-slate-400 font-serif leading-tight">
                  <div className="text-[10px] font-bold text-slate-900 font-sans border-b border-slate-100 pb-1 uppercase">
                    Cookie Policy
                  </div>
                  <p className="line-clamp-2">This Cookie Policy explains what cookies are, how we use them, and how you can manage your preferences on {domain}.</p>
                  <div className="text-[8px] font-bold text-slate-700 uppercase pt-1">LIVE COOKIE TABLE</div>
                  <p className="line-clamp-2">{displayCookies.length} synchronized cookie entries recorded from your active website scanner.</p>
                </div>
              )}
            </div>

            {/* PREVIEW BUTTON */}
            <button
              type="button"
              onClick={() => setIsPreviewModalOpen(true)}
              className="w-full py-2.5 px-4 rounded-md border border-[#2563eb] text-[#2563eb] hover:bg-blue-50/60 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Eye className="size-4" />
              <span>PREVIEW</span>
            </button>
          </div>

          {/* Tips Guidance Box matching screenshots */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <span className="text-base">💡</span>
              <span>Tips:</span>
            </div>

            {/* Privacy Tips */}
            {isPrivacy && (
              <>
                {activeStep === 1 && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-800">What is a privacy policy?</h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      A privacy policy (also referred to as a privacy notice) is a legal document that informs your users about how your website or app collects, uses, and discloses their personal information.
                    </p>
                  </div>
                )}

                {activeStep === 2 && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-800">What are users?</h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Users are individuals that visit your website or app. Indicating whether you target users in the US, EU, UK, and Canada activates corresponding GDPR, CCPA, and statutory privacy disclosures.
                    </p>
                  </div>
                )}

                {activeStep === 3 && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-800">What is personal information?</h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Personal information is information that is linked or reasonably linked, directly or indirectly, to an identified or identifiable natural person. Personal identifiers include names, addresses, emails, and payment details.
                    </p>
                  </div>
                )}

                {activeStep === 4 && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-800">Marketing and Promotional Communications</h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Disclosing marketing outreach keeps you compliant with global anti-spam regulations (CAN-SPAM, CASL, GDPR) and provides users with explicit opt-out mechanisms.
                    </p>
                  </div>
                )}

                {activeStep === 5 && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-800">Artificial Intelligence (AI)</h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Disclose whether your services utilize automated decision-making, machine learning, or third-party AI models to process user interactions or generate content.
                    </p>
                  </div>
                )}

                {activeStep === 6 && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-800">What are cookies, web beacons, and APIs?</h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Cookies and web beacons are tracking technologies stored on a user&apos;s browser or device that allow your website to remember preferences. If you use analytics services or Google Maps APIs, this must be disclosed.
                    </p>
                  </div>
                )}

                {activeStep === 7 && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-800">Data Protection Officer (DPO)</h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      A Data Protection Officer (DPO) oversees the company&apos;s compliance with US, EU, and UK privacy laws. Appointing a DPO or privacy contact point is required for large-scale data controllers.
                    </p>
                  </div>
                )}

                {activeStep === 8 && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-800">
                      {step8SubStep === 2 || step8SubStep === 3
                        ? "Why should I include my business address?"
                        : "Are you making substantive or material changes to your Privacy Policy?"}
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {step8SubStep === 2 || step8SubStep === 3
                        ? "It's best practice to include your business address in your privacy policy, so users and customers can send you legal communication related to your privacy policy (such as requests to delete their personal information) by mail."
                        : "The effective date informs users of when your Privacy Policy was originally published or last updated. When making updates, make sure the effective date matches your notice communications."}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Terms of Service Tips */}
            {isTerms && (
              <>
                {activeStep === 1 && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-800">What are Legal Terms?</h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Legal Terms (also referred to as Terms of Service or Terms of Use) define the binding contractual rules, conditions, and standards between you and your users when interacting with your website or applications.
                    </p>
                  </div>
                )}

                {activeStep === 2 && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-800">Why does hosting location matter?</h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Disclosing hosting regions clarifies data storage locations, server jurisdiction, and cross-border regulatory considerations for global platform visitors.
                    </p>
                  </div>
                )}

                {activeStep === 3 && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-800">Subscription & Auto-Renewal Laws</h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Statutory renewal mandates (e.g., California ARL, EU Consumer Directives) require explicit disclosure of renewal cycles, cancellation methods, and advance notices prior to recurring charges.
                    </p>
                  </div>
                )}

                {activeStep === 4 && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-800">Prohibited Activities & Account Safety</h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Explicitly listing forbidden behaviors gives you the legal authority to immediately terminate offending accounts and protect your platform against abuse, scraping, and reverse-engineering.
                    </p>
                  </div>
                )}

                {activeStep === 5 && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-800">Arbitration vs. Litigation</h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Binding arbitration combined with informal negotiation windows keeps dispute resolution private, expedited, and significantly less expensive than lengthy court litigation.
                    </p>
                  </div>
                )}

                {activeStep === 6 && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-800">TCPA & SMS Compliance</h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      TCPA and cellular carrier guidelines mandate clear disclosures regarding text messaging opt-out commands (e.g. replying STOP), message frequencies, and standard carrier rates.
                    </p>
                  </div>
                )}

                {activeStep === 7 && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-800">
                      {termsStep7SubStep === 1
                        ? "Governing Law & Jurisdiction"
                        : termsStep7SubStep === 4
                        ? "Notification of Material Changes"
                        : "Final Legal Formalities"}
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {termsStep7SubStep === 1
                        ? "Governing law determines which state or country's statutory laws and precedent courts will apply in case of disputes."
                        : termsStep7SubStep === 4
                        ? "Establishing a structured update procedure ensures that revisions to your Terms remain legally enforceable across all existing and new accounts."
                        : "Ensuring full business entity details and an accurate effective date makes your Legal Terms fully binding and enforceable."}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* FULL SCREEN MODAL PREVIEW (Full 13 Sections Document View) */}
      {/* ========================================================= */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-0 duration-200">
          <div className="relative w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-full bg-blue-50 text-[#2563eb] flex items-center justify-center border border-blue-100">
                  <FileText className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {isPrivacy
                      ? policyTitleChoice === "none"
                        ? "Privacy Notice Preview"
                        : policyTitleChoice === "custom" && customPolicyTitle
                        ? customPolicyTitle
                        : policyTitleChoice
                      : isTerms
                      ? termsTitleChoice === "custom" && customTermsTitle
                        ? customTermsTitle
                        : termsTitleChoice
                      : "Cookie Policy Preview"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isPrivacy
                      ? "Complete standardized 13-section legal document preview"
                      : isTerms
                      ? "Complete standardized 21-section legal terms preview"
                      : "Live synchronized cookie consent declaration"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer p-1.5 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* View Mode Switcher */}
            <div className="px-5 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setPreviewModalTab("rendered")}
                  className={cn(
                    "px-3 py-1 font-semibold rounded-md transition-all cursor-pointer",
                    previewModalTab === "rendered"
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Document View
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewModalTab("html")}
                  className={cn(
                    "px-3 py-1 font-semibold rounded-md transition-all cursor-pointer",
                    previewModalTab === "html"
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  HTML Code
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewModalTab("markdown")}
                  className={cn(
                    "px-3 py-1 font-semibold rounded-md transition-all cursor-pointer",
                    previewModalTab === "markdown"
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Markdown
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(generateMarkdown(), "preview_md")}
                  className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  {copiedType === "preview_md" ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5 text-slate-500" />}
                  <span>{copiedType === "preview_md" ? "Copied!" : "Copy"}</span>
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-slate-50/50">
              {previewModalTab === "rendered" && (
                <div className="bg-white border border-slate-200 rounded-xl p-8 sm:p-12 shadow-sm max-w-3xl mx-auto space-y-4 text-xs text-slate-700 leading-relaxed">
                  {generateMarkdown()
                    .replace(/\r\n/g, "\n")
                    .replace(/(^|\n)(#{1,3}\s+[^\n]+)/g, "\n\n$2\n\n")
                    .replace(/(^|\n)(---\s*)/g, "\n\n---\n\n")
                    .split(/\n\s*\n/)
                    .map((section, idx) => {
                      const trimmed = section.trim()
                      if (!trimmed) return null
                      if (trimmed === "---") return <hr key={idx} className="border-t border-slate-200 my-4" />

                      if (trimmed.startsWith("# ")) {
                        return (
                          <div key={idx} className="border-b border-slate-100 pb-3 mb-4">
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{trimmed.replace(/^# /, "")}</h1>
                          </div>
                        )
                      }

                      if (trimmed.startsWith("## ")) {
                        return (
                          <h2 key={idx} className="text-sm font-bold text-slate-900 mt-6 mb-2 tracking-tight">
                            {trimmed.replace(/^## /, "")}
                          </h2>
                        )
                      }

                      if (trimmed.startsWith("### ")) {
                        return (
                          <h3 key={idx} className="text-xs font-semibold text-slate-800 mt-4 mb-1.5">
                            {trimmed.replace(/^### /, "")}
                          </h3>
                        )
                      }

                      if (trimmed.startsWith("- ")) {
                        const items = trimmed.split("\n").map((line) => line.replace(/^- /, "").trim())
                        return (
                          <ul key={idx} className="list-disc pl-5 space-y-1 text-slate-600 text-[13px] font-normal">
                            {items.map((item, i) => (
                              <li
                                key={i}
                                dangerouslySetInnerHTML={{
                                  __html: item
                                    .replace(/\*\*(.*?)\*\*/g, "<strong class='font-semibold text-slate-800'>$1</strong>")
                                    .replace(/\*(.*?)\*/g, "<em class='italic'>$1</em>"),
                                }}
                              />
                            ))}
                          </ul>
                        )
                      }

                      return (
                        <p
                          key={idx}
                          className="text-[13px] text-slate-600 font-normal leading-relaxed mb-2"
                          dangerouslySetInnerHTML={{
                            __html: trimmed
                              .replace(/\*\*(.*?)\*\*/g, "<strong class='font-semibold text-slate-800'>$1</strong>")
                              .replace(/\*(.*?)\*/g, "<em class='italic'>$1</em>")
                              .replace(/\`(.*?)\`/g, "<code class='bg-slate-100 px-1 py-0.5 rounded text-blue-700 text-[11px] font-mono'>$1</code>")
                              .replace(/\[(.*?)\]\((.*?)\)/g, "<a href='$2' class='text-[#2563eb] hover:underline' target='_blank' rel='noopener noreferrer'>$1</a>"),
                          }}
                        />
                      )
                    })}
                </div>
              )}

              {previewModalTab === "html" && (
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-xs font-mono text-emerald-400 overflow-x-auto">
                  <pre className="whitespace-pre-wrap">{generateHtml()}</pre>
                </div>
              )}

              {previewModalTab === "markdown" && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 font-mono text-xs text-slate-800 overflow-x-auto shadow-2xs">
                  <pre className="whitespace-pre-wrap">{generateMarkdown()}</pre>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-emerald-600" />
                <span>13 standard statutory compliance sections</span>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-4 py-1.5 rounded-md bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PUBLISHED SUCCESS MODAL */}
      {/* ========================================================= */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-0 duration-200">
          <div className="relative w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
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

            <div className="px-5 pt-3 border-b border-slate-100 flex items-center gap-2 bg-white text-xs">
              <button
                type="button"
                onClick={() => setPublishModalTab("html")}
                className={cn(
                  "pb-2.5 px-2 border-b-2 font-semibold transition-colors cursor-pointer",
                  publishModalTab === "html"
                    ? "border-[#2563eb] text-[#2563eb]"
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
                    ? "border-[#2563eb] text-[#2563eb]"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                )}
              >
                <span>2. Auto-Updating Script (Growth)</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-[#2563eb] border border-blue-200">
                  PRO
                </span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {publishModalTab === "html" ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600">
                    Copy the standard static HTML code and paste it directly into your website&apos;s <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">{isCookies ? "/cookie-policy" : isPrivacy ? "/privacy" : "/terms"}</code> page:
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

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span>Status: Active & Published in Database</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(publishModalTab === "html" ? generateHtml() : dynamicScriptEmbed, "publish_code")}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
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
