# Enterprise Consent Management Platform (ConsentOS) Deep-Dive Research
**Source Repository:** [github.com/consentos/consentos](https://github.com/consentos/consentos)

---

## 1. Executive Summary & Monorepo Directory Structure

ConsentOS is structured as a high-performance monorepo separating client runtime, backend APIs, automated browser scanners, and admin dashboards.

```
consentos/
├── apps/
│   ├── banner/                       # Client-side Runtime Engine (< 5KB)
│   │   ├── src/
│   │   │   ├── banner.ts             # Shadow DOM UI rendering & layouts
│   │   │   ├── blocker.ts            # Deep script, cookie & storage interceptor
│   │   │   ├── blocking-mode.ts      # Strict vs Dynamic blocking modes
│   │   │   ├── consent.ts            # State machine & local storage sync
│   │   │   ├── cookies-widget.ts     # Floating revisit cookie button (Shadow DOM)
│   │   │   ├── gcm.ts                # Google Consent Mode v2 (7 signals)
│   │   │   ├── gpc.ts                # Global Privacy Control (navigator.globalPrivacyControl)
│   │   │   ├── gpp.ts & gpp-api.ts   # IAB Global Privacy Platform (US Multi-State)
│   │   │   ├── tcf.ts                # IAB TCF v2.2 specification (__tcfapi)
│   │   │   ├── shopify.ts            # Shopify Customer Privacy API integration
│   │   │   ├── reporter.ts           # Client-side discovered cookie telemetry
│   │   │   ├── reconsent.ts          # Policy revision re-prompting logic
│   │   │   └── i18n.ts               # Multi-language dictionary loader
│   │   └── rollup.config.mjs         # Rollup IIFE bundler with minification
│   │
│   ├── api/                          # FastAPI Backend & Orchestration
│   │   ├── src/
│   │   │   ├── routers/              # REST Endpoints
│   │   │   │   ├── config.py         # Multi-tier configuration cascading
│   │   │   │   ├── consent.py        # Consent logging & receipt generation
│   │   │   │   ├── scanner.py        # Scan scheduling & result inspection
│   │   │   │   ├── compliance.py     # Regulatory compliance validator
│   │   │   │   └── analytics.py      # Consent acceptance & trend metrics
│   │   │   ├── services/             # Core Business Logic
│   │   │   │   ├── classification.py # Cookie pattern matching engine
│   │   │   │   ├── compliance.py     # GDPR/CCPA/CNIL rule-checking engine
│   │   │   │   ├── publisher.py      # CDN static config distributor
│   │   │   │   ├── gcm.py & tcf.py   # Signal generators
│   │   │   │   └── consent.py        # Cryptographic receipt vaulting
│   │   │   ├── models/               # SQLAlchemy 2.0 Database Models
│   │   │   │   ├── organisation.py   # Multi-tenant organization model
│   │   │   │   ├── user.py           # Identity & RBAC permissions
│   │   │   │   ├── site.py           # Registered domains
│   │   │   │   ├── site_config.py    # Per-domain banner & gating settings
│   │   │   │   ├── consent.py        # Tamper-evident receipt logs
│   │   │   │   ├── cookie.py         # Known & discovered cookie catalogue
│   │   │   │   ├── scan.py           # Crawl execution history & diffs
│   │   │   │   └── translation.py    # Per-site localized translations
│   │   │   └── main.py
│   │
│   ├── scanner/                      # Headless Browser Scanner Service
│   │   ├── src/
│   │   │   ├── crawler.py            # Playwright headless crawler
│   │   │   ├── classifier.py         # Open Cookie Database pattern matcher (2,200+)
│   │   │   ├── dark_pattern_detector.py # Visual & DOM anti-dark pattern auditor
│   │   │   ├── consent_validator.py  # Zero-consent tracking leak detector
│   │   │   ├── sitemap.py            # Automated multi-page sitemap crawler
│   │   │   └── worker.py             # Celery distributed task worker
│   │
│   └── admin-ui/                     # Next.js / Vite React Admin Platform
│       ├── src/
│       │   ├── pages/                # Overview, Banner Studio, Scanner, Vault
│       │   ├── components/           # Live previewers, cookie tables, charts
│       │   └── stores/               # State management
│
└── sdks/                             # Client integration libraries
```

---

## 2. Runtime Code Deep Dive (`apps/banner/src/`)

### A. Total Style Isolation via Shadow DOM (`banner.ts`)
Standard CMP scripts inject `<div>` tags directly into the host `document.body`. This causes CSS frameworks (like Bootstrap, Tailwind, or global typography resets) on the host website to break the banner's layout or corrupt its buttons.

**ConsentOS Implementation**:
```typescript
// Creates an isolated DOM tree impenetrable by host CSS
const host = document.createElement('div');
host.id = 'userly-cmp-root';
const shadow = host.attachShadow({ mode: 'open' });

// Injects scoped styling into the shadow root
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  :host { all: initial; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  .userly-banner { position: fixed; z-index: 2147483647; ... }
  .userly-btn-primary { background: ${config.primary_color}; border-radius: ${config.border_radius}; }
`;
shadow.appendChild(styleSheet);
shadow.appendChild(bannerContainer);
document.body.appendChild(host);
```

### B. Deep Client-Side Auto-Blocking Engine (`blocker.ts`)
ConsentOS blocks unconsented scripts and third-party trackers through a 3-layer interception strategy:

1. **MutationObserver DOM Guard**:
   Intercepts `<script>` and `<iframe>` elements added to `<head>` or `<body>` before the browser executes them. If a script matches an unconsented category (e.g. `connect.facebook.net` or `google-analytics.com`), its `type` is dynamically changed to `text/plain` and execution is halted.
2. **Prototype Monkey-Patching**:
   ```typescript
   const originalCreateElement = document.createElement;
   document.createElement = function(tagName, options) {
     const element = originalCreateElement.call(document, tagName, options);
     if (tagName.toLowerCase() === 'script') {
       Object.defineProperty(element, 'src', {
         set(value) {
           if (isTrackerBlocked(value, currentConsentState)) {
             this.type = 'text/plain';
             this.setAttribute('data-userly-blocked-src', value);
             return;
           }
           this.setAttribute('src', value);
         }
       });
     }
     return element;
   };
   ```
3. **Storage & Cookie Proxying**:
   Overrides `document.cookie` setter and `localStorage.setItem` to prevent third-party scripts from writing non-essential cookies prior to explicit consent.
4. **Dynamic Unblocking**:
   When the visitor clicks **"Accept All"** or enables a category in Preferences, `userly.js` iterates over all blocked elements, restores `type="text/javascript"`, and executes them immediately without requiring a page reload.

### C. Regulatory Signals: GCM v2 & GPC (`gcm.ts`, `gpc.ts`)
- **Google Consent Mode v2**: Synchronizes all 7 parameters with `gtag`:
  ```typescript
  window.gtag('consent', 'update', {
    ad_storage: consent.advertisement ? 'granted' : 'denied',
    ad_user_data: consent.advertisement ? 'granted' : 'denied',
    ad_personalization: consent.advertisement ? 'granted' : 'denied',
    analytics_storage: consent.analytics ? 'granted' : 'denied',
    functionality_storage: consent.functional ? 'granted' : 'denied',
    personalization_storage: consent.functional ? 'granted' : 'denied',
    security_storage: 'granted'
  });
  ```
- **Global Privacy Control (GPC)**:
  ```typescript
  if (navigator.globalPrivacyControl === true) {
    // Automatically deny advertisement / sale of data under CCPA/CPRA
    consentState.advertisement = false;
  }
  ```

---

## 3. Backend & API Services (`apps/api/src/`)

### A. Configuration Cascading (`services/config.py`)
ConsentOS uses a 4-tier configuration hierarchy that cascades from top to bottom:
1. **System Defaults**: Baseline privacy-first configuration.
2. **Organization Level**: Global enterprise policies.
3. **Site Group Level**: Brand or portfolio-wide styling.
4. **Site Domain Level**: Website-specific banner titles, URLs, and custom CSS.
5. **Regional Override**: Dynamic geolocation rule (e.g. EU opt-in vs US opt-out).

### B. Compliance & Dark Pattern Validation Engine (`services/compliance.py`)
The backend validates banner configurations against European (GDPR, CNIL), American (CCPA/CPRA), and Brazilian (LGPD) legal criteria:
- **Rule 1 (Equal Prominence)**: Reject button must not have lesser visual prominence (e.g. grey outline vs bright green accept).
- **Rule 2 (No Pre-Ticked Boxes)**: Optional categories (`functional`, `analytics`, `advertisement`) must default to `false`.
- **Rule 3 (Proof of Consent)**: All consent decisions must generate a timestamped cryptographic audit record.
- **Rule 4 (Withdrawal Mechanism)**: Persistent floating revisit widget must be enabled.

---

## 4. Database Schema & Architecture (`apps/api/src/models/`)

ConsentOS uses PostgreSQL with a relational multi-tenant schema:

```sql
-- 1. Sites Table (Managed Websites)
CREATE TABLE sites (
    id VARCHAR(36) PRIMARY KEY,
    org_id VARCHAR(36) REFERENCES organisations(id) ON DELETE CASCADE,
    domain VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- 2. Hierarchical Site Configuration
CREATE TABLE site_configs (
    id VARCHAR(36) PRIMARY KEY,
    site_id VARCHAR(36) REFERENCES sites(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT TRUE,
    layout VARCHAR(50) DEFAULT 'bottom_bar', -- bottom_bar, floating_left, floating_right, center_modal
    theme VARCHAR(50) DEFAULT 'light',
    primary_color VARCHAR(50) DEFAULT '#1868db',
    border_radius VARCHAR(20) DEFAULT 'rounded-md',
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    privacy_policy_url VARCHAR(500),
    enable_gcm_v2 BOOLEAN DEFAULT TRUE,
    enable_gpc BOOLEAN DEFAULT TRUE,
    geo_targeting VARCHAR(50) DEFAULT 'all', -- all, eu_only, eu_us, us_only
    consent_version VARCHAR(20) DEFAULT '1.0',
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- 3. Discovered Cookie Catalogue (Scanner Results)
CREATE TABLE discovered_cookies (
    id VARCHAR(36) PRIMARY KEY,
    site_id VARCHAR(36) REFERENCES sites(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL, -- necessary, functional, analytics, performance, advertisement
    service_name VARCHAR(100),     -- Google Analytics, Meta Pixel, Hotjar
    duration VARCHAR(50),          -- 1 year, session, 3 months
    description TEXT,
    is_discovered BOOLEAN DEFAULT TRUE,
    last_detected_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- 4. Cryptographic Proof-of-Consent Receipts
CREATE TABLE consent_receipts (
    id VARCHAR(36) PRIMARY KEY,
    site_id VARCHAR(36) REFERENCES sites(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL,
    visitor_hash VARCHAR(64) NOT NULL, -- Salted SHA-256 (Zero PII)
    country VARCHAR(10),
    consent_version VARCHAR(20),
    necessary BOOLEAN DEFAULT TRUE,
    functional BOOLEAN DEFAULT FALSE,
    analytics BOOLEAN DEFAULT FALSE,
    performance BOOLEAN DEFAULT FALSE,
    advertisement BOOLEAN DEFAULT FALSE,
    interaction_type VARCHAR(50),     -- accept_all, reject_all, custom_preferences
    user_agent_category VARCHAR(50),  -- Desktop, Mobile, Tablet
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);
CREATE INDEX ix_consent_receipts_domain_created ON consent_receipts(domain, created_at);
```

---

## 5. Automated Scanner & Crawler (`apps/scanner/src/`)

The scanner automates website audits using headless **Playwright** browsers:

```
[Target URL] ───► [Playwright Crawler]
                         │
                         ├──► 1. Pre-Consent Scan (Detects unauthorized cookie leaks)
                         ├──► 2. DOM & Visual Inspection (Detects Dark Patterns & Color Asymmetry)
                         ├──► 3. Open Cookie Database Matcher (Categorizes 2,200+ signatures)
                         └──► 4. Post-Consent Scan (Validates script release upon 'Accept')
```

1. **Pre-Consent Leak Detection (`consent_validator.py`)**:
   Loads the target page in an isolated headless browser. Intercepts `page.on('response')` and `context.cookies()`. If any tracking cookie (e.g. `_ga` or `_fbp`) is set before clicking "Accept", it flags a **Critical Compliance Leak**.
2. **Open Cookie Database Classification (`classifier.py`)**:
   Matches discovered cookies against regex signatures:
   - `^_ga.*|^_gid$|^_gat.*` → **Google Analytics (Analytics)**
   - `^_fbp$|^_fbc$|^fr$` → **Meta Advertising (Advertisement)**
   - `^__stripe_.*|^__cf_bm$` → **Stripe / Cloudflare (Strictly Necessary)**
   - `^intercom-.*|^crisp-.*` → **Intercom / Crisp (Functional)**
3. **Dark Pattern Detector (`dark_pattern_detector.py`)**:
   Inspects button bounding boxes, computed font colors, and background contrasts to ensure the "Reject All" button is equally readable and accessible compared to "Accept All".

---

## 6. How We Modernize Userly to Match This Architecture

1. **Client Engine (`userly.js`)**:
   - Refactor banner DOM injection into a **Shadow DOM root** (`attachShadow({ mode: 'open' })`) for bulletproof styling.
   - Upgrade script interception to support both declarative (`type="text/plain"`) and dynamic runtime monkey-patching.
   - Add native `navigator.globalPrivacyControl` signal listener.
2. **Database Schema**:
   - Add `discovered_cookies` table and pre-load the 2,200+ Open Cookie Database registry into Neon PostgreSQL.
3. **Admin Studio (Next.js Dashboard)**:
   - Add live multi-state Shadow DOM preview with responsive device controls (Desktop, Mobile).
   - Add Dark Pattern validator warning indicators in Banner Studio.
   - Add automatic Cookie Scanner tab in the Consent section of Userly.
