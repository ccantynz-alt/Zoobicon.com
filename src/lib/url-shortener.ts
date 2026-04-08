import { sql } from "@/lib/db";

const BASE62 =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const SHORT_BASE_URL =
  process.env.SHORT_LINK_BASE_URL || "https://zoobicon.sh";

export interface ShortLink {
  id: number;
  code: string;
  target_url: string;
  created_by: string | null;
  clicks: number;
  created_at: string;
}

export interface CreateShortLinkResult {
  code: string;
  shortUrl: string;
}

let tablesEnsured = false;

export async function ensureShortLinkTables(): Promise<void> {
  if (tablesEnsured) return;
  await sql`
    CREATE TABLE IF NOT EXISTS short_links (
      id SERIAL PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      target_url TEXT NOT NULL,
      created_by TEXT,
      clicks INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS short_links_code_idx ON short_links(code)`;
  await sql`CREATE INDEX IF NOT EXISTS short_links_created_by_idx ON short_links(created_by)`;
  tablesEnsured = true;
}

function generateCode(length: number = 7): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += BASE62.charAt(Math.floor(Math.random() * BASE62.length));
  }
  return out;
}

function isValidUrl(input: string): boolean {
  try {
    const u = new URL(input);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function createShortLink(
  targetUrl: string,
  createdBy?: string
): Promise<CreateShortLinkResult> {
  if (!targetUrl || !isValidUrl(targetUrl)) {
    throw new Error(
      "Invalid target URL: must be a valid http(s) URL. Example: https://example.com"
    );
  }
  await ensureShortLinkTables();

  for (let attempt = 0; attempt < 6; attempt++) {
    const code = generateCode(7);
    try {
      const rows = (await sql`
        INSERT INTO short_links (code, target_url, created_by)
        VALUES (${code}, ${targetUrl}, ${createdBy ?? null})
        ON CONFLICT (code) DO NOTHING
        RETURNING code
      `) as Array<{ code: string }>;
      if (rows.length > 0) {
        return {
          code: rows[0].code,
          shortUrl: `${SHORT_BASE_URL}/s/${rows[0].code}`,
        };
      }
    } catch (err) {
      if (attempt === 5) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(`Failed to create short link: ${msg}`);
      }
    }
  }
  throw new Error(
    "Failed to generate a unique short code after 6 attempts. Try again."
  );
}

export async function resolveShortLink(
  code: string
): Promise<string | null> {
  if (!code) return null;
  await ensureShortLinkTables();
  const rows = (await sql`
    SELECT target_url FROM short_links WHERE code = ${code} LIMIT 1
  `) as Array<{ target_url: string }>;
  if (rows.length === 0) return null;
  await sql`UPDATE short_links SET clicks = clicks + 1 WHERE code = ${code}`;
  return rows[0].target_url;
}

export async function listShortLinks(
  createdBy: string
): Promise<ShortLink[]> {
  await ensureShortLinkTables();
  const rows = (await sql`
    SELECT id, code, target_url, created_by, clicks, created_at
    FROM short_links
    WHERE created_by = ${createdBy}
    ORDER BY created_at DESC
    LIMIT 500
  `) as ShortLink[];
  return rows;
}
