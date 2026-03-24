import { sql } from "./db";

/* ---------- types ---------- */

export type ActivityType = "build" | "deploy" | "signup" | "share" | "remix";

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  userName: string;
  description: string;
  slug: string | null;
  timestamp: string;
}

/* ---------- table setup ---------- */

export async function ensureActivityTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS activities (
      id          SERIAL PRIMARY KEY,
      type        TEXT NOT NULL,
      user_email  TEXT NOT NULL,
      user_name   TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL,
      slug        TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS activities_created_at_idx ON activities (created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS activities_type_idx ON activities (type)`;
}

/* ---------- anonymize name: "Emma Watson" -> "Emma W." ---------- */

function anonymizeName(name: string, email: string): string {
  if (name && name.trim().length > 0) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0]} ${parts[parts.length - 1][0]}.`;
    }
    return parts[0];
  }
  // Fall back to email prefix
  const prefix = email.split("@")[0];
  const cleaned = prefix.replace(/[^a-zA-Z]/g, " ").trim();
  if (cleaned.length === 0) return "User";
  const capitalized = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return capitalized;
}

/* ---------- log activity ---------- */

export async function logActivity(
  type: ActivityType,
  email: string,
  description: string,
  slug?: string,
  name?: string
): Promise<void> {
  try {
    const userName = anonymizeName(name || "", email);
    await ensureActivityTable();
    await sql`
      INSERT INTO activities (type, user_email, user_name, description, slug)
      VALUES (${type}, ${email}, ${userName}, ${description}, ${slug || null})
    `;
  } catch (err) {
    // Non-critical — log and continue
    console.error("[activity] Failed to log activity:", err);
  }
}

/* ---------- get recent activity ---------- */

export async function getRecentActivity(limit = 20): Promise<ActivityEvent[]> {
  try {
    await ensureActivityTable();
    const rows = await sql`
      SELECT id, type, user_name, description, slug, created_at
      FROM activities
      WHERE created_at > NOW() - INTERVAL '24 hours'
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return rows.map((row: Record<string, unknown>) => ({
      id: String(row.id),
      type: row.type as ActivityType,
      userName: String(row.user_name),
      description: String(row.description),
      slug: row.slug ? String(row.slug) : null,
      timestamp: String(row.created_at),
    }));
  } catch (err) {
    console.error("[activity] Failed to fetch activity:", err);
    return [];
  }
}
