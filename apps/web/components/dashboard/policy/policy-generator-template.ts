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

export function generatePrivacyPolicyMarkdown(data: PrivacyPolicyData, domain: string): string {
  const company = data.companyName || domain || "Company"
  const url = data.websiteUrl || `https://${domain || "example.com"}`
  const email = data.supportEmail || `privacy@${domain || "example.com"}`
  const effective = data.effectiveDate || new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })
  const dba = data.isDba && data.dbaName ? ` (doing business as "${data.dbaName}")` : ""
  const serverCountry = data.country || "the United States"
  
  const title =
    data.policyTitleChoice === "none"
      ? ""
      : `# ${data.policyTitleChoice === "custom" && data.customPolicyTitle ? data.customPolicyTitle : (data.policyTitleChoice || "PRIVACY NOTICE")}\n\n`

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

  return `${title}**Last updated ${effective}**

This Privacy Notice for **${company}**${dba} ("we," "us," or "our"), describes how and why we might access, collect, store, use, and/or share ("process") your personal information when you use our services ("Services"), including when you:
- Visit our website at [${url}](${url}), or any website of ours that links to this Privacy Notice
${data.platforms?.includes("Mobile application") ? `- Download and use our mobile application, or any other application of ours that links to this Privacy Notice\n` : ""}${data.platforms?.includes("Facebook application") ? `- Use our Facebook application, or any other social application of ours that links to this Privacy Notice\n` : ""}- Engage with us in other related ways, including any sales, marketing, or events

**Questions or concerns?** Reading this Privacy Notice will help you understand your privacy rights and choices. We are responsible for making decisions about how your personal information is processed. If you do not agree with our policies and practices, please do not use our Services.

## SUMMARY OF KEY POINTS

This summary provides key points from our Privacy Notice, but you can find out more details about any of these topics by clicking the link following each key point or by using our table of contents below to find the section you are looking for.

**What personal information do we process?** When you visit, use, or navigate our Services, we may process personal information depending on how you interact with us and the Services, the choices you make, and the products and features you use. Learn more about personal information you disclose to us.

**Do we process any sensitive personal information?** Some of the information may be considered "special" or "sensitive" in certain jurisdictions, for example your racial or ethnic origins, sexual orientation, and religious beliefs. We do not process sensitive personal information.

**Do we collect any information from third parties?** We may collect information from public databases, marketing partners, social media platforms, and other outside sources. Learn more about information collected from other sources.

**How do we process your information?** We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent. We process your information only when we have a valid legal reason to do so. Learn more about how we process your information.

**In what situations and with which parties do we share personal information?** We may share information in specific situations and with specific third parties. Learn more about when and with whom we share your personal information.

**What are your rights?** Depending on where you are located geographically, the applicable privacy law may mean you have certain rights regarding your personal information. Learn more about your privacy rights.

**How do you exercise your rights?** The easiest way to exercise your rights is by submitting a data subject access request, or by contacting us. We will consider and act upon any request in accordance with applicable data protection laws.

Want to learn more about what we do with any information we collect? Review the Privacy Notice in full.

---

## TABLE OF CONTENTS

1. WHAT INFORMATION DO WE COLLECT?
2. HOW DO WE PROCESS YOUR INFORMATION?
3. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?
4. DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?
5. HOW DO WE HANDLE YOUR SOCIAL LOGINS?
6. IS YOUR INFORMATION TRANSFERRED INTERNATIONALLY?
7. HOW LONG DO WE KEEP YOUR INFORMATION?
8. DO WE COLLECT INFORMATION FROM MINORS?
9. WHAT ARE YOUR PRIVACY RIGHTS?
10. CONTROLS FOR DO-NOT-TRACK FEATURES
11. DO WE MAKE UPDATES TO THIS NOTICE?
12. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?
13. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?

---

## 1. WHAT INFORMATION DO WE COLLECT?

### Personal information you disclose to us

**In Short:** *We collect personal information that you provide to us.*

We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.

**Personal Information Provided by You.** The personal information that we collect depends on the context of your interactions with us and the Services, the choices you make, and the products and features you use. The personal information we collect may include the following:
${directList}

**Sensitive Information.** We do not process sensitive personal information.

All personal information that you provide to us must be true, complete, and accurate, and you must notify us of any changes to such personal information.

### Information automatically collected

**In Short:** *Some information — such as your Internet Protocol (IP) address and/or browser and device characteristics — is collected automatically when you visit our Services.*

We automatically collect certain information when you visit, use, or navigate the Services. This information does not reveal your specific identity (like your name or contact information) but may include device and usage information, such as your IP address, browser and device characteristics, operating system, language preferences, referring URLs, device name, country, location, information about how and when you use our Services, and other technical information. This information is primarily needed to maintain the security and operation of our Services, and for our internal analytics and reporting purposes.

Like many businesses, we also collect information through cookies and similar technologies.

---

## 2. HOW DO WE PROCESS YOUR INFORMATION?

**In Short:** *We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent.*

We process your personal information for a variety of reasons, depending on how you interact with our Services, including:
- **To facilitate account creation and authentication and otherwise manage user accounts.** We may process your information so you can create and log in to your account, as well as keep your account in working order.
- **To deliver and facilitate delivery of services to the user.** We may process your information to provide you with the requested service.
- **To respond to user inquiries/offer support to users.** We may process your information to respond to your inquiries and solve any potential issues you might have with the requested service.
- **To send administrative information to you.** We may process your information to send you details about our products and services, changes to our terms and policies, and other similar information.
- **To fulfill and manage your orders.** We may process your information to fulfill and manage your orders, payments, and exchanges made through the Services.
- **To request feedback.** We may process your information when necessary to request feedback and to contact you about your use of our Services.
${data.sendMarketing !== false ? `- **To send you marketing and promotional communications.** We may process the personal information you send to us for our marketing purposes, if this is in accordance with your marketing preferences. You can opt out of our marketing emails at any time.\n` : ""}${data.offerAi ? `- **To provide and improve AI-based services and features.** We may process your information to deliver automated insights and power machine learning capabilities.\n` : ""}- **To protect our Services.** We may process your information as part of our efforts to keep our Services safe and secure, including fraud monitoring and prevention.
- **To comply with our legal obligations.** We may process your information to comply with our legal obligations, respond to legal requests, and exercise, establish, or defend our legal rights.

---

## 3. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?

**In Short:** *We may share information in specific situations described in this section and/or with the following third parties.*

We may need to share your personal information in the following situations:
- **Business Transfers.** We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.
- **Affiliates.** We may share your information with our affiliates, in which case we will require those affiliates to honor this Privacy Notice. Affiliates include our parent company and any subsidiaries, joint venture partners, or other companies that we control or that are under common control with us.
- **Business Partners.** We may share your information with our business partners to offer you certain products, services, or promotions.

---

## 4. DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?

**In Short:** *We may use cookies and other tracking technologies to collect and store your information.*

We may use cookies and similar tracking technologies (like web beacons and pixels) to gather information when you interact with our Services. Some online tracking technologies help us maintain the security of our Services, prevent crashes, fix bugs, save your preferences, and assist with basic site functions.

We also permit third parties and service providers to use online tracking technologies on our Services for analytics and advertising, including to help manage and display advertisements or to tailor advertisements to your interests. The third parties and service providers use their technology to provide advertising about products and services tailored to your interests which may appear either on our Services or on other websites.
${data.trackingTech === "maps" || data.trackingTech === "both" ? `\nWe also use Google Maps Platform APIs to provide location-based services and features.\n` : ""}
Specific information about how we use such technologies and how you can refuse certain cookies is set out in our Cookie Notice.

---

## 5. HOW DO WE HANDLE YOUR SOCIAL LOGINS?

**In Short:** *If you choose to register or log in to our Services using a social media account, we may have access to certain information about you.*

Our Services offer you the ability to register and log in using your third-party social media account details (like your Facebook or X logins). Where you choose to do this, we will receive certain profile information about you from your social media provider. The profile information we receive may vary depending on the social media provider concerned, but will often include your name, email address, friends list, and profile picture, as well as other information you choose to make public on such a social media platform.

We will use the information we receive only for the purposes that are described in this Privacy Notice or that are otherwise made clear to you on the relevant Services. Please note that we do not control, and are not responsible for, other uses of your personal information by your third-party social media provider. We recommend that you review their privacy notice to understand how they collect, use, and share your personal information, and how you can set your privacy preferences on their sites and apps.

---

## 6. IS YOUR INFORMATION TRANSFERRED INTERNATIONALLY?

**In Short:** *We may transfer, store, and process your information in countries other than your own.*

Our servers are located in ${serverCountry}. Regardless of your location, please be aware that your information may be transferred to, stored by, and processed by us in our facilities and in the facilities of the third parties with whom we may share your personal information (see "WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?" above), including facilities in ${serverCountry} and other countries.

${data.hasEuUsers !== false ? `If you are a resident in the European Economic Area (EEA), United Kingdom (UK), or Switzerland, then these countries may not necessarily have data protection laws or other similar laws as comprehensive as those in your country. However, we will take all necessary measures to protect your personal information in accordance with this Privacy Notice and applicable law.\n` : ""}
---

## 7. HOW LONG DO WE KEEP YOUR INFORMATION?

**In Short:** *We keep your information for as long as necessary to fulfill the purposes outlined in this Privacy Notice unless otherwise required by law.*

We will only keep your personal information for as long as it is necessary for the purposes set out in this Privacy Notice, unless a longer retention period is required or permitted by law (such as tax, accounting, or other legal requirements).

When we have no ongoing legitimate business need to process your personal information, we will either delete or anonymize such information, or, if this is not possible (for example, because your personal information has been stored in backup archives), then we will securely store your personal information and isolate it from any further processing until deletion is possible.

---

## 8. DO WE COLLECT INFORMATION FROM MINORS?

**In Short:** *We do not knowingly collect data from or market to children under 18 years of age.*

We do not knowingly collect, solicit data from, or market to children under 18 years of age, nor do we knowingly sell such personal information. By using the Services, you represent that you are at least 18 or that you are the parent or guardian of such a minor and consent to such minor dependent’s use of the Services. If we learn that personal information from users less than 18 years of age has been collected, we will deactivate the account and take reasonable measures to promptly delete such data from our records. If you become aware of any data we may have collected from children under age 18, please contact us at **${email}**.

---

## 9. WHAT ARE YOUR PRIVACY RIGHTS?

**In Short:** *You may review, change, or terminate your account at any time, depending on your country, province, or state of residence.*

**Withdrawing your consent:** If we are relying on your consent to process your personal information, which may be express and/or implied consent depending on the applicable law, you have the right to withdraw your consent at any time. You can withdraw your consent at any time by contacting us by using the contact details provided in the section "HOW CAN YOU CONTACT US ABOUT THIS NOTICE?" below.

However, please note that this will not affect the lawfulness of the processing before its withdrawal nor, when applicable law allows, will it affect the processing of your personal information conducted in reliance on lawful processing grounds other than consent.

${data.hasDpo ? `**Data Protection Officer:** We have appointed a Data Protection Officer (DPO) to oversee compliance. You may contact our DPO at **${data.dpoEmail || email}**.\n\n` : ""}### Account Information

If you would at any time like to review or change the information in your account or terminate your account, you can:
- Log in to your account settings and update your user account.
- Contact us using the contact information provided.

Upon your request to terminate your account, we will deactivate or delete your account and information from our active databases. However, we may retain some information in our files to prevent fraud, troubleshoot problems, assist with any investigations, enforce our legal terms and/or comply with applicable legal requirements.

${data.extraRegions && data.extraRegions.length > 0 ? `### Additional Regional Disclosures\n\n${data.extraRegions.map((r) => `- **${r}:** We adhere to statutory data protection principles and user access rights under ${r}.`).join("\n")}\n` : ""}
---

## 10. CONTROLS FOR DO-NOT-TRACK FEATURES

Most web browsers and some mobile operating systems and mobile applications include a Do-Not-Track ("DNT") feature or setting you can activate to signal your privacy preference not to have data about your online browsing activities monitored and collected. At this stage, no uniform technology standard for recognizing and implementing DNT signals has been finalized. As such, we do not currently respond to DNT browser signals or any other mechanism that automatically communicates your choice not to be tracked online. If a standard for online tracking is adopted that we must follow in the future, we will inform you about that practice in a revised version of this Privacy Notice.

---

## 11. DO WE MAKE UPDATES TO THIS NOTICE?

**In Short:** *Yes, we will update this notice as necessary to stay compliant with relevant laws.*

We may update this Privacy Notice from time to time. The updated version will be indicated by an updated "Revised" date at the top of this Privacy Notice. If we make material changes to this Privacy Notice, we may notify you either by prominently posting a notice of such changes or by directly sending you a notification. We encourage you to review this Privacy Notice frequently to be informed of how we are protecting your information.

---

## 12. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?

If you have questions or comments about this notice, you may contact us by post at:

${contactLines}

---

## 13. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?

Based on the applicable laws of your country, you may have the right to request access to the personal information we collect from you, details about how we have processed it, correct inaccuracies, or delete your personal information. You may also have the right to withdraw your consent to our processing of your personal information. These rights may be limited in some circumstances by applicable law. To request to review, update, or delete your personal information, please fill out and submit a data subject access request.
`
}

export function generatePrivacyPolicyHtml(data: PrivacyPolicyData, domain: string): string {
  const md = generatePrivacyPolicyMarkdown(data, domain)
  const title = data.policyTitleChoice === "none" ? "Privacy Notice" : (data.policyTitleChoice || "Privacy Policy")
  
  const normalized = md
    .replace(/\r\n/g, "\n")
    .replace(/(^|\n)(#{1,3}\s+[^\n]+)/g, "\n\n$2\n\n")
    .replace(/(^|\n)(---\s*)/g, "\n\n---\n\n")

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title} - ${domain}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-weight: 400; line-height: 1.65; color: #475569; max-width: 820px; margin: 0 auto; padding: 32px 16px; -webkit-font-smoothing: antialiased; }
    h1 { font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 12px; letter-spacing: -0.01em; }
    h2 { font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 24px; margin-bottom: 8px; letter-spacing: -0.01em; }
    h3 { font-size: 13px; font-weight: 600; color: #1e293b; margin-top: 16px; margin-bottom: 6px; }
    p, li { font-size: 13px; font-weight: 400; color: #475569; margin-bottom: 10px; line-height: 1.65; }
    ul { padding-left: 20px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px; font-weight: 400; }
    th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
    th { background: #f8fafc; font-weight: 600; color: #0f172a; }
    hr { border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0; }
    strong { font-weight: 600; color: #0f172a; }
  </style>
</head>
<body>
  ${normalized
    .split(/\n\s*\n/)
    .map((chunk) => {
      const trimmed = chunk.trim()
      if (!trimmed) return ""
      if (trimmed === "---") return `<hr />`
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
    .join("\n  ")}
</body>
</html>`
}


