# Contributing to UpFront

Thank you for your interest in contributing to **UpFront**! We welcome contributions from developers, designers, compliance researchers, and documentation writers of all experience levels.

UpFront is an open-source, privacy-first analytics and consent management platform licensed under the [Apache License 2.0](LICENSE).

---

## 🧭 Ways to Contribute

There are many ways you can help improve UpFront:
- **Reporting Bugs**: Let us know if something is broken or behaving unexpectedly.
- **Suggesting Features**: Propose new privacy frameworks, integrations, or UX enhancements.
- **Submitting Code**: Fix bugs, optimize tracker script size, or build new capabilities.
- **Improving Documentation**: Fix typos, add deployment guides, or improve code comments.
- **Translations & Localization**: Add or refine language translations in the Banner Studio and Policy Generator.

---

## 🛠️ Local Development Setup

UpFront is organized as a monorepo powered by **Turborepo** and **pnpm**.

### Prerequisites
- **Node.js**: `v20.x` or higher
- **pnpm**: `v9.x` or `v10.x` (`npm install -g pnpm`)
- **PostgreSQL**: PostgreSQL 15+ (local instance, Docker, or hosted like Supabase / Neon)
- **Git**

### Step-by-Step Setup

1. **Fork and Clone the Repository**
   ```bash
   git clone https://github.com/<your-username>/upfront.git
   cd upfront
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   ```
   Open `.env` and set your PostgreSQL connection string:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/upfront
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Start the Development Server**
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the landing page, or go directly to [http://localhost:3000/analytics](http://localhost:3000/analytics) to access the dashboard.

5. **Type Checking and Building**
   Before submitting code, ensure everything compiles cleanly:
   ```bash
   # Type check
   cd apps/web && npx tsc --noEmit

   # Full production build
   pnpm build
   ```

---

## 🌿 Git Branching & Workflow

1. **Create a Feature Branch**
   Always branch off `main`:
   ```bash
   git checkout -b feat/your-feature-name
   # or for bug fixes:
   git checkout -b fix/issue-description
   ```

2. **Commit Conventions**
   Write clear, concise commit messages following conventional commits:
   - `feat(analytics): add custom event aggregation`
   - `fix(banner): correct z-index in popup modal`
   - `docs(readme): clarify docker compose instructions`
   - `refactor(tracker): optimize script payload size`

3. **Keep Tracker Script Under 4KB**
   When making changes to client tracker files (`upfront.js`, `tracker.js`, `consentos.js`), please keep script weight minimal. Our Core Web Vitals guarantee depends on an ultra-lightweight client footprint.

---

## 📋 Pull Request (PR) Checklist

Before submitting your PR, please verify:
- [ ] Code follows TypeScript best practices with zero type errors (`npx tsc --noEmit`).
- [ ] The production build succeeds (`pnpm build`).
- [ ] No personal secrets, credentials, or `.env` files are committed.
- [ ] Your branch is rebased with the latest `main`.
- [ ] You have provided a clear description of changes and screenshots for UI updates.

---

## ⚖️ License & Developer Certificate of Origin

By contributing to UpFront, you agree that your contributions will be licensed under the project's [Apache License 2.0](LICENSE).
