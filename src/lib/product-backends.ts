/**
 * Real Database Backends for CRM, Email Marketing, Invoicing, Analytics
 *
 * These products currently show 100% hardcoded mock data.
 * This module provides REAL database tables and CRUD operations.
 * Once the tables are created (via /api/db/init), the product pages
 * can switch from mock data to real data.
 */

import { sql } from "./db";

// ═══════════════════════════════════════════════════════
// CRM (#26)
// ═══════════════════════════════════════════════════════

export async function ensureCRMTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS crm_contacts (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_email     TEXT NOT NULL,
      name            TEXT NOT NULL,
      email           TEXT,
      phone           TEXT,
      company         TEXT,
      status          TEXT NOT NULL DEFAULT 'lead',
      source          TEXT,
      notes           TEXT,
      tags            JSONB DEFAULT '[]',
      custom_fields   JSONB DEFAULT '{}',
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS crm_contacts_owner_idx ON crm_contacts (owner_email)`;
  await sql`CREATE INDEX IF NOT EXISTS crm_contacts_status_idx ON crm_contacts (status)`;

  await sql`
    CREATE TABLE IF NOT EXISTS crm_deals (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_email     TEXT NOT NULL,
      contact_id      UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
      title           TEXT NOT NULL,
      value           DECIMAL(12,2) DEFAULT 0,
      stage           TEXT NOT NULL DEFAULT 'lead',
      probability     INTEGER DEFAULT 0,
      expected_close  DATE,
      notes           TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS crm_deals_owner_idx ON crm_deals (owner_email)`;
  await sql`CREATE INDEX IF NOT EXISTS crm_deals_stage_idx ON crm_deals (stage)`;

  await sql`
    CREATE TABLE IF NOT EXISTS crm_activities (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_email     TEXT NOT NULL,
      contact_id      UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
      deal_id         UUID REFERENCES crm_deals(id) ON DELETE CASCADE,
      type            TEXT NOT NULL,
      description     TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS crm_activities_contact_idx ON crm_activities (contact_id)`;
}

export async function getCRMContacts(ownerEmail: string, status?: string) {
  if (status) {
    return sql`SELECT * FROM crm_contacts WHERE owner_email = ${ownerEmail} AND status = ${status} ORDER BY updated_at DESC`;
  }
  return sql`SELECT * FROM crm_contacts WHERE owner_email = ${ownerEmail} ORDER BY updated_at DESC`;
}

export async function createCRMContact(ownerEmail: string, data: Record<string, unknown>) {
  const [contact] = await sql`
    INSERT INTO crm_contacts (owner_email, name, email, phone, company, status, source, notes)
    VALUES (${ownerEmail}, ${data.name as string}, ${data.email as string || null}, ${data.phone as string || null},
            ${data.company as string || null}, ${data.status as string || 'lead'}, ${data.source as string || null}, ${data.notes as string || null})
    RETURNING *
  `;
  return contact;
}

export async function getCRMDeals(ownerEmail: string, stage?: string) {
  if (stage) {
    return sql`SELECT d.*, c.name as contact_name FROM crm_deals d LEFT JOIN crm_contacts c ON d.contact_id = c.id WHERE d.owner_email = ${ownerEmail} AND d.stage = ${stage} ORDER BY d.updated_at DESC`;
  }
  return sql`SELECT d.*, c.name as contact_name FROM crm_deals d LEFT JOIN crm_contacts c ON d.contact_id = c.id WHERE d.owner_email = ${ownerEmail} ORDER BY d.updated_at DESC`;
}

// ═══════════════════════════════════════════════════════
// EMAIL MARKETING (#27)
// ═══════════════════════════════════════════════════════

export async function ensureEmailMarketingTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS email_subscribers (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_email     TEXT NOT NULL,
      email           TEXT NOT NULL,
      name            TEXT,
      status          TEXT NOT NULL DEFAULT 'active',
      tags            JSONB DEFAULT '[]',
      subscribed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      unsubscribed_at TIMESTAMPTZ,
      UNIQUE(owner_email, email)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS email_subs_owner_idx ON email_subscribers (owner_email)`;

  await sql`
    CREATE TABLE IF NOT EXISTS email_campaigns (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_email     TEXT NOT NULL,
      name            TEXT NOT NULL,
      subject         TEXT NOT NULL,
      body_html       TEXT,
      body_text       TEXT,
      status          TEXT NOT NULL DEFAULT 'draft',
      sent_count      INTEGER DEFAULT 0,
      open_count      INTEGER DEFAULT 0,
      click_count     INTEGER DEFAULT 0,
      scheduled_at    TIMESTAMPTZ,
      sent_at         TIMESTAMPTZ,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS email_campaigns_owner_idx ON email_campaigns (owner_email)`;
}

export async function getSubscribers(ownerEmail: string, status?: string) {
  if (status) {
    return sql`SELECT * FROM email_subscribers WHERE owner_email = ${ownerEmail} AND status = ${status} ORDER BY subscribed_at DESC`;
  }
  return sql`SELECT * FROM email_subscribers WHERE owner_email = ${ownerEmail} ORDER BY subscribed_at DESC`;
}

export async function addSubscriber(ownerEmail: string, email: string, name?: string) {
  const [sub] = await sql`
    INSERT INTO email_subscribers (owner_email, email, name)
    VALUES (${ownerEmail}, ${email}, ${name || null})
    ON CONFLICT (owner_email, email) DO UPDATE SET status = 'active', unsubscribed_at = null
    RETURNING *
  `;
  return sub;
}

export async function getCampaigns(ownerEmail: string) {
  return sql`SELECT * FROM email_campaigns WHERE owner_email = ${ownerEmail} ORDER BY created_at DESC`;
}

// ═══════════════════════════════════════════════════════
// INVOICING (#28)
// ═══════════════════════════════════════════════════════

export async function ensureInvoicingTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS invoices (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_email     TEXT NOT NULL,
      invoice_number  TEXT UNIQUE NOT NULL,
      client_name     TEXT NOT NULL,
      client_email    TEXT,
      items           JSONB NOT NULL DEFAULT '[]',
      subtotal        DECIMAL(12,2) NOT NULL DEFAULT 0,
      tax_rate        DECIMAL(5,2) DEFAULT 0,
      tax_amount      DECIMAL(12,2) DEFAULT 0,
      total           DECIMAL(12,2) NOT NULL DEFAULT 0,
      currency        TEXT NOT NULL DEFAULT 'USD',
      status          TEXT NOT NULL DEFAULT 'draft',
      due_date        DATE,
      paid_at         TIMESTAMPTZ,
      notes           TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS invoices_owner_idx ON invoices (owner_email)`;
  await sql`CREATE INDEX IF NOT EXISTS invoices_status_idx ON invoices (status)`;
}

export async function getInvoices(ownerEmail: string, status?: string) {
  if (status) {
    return sql`SELECT * FROM invoices WHERE owner_email = ${ownerEmail} AND status = ${status} ORDER BY created_at DESC`;
  }
  return sql`SELECT * FROM invoices WHERE owner_email = ${ownerEmail} ORDER BY created_at DESC`;
}

export async function createInvoice(ownerEmail: string, data: Record<string, unknown>) {
  const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
  const items = data.items as Array<{ description: string; quantity: number; price: number }> || [];
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const taxRate = (data.taxRate as number) || 0;
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const [invoice] = await sql`
    INSERT INTO invoices (owner_email, invoice_number, client_name, client_email, items, subtotal, tax_rate, tax_amount, total, currency, due_date, notes)
    VALUES (${ownerEmail}, ${invoiceNumber}, ${data.clientName as string}, ${data.clientEmail as string || null},
            ${JSON.stringify(items)}, ${subtotal}, ${taxRate}, ${taxAmount}, ${total},
            ${data.currency as string || 'USD'}, ${data.dueDate as string || null}, ${data.notes as string || null})
    RETURNING *
  `;
  return invoice;
}

// ═══════════════════════════════════════════════════════
// ANALYTICS (#29)
// ═══════════════════════════════════════════════════════

export async function ensureAnalyticsTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      site_id         TEXT NOT NULL,
      owner_email     TEXT NOT NULL,
      event_type      TEXT NOT NULL,
      page_url        TEXT,
      referrer        TEXT,
      user_agent      TEXT,
      ip_hash         TEXT,
      country         TEXT,
      device          TEXT,
      browser         TEXT,
      session_id      TEXT,
      metadata        JSONB DEFAULT '{}',
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS analytics_events_site_idx ON analytics_events (site_id)`;
  await sql`CREATE INDEX IF NOT EXISTS analytics_events_date_idx ON analytics_events (created_at)`;
  await sql`CREATE INDEX IF NOT EXISTS analytics_events_type_idx ON analytics_events (event_type)`;

  await sql`
    CREATE TABLE IF NOT EXISTS analytics_daily (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      site_id         TEXT NOT NULL,
      owner_email     TEXT NOT NULL,
      date            DATE NOT NULL,
      pageviews       INTEGER DEFAULT 0,
      visitors        INTEGER DEFAULT 0,
      sessions        INTEGER DEFAULT 0,
      avg_duration    INTEGER DEFAULT 0,
      bounce_rate     DECIMAL(5,2) DEFAULT 0,
      top_pages       JSONB DEFAULT '[]',
      top_referrers   JSONB DEFAULT '[]',
      top_countries   JSONB DEFAULT '[]',
      UNIQUE(site_id, date)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS analytics_daily_site_idx ON analytics_daily (site_id)`;
}

export async function trackEvent(siteId: string, ownerEmail: string, event: Record<string, unknown>) {
  await sql`
    INSERT INTO analytics_events (site_id, owner_email, event_type, page_url, referrer, user_agent, session_id, metadata)
    VALUES (${siteId}, ${ownerEmail}, ${event.type as string || 'pageview'}, ${event.url as string || null},
            ${event.referrer as string || null}, ${event.userAgent as string || null}, ${event.sessionId as string || null},
            ${JSON.stringify(event.metadata || {})})
  `;
}

export async function getDailyAnalytics(siteId: string, days: number = 30) {
  return sql`
    SELECT * FROM analytics_daily
    WHERE site_id = ${siteId} AND date > NOW() - INTERVAL '1 day' * ${days}
    ORDER BY date DESC
  `;
}

// ═══════════════════════════════════════════════════════
// Initialize ALL product tables at once
// ═══════════════════════════════════════════════════════

export async function initAllProductTables() {
  await ensureCRMTables();
  await ensureEmailMarketingTables();
  await ensureInvoicingTables();
  await ensureAnalyticsTables();
}
