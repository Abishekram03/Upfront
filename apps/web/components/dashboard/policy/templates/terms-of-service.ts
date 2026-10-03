export interface TermsOfServiceData {
  companyName?: string
  isDba?: boolean
  dbaName?: string
  websiteUrl?: string
  isWebsite?: boolean
  isMobileApp?: boolean
  platformType?: "ecommerce" | "saas" | "other"
  otherPlatformType?: string
  hostingCountry?: string
  hostedOtherCountries?: boolean
  otherHostingCountries?: string[]
  hasSubscription?: boolean
  subscriptionAutoRenew?: boolean
  renewalFrequency?: "monthly" | "annually" | "customer_chooses" | "custom"
  customRenewalFrequency?: string
  prohibitCommercialAds?: boolean
  prohibitTransferProfile?: boolean
  customProhibitedActivities?: string[]
  disputeResolution?: "litigation" | "arbitration" | "informal_then_arbitration"
  disputeCountry?: string
  disputeState?: string
  mediationDays?: number
  sendSms?: boolean
  smsProgramName?: string
  smsMessageTypes?: string
  smsOptOut?: "stop" | "other"
  customSmsOptOut?: string
  specifySmsFrequency?: boolean
  smsFrequencyDetails?: string
  governingCountry?: string
  governingState?: string
  contactEmail?: string
  contactPhone?: string
  contactFax?: string
  country?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  zipCode?: string
  hasRegisteredAddress?: boolean
  registeredCountry?: string
  registeredAddressLine1?: string
  registeredAddressLine2?: string
  registeredCity?: string
  registeredZipCode?: string
  notifyUpdates?: boolean
  updateNotificationMethod?: "email" | "before_effective" | "other"
  updateNotificationEmail?: string
  updateNotificationDaysAdvance?: number
  updateImmediateTriggers?: string[]
  customUpdateDetails?: string
  policyTitleChoice?: "Terms of Use" | "Terms of Service" | "Terms and Conditions" | "custom"
  customPolicyTitle?: string
  effectiveDate?: string
}

export function generateTermsOfServiceMarkdown(data: TermsOfServiceData, domain: string): string {
  const company = data.companyName || domain || "Company"
  const url = data.websiteUrl || `https://${domain || "example.com"}`
  const email = data.contactEmail || `contact@${domain || "example.com"}`
  const effective = data.effectiveDate || new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })
  const dba = data.isDba && data.dbaName ? `, doing business as "${data.dbaName}"` : ""
  const governing = data.governingCountry || data.country || "the United States"
  const disputePlace = data.disputeCountry || governing
  const mediationDays = data.mediationDays || 30
  
  const title = data.policyTitleChoice === "custom" && data.customPolicyTitle 
    ? data.customPolicyTitle 
    : (data.policyTitleChoice || "TERMS OF USE").toUpperCase()

  const addressString = [data.addressLine1, data.addressLine2, data.city, data.zipCode, data.country].filter(Boolean).join(", ") || governing

  let contactLines = `**${company}**${dba ? ` (${data.dbaName})` : ""}`
  if (data.addressLine1) contactLines += `\n${data.addressLine1}`
  if (data.addressLine2) contactLines += `\n${data.addressLine2}`
  if (data.city || data.zipCode || data.country) {
    const loc = [data.city, data.zipCode, data.country].filter(Boolean).join(", ")
    contactLines += `\n${loc}`
  }
  contactLines += `\nEmail: ${email}`
  if (data.contactPhone) contactLines += `\nPhone: ${data.contactPhone}`
  if (data.contactFax) contactLines += `\nFax: ${data.contactFax}`

  // Custom prohibited items
  const customProhibitions = data.customProhibitedActivities && data.customProhibitedActivities.length > 0
    ? data.customProhibitedActivities.map((act) => `- ${act}`).join("\n") + "\n"
    : ""

  return `# ${title}

**Last updated ${effective}**

---

### AGREEMENT TO OUR LEGAL TERMS

We are **${company}**${dba} ("Company," "we," "us," "our"), a company registered in ${data.country || governing} at ${addressString}.

We operate [${url}](${url})${data.isMobileApp ? ", our mobile application," : ""}, as well as any other related products and services that refer or link to these legal terms (the "Legal Terms") (collectively, the "Services").

You can contact us by email at ${email} or by mail to ${addressString}.

These Legal Terms constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you"), and **${company}**, concerning your access to and use of the Services. You agree that by accessing the Services, you have read, understood, and agreed to be bound by all of these Legal Terms. **IF YOU DO NOT AGREE WITH ALL OF THESE LEGAL TERMS, THEN YOU ARE EXPRESSLY PROHIBITED FROM USING THE SERVICES AND YOU MUST DISCONTINUE USE IMMEDIATELY.**

${data.notifyUpdates && data.updateNotificationMethod === "before_effective" ? `Supplemental terms and conditions or documents that may be posted on the Services from time to time are hereby expressly incorporated herein by reference. We will provide you with prior notice of scheduled changes to the Legal Terms you are using, typically ${data.updateNotificationDaysAdvance || 7} days in advance.` : "Supplemental terms and conditions or documents that may be posted on the Services from time to time are hereby expressly incorporated herein by reference. We reserve the right, in our sole discretion, to make changes or modifications to these Legal Terms at any time and for any reason."}

We recommend that you print a copy of these Legal Terms for your records.

---

### TABLE OF CONTENTS

1. OUR SERVICES
2. INTELLECTUAL PROPERTY RIGHTS
3. USER REPRESENTATIONS
4. SUBSCRIPTIONS
5. PROHIBITED ACTIVITIES
6. USER GENERATED CONTRIBUTIONS
7. CONTRIBUTION LICENSE
8. SERVICES MANAGEMENT
9. TERM AND TERMINATION
10. MODIFICATIONS AND INTERRUPTIONS
11. GOVERNING LAW
12. DISPUTE RESOLUTION
13. CORRECTIONS
14. DISCLAIMER
15. LIMITATIONS OF LIABILITY
16. INDEMNIFICATION
17. USER DATA
18. ELECTRONIC COMMUNICATIONS, TRANSACTIONS, AND SIGNATURES
19. SMS TEXT MESSAGING
20. MISCELLANEOUS
21. CONTACT US

---

## 1. OUR SERVICES

The information provided when using the Services is not intended for distribution to or use by any person or entity in any jurisdiction or country where such distribution or use would be contrary to law or regulation or which would subject us to any registration requirement within such jurisdiction or country. Accordingly, those persons who choose to access the Services from other locations do so on their own initiative and are solely responsible for compliance with local laws, if and to the extent local laws are applicable.

---

## 2. INTELLECTUAL PROPERTY RIGHTS

### Our intellectual property
We are the owner or the licensee of all intellectual property rights in our Services, including all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics in the Services (collectively, the "Content"), as well as the trademarks, service marks, and logos contained therein (the "Marks").

Our Content and Marks are protected by copyright and trademark laws (and various other intellectual property rights and unfair competition laws) and treaties around the world.

The Content and Marks are provided in or through the Services "AS IS" for your personal, non-commercial use or internal business purpose only.

### Your use of our Services
Subject to your compliance with these Legal Terms, including the "PROHIBITED ACTIVITIES" section below, we grant you a non-exclusive, non-transferable, revocable license to:
- Access the Services; and
- Download or print a copy of any portion of the Content to which you have properly gained access,

solely for your personal, non-commercial use or internal business purpose.

Except as set out in this section or elsewhere in our Legal Terms, no part of the Services and no Content or Marks may be copied, reproduced, aggregated, republished, uploaded, posted, publicly displayed, encoded, translated, transmitted, distributed, sold, licensed, or otherwise exploited for any commercial purpose whatsoever, without our express prior written permission.

If you wish to make any use of the Services, Content, or Marks other than as set out in this section or elsewhere in our Legal Terms, please address your request to: ${email}. If we ever grant you the permission to post, reproduce, or publicly display any part of our Services or Content, you must identify us as the owners or licensors of the Services, Content, or Marks and ensure that any copyright or proprietary notice appears or is visible on posting, reproducing, or displaying our Content.

We reserve all rights not expressly granted to you in and to the Services, Content, and Marks.

Any breach of these Intellectual Property Rights will constitute a material breach of our Legal Terms and your right to use our Services will terminate immediately.

### Your submissions
Please review this section and the "PROHIBITED ACTIVITIES" section carefully prior to using our Services to understand the (a) rights you give us and (b) obligations you have when you post or upload any content through the Services.

**Submissions:** By directly sending us any question, comment, suggestion, idea, feedback, or other information about the Services ("Submissions"), you agree to assign to us all intellectual property rights in such Submission. You agree that we shall own this Submission and be entitled to its unrestricted use and dissemination for any lawful purpose, commercial or otherwise, without acknowledgment or compensation to you.

**You are responsible for what you post or upload:** By sending us Submissions through any part of the Services you:
- Confirm that you have read and agree with our "PROHIBITED ACTIVITIES" and will not post, send, publish, upload, or transmit through the Services any Submission that is illegal, harassing, hateful, harmful, defamatory, obscene, bullying, abusive, discriminatory, threatening to any person or group, sexually explicit, false, inaccurate, deceitful, or misleading;
- To the extent permissible by applicable law, waive any and all moral rights to any such Submission;
- Warrant that any such Submission are original to you or that you have the necessary rights and licenses to submit such Submissions and that you have full authority to grant us the above-mentioned rights in relation to your Submissions; and
- Warrant and represent that your Submissions do not constitute confidential information.

You are solely responsible for your Submissions and you expressly agree to reimburse us for any and all losses that we may suffer because of your breach of (a) this section, (b) any third party's intellectual property rights, or (c) applicable law.

---

## 3. USER REPRESENTATIONS

By using the Services, you represent and warrant that:
1. You have the legal capacity and you agree to comply with these Legal Terms;
2. You are not a minor in the jurisdiction in which you reside;
3. You will not access the Services through automated or non-human means, whether through a bot, script or otherwise;
4. You will not use the Services for any illegal or unauthorized purpose; and
5. Your use of the Services will not violate any applicable law or regulation.

If you provide any information that is untrue, inaccurate, not current, or incomplete, we have the right to suspend or terminate your account and refuse any and all current or future use of the Services (or any portion thereof).

---

## 4. SUBSCRIPTIONS

${data.hasSubscription !== false ? `### Billing and Renewal
Your subscription will continue and automatically renew unless canceled. You consent to our charging your payment method on a recurring basis without requiring your prior approval for each recurring charge, until such time as you cancel the applicable order. The length of your billing cycle is ${data.renewalFrequency === "monthly" ? "monthly" : data.renewalFrequency === "annually" ? "annually" : data.renewalFrequency === "customer_chooses" ? "as selected by you during checkout" : data.customRenewalFrequency || "monthly"}.

### Cancellation
You can cancel your subscription at any time by logging into your account. Your cancellation will take effect at the end of the current paid term. If you have any questions or are unsatisfied with our Services, please email us at ${email}.

### Fee Changes
We may, from time to time, make changes to the subscription fee and will communicate any price changes to you in accordance with applicable law.` : `We do not currently offer recurring subscription services on our platform. All purchases or access terms are governed at the time of transaction or account creation.`}

---

## 5. PROHIBITED ACTIVITIES

You may not access or use the Services for any purpose other than that for which we make the Services available. The Services may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.

As a user of the Services, you agree not to:
- Systematically retrieve data or other content from the Services to create or compile, directly or indirectly, a collection, compilation, database, or directory without written permission from us.
- Trick, defraud, or mislead us and other users, especially in any attempt to learn sensitive account information such as user passwords.
- Circumvent, disable, or otherwise interfere with security-related features of the Services, including features that prevent or restrict the use or copying of any Content or enforce limitations on the use of the Services and/or the Content contained therein.
- Disparage, tarnish, or otherwise harm, in our opinion, us and/or the Services.
- Use any information obtained from the Services in order to harass, abuse, or harm another person.
- Make improper use of our support services or submit false reports of abuse or misconduct.
- Use the Services in a manner inconsistent with any applicable laws or regulations.
- Engage in unauthorized framing of or linking to the Services.
- Upload or transmit (or attempt to upload or to transmit) viruses, Trojan horses, or other material, including excessive use of capital letters and spamming (continuous posting of repetitive text), that interferes with any party's uninterrupted use and enjoyment of the Services or modifies, impairs, disrupts, alters, or interferes with the use, features, functions, operation, or maintenance of the Services.
- Engage in any automated use of the system, such as using scripts to send comments or messages, or using any data mining, robots, or similar data gathering and extraction tools.
- Delete the copyright or other proprietary rights notice from any Content.
- Attempt to impersonate another user or person or use the username of another user.
- Upload or transmit (or attempt to upload or to transmit) any material that acts as a passive or active information collection or transmission mechanism, including without limitation, clear graphics interchange formats ("gifs"), 1×1 pixels, web bugs, cookies, or other similar devices (sometimes referred to as "spyware" or "passive collection mechanisms" or "pcms").
- Interfere with, disrupt, or create an undue burden on the Services or the networks or services connected to the Services.
- Harass, annoy, intimidate, or threaten any of our employees or agents engaged in providing any portion of the Services to you.
- Attempt to bypass any measures of the Services designed to prevent or restrict access to the Services, or any portion of the Services.
- Copy or adapt the Services' software, including but not limited to Flash, PHP, HTML, JavaScript, or other code.
- Except as permitted by applicable law, decipher, decompile, disassemble, or reverse engineer any of the software comprising or in any way making up a part of the Services.
- Except as may be the result of standard search engine or Internet browser usage, use, launch, develop, or distribute any automated system, including without limitation, any spider, robot, cheat utility, scraper, or offline reader that accesses the Services, or use or launch any unauthorized script or other software.
- Use a buying agent or purchasing agent to make purchases on the Services.
- Make any unauthorized use of the Services, including collecting usernames and/or email addresses of users by electronic or other means for the purpose of sending unsolicited email, or creating user accounts by automated means or under false pretenses.
- Use the Services as part of any effort to compete with us or otherwise use the Services and/or the Content for any revenue-generating endeavor or commercial enterprise.
${data.prohibitCommercialAds ? `- Use the Services to advertise or offer to sell goods and services.\n` : ""}${data.prohibitTransferProfile ? `- Sell or otherwise transfer your profile.\n` : ""}${customProhibitions}
---

## 6. USER GENERATED CONTRIBUTIONS

The Services may invite you to chat, contribute to, or participate in blogs, message boards, online forums, and other functionality, and may provide you with the opportunity to create, submit, post, display, transmit, perform, publish, distribute, or broadcast content and materials to us or on the Services, including but not limited to text, writings, video, audio, photographs, graphics, comments, suggestions, or personal information or other material (collectively, "Contributions"). Contributions may be viewable by other users of the Services and through third-party websites. As such, any Contributions you transmit may be treated as non-confidential and non-proprietary.

---

## 7. CONTRIBUTION LICENSE

You and Services agree that we may access, store, process, and use any information and personal data that you provide and your choices (including settings).

By submitting suggestions or other feedback regarding the Services, you agree that we can use and share such feedback for any purpose without compensation to you.

We do not assert any ownership over your Contributions. You retain full ownership of all of your Contributions and any intellectual property rights or other proprietary rights associated with your Contributions. We are not liable for any statements or representations in your Contributions provided by you in any area on the Services. You are solely responsible for your Contributions to the Services and you expressly agree to exonerate us from any and all responsibility and to refrain from any legal action against us regarding your Contributions.

---

## 8. SERVICES MANAGEMENT

We reserve the right, but not the obligation, to:
1. Monitor the Services for violations of these Legal Terms;
2. Take appropriate legal action against anyone who, in our sole discretion, violates the law or these Legal Terms, including without limitation, reporting such user to law enforcement authorities;
3. In our sole discretion and without limitation, refuse, restrict access to, limit the availability of, or disable (to the extent technologically feasible) any of your Contributions or any portion thereof;
4. In our sole discretion and without limitation, notice, or liability, to remove from the Services or otherwise disable all files and content that are excessive in size or are in any way burdensome to our systems; and
5. Otherwise manage the Services in a manner designed to protect our rights and property and to facilitate the proper functioning of the Services.

---

## 9. TERM AND TERMINATION

These Legal Terms shall remain in full force and effect while you use the Services. **WITHOUT LIMITING ANY OTHER PROVISION OF THESE LEGAL TERMS, WE RESERVE THE RIGHT TO, IN OUR SOLE DISCRETION AND WITHOUT NOTICE OR LIABILITY, DENY ACCESS TO AND USE OF THE SERVICES (INCLUDING BLOCKING CERTAIN IP ADDRESSES), TO ANY PERSON FOR ANY REASON OR FOR NO REASON, INCLUDING WITHOUT LIMITATION FOR BREACH OF ANY REPRESENTATION, WARRANTY, OR COVENANT CONTAINED IN THESE LEGAL TERMS OR OF ANY APPLICABLE LAW OR REGULATION. WE MAY TERMINATE YOUR USE OR PARTICIPATION IN THE SERVICES OR DELETE ANY CONTENT OR INFORMATION THAT YOU POSTED AT ANY TIME, WITHOUT WARNING, IN OUR SOLE DISCRETION.**

If we terminate or suspend your account for any reason, you are prohibited from registering and creating a new account under your name, a fake or borrowed name, or the name of any third party, even if you may be acting on behalf of the third party. In addition to terminating or suspending your account, we reserve the right to take appropriate legal action, including without limitation pursuing civil, criminal, and injunctive redress.

---

## 10. MODIFICATIONS AND INTERRUPTIONS

We reserve the right to change, modify, or remove the contents of the Services at any time or for any reason at our sole discretion without notice. However, we have no obligation to update any information on our Services. We will not be liable to you or any third party for any modification, price change, suspension, or discontinuance of the Services.

We cannot guarantee the Services will be available at all times. We may experience hardware, software, or other problems or need to perform maintenance related to the Services, resulting in interruptions, delays, or errors. We reserve the right to change, revise, update, suspend, discontinue, or otherwise modify the Services at any time or for any reason without notice to you. You agree that we have no liability whatsoever for any loss, damage, or inconvenience caused by your inability to access or use the Services during any downtime or discontinuance of the Services. Nothing in these Legal Terms will be construed to obligate us to maintain and support the Services or to supply any corrections, updates, or releases in connection therewith.

---

## 11. GOVERNING LAW

These Legal Terms shall be governed by and defined following the laws of **${governing}**. **${company}** and yourself irrevocably consent that the courts of **${governing}** shall have exclusive jurisdiction to resolve any dispute which may arise in connection with these Legal Terms.

---

## 12. DISPUTE RESOLUTION

${data.disputeResolution === "litigation" ? `### Court Litigation
Any legal action of whatever nature brought by either you or us (collectively, the "Parties" and individually, a "Party") shall be commenced or prosecuted in the state and federal courts located in ${disputePlace}, and the Parties hereby consent to, and waive all defenses of lack of personal jurisdiction and forum non conveniens with respect to venue and jurisdiction in such state and federal courts.` : data.disputeResolution === "arbitration" ? `### Binding Arbitration
If the Parties are unable to resolve a Dispute through informal negotiations, the Dispute will be finally and exclusively resolved through binding arbitration in accordance with the rules of the United Nations Commission on International Trade Law (UNCITRAL) or the American Arbitration Association (AAA) in force at the time of commencement. The place of arbitration shall be **${disputePlace}**. The language of the proceedings shall be English. The governing law of these Legal Terms shall be substantive law of **${governing}**.` : `### Informal Negotiations
To expedite resolution and control the cost of any dispute, controversy, or claim related to these Legal Terms (each a "Dispute" and collectively, the "Disputes") brought by either you or us (individually, a "Party" and collectively, the "Parties"), the Parties agree to first attempt to negotiate any Dispute (except those Disputes expressly provided below) informally for at least **${mediationDays} days** before initiating arbitration. Such informal negotiations commence upon written notice from one Party to the other Party.

### Binding Arbitration
If the Parties are unable to resolve the dispute through informal negotiation, the dispute shall be finally resolved by arbitration in accordance with the United Nations Commission on International Trade Law Arbitration Rules or AAA in force at the time of commencement of the arbitration. The place of arbitration shall be **${disputePlace}**. The language of the proceedings shall be English. The governing law shall be substantive law of **${governing}**.`}

### Restrictions
The Parties agree that any arbitration shall be limited to the Dispute between the Parties individually. To the full extent permitted by law:
- No arbitration shall be joined with any other proceeding;
- There is no right or authority for any Dispute to be arbitrated on a class-action basis or to utilize class action procedures; and
- There is no right or authority for any Dispute to be brought in a purported representative capacity on behalf of the general public or any other persons.

### Exceptions to Informal Negotiations and Arbitration
The Parties agree that the following Disputes are not subject to the above provisions concerning informal negotiations and binding arbitration: (a) any Disputes seeking to enforce or protect, or concerning the validity of, any of the intellectual property rights of a Party; (b) any Dispute related to, or arising from, allegations of theft, piracy, invasion of privacy, or unauthorized use; and (c) any claim for injunctive relief.

---

## 13. CORRECTIONS

There may be information on the Services that contains typographical errors, inaccuracies, or omissions, including descriptions, pricing, availability, and various other information. We reserve the right to correct any errors, inaccuracies, or omissions and to change or update the information on the Services at any time, without prior notice.

---

## 14. DISCLAIMER

**THE SERVICES ARE PROVIDED ON AN AS-IS AND AS-AVAILABLE BASIS. YOU AGREE THAT YOUR USE OF THE SERVICES WILL BE AT YOUR SOLE RISK. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, IN CONNECTION WITH THE SERVICES AND YOUR USE THEREOF, INCLUDING, WITHOUT LIMITATION, THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE MAKE NO WARRANTIES OR REPRESENTATIONS ABOUT THE ACCURACY OR COMPLETENESS OF THE SERVICES' CONTENT OR THE CONTENT OF ANY WEBSITES OR MOBILE APPLICATIONS LINKED TO THE SERVICES AND WE WILL ASSUME NO LIABILITY OR RESPONSIBILITY FOR ANY (1) ERRORS, MISTAKES, OR INACCURACIES OF CONTENT AND MATERIALS, (2) PERSONAL INJURY OR PROPERTY DAMAGE, OF ANY NATURE WHATSOEVER, RESULTING FROM YOUR ACCESS TO AND USE OF THE SERVICES, (3) ANY UNAUTHORIZED ACCESS TO OR USE OF OUR SECURE SERVERS AND/OR ANY AND ALL PERSONAL INFORMATION AND/OR FINANCIAL INFORMATION STORED THEREIN, (4) ANY INTERRUPTION OR CESSATION OF TRANSMISSION TO OR FROM THE SERVICES, (5) ANY BUGS, VIRUSES, TROJAN HORSES, OR THE LIKE WHICH MAY BE TRANSMITTED TO OR THROUGH THE SERVICES BY ANY THIRD PARTY, AND/OR (6) ANY ERRORS OR OMISSIONS IN ANY CONTENT AND MATERIALS OR FOR ANY LOSS OR DAMAGE OF ANY KIND INCURRED AS A RESULT OF THE USE OF ANY CONTENT POSTED, TRANSMITTED, OR OTHERWISE MADE AVAILABLE VIA THE SERVICES.**

---

## 15. LIMITATIONS OF LIABILITY

**IN NO EVENT WILL WE OR OUR DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT, CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFIT, LOST REVENUE, LOSS OF DATA, OR OTHER DAMAGES ARISING FROM YOUR USE OF THE SERVICES, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. NOTWITHSTANDING ANYTHING TO THE CONTRARY CONTAINED HEREIN, OUR LIABILITY TO YOU FOR ANY CAUSE WHATSOEVER AND REGARDLESS OF THE FORM OF THE ACTION, WILL AT ALL TIMES BE LIMITED TO THE AMOUNT PAID, IF ANY, BY YOU TO US DURING THE SIX (6) MONTH PERIOD PRIOR TO ANY CAUSE OF ACTION ARISING.**

---

## 16. INDEMNIFICATION

You agree to defend, indemnify, and hold us harmless, including our subsidiaries, affiliates, and all of our respective officers, agents, partners, and employees, from and against any loss, damage, liability, claim, or demand, including reasonable attorneys' fees and expenses, made by any third party due to or arising out of:
1. Use of the Services;
2. Breach of these Legal Terms;
3. Any breach of your representations and warranties set forth in these Legal Terms;
4. Your violation of the rights of a third party, including but not limited to intellectual property rights; or
5. Any overt harmful act toward any other user of the Services with whom you connected via the Services.

Notwithstanding the foregoing, we reserve the right, at your expense, to assume the exclusive defense and control of any matter for which you are required to indemnify us, and you agree to cooperate, at your expense, with our defense of such claims.

---

## 17. USER DATA

We will maintain certain data that you transmit to the Services for the purpose of managing the performance of the Services, as well as data relating to your use of the Services. Although we perform regular routine backups of data, you are solely responsible for all data that you transmit or that relates to any activity you have undertaken using the Services. You agree that we shall have no liability to you for any loss or corruption of any such data, and you hereby waive any right of action against us arising from any such loss or corruption of such data.

---

## 18. ELECTRONIC COMMUNICATIONS, TRANSACTIONS, AND SIGNATURES

Visiting the Services, sending us emails, and completing online forms constitute electronic communications. You consent to receive electronic communications, and you agree that all agreements, notices, disclosures, and other communications we provide to you electronically, via email and on the Services, satisfy any legal requirement that such communication be in writing. **YOU HEREBY AGREE TO THE USE OF ELECTRONIC SIGNATURES, CONTRACTS, ORDERS, AND OTHER RECORDS, AND TO ELECTRONIC DELIVERY OF NOTICES, POLICIES, AND RECORDS OF TRANSACTIONS INITIATED OR COMPLETED BY US OR VIA THE SERVICES.**

---

## 19. SMS TEXT MESSAGING

${data.sendSms ? `### Program Overview
If you opt into our SMS text messaging program (${data.smsProgramName || company}), you agree to receive promotional and informational text messages at the phone number you provide.

### Message Frequency
${data.specifySmsFrequency && data.smsFrequencyDetails ? data.smsFrequencyDetails : "When you opt into our SMS messaging service, message frequency may vary based on your interactions with our Services."}

### Opting Out
${data.smsOptOut === "stop" ? 'If at any time you wish to stop receiving SMS messages from us, simply reply to the text with "STOP." You may receive an SMS message confirming your opt out. After this, you will no longer receive SMS messages from us. If you want to join again, please sign up as you did the first time and we will start sending SMS messages to you again.' : data.customSmsOptOut || 'You may opt out of receiving SMS text messages at any time by replying "STOP" to any text message.'}

### Message and Data Rates
Please be aware that message and data rates may apply to any SMS messages sent or received. The rates are determined by your carrier and the specifics of your mobile plan. Carriers are not liable for delayed or undelivered messages.

### Support
If you have any questions or need assistance regarding our SMS communications, please reply with the keyword HELP. You can also email us at ${email}.` : `We do not currently send automated SMS text messages to our users. Should we offer SMS text message services in the future, explicit opt-in consent and clear opt-out terms will be provided in accordance with applicable laws.`}

---

## 20. MISCELLANEOUS

These Legal Terms and any policies or operating rules posted by us on the Services or in respect to the Services constitute the entire agreement and understanding between you and us. Our failure to exercise or enforce any right or provision of these Legal Terms shall not operate as a waiver of such right or provision. These Legal Terms operate to the fullest extent permissible by law. We may assign any or all of our rights and obligations to others at any time. We shall not be responsible or liable for any loss, damage, delay, or failure to act caused by any cause beyond our reasonable control. If any provision or part of a provision of these Legal Terms is determined to be unlawful, void, or unenforceable, that provision or part of the provision is deemed severable from these Legal Terms and does not affect the validity and enforceability of any remaining provisions. There is no joint venture, partnership, employment or agency relationship created between you and us as a result of these Legal Terms or use of the Services.

---

## 21. CONTACT US

In order to resolve a complaint regarding the Services or to receive further information regarding use of the Services, please contact us at:

${contactLines}
`
}

export function generateTermsOfServiceHtml(data: TermsOfServiceData, domain: string): string {
  const md = generateTermsOfServiceMarkdown(data, domain)
  const title = data.policyTitleChoice === "custom" && data.customPolicyTitle 
    ? data.customPolicyTitle 
    : (data.policyTitleChoice || "Terms of Use")
  
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
    h2 { font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 28px; margin-bottom: 8px; letter-spacing: -0.01em; }
    h3 { font-size: 14px; font-weight: 600; color: #1e293b; margin-top: 18px; margin-bottom: 6px; }
    p, li { font-size: 13px; font-weight: 400; color: #475569; margin-bottom: 10px; line-height: 1.65; }
    ul { padding-left: 20px; margin-bottom: 16px; }
    ol { padding-left: 20px; margin-bottom: 16px; }
    hr { border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0; }
    strong { font-weight: 600; color: #0f172a; }
    code { background: #f1f5f9; padding: 2px 4px; border-radius: 4px; font-size: 12px; }
    a { color: #2563eb; text-decoration: none; }
    a:hover { text-decoration: underline; }
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
