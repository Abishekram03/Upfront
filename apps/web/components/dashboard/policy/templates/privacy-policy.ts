export interface PrivacyPolicyData {
  companyName?: string
  dbaName?: string
  isDba?: boolean
  websiteUrl?: string
  supportEmail?: string
  phone?: string
  country?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  zipCode?: string
  effectiveDate?: string
  platforms?: string[]
  hasUsUsers?: boolean
  hasEuUsers?: boolean
  hasCanadaUsers?: boolean
  directData?: string[]
  sendMarketing?: boolean
  offerAi?: boolean
  trackingTech?: "both" | "cookies" | "maps" | "neither"
  hasDpo?: boolean
  dpoEmail?: string
  extraRegions?: string[]
  policyTitleChoice?: "Privacy Policy" | "Privacy Notice" | "none" | "custom"
  customPolicyTitle?: string
}

export function formatLegalDate(rawDate?: string, langCode?: string): string {
  const localeMap: Record<string, string> = {
    en: "en-US",
    de: "de-DE",
    fr: "fr-FR",
    es: "es-ES",
    pt: "pt-PT",
    it: "it-IT",
    nl: "nl-NL",
    hi: "hi-IN",
    ja: "ja-JP",
  }
  const locale = localeMap[langCode || "en"] || "en-US"
  if (!rawDate) {
    return new Date().toLocaleDateString(locale, { month: "long", day: "numeric", year: "numeric" })
  }
  try {
    const d = new Date(rawDate)
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString(locale, { month: "long", day: "numeric", year: "numeric" })
    }
  } catch {
    // fallback
  }
  return rawDate
}

const PRIVACY_TITLES: Record<string, string> = {
  en: "Privacy Policy",
  de: "Datenschutzerklärung",
  fr: "Politique de Confidentialité",
  es: "Política de Privacidad",
  pt: "Política de Privacidade",
  it: "Informativa sulla Privacy",
  nl: "Privacybeleid",
  hi: "गोपनीयता नीति",
  ja: "プライバシーポリシー",
}

const PRIVACY_SUBTITLES: Record<string, (comp: string, dom: string) => string> = {
  en: (c, d) => `How ${c} handles personal data across the ${d} website and service.`,
  de: (c, d) => `Wie ${c} personenbezogene Daten auf der Website und den Diensten von ${d} verarbeitet.`,
  fr: (c, d) => `Comment ${c} traite les données personnelles sur le site Web et les services ${d}.`,
  es: (c, d) => `Cómo maneja ${c} los datos personales en el sitio web y servicio de ${d}.`,
  pt: (c, d) => `Como a ${c} trata os dados pessoais no site e serviço ${d}.`,
  it: (c, d) => `Come ${c} gestisce i dati personali sul sito web e sui servizi ${d}.`,
  nl: (c, d) => `Hoe ${c} omgaat met persoonsgegevens op de website en diensten van ${d}.`,
  hi: (c, d) => `${c} ${d} वेबसाइट और सेवा पर व्यक्तिगत डेटा का प्रबंधन कैसे करता है।`,
  ja: (c, d) => `${c}が${d}のウェブサイトおよびサービス全体で個人データをどのように取り扱うかについて。`,
}

const LAST_UPDATED_LABELS: Record<string, string> = {
  en: "Last updated",
  de: "Zuletzt aktualisiert",
  fr: "Dernière mise à jour",
  es: "Última actualización",
  pt: "Última atualização",
  it: "Ultimo aggiornamento",
  nl: "Laatst bijgewerkt",
  hi: "अंतिम अद्यतन",
  ja: "最終更新日",
}

export function generatePrivacyPolicyMarkdown(data: PrivacyPolicyData, domain: string, langCode: string = "en"): string {
  const company = data.companyName || domain || "Company"
  const url = data.websiteUrl || `https://${domain || "example.com"}`
  const email = data.supportEmail || `privacy@${domain || "example.com"}`
  const effective = formatLegalDate(data.effectiveDate, langCode)
  const dba = data.isDba && data.dbaName ? ` (doing business as "${data.dbaName}")` : ""
  const serverCountry = data.country || "the United States"
  const langKey = langCode.toLowerCase().split("-")[0] || "en"
  
  const defaultTranslatedTitle = PRIVACY_TITLES[langKey] || "Privacy Policy"
  const rawTitle = data.policyTitleChoice === "custom" && data.customPolicyTitle
    ? data.customPolicyTitle
    : defaultTranslatedTitle
  const sanitizedTitle = (rawTitle.toLowerCase().includes("terms") || !rawTitle)
    ? defaultTranslatedTitle
    : rawTitle

  const title =
    data.policyTitleChoice === "none"
      ? ""
      : `# ${sanitizedTitle}\n\n`

  const directList = data.directData && data.directData.length > 0
    ? data.directData.map((d) => `- ${d}`).join("\n")
    : "- Names\n- Phone numbers\n- Email addresses\n- Mailing addresses\n- Usernames\n- Billing addresses"

  let contactLines = `**${company}**${dba}`
  if (data.addressLine1) contactLines += `\n${data.addressLine1}`
  if (data.addressLine2) contactLines += `\n${data.addressLine2}`
  if (data.city || data.zipCode || data.country) {
    const locParts = [data.city, data.zipCode, data.country].filter(Boolean)
    contactLines += `\n${locParts.join(", ")}`
  }
  contactLines += `\nEmail: ${email}`
  if (data.phone) contactLines += `\nPhone: ${data.phone}`

  return `${title}*Last updated: ${effective}*

This Privacy Notice for **${company}**${dba} ("we," "us," or "our"), describes how and why we might access, collect, store, use, and/or share ("process") your personal information when you use our services ("Services"), including when you:
- Visit our website at [${url}](${url}), or any website of ours that links to this Privacy Notice
${data.platforms?.includes("Mobile application") ? `- Download and use our mobile application, or any other application of ours that links to this Privacy Notice\n` : ""}${data.platforms?.includes("Facebook application") ? `- Use our Facebook application, or any other social application of ours that links to this Privacy Notice\n` : ""}- Engage with us in other related ways, including any sales, marketing, or events

**Questions or concerns?** Reading this Privacy Notice will help you understand your privacy rights and choices. We are responsible for making decisions about how your personal information is processed. If you do not agree with our policies and practices, please do not use our Services. If you still have any questions or concerns, please contact us at ${email}.

### Summary of Key Points

***This summary provides key points from our Privacy Notice, but you can find out more details about any of these topics by reviewing each section below.***

**What personal information do we process?** When you visit, use, or navigate our Services, we may process personal information depending on how you interact with us and the Services, the choices you make, and the products and features you use.

**Do we process any sensitive personal information?** Some of the information may be considered "special" or "sensitive" in certain jurisdictions. We do not process sensitive personal information unless required for legitimate business operations or with your explicit consent.

**Do we collect any information from third parties?** We may collect information from public databases, marketing partners, and other outside sources where permitted by law.

**How do we process your information?** We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent.

**In what situations and with which parties do we share personal information?** We may share information in specific situations and with specific third parties as detailed in this notice.

**What are your rights?** Depending on where you are located geographically, the applicable privacy law may mean you have certain rights regarding your personal information.

**How do you exercise your rights?** The easiest way to exercise your rights is by submitting a data subject access request, or by contacting us directly at ${email}. We will consider and act upon any request in accordance with applicable data protection laws.

### Table of Contents

1. What Information Do We Collect?
2. How Do We Process Your Information?
3. When and With Whom Do We Share Your Personal Information?
4. Do We Use Cookies and Other Tracking Technologies?
5. How Do We Handle Your Social Logins?
6. Is Your Information Transferred Internationally?
7. How Long Do We Keep Your Information?
8. Do We Collect Information from Minors?
9. What Are Your Privacy Rights?
10. Controls for Do-Not-Track Features
11. Do United States Residents Have Specific Privacy Rights?
12. Do We Make Updates to This Notice?
13. How Can You Contact Us About This Notice?
14. How Can You Review, Update, or Delete the Data We Collect from You?

## 1. What Information Do We Collect?

### Personal information you disclose to us

**In Short:** *We collect personal information that you provide to us.*

We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.

**Personal Information Provided by You.** The personal information that we collect depends on the context of your interactions with us and the Services, the choices you make, and the products and features you use. The personal information we collect may include the following:
${directList}

**Sensitive Information.** We do not process sensitive personal information without your explicit consent or lawful basis.

All personal information that you provide to us must be true, complete, and accurate, and you must notify us of any changes to such personal information.

### Information automatically collected

**In Short:** *Some information — such as your Internet Protocol (IP) address and/or browser and device characteristics — is collected automatically when you visit our Services.*

We automatically collect certain information when you visit, use, or navigate the Services. This information does not reveal your specific identity (like your name or contact information) but may include device and usage information, such as your IP address, browser and device characteristics, operating system, language preferences, referring URLs, device name, country, location, information about how and when you use our Services, and other technical information. This information is primarily needed to maintain the security and operation of our Services, and for our internal analytics and reporting purposes.

## 2. How Do We Process Your Information?

**In Short:** *We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law.*

We process your personal information for a variety of reasons, depending on how you interact with our Services, including:
- **To facilitate account creation and authentication and otherwise manage user accounts.** We may process your information so you can create and log in to your account, as well as keep your account in working order.
- **To deliver and facilitate delivery of services to the user.** We may process your information to provide you with the requested service.
- **To respond to user inquiries/offer support to users.** We may process your information to respond to your inquiries and solve any potential issues you might have with the requested service.
${data.sendMarketing !== false ? `- **To send you marketing and promotional communications.** We may process the personal information you send to us for our marketing purposes, if this is in accordance with your marketing preferences. You can opt out of our marketing emails at any time.\n` : ""}${data.offerAi ? `- **To provide and improve AI-based services and features.** We may process your information to deliver automated insights and power machine learning capabilities.\n` : ""}- **To protect our Services.** We may process your information as part of our efforts to keep our Services safe and secure, including fraud monitoring and prevention.
- **To comply with our legal obligations.** We may process your information to comply with our legal obligations, respond to legal requests, and exercise, establish, or defend our legal rights.

## 3. When and With Whom Do We Share Your Personal Information?

**In Short:** *We may share information in specific situations described in this section and/or with the following third parties.*

We may need to share your personal information in the following situations:
- **Business Transfers.** We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.
- **Affiliates.** We may share your information with our affiliates, in which case we will require those affiliates to honor this Privacy Notice. Affiliates include our parent company and any subsidiaries, joint venture partners, or other companies that we control or that are under common control with us.
- **Business Partners.** We may share your information with our business partners to offer you certain products, services, or promotions.

## 4. Do We Use Cookies and Other Tracking Technologies?

**In Short:** *We may use cookies and other tracking technologies to collect and store your information.*

We may use cookies and similar tracking technologies (like web beacons and pixels) to gather information when you interact with our Services. Some online tracking technologies help us maintain the security of our Services, prevent crashes, fix bugs, save your preferences, and assist with basic site functions.

We also permit third parties and service providers to use online tracking technologies on our Services for analytics and advertising, including to help manage and display advertisements or to tailor advertisements to your interests. The third parties and service providers use their technology to provide advertising about products and services tailored to your interests which may appear either on our Services or on other websites.
${data.trackingTech === "maps" || data.trackingTech === "both" ? `\nWe also use Google Maps Platform APIs to provide location-based services and features.\n` : ""}
Specific information about how we use such technologies and how you can refuse certain cookies is set out in our Cookie Notice.

## 5. How Do We Handle Your Social Logins?

**In Short:** *If you choose to register or log in to our Services using a social media account, we may have access to certain information about you.*

Our Services offer you the ability to register and log in using your third-party social media account details (like your Facebook or X logins). Where you choose to do this, we will receive certain profile information about you from your social media provider. The profile information we receive may vary depending on the social media provider concerned, but will often include your name, email address, friends list, and profile picture, as well as other information you choose to make public on such a social media platform.

We will use the information we receive only for the purposes that are described in this Privacy Notice or that are otherwise made clear to you on the relevant Services. Please note that we do not control, and are not responsible for, other uses of your personal information by your third-party social media provider. We recommend that you review their privacy notice to understand how they collect, use, and share your personal information, and how you can set your privacy preferences on their sites and apps.

## 6. Is Your Information Transferred Internationally?

**In Short:** *We may transfer, store, and process your information in countries other than your own.*

Our servers are located in ${serverCountry}. If you are accessing our Services from outside, please be aware that your information may be transferred to, stored, and processed by us in our facilities and by those third parties with whom we may share your personal information, in and other countries.

If you are a resident in the European Economic Area (EEA), United Kingdom (UK), or Switzerland, then these countries may not necessarily have data protection laws or other similar laws as comprehensive as those in your country. However, we will take all necessary measures to protect your personal information in accordance with this Privacy Notice and applicable law.

## 7. How Long Do We Keep Your Information?

**In Short:** *We keep your information for as long as necessary to fulfill the purposes outlined in this Privacy Notice unless otherwise required by law.*

We will only keep your personal information for as long as it is necessary for the purposes set out in this Privacy Notice, unless a longer retention period is required or permitted by law (such as tax, accounting, or other legal requirements).

When we have no ongoing legitimate business need to process your personal information, we will either delete or anonymize such information, or, if this is not possible (for example, because your personal information has been stored in backup archives), then we will securely store your personal information and isolate it from any further processing until deletion is possible.

## 8. Do We Collect Information from Minors?

**In Short:** *We do not knowingly collect data from or market to children under 18 years of age.*

We do not knowingly collect, solicit data from, or market to children under 18 years of age. By using the Services, you represent that you are at least 18 or that you are the parent or guardian of such a minor and consent to such minor dependent’s use of the Services. If we learn that personal information from users less than 18 years of age has been collected, we will deactivate the account and take reasonable measures to promptly delete such data from our records.

## 9. What Are Your Privacy Rights?

**In Short:** *Depending on your state of residence in the US or in some regions, such as the European Economic Area (EEA), United Kingdom (UK), and Switzerland, you have rights that allow you greater access to and control over your personal information.*

In some regions (like the EEA, UK, and Switzerland), you have certain rights under applicable data protection laws. These may include the right (i) to request access and obtain a copy of your personal information, (ii) to request rectification or erasure; (iii) to restrict the processing of your personal information; (iv) if applicable, to data portability; and (v) not to be subject to automated decision-making. In certain circumstances, you may also have the right to object to the processing of your personal information.

You can make such a request by contacting us by using the contact details provided in the section "How Can You Contact Us About This Notice?" below.

**Withdrawing your consent:** If we are relying on your consent to process your personal information, you have the right to withdraw your consent at any time. You can withdraw your consent at any time by contacting us by using the contact details provided in the section "How Can You Contact Us About This Notice?" below.

**Opting out of marketing and promotional communications:** You can unsubscribe from our marketing and promotional communications at any time by clicking on the unsubscribe link in the emails that we send, or by contacting us.

## 10. Controls for Do-Not-Track Features

Most web browsers and some mobile operating systems and mobile applications include a Do-Not-Track ("DNT") feature or setting you can activate to signal your privacy preference not to have data about your online browsing activities monitored and collected. At this stage, no uniform technology standard for recognizing and implementing DNT signals has been finalized. As such, we do not currently respond to DNT browser signals or any other mechanism that automatically communicates your choice not to be tracked online. If a standard for online tracking is adopted that we must follow in the future, we will inform you about that practice in a revised version of this Privacy Notice.

## 11. Do United States Residents Have Specific Privacy Rights?

**In Short:** *If you are a resident of California, Colorado, Connecticut, Utah, or Virginia, you are granted specific rights regarding access to your personal information.*

Under state privacy laws such as the California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA), residents have the right to:
- Request to know what personal information is collected, disclosed, or sold.
- Request deletion of personal information.
- Request correction of inaccurate personal information.
- Opt out of the sale or sharing of personal information for cross-context behavioral advertising.
- Not be discriminated against for exercising privacy rights.

To exercise these rights, please submit a request by contacting us at ${email}.

## 12. Do We Make Updates to This Notice?

**In Short:** *Yes, we will update this notice as necessary to stay compliant with relevant laws.*

We may update this Privacy Notice from time to time. The updated version will be indicated by an updated "Revised" date and the updated version will be effective as soon as it is accessible. If we make material changes to this Privacy Notice, we may notify you either by prominently posting a notice of such changes or by directly sending you a notification. We encourage you to review this Privacy Notice frequently to be informed of how we are protecting your information.

## 13. How Can You Contact Us About This Notice?

If you have questions or comments about this notice, you may contact us by post at:

${contactLines}

## 14. How Can You Review, Update, or Delete the Data We Collect from You?

Based on the applicable laws of your country, you may have the right to request access to the personal information we collect from you, details about how we have processed it, correct inaccuracies, or delete your personal information. You may also have the right to withdraw your consent to our processing of your personal information. These rights may be limited in some circumstances by applicable law. To request to review, update, or delete your personal information, please fill out and submit a data subject access request.
`
}

export function generatePrivacyPolicyHtml(data: PrivacyPolicyData, domain: string, langCode: string = "en"): string {
  const md = generatePrivacyPolicyMarkdown(data, domain, langCode)
  const langKey = langCode.toLowerCase().split("-")[0] || "en"
  const defaultTranslatedTitle = PRIVACY_TITLES[langKey] || "Privacy Policy"
  const rawTitle = data.policyTitleChoice === "custom" && data.customPolicyTitle
    ? data.customPolicyTitle
    : defaultTranslatedTitle
  const sanitizedTitle = (rawTitle.toLowerCase().includes("terms") || !rawTitle)
    ? defaultTranslatedTitle
    : rawTitle
  const title = data.policyTitleChoice === "none" ? defaultTranslatedTitle : sanitizedTitle
  const effective = formatLegalDate(data.effectiveDate, langCode)
  const updatedLabel = LAST_UPDATED_LABELS[langKey] || "Last updated"
  
  const normalized = md
    .replace(/\r\n/g, "\n")
    .replace(/(^|\n)(#{1,3}\s+[^\n]+)/g, "\n\n$2\n\n")

  const rawSections = normalized.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean)
  let startIdx = 0

  if (rawSections[0]?.startsWith("# ")) {
    startIdx = 1
    if (
      rawSections[1]?.startsWith("*Last updated") ||
      rawSections[1]?.startsWith("**Last updated") ||
      rawSections[1]?.toLowerCase().startsWith("last updated")
    ) {
      startIdx = 2
    }
  }

  const company = data.companyName || domain
  const subtitleGenerator = PRIVACY_SUBTITLES[langKey] || PRIVACY_SUBTITLES.en || ((c: string, d: string) => `How ${c} handles personal data across the ${d} website and service.`)
  const subtitle = subtitleGenerator(company, domain)

  return `<!DOCTYPE html>
<html lang="${langKey}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} - ${domain}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

    *, *::before, *::after { box-sizing: border-box; }
    
    body, .legal-page-container {
      font-family: 'Poppins', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-weight: 400;
      line-height: 1.7;
      color: #475569;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .legal-hero {
      position: relative;
      overflow: hidden;
      border-bottom: 1px solid #e2e8f0;
      background-color: #f8fafc;
      padding: 64px 24px 56px 24px;
      text-align: center;
      margin-bottom: 40px;
    }

    .legal-hero-grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(to right, rgba(15, 23, 42, 0.05) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(15, 23, 42, 0.05) 1px, transparent 1px);
      background-size: 44px 44px;
      mask-image: radial-gradient(ellipse 80% 70% at 50% 0%, black 55%, transparent 100%);
      -webkit-mask-image: radial-gradient(ellipse 80% 70% at 50% 0%, black 55%, transparent 100%);
      pointer-events: none;
    }

    .legal-hero-content {
      position: relative;
      max-width: 640px;
      margin: 0 auto;
    }

    .legal-eyebrow {
      font-size: 13.5px;
      font-weight: 500;
      color: #1868db;
      margin: 0 0 10px 0;
      letter-spacing: 0.02em;
    }

    .legal-hero-title {
      font-size: 38px;
      font-weight: 500;
      color: #0f172a;
      margin: 0 0 14px 0;
      letter-spacing: -0.02em;
      line-height: 1.25;
    }

    @media (max-width: 640px) {
      .legal-hero-title { font-size: 28px; }
      .legal-hero { padding: 48px 16px 40px 16px; }
    }

    .legal-subtitle {
      font-size: 15.5px;
      color: #64748b;
      margin: 0 auto;
      line-height: 1.6;
      max-width: 580px;
    }

    .legal-body {
      max-width: 768px;
      margin: 0 auto;
      padding: 0 24px 64px 24px;
    }

    .legal-last-updated {
      font-size: 13.5px;
      color: #64748b;
      margin-bottom: 32px;
    }

    h1, .legal-h1 {
      font-size: 24px;
      font-weight: 600;
      color: #0f172a;
      margin: 36px 0 14px 0;
      letter-spacing: -0.01em;
    }

    h2, .legal-h2 {
      font-size: 20px;
      font-weight: 500;
      color: #0f172a;
      margin: 36px 0 14px 0;
      letter-spacing: -0.01em;
    }

    h3, .legal-h3 {
      font-size: 16px;
      font-weight: 600;
      color: #0f172a;
      margin: 24px 0 10px 0;
    }

    p, li {
      font-size: 15px;
      font-weight: 400;
      color: #475569;
      margin: 0 0 16px 0;
      line-height: 1.7;
    }

    ul, ol {
      padding-left: 24px;
      margin: 0 0 20px 0;
    }

    li {
      margin-bottom: 8px;
    }

    strong {
      font-weight: 600;
      color: #0f172a;
    }

    code {
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 13px;
      color: #1868db;
      font-family: monospace;
      border: 1px solid #e2e8f0;
    }

    a {
      color: #1868db;
      text-decoration: none;
      font-weight: 500;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="legal-page-container">
    <div class="legal-hero">
      <div class="legal-hero-grid" aria-hidden="true"></div>
      <div class="legal-hero-content">
        <p class="legal-eyebrow">Legal</p>
        <h1 class="legal-hero-title">${title}</h1>
        <p class="legal-subtitle">${subtitle}</p>
      </div>
    </div>

    <div class="legal-body">
      <div class="legal-last-updated">Last updated: ${effective}</div>

      ${rawSections
        .slice(startIdx)
        .map((chunk) => {
          const trimmed = chunk.trim()
          if (!trimmed || trimmed === "---") return ""
          if (trimmed.startsWith("# ")) return `<h1>${trimmed.replace("# ", "")}</h1>`
          if (trimmed.startsWith("## ")) return `<h2>${trimmed.replace("## ", "")}</h2>`
          if (trimmed.startsWith("### ")) return `<h3>${trimmed.replace("### ", "")}</h3>`
          if (trimmed.startsWith("- ")) {
            const items = trimmed
              .split("\n")
              .map((line) => `<li>${line.replace(/^- \*\*(.*?)\*\*/, "<strong>$1</strong>").replace(/^- /, "")}</li>`)
              .join("")
            return `<ul>${items}</ul>`
          }
          return `<p>${trimmed.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>").replace(/\`(.*?)\`/g, "<code>$1</code>")}</p>`
        })
        .filter(Boolean)
        .join("\n      ")}
    </div>
  </div>
</body>
</html>`
}
