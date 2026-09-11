import { Pool } from "pg"

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:Abishek%40supabase1@db.rdmpzalrmvnqfqlpkrvu.supabase.co:5432/postgres"

// Clean postgresql+asyncpg:// if provided
const pgConnectionString = connectionString
  .replace("postgresql+asyncpg://", "postgresql://")
  .replace("postgres+asyncpg://", "postgresql://")

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

        -- Analytics & Consent Tables
        CREATE TABLE IF NOT EXISTS sites (
          id VARCHAR(36) PRIMARY KEY,
          domain VARCHAR(255) UNIQUE NOT NULL,
          timezone VARCHAR(64) DEFAULT 'UTC' NOT NULL,
          public BOOLEAN DEFAULT FALSE NOT NULL,
          user_id VARCHAR(64),
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
        );

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
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS ix_consent_receipts_domain_created ON consent_receipts(domain, created_at);
      `)
      tablesInitialized = true
    } finally {
      client.release()
    }
  } catch (err) {
    console.error("[Database] Failed to ensure tables in Supabase:", err)
  }
}
