<div align="center">

# UpFront

**Privacy-First Web Analytics & Complete Consent Management Platform (CMP)**  
*Unified into a single lightweight script under 4KB. Cookieless, open-source, and self-hostable.*

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb?logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-1.0-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?logo=typescript)](https://www.typescriptlang.org/)

</div>

---

## 💡 What is UpFront?

Traditional websites typically install two separate tools:
1. **A web analytics service** (Google Analytics, Plausible, Umami) to track traffic and visitor metrics.
2. **A consent management platform** (OneTrust, Cookiebot, CookieYes) to display cookie banners and block tracking scripts for GDPR/ePrivacy compliance.

This fragmented approach bloats pages with multiple heavy scripts (often 50KB–200KB+), slows down page load performance, splits your team across separate dashboards, and carries expensive recurring subscriptions.

**UpFront solves this by unifying cookieless analytics and a full-featured Consent Management Platform into a single, self-hostable open-source script under 4KB.**

---

## 🔓 How UpFront Operates (Self-Hosted Model)

UpFront is designed as a single-tenant, privacy-first tool where **you own your server and data**:

- **🚀 Instant Access (No Signups or Paywalls)**: There is zero authentication friction. When you clone and run UpFront, you are automatically signed in as **Local Admin** (`admin@upfront.local`). There are no user registration forms, no email verifications, and no SaaS subscription tiers.
- **⚡ Direct to Dashboard**: You can navigate straight to `/analytics`, `/consent`, `/consent/studio`, or `/settings`. The default workspace is ready immediately.
- **🔓 100% Unlocked Features**: Every single capability—Banner Studio, Google Consent Mode v2, automated crawler cookie scanning, dynamic policy generation, multi-language localization, scheduled audits, and cryptographic consent receipts—is unlocked with **unlimited domains and zero quota limits**.
- **💾 PostgreSQL Storage**: Event data, consent receipts, and site configs are persisted directly to your own PostgreSQL database (configured via `DATABASE_URL` in `.env`). Tables and schemas migrate automatically on first boot.

---

## ✨ Key Features

### 📊 1. Privacy-First Cookieless Analytics
- **Zero Cookies for Measurement**: Analytics works out-of-the-box without setting cookies or persistent device identifiers.
- **Privacy-Preserving Visitor Hashing**: Visitors are counted using daily rotating cryptographic salts. Raw IP addresses are discarded in memory after country lookup and never stored on disk.
- **Real-Time Traffic Dashboard**: Live active visitor counter, pageviews, unique visitors, visit durations, and bounce rates.
- **Traffic Breakdowns**: Top referrers, search engines, social networks, entry/exit pages, UTM campaign parameters, countries, cities, browsers, operating systems, and device screen sizes.

### 🛡️ 2. Consent Management Platform (CMP)
- **Interactive Banner Studio**: Configure and live-preview cookie banners with customizable themes, brand colors, typography, borders, and position layouts.
- **Layout Variations**: Bottom Bar, Centered Box, and Modal Popup layouts.
- **Legal Framework Presets**: One-click configuration for **GDPR (EU)**, **ePrivacy**, **CCPA / CPRA (US/California)**, **LGPD (Brazil)**, and **DPDP (India)**.
- **Granular Category Controls**: Necessary, Functional, Analytics, Performance, and Advertisement categories with independent opt-in/opt-out toggles.
- **Script Auto-Blocking**: Automatically detects and blocks third-party tracking scripts (e.g., Google Tag Manager, Meta Pixel, Hotjar, TikTok) until visitors grant explicit consent.
- **Google Consent Mode v2 (GCM v2)**: Native support for `ad_storage`, `analytics_storage`, `ad_user_data`, and `ad_personalization`.
- **Global Privacy Control (GPC)**: Respects browser `navigator.globalPrivacyControl` signals automatically.
- **Revisit Preference Widget**: Floating badge enabling visitors to change or revoke their consent preferences at any time.

### 🕷️ 3. Automated Cookie Scanner & Crawler
- **Headless Browser Scanner**: Crawls your website to identify first-party and third-party cookies, `localStorage` entries, and external tracker scripts.
- **Automatic Classification**: Classifies discovered cookies against a built-in catalog into their corresponding consent categories.
- **Scheduled Scans**: Configure recurring automated audits (daily, weekly, monthly) to detect newly added tracker scripts and cookie changes.

### 📜 4. Dynamic Cookie Policy Generator
- Automatically generates an up-to-date, compliant Cookie Policy table from detected cookies.
- Embed via a lightweight JavaScript snippet or export as clean HTML/Markdown directly into your existing privacy page.

### 🔒 5. Cryptographic Proof of Consent & Audit Vault
- Logs anonymized, timestamped consent receipts with cryptographic hashes.
- Maintains compliance evidence for regulatory audits and data protection authorities.
- Filter, search, and export consent records.

### 🌐 6. Multi-Domain & Workspace Management
- Monitor and manage unlimited websites and domains from a single unified dashboard.
- Create separate workspaces to organize personal projects, client websites, or distinct teams.

---

## 🏗️ Architecture & Monorepo Structure

UpFront is structured as a modern monorepo powered by **Turborepo** and **pnpm**:

```
upfront/
├── apps/
│   ├── web/           # Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui dashboard & CMP runtime
│   │   ├── app/       # Application routes (dashboard, consent studio, analytics, API endpoints)
│   │   ├── components/# React UI components (Tabler dashboard, charts, scanner, Banner Studio)
│   │   ├── lib/       # Database pool, entitlements engine, cookie signatures, localization
│   │   └── public/    # Static assets, SVG logos, tracker script builds
│   └── api/           # Python FastAPI backend for high-throughput event ingestion & aggregation
│       ├── app/       # FastAPI app (FastAPI router, Pydantic schemas, geo IP, user-agent parsing)
│       └── tracker/   # Lightweight tracker runtime scripts
├── packages/
│   ├── ui/            # Shared shadcn/ui design system component library
│   ├── eslint-config/ # ESLint configurations
│   └── typescript-config/ # TypeScript configurations
├── scripts/           # Testing and scanner suite automation scripts
├── .env.example       # Environment variables template
└── LICENSE            # Apache License 2.0
```

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- **Node.js**: `v20.x` or higher
- **Package Manager**: `pnpm` (`v10.x` or `v9.x`)
- **Python**: `v3.11+` (for the optional high-throughput FastAPI ingestion service)
- **PostgreSQL**: PostgreSQL 15+ (local, Docker, or managed like Supabase / Neon)

### 1. Clone the Repository
```bash
git clone https://github.com/Abishekram03/usrly.git upfront
cd upfront
```

### 2. Configure Environment Variables
Copy the example environment file:
```bash
cp .env.example .env
```
Edit `.env` with your PostgreSQL database connection:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/upfront
NEXT_PUBLIC_APP_URL=http://localhost:3000
HASH_SALT=your_random_salt_here_for_privacy_hashing
```

### 3. Install Dependencies
```bash
pnpm install
```

### 4. Start the Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. Database tables and a default workspace are automatically provisioned on the first run.

---

## 📦 Adding UpFront to Your Website

Once UpFront is running, add a single line to the `<head>` of your website:

```html
<!-- UpFront Analytics & Consent Management Platform -->
<script 
  defer 
  src="https://your-upfront-domain.com/upfront.js" 
  data-domain="yourwebsite.com">
</script>
```

### Script Tag Options

| Attribute | Description | Example |
| :--- | :--- | :--- |
| `src` | URL to your hosted tracker script (`/upfront.js`) | `https://analytics.example.com/upfront.js` |
| `data-domain` | The registered domain name in your dashboard | `data-domain="mywebsite.com"` |
| `data-api` | Optional custom ingestion endpoint URL | `data-api="https://analytics.example.com/api/v1/event"` |

---

## 🔒 Privacy & Compliance Guarantees

UpFront is designed from the ground up for strict privacy regulations:
- **GDPR (General Data Protection Regulation - EU)**
- **ePrivacy Directive (EU Cookie Law)**
- **CCPA / CPRA (California Consumer Privacy Act)**
- **LGPD (Lei Geral de Proteção de Dados - Brazil)**
- **DPDP Act (Digital Personal Data Protection Act - India)**

### What UpFront Does NOT Do:
- ❌ Does **not** store raw visitor IP addresses.
- ❌ Does **not** place persistent tracking cookies for analytics.
- ❌ Does **not** track visitors across different domains or browsers.
- ❌ Does **not** sell, share, or monetize visitor data.

---

## 🤝 Contributing

We welcome community contributions, issues, and feature proposals! Please see our **[Contributing Guide](CONTRIBUTING.md)** for details on setting up your local environment, code conventions, and submitting pull requests.

---

## 📄 License

UpFront is free and open-source software licensed under the **[Apache License 2.0](LICENSE)**.

```
Copyright 2026 UpFront Contributors / Syft Technologies

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
```

---

<div align="center">
  <sub>Built with care by the UpFront community. If you find UpFront helpful, please consider giving us a star ⭐️ on GitHub!</sub>
</div>
