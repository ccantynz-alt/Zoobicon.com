/**
 * Shared builds — persistent, link-shareable snapshots of a builder
 * session (Sprint 4 T9 full).
 *
 * The builder's Share button (page.tsx top toolbar) previously only
 * encoded the prompt into a URL — recipients got a fresh build, not
 * the exact same code. This lib persists the full file tree + brand
 * spec so a recipient hitting `/share/<code>` sees identical output.
 *
 * Schema (auto-created on first call):
 *   shared_builds
 *     id          UUID PK
 *     code        TEXT UNIQUE  (10-char human-friendly URL slug)
 *     prompt      TEXT
 *     files       JSONB        (the generated file tree)
 *     brand_spec  JSONB NULL   (the planner-emitted brand sheet from Q4)
 *     created_at  TIMESTAMPTZ
 *     expires_at  TIMESTAMPTZ  (NULL = never)
 *     view_count  INTEGER      (incremented on each /share/<code> read)
 *
 * Codes are 10-char base32-ish (32^10 ≈ 1.1 × 10^15 — enumeration-
 * resistant). Lazy GC: any read drops expired rows.
 */

import { neon } from "@neondatabase/serverless";

function getDb() {
  if (!process.env.DATABASE_URL) return null;
  return neon(process.env.DATABASE_URL);
}

export async function ensureSharedBuildsTable(): Promise<void> {
  const sql = getDb();
  if (!sql) return;
  await sql`
    CREATE TABLE IF NOT EXISTS shared_builds (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code        TEXT NOT NULL UNIQUE,
      prompt      TEXT NOT NULL,
      files       JSONB NOT NULL,
      brand_spec  JSONB,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at  TIMESTAMPTZ,
      view_count  INTEGER NOT NULL DEFAULT 0
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS shared_builds_code_idx ON shared_builds(code)`;
}

function generateShareCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const buf = new Uint8Array(10);
  crypto.getRandomValues(buf);
  let code = "";
  for (let i = 0; i < 10; i++) code += alphabet[buf[i] % alphabet.length];
  return code;
}

export interface SharedBuild {
  code: string;
  prompt: string;
  files: Record<string, string>;
  brandSpec: Record<string, unknown> | null;
  createdAt: string;
  viewCount: number;
}

export async function createSharedBuild(input: {
  prompt: string;
  files: Record<string, string>;
  brandSpec?: Record<string, unknown> | null;
  ttlDays?: number; // null/undefined → never expires
}): Promise<SharedBuild | null> {
  const sql = getDb();
  if (!sql) return null;

  await ensureSharedBuildsTable();

  // Sanity check on size — Postgres JSONB has a ~1GB ceiling but
  // we don't want to be the test case. Cap at 2MB worth of files.
  const filesJson = JSON.stringify(input.files);
  if (filesJson.length > 2_000_000) {
    throw new Error("Files too large to share — over 2MB JSON payload");
  }

  // Pick a code; retry on the (extremely rare) UNIQUE collision.
  let code = generateShareCode();
  for (let attempt = 0; attempt < 4; attempt++) {
    const existing = (await sql`
      SELECT id FROM shared_builds WHERE code = ${code} LIMIT 1
    `) as Array<{ id: string }>;
    if (existing.length === 0) break;
    code = generateShareCode();
  }

  const expiresAt = input.ttlDays
    ? new Date(Date.now() + input.ttlDays * 86400_000).toISOString()
    : null;

  const rows = (await sql`
    INSERT INTO shared_builds (code, prompt, files, brand_spec, expires_at)
    VALUES (
      ${code},
      ${input.prompt},
      ${filesJson}::jsonb,
      ${input.brandSpec ? JSON.stringify(input.brandSpec) : null}::jsonb,
      ${expiresAt}
    )
    RETURNING code, prompt, files, brand_spec, created_at, view_count
  `) as Array<{
    code: string;
    prompt: string;
    files: Record<string, string>;
    brand_spec: Record<string, unknown> | null;
    created_at: string;
    view_count: number;
  }>;

  const row = rows[0];
  return {
    code: row.code,
    prompt: row.prompt,
    files: row.files,
    brandSpec: row.brand_spec,
    createdAt: row.created_at,
    viewCount: row.view_count,
  };
}

export async function getSharedBuild(code: string): Promise<SharedBuild | null> {
  const sql = getDb();
  if (!sql) return null;

  await ensureSharedBuildsTable();

  // Lazy GC — drop expired rows on every read so the table stays lean.
  await sql`
    DELETE FROM shared_builds
    WHERE expires_at IS NOT NULL AND expires_at < NOW()
  `;

  const rows = (await sql`
    UPDATE shared_builds
    SET view_count = view_count + 1
    WHERE code = ${code}
    RETURNING code, prompt, files, brand_spec, created_at, view_count
  `) as Array<{
    code: string;
    prompt: string;
    files: Record<string, string>;
    brand_spec: Record<string, unknown> | null;
    created_at: string;
    view_count: number;
  }>;

  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    code: row.code,
    prompt: row.prompt,
    files: row.files,
    brandSpec: row.brand_spec,
    createdAt: row.created_at,
    viewCount: row.view_count,
  };
}
