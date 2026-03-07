import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

export const sql = neon(process.env.DATABASE_URL);

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

  // Idempotent: add Stripe columns if the table was created before this migration
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
}
