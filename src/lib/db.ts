import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let _sql: NeonQueryFunction<false, false>;

export function getSQL() {
  if (!_sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql;
}

// Proxy target must be callable for tagged template usage (sql`...`)
// Using a function as target so the `apply` trap fires correctly.
export const sql = new Proxy(
  Object.assign(function () {} as unknown as NeonQueryFunction<false, false>),
  {
    apply(_target, thisArg, args) {
      return Reflect.apply(getSQL(), thisArg, args);
    },
    get(_target, prop) {
      return Reflect.get(getSQL(), prop);
    },
  }
);

/**
 * Initialize database schema. Call this from /api/db/init or at startup.
 * Safe to run multiple times (CREATE TABLE IF NOT EXISTS).
 */
export async function initSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email                   TEXT UNIQUE NOT NULL,
      name                    TEXT NOT NULL DEFAULT '',
      role                    TEXT NOT NULL DEFAULT 'user',
      plan                    TEXT NOT NULL DEFAULT 'free',
      stripe_customer_id      TEXT UNIQUE,
      stripe_subscription_id  TEXT UNIQUE,
      subscription_status     TEXT,
      created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // Idempotent: add columns if the table was created before this migration
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash          TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id     TEXT UNIQUE`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status    TEXT`;

  await sql`
    CREATE TABLE IF NOT EXISTS projects (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_email  TEXT NOT NULL,
      name        TEXT NOT NULL,
      prompt      TEXT NOT NULL DEFAULT '',
      code        TEXT NOT NULL DEFAULT '',
      template    TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS projects_user_email_idx ON projects (user_email)
  `;

  // ---- Hosting tables ----

  await sql`
    CREATE TABLE IF NOT EXISTS sites (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email       TEXT NOT NULL,
      name        TEXT NOT NULL,
      slug        TEXT UNIQUE NOT NULL,
      plan        TEXT NOT NULL DEFAULT 'free',
      status      TEXT NOT NULL DEFAULT 'active',
      settings    JSONB NOT NULL DEFAULT '{}',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS sites_email_idx ON sites (email)`;
  await sql`CREATE INDEX IF NOT EXISTS sites_slug_idx  ON sites (slug)`;

  await sql`
    CREATE TABLE IF NOT EXISTS deployments (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      site_id         UUID NOT NULL REFERENCES sites(id),
      environment     TEXT NOT NULL DEFAULT 'production',
      status          TEXT NOT NULL,
      url             TEXT,
      size            INTEGER,
      commit_message  TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`ALTER TABLE deployments ADD COLUMN IF NOT EXISTS code TEXT`;
  await sql`CREATE INDEX IF NOT EXISTS deployments_site_id_idx ON deployments (site_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS custom_domains (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      site_id     UUID NOT NULL REFERENCES sites(id),
      domain      TEXT UNIQUE NOT NULL,
      status      TEXT NOT NULL DEFAULT 'pending',
      ssl_status  TEXT NOT NULL DEFAULT 'pending',
      dns_records JSONB,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS custom_domains_site_id_idx ON custom_domains (site_id)`;
  await sql`CREATE INDEX IF NOT EXISTS custom_domains_domain_idx  ON custom_domains (domain)`;

  await sql`
    CREATE TABLE IF NOT EXISTS dns_records (
      id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      domain    TEXT NOT NULL,
      type      TEXT NOT NULL,
      name      TEXT NOT NULL,
      value     TEXT NOT NULL,
      ttl       INTEGER NOT NULL DEFAULT 3600,
      priority  INTEGER,
      proxied   BOOLEAN NOT NULL DEFAULT false
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS dns_records_domain_idx ON dns_records (domain)`;

  await sql`
    CREATE TABLE IF NOT EXISTS site_analytics (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      site_id     UUID NOT NULL,
      date        DATE NOT NULL,
      visitors    INTEGER NOT NULL DEFAULT 0,
      page_views  INTEGER NOT NULL DEFAULT 0,
      bandwidth   BIGINT NOT NULL DEFAULT 0,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS site_analytics_site_id_idx ON site_analytics (site_id)`;

  // ---- Usage tracking for monthly quotas ----

  await sql`
    CREATE TABLE IF NOT EXISTS usage_tracking (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email       TEXT NOT NULL,
      usage_type  TEXT NOT NULL,
      month       DATE NOT NULL,
      count       INTEGER NOT NULL DEFAULT 0,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (email, usage_type, month)
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS usage_tracking_email_idx ON usage_tracking (email)`;
}
