# CookieYes Comprehensive Platform Analysis & Implementation Blueprint

> **Document Version:** 5.0 (Full Master Edition)  
> **Source:** Reverse-engineering & architectural analysis of CookieYes CMP Dashboard (Screenshots 1–32)  
> **Platform Target:** Upfront (Unified Analytics & Consent Management Platform)

---

## 1. Executive Summary & Core Value Proposition

CookieYes is a market-leading **Consent Management Platform (CMP)** designed to ensure compliance with global privacy regulations (GDPR, ePrivacy Directive, LGPD Brazil, PIPEDA Canada, Law 25 Quebec, POPIA South Africa, nFADP Switzerland, CCPA/CPRA, etc.).

Its core architecture consists of:
1. **Interactive Real-Time Banner Studio** with live website simulation and responsive device switching (`Desktop`, `Tablet`, `Mobile`).
2. **Deep Content & Copy Control** split into a clean 5-accordion structure (`Cookie Notice`, `Preference Centre`, `Cookie List`, `Revisit Button`, `Blocked Content`).
3. **Automated Scanner-to-Policy Pipeline** where website scan results directly populate the Cookie Policy and Preference Center tables.
4. **Zero-Code Policy Deployment** offering both dynamic `<script>` embeds and static HTML format with 1-click developer sharing.
5. **Intelligent Cookie Scanner & History Engine** tracking scan runs, URLs crawled, cookies discovered, and associated script origin patterns.
6. **Script URL Pattern Auto-Blocking** linking each cookie to its originating script URL regex for automatic pre-consent blocking.
7. **GDPR Consent Log & Audit Trail (Proof of Consent)** recording every visitor consent event with cryptographic IDs, statuses, timestamps, CSV exports, and 1-click proof-of-consent receipt downloads.
8. **Advanced Enterprise Compliance Engine** including Google Consent Mode v2 (Basic & Advanced modes), Microsoft UET / Clarity API hooks, Subdomain consent sharing, CCPA/CPRA data selling flags, Page-specific exclusion rules, and Static IP firewall whitelisting.

---

## 2. Global Navigation & Layout Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Top Bar: Brand Logo | Active Domain Selector | Plan & Quota Tracker (Pageviews) | CTAs │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Sub-Nav: Dashboard | Cookie Banner | Cookie Manager | Consent Log | Languages | More ▾ │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  ┌──────────┬─────────────────────────────┬─────────────────────────────────────────┐  │
│  │ Icon Rail│ 380px Settings Panel        │ Live Website Preview Canvas             │  │
│  │          │                             │                                         │  │
│  │ ⚙ Gen   │ • Collapsible Accordions    │ • Simulated Webpage                     │  │
│  │ ⊞ Layout │ • Form Toggles & Colors     │ • Interactive Banner & Modal            │  │
│  │ 📄 Content│ • Live Inputs & Copy        │ • [Desktop | Tablet | Mobile] Switcher  │  │
│  │ 🎨 Colors │                             │                                         │  │
│  │ 💻 CSS    │ [ Publish Changes Button ]  │ [ Revisit Floating Widget Preview ]     │  │
│  └──────────┴─────────────────────────────┴─────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Complete Module Breakdown & Specifications

### Module A: Cookie Banner Studio

#### 1. Vertical Icon Rail Navigation
Instead of bulky horizontal tabs, the studio uses a compact 48px vertical rail on the left:
* **General (⚙):** Consent templates, geo-targeting, Google Consent Mode v2, IAB TCF v2.2.
* **Layout (⊞):** Notice form factors, positioning matrix, preference center layouts.
* **Content (📄):** 5-accordion content copy management.
* **Colours (🎨):** Primary brand colors, background/text contrast, button borders.
* **Custom CSS (💻):** Advanced CSS overrides for enterprise styling.
* **Revisit Badge (🍪):** Floating persistent cookie widget preview.

#### 2. Layout Form Factors & Positioning
* **Cookie Notice Styles:**
  * `Box` (Floating rectangular card with 4-corner positioning: Bottom-Left, Bottom-Right, Top-Left, Top-Right).
  * `Banner` (Full-width edge bar: Bottom Bar or Top Bar).
  * `Popup` (Centered modal dialog with dark backdrop overlay).
* **Preference Centre Layouts:**
  * `Center` (Standard modal popup with backdrop).
  * `Sidebar` (Slide-over drawer from right or left edge).
  * `Push Down` (Collapsible header drawer expanding from the top).
* **Categories on First Layer (Toggle):**
  * When enabled, renders category toggle checkboxes directly inside the initial notice banner without requiring the user to click "Customise".

#### 3. General & Geo-Targeting Rules
* **Geo-Targeting Options:**
  * `Worldwide` (Display banner to all visitors).
  * `EU Countries & UK Only` (Saves pageview quota by only showing to regulated European IPs).
  * `Custom Selected Countries` (Granular ISO-2 country selection).

---

### Module B: Content Management (The 5-Accordion System)

The `Content` panel is structured into 5 clean collapsible accordions:

#### Accordion 1: Cookie Notice (Initial Banner)
* **Title Input:** e.g., `"We value your privacy"`.
* **Message Area:** Rich text / HTML input explaining cookie usage.
* **Granular Button Toggles & Custom Labels:**
  * `Close [X] Button` (Toggle ON/OFF).
  * `"Accept All" Button` (Label text, mandatory).
  * `"Reject All" Button` (Toggle ON/OFF + custom label text).
  * `"Customise" Button` (Toggle ON/OFF + custom label text).
  * `"Cookie Policy" Link` (Toggle ON/OFF + anchor URL).

#### Accordion 2: Preference Centre (Preferences Modal Settings)
* **1. Title:** Text input e.g. `"Customise Consent Preferences"`.
* **2. Preview message:** Textarea for the introductory overview description.
* **3. Show Google Privacy Policy (Toggle ON/OFF):**
  * When toggled ON, exposes:
    * `Message preview`: Textarea explaining Google's third-party cookie handling.
    * `Link text`: e.g. `"Google Privacy Policy"`.
    * `Link URL`: e.g. `"https://business.safety.google/privacy"`.
* **4. "Save My Preferences" label:** Custom button text input.
* **5. "Show more" button:** Custom toggle label input (e.g. `"Show more"`, `"Read more"`), displayed when the preview message copy is long to collapse the text into a clean 2-line snippet.
* **6. "Show less" button:** Custom toggle label input (e.g. `"Show less"`, `"Read less"`), displayed when the preview message is expanded.

#### Accordion 3: Cookie List & Audit Table Settings
* **1. Show cookie list on banner:** Toggle switch (ON/OFF).
  * When **ON**: When a user expands a category in the Preference Centre modal, it renders the full audit table listing the specific cookies, domains, and durations.
  * When **OFF**: The Preference Centre modal only displays category names and their general descriptions, completely omitting the table rows for a cleaner, ultra-compact banner look.
* **2. Embed code:**
  * Subtext: *"Add cookie list to your Cookie/Privacy Policy page with this HTML code."*
  * Copyable HTML code box with 1-click Copy button:
    ```html
    <div class="upfront-audit-table-element"></div>
    ```
* **3. "Cookie" column label:** Text input (default `"Cookie"`).
* **4. "Duration" column label:** Text input (default `"Duration"`).
* **5. "Description" column label:** Text input (default `"Description"`).
* **6. "Always Active" label:** Text input (default `"Always Active"`).
* **7. "No cookies to display" label:** Text input (default `"No cookies to display"`).
  * **Why CookieYes has this:** When a website has 0 discovered cookies under a particular category (e.g. 0 Advertisement cookies), this string is rendered inside that category's table container to reassure the user that no tracking cookies exist in that group, rather than showing a broken empty table or error state. Also crucial for multi-language translations (e.g., *"No hay cookies para mostrar"*).

#### Accordion 4: Revisit Consent Button
* **Floating Widget Toggle:** (ON/OFF).
* **Position Matrix:** Radio toggle for `Left` vs. `Right` corner.
* **Custom Icon Upload:** Ability to upload custom SVG/PNG brand icon.
* **Hover Tooltip Text:** e.g., `"Consent Preferences"`.

#### Accordion 5: Blocked Content (Pre-Consent Gating)
* **Iframe & Script Gating Placeholder:**
  * Alt text overlay displayed when third-party widgets (YouTube, Google Maps, Twitter) are blocked prior to consent.
  * e.g., `"Please accept cookies to view this content"`.

---

### Module C: Cookie Policy Generator Wizard

A structured 5-step wizard with real-time draft auto-saving:

```
Step 1: Language Settings (0%)
   ├── Select primary language (English, French, German, Italian, Spanish)
   └── Enable multi-language generation toggle
Step 2: About Cookies (20%)
   ├── Heading: "What are cookies?"
   └── Pre-filled compliant legal definitions
Step 3: Use of Cookies (40%)
   ├── Heading: "How do we use cookies?"
   └── First-party essential vs. third-party tracking disclosures
Step 4: Types of Cookies (60%)
   ├── Direct sync with Cookie Scanner results (with timestamp)
   ├── Dynamic categorized tables (Necessary, Functional, Analytics, Performance, Ads)
   └── "What to know" educational compliance sidebar
Step 5: Cookie Preferences (80%)
   ├── Revisit link embed snippet: `<a class="upfront-banner-element">Consent Preferences</a>`
   └── Browser-level opt-out guide links (Chrome, Safari, Firefox, Edge)
Result: Policy Preview & Deployment (100%)
   ├── Disclaimer callout
   └── "Add Policy to Site" modal (Dynamic Script vs. Static HTML + "Send to Teammate")
```

---

### Module D: Cookie Manager, Scanner & Script Auto-Blocking

#### 1. Scanner Dashboard & Scan History
* **Header Controls:**
  * `Last successful scan` (Timestamp) + **`Scan now`** on-demand button.
  * `Next scan` (Schedule status) + **`Schedule scan`** recurring frequency modal.
* **Sub-Tabs:** `Cookie List` | `Scan History`.
* **Scan History Table Schema:**
  | Column | Description | Example |
  | :--- | :--- | :--- |
  | **Scan Date** | Timestamp (UTC) | `03 November 2025 09:38:39` |
  | **Scan Status** | Execution state badge | `Completed` (green pill), `Failed`, `Running` |
  | **URLs Scanned** | Depth of crawled pages | `9 pages` |
  | **Categories** | Number of distinct active categories | `4` |
  | **Cookies** | Total cookies discovered | `19` |
  | **Scripts** | Unique third-party scripts detected | `4` |
  | **Actions** | Detailed report modal | `More info` |

#### 2. Uncategorized Cookie Resolution & Warning Workflow
* **Warning Badge (`Uncategorised ⚠`):**
  * When unknown cookies are detected by the crawler, a warning callout notifies the user:
    * `"This cookie does not have a script URL pattern. It is required for blocking the cookie prior to obtaining user consent."`
* **Edit Cookie Modal:**
  * `Cookie ID` (Token or regex, e.g. `__Secure-ROLLOUT_TOKEN`).
  * `Domain` (`.youtube.com`, `webdev.how`).
  * `Duration` (`Session`, `1 hour`, `6 months`, `1 year`, `Never Expires`).
  * `Category Dropdown` (Necessary, Functional, Analytics, Performance, Advertisement).
  * `Script URL Pattern` (e.g. `google-analytics.com`, `youtube.com`).
  * `Description` (Plain-text explanation).

#### 3. Category Customization & CCPA/CPRA Compliance Rules (Edit Category Modal)
* **Name & Description:** Custom editable category label and rich-text definition.
* **Compliance Switches:**
  * `Sells or shares personal data` (Toggle ON/OFF) — Flags categories for CCPA/CPRA Do Not Sell opt-out compliance.
  * `Load cookies prior to consent` (Toggle ON/OFF) — Controls opt-in (GDPR) vs opt-out (US) behavior.
  * `Hide category from banner` (Toggle ON/OFF) — Automatically hides categories with 0 cookies to keep modals clean.

---

### Module E: Consent Log & Audit Trail (Proof of Consent)

Under **GDPR Article 7(1)**, website owners must be able to demonstrate that a user provided valid consent. The **Consent Log** provides an immutable compliance ledger:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Consent Log: "View visitor consents and download proof of consents"                    │
│ [ Your visitor consents | Export as CSV ]    [ Search log with visitor's Consent ID 🔍]│
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Consent ID           │ Consent Status  │ Date/Time (UTC ± 00:00) │ Proof of Consent    │
├──────────────────────┼─────────────────┼─────────────────────────┼─────────────────────┤
│ ZnFFOTIMZjFOMVFP...  │ Rejected [pill] │ July 25, 2023 10:41:55  │ [📥 Download Icon]  │
│ SmIFQ1IoRmNGY1N5...  │ Accepted [pill] │ July 25, 2023 10:21:23  │ [📥 Download Icon]  │
│ U1V1NzczV3JXV1E2...  │ Accepted [pill] │ July 25, 2023 07:15:40  │ [📥 Download Icon]  │
│ ekxBdWNCUkd3NG...   │ Rejected [pill] │ July 24, 2023 22:49:13  │ [📥 Download Icon]  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Core Components & Schema:
1. **Consent ID:** Anonymized, pseudonymous cryptographic hash (e.g. `SHA-256(visitor_hash + timestamp)`). No PII is stored.
2. **Consent Status:**
   * `Accepted` (All categories granted — green pill).
   * `Rejected` (Only strictly necessary cookies allowed — rose pill).
   * `Customized / Partial` (Specific categories selected).
3. **Date/Time (UTC):** Exact millisecond-precision UTC timestamp.
4. **Proof of Consent (1-Click Download):**
   * Generates a downloadable compliance certificate/JSON receipt detailing:
     - `Consent ID`
     - `Timestamp (UTC)`
     - `IP Anonymization Hash & Country`
     - `Consent Status Breakdown` (Necessary: YES, Functional: YES/NO, Analytics: YES/NO, Ads: YES/NO)
     - `Banner Version & Active Policy Version`
     - `User-Agent Category` (Desktop / Mobile / Tablet)
5. **Search Log by Consent ID:**
   * Instant search field to quickly pull up records when responding to user privacy requests or data protection inquiries.
6. **Export as CSV:**
   * Bulk download of the entire historical consent ledger for legal compliance audits.

---

### Module F: Advanced Settings, Framework Integrations & Firewall Security

#### 1. Banner Display & Exclusions
* **Banner Display Status:** `Enabled` / `Disabled` (Allows disabling the banner for staging or debugging without removing snippet code).
* **Page-Specific Exclusions:** Ability to disable the consent banner on specific paths (e.g. `/login`, `/admin`, `/checkout`).
* **Subdomain Consent Sharing:** Toggle to propagate consent across all `*.yourdomain.com` subdomains using root domain cookies.
* **1-Click Global Re-Consent Trigger (`Renew user consents`):**
  * Forces the banner to reappear for all existing visitors whenever a privacy policy or tracking setup is updated.

#### 2. Google Consent Mode v2 (GCM) Architecture
* **Support GCM (Toggle):** Enables `gtag('consent', 'default', ...)` signals.
* **Basic vs. Advanced Consent Mode:**
  * `Allow Google tags to fire before consent` (Toggle):
    * **OFF (Basic Consent Mode / GDPR Strict):** Blocks Google tags entirely until user clicks Accept.
    * **ON (Advanced Consent Mode):** Sends cookieless pings/modeling signals before consent.
* **GCM Diagnostic & Debugging Tools:**
  * `Check GCM Status` button — Validates whether GCM defaults are executing before tag triggers.
  * `Enable Debug Mode` toggle — Logs real-time GCM status updates to browser developer console.

#### 3. Microsoft UET & Clarity API Integrations
* **Microsoft UET Consent Mode:** Auto-configures Bing Ads Universal Event Tracking based on marketing consent.
* **Microsoft Clarity API Integration:** Directly invokes `clarity("consent")` API prior to user recording sessions.

#### 4. Firewall & Crawler Security (`Scan settings`)
* **Static IP Scan (Toggle):**
  * For enterprise websites behind Cloudflare WAF, AWS Shield, or internal staging firewalls, provides dedicated fixed static IP addresses to whitelist so the crawler can perform complete vulnerability/cookie audits without being blocked.

---

## 4. Upfront Master Implementation Roadmap

To make **Upfront** the definitive modern privacy platform, we will implement:

```
Upfront Execution Roadmap
├── Phase 1: Studio & UI Upgrade
│   ├── Compact 48px vertical icon rail (General, Layout, Content, Colours, Custom CSS)
│   ├── Responsive canvas preview with Desktop / Tablet / Mobile frame resizing
│   └── 3-Form Factor notice engine (Box, Banner, Center Popup) + 3-Modal layouts (Center, Sidebar, Push down)
│
├── Phase 2: Content & Copy Architecture
│   ├── 5-Accordion Content System with granular button toggles ([X], Reject, Customise, Policy link)
│   └── Gated Iframe / Script placeholder overlay generator
│
├── Phase 3: Scanner & Auto-Blocking Engine
│   ├── Python/Playwright crawler with full Scan History logging (URLs crawled, cookies, scripts detected)
│   ├── Regex Script URL Pattern matcher for automated tag blocking
│   └── Uncategorized cookie warning workflow with category editing
│
├── Phase 4: Zero-Code Policy Generator
│   ├── 5-Step interactive policy generator wizard synced with latest scan
│   └── Dynamic `<script id="upfront-policy">` embed snippet generator + static HTML
│
├── Phase 5: Consent Log & Audit Trail Ledger
│   ├── Anonymized Consent ID generator & real-time log ingestion table
│   ├── 1-Click "Proof of Consent" receipt certificate download
│   └── Live Consent ID search filter & CSV export
│
└── Phase 6: Enterprise Frameworks
    ├── Google Consent Mode v2 (Basic & Advanced modes with debug console)
    ├── Microsoft UET & Clarity Consent API hooks
    └── Subdomain consent propagation & 1-click global re-consent trigger
```

---
*Generated for Syft Technologies / Upfront Platform.*
