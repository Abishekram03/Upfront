import { Pool } from "pg"

const rawConnectionString = process.env.DATABASE_URL || ""

// Function to normalize any Supabase connection URL (handling IPv6 direct hosts and unencoded @ in password)
function normalizeDatabaseUrl(url: string): string {
  let clean = url
    .trim()
    .replace(/^postgres\+asyncpg:\/\//, "postgresql://")
    .replace(/^postgresql\+asyncpg:\/\//, "postgresql://")

  try {
    // Check if URL starts with postgresql:// or postgres://
    const protoMatch = clean.match(/^postgres(?:ql)?:\/\//)
    if (!protoMatch || !protoMatch[0]) return clean

    const proto = protoMatch[0]
    const rest = clean.slice(proto.length)

    // Find the last '@' which precedes the host/port/db
    const lastAtIndex = rest.lastIndexOf("@")
    if (lastAtIndex === -1) return clean

    const authPart = rest.slice(0, lastAtIndex) // e.g. postgres:Abishek@supabase1 or postgres.rdmpzalrmvnqfqlpkrvu:Abishek%40supabase1
    const hostDbPart = rest.slice(lastAtIndex + 1) // e.g. db.rdmpzalrmvnqfqlpkrvu.supabase.co:5432/postgres

    // Split user:pass on FIRST ':'
    const firstColon = authPart.indexOf(":")
    let user = firstColon !== -1 ? authPart.slice(0, firstColon) : authPart
    let rawPass = firstColon !== -1 ? authPart.slice(firstColon + 1) : ""

    // Decode first in case partially encoded, then properly encode password
    let pass = encodeURIComponent(decodeURIComponent(rawPass))

    // Check if host is direct Supabase (IPv6)
    if (hostDbPart.includes("supabase.co")) {
      const projectMatch = hostDbPart.match(/(?:db\.)?([a-z0-9_-]+)\.supabase\.co/i)
      const projectRef = (projectMatch && projectMatch[1]) ? projectMatch[1] : "rdmpzalrmvnqfqlpkrvu"

      if (user === "postgres") {
        user = `postgres.${projectRef}`
      }

      // Extract db name (e.g. /postgres)
      const slashIndex = hostDbPart.indexOf("/")
      const dbName = slashIndex !== -1 ? hostDbPart.slice(slashIndex + 1) : "postgres"

      return `postgresql://${user}:${pass}@aws-0-eu-central-1.pooler.supabase.com:5432/${dbName}`
    }

    return `postgresql://${user}:${pass}@${hostDbPart}`
  } catch (e) {
    console.error("[Database] Error normalizing connection URL:", e)
    return clean
  }
}

let pgConnectionString = normalizeDatabaseUrl(rawConnectionString)

declare global {
  var _pgPool: Pool | undefined
}

export const pool =
  global._pgPool ||
  new Pool({
    connectionString: pgConnectionString,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
  })

export const db = pool

if (process.env.NODE_ENV !== "production") {
  global._pgPool = pool
}

let tablesInitialized = false

export async function ensureTables() {
  if (tablesInitialized) return
  try {
    const client = await pool.connect()
    try {
      await client.query(`
        -- Better Auth Tables
        CREATE TABLE IF NOT EXISTS "user" (
          "id" TEXT PRIMARY KEY,
          "name" TEXT NOT NULL,
          "email" TEXT UNIQUE NOT NULL,
          "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
          "image" TEXT,
          "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
          "twoFactorEnabled" BOOLEAN DEFAULT FALSE
        );

        CREATE TABLE IF NOT EXISTS "session" (
          "id" TEXT PRIMARY KEY,
          "expiresAt" TIMESTAMP NOT NULL,
          "token" TEXT UNIQUE NOT NULL,
          "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
          "ipAddress" TEXT,
          "userAgent" TEXT,
          "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS "account" (
          "id" TEXT PRIMARY KEY,
          "accountId" TEXT NOT NULL,
          "providerId" TEXT NOT NULL,
          "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
          "accessToken" TEXT,
          "refreshToken" TEXT,
          "idToken" TEXT,
          "accessTokenExpiresAt" TIMESTAMP,
          "refreshTokenExpiresAt" TIMESTAMP,
          "scope" TEXT,
          "password" TEXT,
          "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS "verification" (
          "id" TEXT PRIMARY KEY,
          "identifier" TEXT NOT NULL,
          "value" TEXT NOT NULL,
          "expiresAt" TIMESTAMP NOT NULL,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS "twoFactor" (
          "id" TEXT PRIMARY KEY,
          "secret" TEXT NOT NULL,
          "backupCodes" TEXT NOT NULL,
          "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
        );

        -- Multi-Tenant Workspaces Tables
        CREATE TABLE IF NOT EXISTS workspaces (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(255) UNIQUE NOT NULL,
          owner_id VARCHAR(64) NOT NULL,
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS workspace_members (
          id VARCHAR(36) PRIMARY KEY,
          workspace_id VARCHAR(36) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
          user_id VARCHAR(64) NOT NULL,
          role VARCHAR(50) DEFAULT 'member' NOT NULL,
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
          UNIQUE(workspace_id, user_id)
        );

        CREATE INDEX IF NOT EXISTS ix_workspace_members_user ON workspace_members(user_id);
        CREATE INDEX IF NOT EXISTS ix_workspaces_owner ON workspaces(owner_id);

        -- Analytics & Consent Tables
        CREATE TABLE IF NOT EXISTS sites (
          id VARCHAR(36) PRIMARY KEY,
          domain VARCHAR(255) UNIQUE NOT NULL,
          timezone VARCHAR(64) DEFAULT 'UTC' NOT NULL,
          public BOOLEAN DEFAULT FALSE NOT NULL,
          user_id VARCHAR(64),
          workspace_id VARCHAR(36),
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
        );

        ALTER TABLE sites ADD COLUMN IF NOT EXISTS user_id VARCHAR(64);
        ALTER TABLE sites ADD COLUMN IF NOT EXISTS workspace_id VARCHAR(36);
        CREATE INDEX IF NOT EXISTS ix_sites_workspace ON sites(workspace_id);

        CREATE TABLE IF NOT EXISTS sessions (
          id VARCHAR(36) PRIMARY KEY,
          site_id VARCHAR(36) NOT NULL,
          hostname VARCHAR(255) NOT NULL,
          visitor_hash VARCHAR(64) NOT NULL,
          entry_page VARCHAR(500),
          exit_page VARCHAR(500),
          referrer VARCHAR(500),
          referrer_source VARCHAR(100),
          country VARCHAR(10),
          city VARCHAR(100),
          device VARCHAR(50),
          browser VARCHAR(50),
          os VARCHAR(50),
          duration INTEGER DEFAULT 0 NOT NULL,
          pageviews_count INTEGER DEFAULT 1 NOT NULL,
          is_bounce BOOLEAN DEFAULT TRUE NOT NULL,
          started_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
          last_activity_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
        );

        CREATE INDEX IF NOT EXISTS ix_session_site_started ON sessions(site_id, started_at);
        CREATE INDEX IF NOT EXISTS ix_session_site_hash_started ON sessions(site_id, visitor_hash, started_at);

        CREATE TABLE IF NOT EXISTS pageviews (
          id VARCHAR(36) PRIMARY KEY,
          site_id VARCHAR(36) NOT NULL,
          session_id VARCHAR(36) NOT NULL,
          pathname VARCHAR(500) NOT NULL,
          search_query VARCHAR(500),
          timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
        );

        CREATE INDEX IF NOT EXISTS ix_pageview_site_timestamp ON pageviews(site_id, timestamp);
        CREATE INDEX IF NOT EXISTS ix_pageview_site_path_timestamp ON pageviews(site_id, pathname, timestamp);

        CREATE TABLE IF NOT EXISTS consent_configs (
          id VARCHAR(36) PRIMARY KEY,
          site_id VARCHAR(36),
          domain VARCHAR(255) UNIQUE NOT NULL,
          is_enabled BOOLEAN DEFAULT TRUE,
          layout VARCHAR(50) DEFAULT 'bottom_bar',
          theme VARCHAR(50) DEFAULT 'light',
          primary_color VARCHAR(50) DEFAULT '#1868db',
          border_radius VARCHAR(20) DEFAULT 'rounded-md',
          title VARCHAR(255) DEFAULT 'We value your privacy',
          description TEXT DEFAULT 'We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking ''Accept All'', you consent to our use of cookies.',
          privacy_policy_url VARCHAR(500) DEFAULT '/privacy',
          accept_all_label VARCHAR(100) DEFAULT 'Accept All',
          reject_all_label VARCHAR(100) DEFAULT 'Reject All',
          preferences_label VARCHAR(100) DEFAULT 'Customise',
          enable_necessary_category BOOLEAN DEFAULT TRUE,
          enable_functional_category BOOLEAN DEFAULT TRUE,
          enable_analytics_category BOOLEAN DEFAULT TRUE,
          enable_performance_category BOOLEAN DEFAULT TRUE,
          enable_advertisement_category BOOLEAN DEFAULT TRUE,
          show_revisit_button BOOLEAN DEFAULT TRUE,
          revisit_button_position VARCHAR(50) DEFAULT 'bottom_left',
          enable_consent_mode_v2 BOOLEAN DEFAULT TRUE,
          geo_targeting VARCHAR(50) DEFAULT 'all',
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS consent_receipts (
          id VARCHAR(36) PRIMARY KEY,
          site_id VARCHAR(36),
          domain VARCHAR(255) NOT NULL,
          visitor_hash VARCHAR(64) NOT NULL,
          country VARCHAR(10),
          consent_given BOOLEAN DEFAULT TRUE,
          necessary BOOLEAN DEFAULT TRUE,
          functional BOOLEAN DEFAULT FALSE,
          analytics BOOLEAN DEFAULT FALSE,
          performance BOOLEAN DEFAULT FALSE,
          advertisement BOOLEAN DEFAULT FALSE,
          user_agent_category VARCHAR(50) DEFAULT 'Desktop',
          consent_version VARCHAR(20) DEFAULT '1.0',
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS ix_consent_receipts_domain_created ON consent_receipts(domain, created_at);

        -- Safe Schema Migrations
        ALTER TABLE consent_configs ADD COLUMN IF NOT EXISTS consent_version VARCHAR(20) DEFAULT '1.0';
        ALTER TABLE consent_configs ADD COLUMN IF NOT EXISTS enable_gpc BOOLEAN DEFAULT TRUE;
        ALTER TABLE consent_configs ADD COLUMN IF NOT EXISTS preferences_title VARCHAR(255) DEFAULT 'Customise Consent Preferences';
        ALTER TABLE consent_configs ADD COLUMN IF NOT EXISTS preferences_description TEXT;
        ALTER TABLE consent_configs ADD COLUMN IF NOT EXISTS save_preferences_label VARCHAR(100) DEFAULT 'Save My Preferences';
        ALTER TABLE consent_configs ADD COLUMN IF NOT EXISTS always_active_label VARCHAR(100) DEFAULT 'Always Active';
        ALTER TABLE consent_configs ADD COLUMN IF NOT EXISTS no_cookies_to_display_label VARCHAR(100) DEFAULT 'No cookies to display';
        ALTER TABLE consent_configs ADD COLUMN IF NOT EXISTS cookie_column_label VARCHAR(100) DEFAULT 'Cookie';
        ALTER TABLE consent_configs ADD COLUMN IF NOT EXISTS duration_column_label VARCHAR(100) DEFAULT 'Duration';
        ALTER TABLE consent_configs ADD COLUMN IF NOT EXISTS description_column_label VARCHAR(100) DEFAULT 'Description';
        ALTER TABLE consent_configs ADD COLUMN IF NOT EXISTS custom_css TEXT;
        ALTER TABLE consent_configs ADD COLUMN IF NOT EXISTS law_template VARCHAR(50) DEFAULT 'gdpr';
        ALTER TABLE consent_receipts ADD COLUMN IF NOT EXISTS consent_version VARCHAR(20) DEFAULT '1.0';
        ALTER TABLE discovered_cookies ADD COLUMN IF NOT EXISTS script_pattern_regex TEXT;
        ALTER TABLE discovered_cookies ADD COLUMN IF NOT EXISTS discovery_source VARCHAR(50) DEFAULT 'http_set_cookie';
        ALTER TABLE discovered_cookies ADD COLUMN IF NOT EXISTS path VARCHAR(255) DEFAULT '/';
        ALTER TABLE discovered_cookies ADD COLUMN IF NOT EXISTS is_secure BOOLEAN DEFAULT FALSE;
        ALTER TABLE discovered_cookies ADD COLUMN IF NOT EXISTS is_http_only BOOLEAN DEFAULT FALSE;
        ALTER TABLE discovered_cookies ADD COLUMN IF NOT EXISTS same_site VARCHAR(50);
        ALTER TABLE scans ADD COLUMN IF NOT EXISTS scan_type VARCHAR(50) DEFAULT 'hybrid';
        ALTER TABLE scans ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITHOUT TIME ZONE;
        ALTER TABLE scans ADD COLUMN IF NOT EXISTS error_message TEXT;

        -- Discovered Cookies from Scanner
        CREATE TABLE IF NOT EXISTS discovered_cookies (
          id VARCHAR(36) PRIMARY KEY,
          site_id VARCHAR(36),
          domain VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          category VARCHAR(50) NOT NULL,
          service_name VARCHAR(100),
          duration VARCHAR(50),
          description TEXT,
          confidence VARCHAR(20) DEFAULT 'high',
          status VARCHAR(50) DEFAULT 'detected',
          first_detected_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
          last_detected_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS ix_discovered_cookies_domain ON discovered_cookies(domain);

        -- Scan Run Audit History
        CREATE TABLE IF NOT EXISTS scans (
          id VARCHAR(36) PRIMARY KEY,
          site_id VARCHAR(36),
          domain VARCHAR(255) NOT NULL,
          status VARCHAR(50) DEFAULT 'completed',
          cookies_found INTEGER DEFAULT 0,
          scripts_found INTEGER DEFAULT 0,
          leaks_found INTEGER DEFAULT 0,
          dark_patterns_found INTEGER DEFAULT 0,
          findings JSONB DEFAULT '[]'::jsonb,
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS ix_scans_domain_created ON scans(domain, created_at);

        -- Consent Working Drafts (Isolated from Production Runtime)
        CREATE TABLE IF NOT EXISTS consent_drafts (
          id VARCHAR(36) PRIMARY KEY,
          domain VARCHAR(255) UNIQUE NOT NULL,
          site_id VARCHAR(36),
          base_version VARCHAR(20) DEFAULT '1.0',
          draft_config JSONB NOT NULL,
          updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
          updated_by VARCHAR(64)
        );
        CREATE INDEX IF NOT EXISTS ix_consent_drafts_domain ON consent_drafts(domain);

        -- Consent Immutable Published Versions Audit History
        CREATE TABLE IF NOT EXISTS consent_versions (
          id VARCHAR(36) PRIMARY KEY,
          domain VARCHAR(255) NOT NULL,
          site_id VARCHAR(36),
          version VARCHAR(20) NOT NULL,
          config JSONB NOT NULL,
          change_summary JSONB DEFAULT '[]'::jsonb,
          published_by VARCHAR(64),
          published_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
          previous_version VARCHAR(20),
          UNIQUE(domain, version)
        );
        CREATE INDEX IF NOT EXISTS ix_consent_versions_domain_pub ON consent_versions(domain, published_at DESC);

        -- Cookie Policy Published Configuration
        CREATE TABLE IF NOT EXISTS cookie_policies (
          id VARCHAR(36) PRIMARY KEY,
          site_id VARCHAR(36),
          domain VARCHAR(255) UNIQUE NOT NULL,
          company_name VARCHAR(255) NOT NULL DEFAULT 'Acme Corporation',
          website_url VARCHAR(500) NOT NULL DEFAULT '',
          contact_email VARCHAR(255) NOT NULL DEFAULT 'privacy@example.com',
          effective_date VARCHAR(50) NOT NULL DEFAULT '',
          law_template VARCHAR(50) DEFAULT 'gdpr',
          enable_gpc_clause BOOLEAN DEFAULT TRUE,
          enable_gcm_clause BOOLEAN DEFAULT TRUE,
          custom_clauses JSONB DEFAULT '[]'::jsonb,
          is_published BOOLEAN DEFAULT TRUE,
          policy_version VARCHAR(20) DEFAULT '1.0',
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
          published_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
          published_by VARCHAR(64)
        );
        CREATE INDEX IF NOT EXISTS ix_cookie_policies_domain ON cookie_policies(domain);

        -- Cookie Policy Working Drafts
        CREATE TABLE IF NOT EXISTS cookie_policy_drafts (
          id VARCHAR(36) PRIMARY KEY,
          domain VARCHAR(255) UNIQUE NOT NULL,
          site_id VARCHAR(36),
          base_version VARCHAR(20) DEFAULT '1.0',
          draft_config JSONB NOT NULL,
          updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
          updated_by VARCHAR(64)
        );
        CREATE INDEX IF NOT EXISTS ix_cookie_policy_drafts_domain ON cookie_policy_drafts(domain);
      `)
      tablesInitialized = true
    } finally {
      client.release()
    }
  } catch (err) {
    console.error("[Database] Failed to ensure tables in Supabase:", err)
  }
}
