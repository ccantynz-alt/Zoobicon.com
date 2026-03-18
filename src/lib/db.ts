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
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider          TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider_id       TEXT`;

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

  // ---- Agency tables ----

  await sql`
    CREATE TABLE IF NOT EXISTS agencies (
      id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name              VARCHAR(255) NOT NULL,
      slug              VARCHAR(255) UNIQUE NOT NULL,
      owner_email       VARCHAR(255) NOT NULL,
      plan              VARCHAR(50) DEFAULT 'starter',
      status            VARCHAR(50) DEFAULT 'active',
      brand_config      JSONB DEFAULT '{}',
      settings          JSONB DEFAULT '{}',
      stripe_customer_id VARCHAR(255),
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS agencies_owner_email_idx ON agencies (owner_email)`;
  await sql`CREATE INDEX IF NOT EXISTS agencies_slug_idx ON agencies (slug)`;

  await sql`
    CREATE TABLE IF NOT EXISTS agency_members (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agency_id   UUID REFERENCES agencies(id) ON DELETE CASCADE,
      email       VARCHAR(255) NOT NULL,
      name        VARCHAR(255),
      role        VARCHAR(50) DEFAULT 'designer',
      status      VARCHAR(50) DEFAULT 'active',
      invited_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      joined_at   TIMESTAMPTZ,
      UNIQUE(agency_id, email)
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS agency_members_agency_id_idx ON agency_members (agency_id)`;
  await sql`CREATE INDEX IF NOT EXISTS agency_members_email_idx ON agency_members (email)`;

  await sql`
    CREATE TABLE IF NOT EXISTS agency_clients (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agency_id   UUID REFERENCES agencies(id) ON DELETE CASCADE,
      name        VARCHAR(255) NOT NULL,
      email       VARCHAR(255),
      company     VARCHAR(255),
      status      VARCHAR(50) DEFAULT 'active',
      notes       TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS agency_clients_agency_id_idx ON agency_clients (agency_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS agency_client_sites (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agency_id       UUID REFERENCES agencies(id) ON DELETE CASCADE,
      client_id       UUID REFERENCES agency_clients(id) ON DELETE CASCADE,
      site_id         UUID REFERENCES sites(id) ON DELETE CASCADE,
      status          VARCHAR(50) DEFAULT 'active',
      approval_status VARCHAR(50) DEFAULT 'draft',
      approved_at     TIMESTAMPTZ,
      approved_by     TEXT,
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS agency_client_sites_agency_id_idx ON agency_client_sites (agency_id)`;
  await sql`CREATE INDEX IF NOT EXISTS agency_client_sites_client_id_idx ON agency_client_sites (client_id)`;

  // Add approval columns if table already exists (migration)
  await sql`ALTER TABLE agency_client_sites ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'draft'`;
  await sql`ALTER TABLE agency_client_sites ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ`;
  await sql`ALTER TABLE agency_client_sites ADD COLUMN IF NOT EXISTS approved_by TEXT`;
  await sql`ALTER TABLE agency_client_sites ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`;

  await sql`
    CREATE TABLE IF NOT EXISTS bulk_jobs (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agency_id       UUID REFERENCES agencies(id) ON DELETE CASCADE,
      status          VARCHAR(50) DEFAULT 'pending',
      total_count     INTEGER DEFAULT 0,
      completed_count INTEGER DEFAULT 0,
      failed_count    INTEGER DEFAULT 0,
      input_data      JSONB NOT NULL,
      results         JSONB DEFAULT '[]',
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at    TIMESTAMPTZ
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS bulk_jobs_agency_id_idx ON bulk_jobs (agency_id)`;

  // Agency generation tracking (monthly quotas)
  await sql`
    CREATE TABLE IF NOT EXISTS agency_generations (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agency_id       UUID REFERENCES agencies(id) ON DELETE CASCADE,
      user_email      TEXT NOT NULL,
      generator_type  TEXT,
      period          TEXT NOT NULL,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS agency_generations_agency_period_idx ON agency_generations (agency_id, period)`;

  // ---- Real-time collaboration tables ----
  await sql`
    CREATE TABLE IF NOT EXISTS collab_rooms (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug            TEXT NOT NULL,
      owner_email     TEXT NOT NULL,
      invite_code     VARCHAR(10) UNIQUE NOT NULL,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS collab_rooms_slug_idx ON collab_rooms (slug)`;
  await sql`CREATE INDEX IF NOT EXISTS collab_rooms_invite_idx ON collab_rooms (invite_code)`;

  await sql`
    CREATE TABLE IF NOT EXISTS collab_participants (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      room_id         UUID REFERENCES collab_rooms(id) ON DELETE CASCADE,
      user_email      TEXT NOT NULL,
      user_name       TEXT NOT NULL DEFAULT '',
      color           VARCHAR(20) NOT NULL DEFAULT '#3b82f6',
      cursor_x        REAL,
      cursor_y        REAL,
      cursor_element  TEXT,
      last_heartbeat  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      is_active       BOOLEAN NOT NULL DEFAULT true,
      joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS collab_participants_room_idx ON collab_participants (room_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS collab_code_sync (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      room_id         UUID REFERENCES collab_rooms(id) ON DELETE CASCADE UNIQUE,
      html            TEXT NOT NULL DEFAULT '',
      version         INTEGER NOT NULL DEFAULT 1,
      updated_by      TEXT NOT NULL DEFAULT '',
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // ---- Email platform tables (zoobicon.io) ----

  await sql`
    CREATE TABLE IF NOT EXISTS email_domains (
      id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      domain              TEXT UNIQUE NOT NULL,
      user_email          TEXT NOT NULL,
      status              VARCHAR(20) NOT NULL DEFAULT 'pending',
      verification_token  TEXT,
      dkim_tokens         JSONB DEFAULT '[]',
      spf_record          TEXT,
      dmarc_record        TEXT,
      required_records    JSONB DEFAULT '[]',
      created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      verified_at         TIMESTAMPTZ
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS email_domains_user_email_idx ON email_domains (user_email)`;

  await sql`
    CREATE TABLE IF NOT EXISTS email_mailboxes (
      id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      address           TEXT UNIQUE NOT NULL,
      domain            TEXT NOT NULL,
      local_part        TEXT NOT NULL,
      display_name      TEXT NOT NULL DEFAULT '',
      forward_to        TEXT,
      auto_reply        TEXT,
      status            VARCHAR(20) NOT NULL DEFAULT 'active',
      storage_used_mb   INTEGER NOT NULL DEFAULT 0,
      storage_limit_mb  INTEGER NOT NULL DEFAULT 1000,
      user_email        TEXT NOT NULL,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS email_mailboxes_user_email_idx ON email_mailboxes (user_email)`;
  await sql`CREATE INDEX IF NOT EXISTS email_mailboxes_domain_idx ON email_mailboxes (domain)`;

  await sql`
    CREATE TABLE IF NOT EXISTS email_inbound (
      id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      mailbox_address   TEXT NOT NULL,
      from_address      TEXT NOT NULL,
      to_address        TEXT NOT NULL,
      subject           TEXT,
      text_body         TEXT,
      html_body         TEXT,
      headers           JSONB DEFAULT '{}',
      received_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      size              INTEGER NOT NULL DEFAULT 0,
      read              BOOLEAN NOT NULL DEFAULT false,
      folder            VARCHAR(20) NOT NULL DEFAULT 'inbox'
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS email_inbound_mailbox_idx ON email_inbound (mailbox_address)`;
  await sql`CREATE INDEX IF NOT EXISTS email_inbound_received_idx ON email_inbound (received_at)`;

  await sql`
    CREATE TABLE IF NOT EXISTS email_events (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      message_id  TEXT NOT NULL,
      type        VARCHAR(20) NOT NULL,
      domain      TEXT NOT NULL,
      recipient   TEXT,
      timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      metadata    JSONB DEFAULT '{}'
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS email_events_domain_idx ON email_events (domain)`;
  await sql`CREATE INDEX IF NOT EXISTS email_events_timestamp_idx ON email_events (timestamp)`;

  // ---- Domain reseller tables (Tucows/OpenSRS) ----

  await sql`
    CREATE TABLE IF NOT EXISTS registered_domains (
      id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      domain              TEXT UNIQUE NOT NULL,
      user_email          TEXT NOT NULL,
      status              VARCHAR(20) NOT NULL DEFAULT 'active',
      registered_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at          TIMESTAMPTZ NOT NULL,
      auto_renew          BOOLEAN NOT NULL DEFAULT true,
      privacy_protection  BOOLEAN NOT NULL DEFAULT true,
      nameservers         JSONB DEFAULT '["ns1.zoobicon.io", "ns2.zoobicon.io"]'
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS registered_domains_user_email_idx ON registered_domains (user_email)`;

  // ---- Support tickets (replaces in-memory demo) ----

  await sql`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ticket_number   TEXT UNIQUE NOT NULL,
      subject         TEXT NOT NULL,
      from_email      TEXT NOT NULL,
      from_name       TEXT NOT NULL DEFAULT '',
      status          VARCHAR(20) NOT NULL DEFAULT 'open',
      priority        VARCHAR(20) NOT NULL DEFAULT 'medium',
      assignee        TEXT,
      tags            JSONB DEFAULT '[]',
      ai_confidence   REAL,
      ai_auto_replied BOOLEAN NOT NULL DEFAULT false,
      mailgun_message_id TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS support_tickets_status_idx ON support_tickets (status)`;
  await sql`CREATE INDEX IF NOT EXISTS support_tickets_from_email_idx ON support_tickets (from_email)`;

  await sql`
    CREATE TABLE IF NOT EXISTS support_messages (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ticket_id   UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
      sender      VARCHAR(20) NOT NULL,
      body_text   TEXT,
      body_html   TEXT,
      attachments JSONB DEFAULT '[]',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS support_messages_ticket_id_idx ON support_messages (ticket_id)`;

  // ---- Email outbox (sent emails) ----

  await sql`
    CREATE TABLE IF NOT EXISTS email_outbound (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      from_address    TEXT NOT NULL,
      to_address      TEXT NOT NULL,
      subject         TEXT NOT NULL,
      body_text       TEXT,
      body_html       TEXT,
      status          VARCHAR(20) NOT NULL DEFAULT 'sent',
      mailgun_id      TEXT,
      ticket_id       UUID REFERENCES support_tickets(id),
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS email_outbound_ticket_id_idx ON email_outbound (ticket_id)`;

  // ---- Knowledge base for AI support ----

  await sql`
    CREATE TABLE IF NOT EXISTS knowledge_base (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title       TEXT NOT NULL,
      category    VARCHAR(50) NOT NULL DEFAULT 'general',
      content     TEXT NOT NULL,
      keywords    JSONB DEFAULT '[]',
      is_active   BOOLEAN NOT NULL DEFAULT true,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS knowledge_base_category_idx ON knowledge_base (category)`;

  // ---- Live support usage tracking ----

  await sql`
    CREATE TABLE IF NOT EXISTS support_usage (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_email      TEXT NOT NULL,
      month           TEXT NOT NULL,
      minutes_used    REAL NOT NULL DEFAULT 0,
      tokens_used     INTEGER NOT NULL DEFAULT 0,
      sessions_count  INTEGER NOT NULL DEFAULT 0,
      plan_at_time    VARCHAR(50) NOT NULL DEFAULT 'free',
      addon_premium   BOOLEAN NOT NULL DEFAULT false,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_email, month)
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS support_usage_user_month_idx ON support_usage (user_email, month)`;

  await sql`
    CREATE TABLE IF NOT EXISTS support_sessions (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_email      TEXT NOT NULL,
      started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ended_at        TIMESTAMPTZ,
      duration_secs   INTEGER NOT NULL DEFAULT 0,
      messages_count  INTEGER NOT NULL DEFAULT 0,
      tokens_used     INTEGER NOT NULL DEFAULT 0,
      status          VARCHAR(20) NOT NULL DEFAULT 'active'
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS support_sessions_user_email_idx ON support_sessions (user_email)`;
  await sql`CREATE INDEX IF NOT EXISTS support_sessions_status_idx ON support_sessions (status)`;

}
