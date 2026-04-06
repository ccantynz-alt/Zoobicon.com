/**
 * Zoobicon Backend-as-a-Service
 *
 * Unified backend services for every generated app.
 * When a customer builds an app on Zoobicon, they automatically get:
 *   - Authentication (email/password, OAuth)
 *   - Database (Postgres per app)
 *   - File storage
 *   - Transactional email
 *   - Real-time subscriptions
 *   - Payments (Stripe)
 *
 * Architecture:
 *   Bridge mode (now): Supabase for auth/db/storage + Mailgun for email
 *   Own mode (future): Self-hosted Postgres + Postal + S3-compatible storage
 *
 * Every generated app gets a lib/backend.ts file injected that connects
 * to these services. Customer never sees API keys or configuration.
 */

import { isSupabaseConfigured, createProject, executeSQL, generateClientCode } from "./supabase-provision";
import { sql } from "./db";

// ── Types ──

export interface AppBackend {
  appId: string;
  name: string;
  ownerEmail: string;
  supabaseProjectId?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  databaseUrl?: string;
  storageEnabled: boolean;
  emailEnabled: boolean;
  paymentsEnabled: boolean;
  createdAt: Date;
}

export interface BackendProvisionResult {
  appId: string;
  clientCode: string; // The lib/backend.ts file to inject into the generated app
  supabaseUrl?: string;
  databaseReady: boolean;
  authReady: boolean;
  storageReady: boolean;
  emailReady: boolean;
}

// ── Database table for tracking provisioned backends ──

export async function ensureBackendTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS app_backends (
      id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      app_id                TEXT UNIQUE NOT NULL,
      name                  TEXT NOT NULL,
      owner_email           TEXT NOT NULL,
      supabase_project_id   TEXT,
      supabase_url          TEXT,
      supabase_anon_key     TEXT,
      database_url          TEXT,
      storage_enabled       BOOLEAN DEFAULT true,
      email_enabled         BOOLEAN DEFAULT true,
      payments_enabled      BOOLEAN DEFAULT false,
      status                TEXT DEFAULT 'active',
      created_at            TIMESTAMPTZ DEFAULT NOW(),
      updated_at            TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS app_backends_owner_idx ON app_backends (owner_email)`;
}

// ── Provision a new backend for a generated app ──

/**
 * Provision a complete backend for a newly generated app.
 * This is called automatically when someone generates a full-stack app.
 *
 * Steps:
 * 1. Create a Supabase project (database + auth + storage)
 * 2. Generate database schema based on the app description
 * 3. Generate client library code to inject into the app
 * 4. Record the backend in our database for management
 */
export async function provisionBackend(
  appName: string,
  ownerEmail: string,
  appDescription: string,
  schemaSQL?: string
): Promise<BackendProvisionResult> {
  const appId = `app_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // If Supabase is configured, create a real project
  if (isSupabaseConfigured()) {
    try {
      const project = await createProject(appName);

      // Execute schema if provided
      if (schemaSQL) {
        await executeSQL(project.id, schemaSQL);
      }

      // Record in our database
      try {
        await ensureBackendTable();
        await sql`
          INSERT INTO app_backends (app_id, name, owner_email, supabase_project_id, supabase_url, supabase_anon_key)
          VALUES (${appId}, ${appName}, ${ownerEmail}, ${project.id}, ${project.projectUrl}, ${project.anonKey})
        `;
      } catch { /* DB not available — continue without tracking */ }

      // Generate the client code to inject into the generated app
      const clientCode = generateClientCode(project.projectUrl, project.anonKey);

      return {
        appId,
        clientCode,
        supabaseUrl: project.projectUrl,
        databaseReady: true,
        authReady: true,
        storageReady: true,
        emailReady: !!process.env.MAILGUN_API_KEY,
      };
    } catch (err) {
      console.error("[backend-service] Supabase provisioning failed:", err);
      // Fall through to local-only mode
    }
  }

  // Local-only mode — no external services, app uses localStorage
  const clientCode = generateLocalBackendCode(appId);

  return {
    appId,
    clientCode,
    databaseReady: false,
    authReady: false,
    storageReady: false,
    emailReady: false,
  };
}

// ── Get all backends for a user ──

export async function getUserBackends(email: string): Promise<AppBackend[]> {
  try {
    await ensureBackendTable();
    const rows = await sql`
      SELECT * FROM app_backends WHERE owner_email = ${email} ORDER BY created_at DESC
    `;
    return rows as unknown as AppBackend[];
  } catch {
    return [];
  }
}

// ── Email Service Layer ──

/**
 * Send transactional email from a customer's app.
 * Routes through our email infrastructure with reputation protection.
 */
export async function sendAppEmail(params: {
  appId: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ success: boolean; messageId?: string }> {
  // Rate limiting per app — protect reputation
  // TODO: Check rate limits from database

  // Content filtering — block spam/phishing
  if (containsSuspiciousContent(params.subject + " " + params.html)) {
    console.warn(`[email] Blocked suspicious email from app ${params.appId}`);
    return { success: false };
  }

  // Send via Mailgun (bridge mode)
  const mailgunKey = process.env.MAILGUN_API_KEY;
  const mailgunDomain = process.env.MAILGUN_DOMAIN || "zoobicon.com";

  if (!mailgunKey) {
    console.warn("[email] Mailgun not configured — email not sent");
    return { success: false };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("from", params.from);
    formData.append("to", params.to);
    formData.append("subject", params.subject);
    formData.append("html", params.html);
    if (params.text) formData.append("text", params.text);

    const res = await fetch(`https://api.mailgun.net/v3/${mailgunDomain}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${mailgunKey}`).toString("base64")}`,
      },
      body: formData,
    });

    if (!res.ok) {
      console.error("[email] Mailgun send failed:", res.status);
      return { success: false };
    }

    const data = await res.json();
    return { success: true, messageId: data.id };
  } catch (err) {
    console.error("[email] Send failed:", err);
    return { success: false };
  }
}

// ── Content Filtering (reputation protection) ──

function containsSuspiciousContent(content: string): boolean {
  const lowerContent = content.toLowerCase();
  const spamPatterns = [
    /\bcasino\b/,
    /\bviagra\b/,
    /\bcrypto\s*invest/,
    /\bnigerian?\s*prince/,
    /\bfree\s*money\b/,
    /\bact\s*now\b.*\blimited\s*time\b/,
    /\bunsubscribe\b.*\bclick\s*here\b/,
    /\bcongratulations?\s*you\s*(have\s*)?won\b/,
  ];

  return spamPatterns.some(p => p.test(lowerContent));
}

// ── Local Backend Code (no Supabase) ──

function generateLocalBackendCode(appId: string): string {
  return `// Zoobicon Backend — Local Mode
// Full backend available when app is deployed to Zoobicon Cloud

const APP_ID = "${appId}";
const STORAGE_PREFIX = \`zoobicon_\${APP_ID}_\`;

// Auth (localStorage-based for development, Supabase when deployed)
export function signUp(email: string, password: string) {
  const users = JSON.parse(localStorage.getItem(\`\${STORAGE_PREFIX}users\`) || '[]');
  if (users.find((u: {email:string}) => u.email === email)) throw new Error("Email already registered");
  const user = { id: crypto.randomUUID(), email, createdAt: new Date().toISOString() };
  users.push(user);
  localStorage.setItem(\`\${STORAGE_PREFIX}users\`, JSON.stringify(users));
  localStorage.setItem(\`\${STORAGE_PREFIX}current_user\`, JSON.stringify(user));
  return user;
}

export function signIn(email: string, _password: string) {
  const users = JSON.parse(localStorage.getItem(\`\${STORAGE_PREFIX}users\`) || '[]');
  const user = users.find((u: {email:string}) => u.email === email);
  if (!user) throw new Error("Invalid credentials");
  localStorage.setItem(\`\${STORAGE_PREFIX}current_user\`, JSON.stringify(user));
  return user;
}

export function signOut() {
  localStorage.removeItem(\`\${STORAGE_PREFIX}current_user\`);
}

export function getUser() {
  const stored = localStorage.getItem(\`\${STORAGE_PREFIX}current_user\`);
  return stored ? JSON.parse(stored) : null;
}

// Database (localStorage-based, Postgres when deployed)
export function query(table: string) {
  return JSON.parse(localStorage.getItem(\`\${STORAGE_PREFIX}\${table}\`) || '[]');
}

export function insert(table: string, data: Record<string, unknown>) {
  const rows = query(table);
  const row = { ...data, id: crypto.randomUUID(), created_at: new Date().toISOString() };
  rows.push(row);
  localStorage.setItem(\`\${STORAGE_PREFIX}\${table}\`, JSON.stringify(rows));
  return row;
}

export function update(table: string, id: string, data: Record<string, unknown>) {
  const rows = query(table);
  const index = rows.findIndex((r: {id:string}) => r.id === id);
  if (index === -1) throw new Error("Not found");
  rows[index] = { ...rows[index], ...data, updated_at: new Date().toISOString() };
  localStorage.setItem(\`\${STORAGE_PREFIX}\${table}\`, JSON.stringify(rows));
  return rows[index];
}

export function remove(table: string, id: string) {
  const rows = query(table).filter((r: {id:string}) => r.id !== id);
  localStorage.setItem(\`\${STORAGE_PREFIX}\${table}\`, JSON.stringify(rows));
}

// Storage (data URL based, S3 when deployed)
export function uploadFile(_bucket: string, file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}
`;
}

// ── Check what's available ──

export function getBackendCapabilities(): {
  database: boolean;
  auth: boolean;
  storage: boolean;
  email: boolean;
  payments: boolean;
  mode: "supabase" | "local";
} {
  const supabase = isSupabaseConfigured();
  return {
    database: supabase,
    auth: supabase,
    storage: supabase,
    email: !!process.env.MAILGUN_API_KEY,
    payments: !!process.env.STRIPE_SECRET_KEY,
    mode: supabase ? "supabase" : "local",
  };
}
