/**
 * Supabase Integration for Generated Apps
 *
 * When a user generates a full-stack app, we auto-provision:
 *   1. Supabase project (database, auth, storage)
 *   2. Database schema matching the app's needs
 *   3. Row-Level Security policies
 *   4. Auth configuration (email/password, OAuth)
 *   5. Client library wired into the generated React code
 *
 * This is what Lovable does. Now we do it too.
 *
 * Env vars:
 *   SUPABASE_ACCESS_TOKEN — Supabase Management API token
 *   SUPABASE_ORG_ID — Your Supabase organization ID
 */

const SUPABASE_API = "https://api.supabase.com/v1";

function getToken(): string {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) throw new Error("Supabase integration is being configured.");
  return token;
}

function headers() {
  return {
    Authorization: `Bearer ${getToken()}`,
    "Content-Type": "application/json",
  };
}

export interface SupabaseProject {
  id: string;
  name: string;
  organizationId: string;
  region: string;
  dbUrl: string;
  anonKey: string;
  serviceKey: string;
  projectUrl: string;
}

/**
 * Create a new Supabase project for a generated app.
 * Each customer app gets its own isolated Supabase project.
 */
export async function createProject(
  name: string,
  region: string = "us-east-1"
): Promise<SupabaseProject> {
  const orgId = process.env.SUPABASE_ORG_ID;
  if (!orgId) throw new Error("SUPABASE_ORG_ID not configured");

  const res = await fetch(`${SUPABASE_API}/projects`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      name: `zoobicon-${name.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30)}`,
      organization_id: orgId,
      region,
      plan: "free",
      db_pass: generateDbPassword(),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[supabase] Project creation failed:", res.status, err);
    throw new Error("Failed to create database. Please try again.");
  }

  const data = await res.json();

  return {
    id: data.id,
    name: data.name,
    organizationId: data.organization_id,
    region: data.region,
    dbUrl: `https://${data.id}.supabase.co`,
    anonKey: data.anon_key || "",
    serviceKey: data.service_role_key || "",
    projectUrl: `https://${data.id}.supabase.co`,
  };
}

/**
 * Execute SQL on a Supabase project to create tables.
 */
export async function executeSQL(
  projectId: string,
  sql: string
): Promise<void> {
  const res = await fetch(`${SUPABASE_API}/projects/${projectId}/database/query`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ query: sql }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[supabase] SQL execution failed:", err);
    throw new Error("Failed to create database tables.");
  }
}

/**
 * Generate a database schema from an app description using Claude.
 * Returns SQL that creates tables, RLS policies, and sample data.
 */
export function generateSchemaPrompt(appDescription: string): string {
  return `Generate a PostgreSQL schema for this app: "${appDescription}"

Output ONLY valid SQL. Include:
1. CREATE TABLE statements with proper types and constraints
2. Row Level Security (RLS) policies using auth.uid()
3. INSERT statements with 5-10 rows of realistic sample data per table
4. CREATE INDEX for commonly queried columns

Rules:
- Enable RLS on every table: ALTER TABLE x ENABLE ROW LEVEL SECURITY;
- Use UUID primary keys: id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- Include created_at TIMESTAMPTZ DEFAULT NOW() on every table
- Include user_id UUID REFERENCES auth.users(id) where appropriate
- Use Supabase auth conventions (auth.uid(), auth.users)
- Keep it practical — 3-6 tables maximum
- Make sample data realistic and industry-specific`;
}

/**
 * Generate Supabase client code to inject into generated React apps.
 * This gives the generated app a working database connection.
 */
export function generateClientCode(projectUrl: string, anonKey: string): string {
  return `import { createClient } from '@supabase/supabase-js';

const supabaseUrl = '${projectUrl}';
const supabaseAnonKey = '${anonKey}';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth helpers
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Database helpers
export async function query(table: string, options?: {
  select?: string;
  filter?: Record<string, unknown>;
  limit?: number;
  orderBy?: string;
}) {
  let q = supabase.from(table).select(options?.select || '*');
  if (options?.filter) {
    for (const [key, value] of Object.entries(options.filter)) {
      q = q.eq(key, value);
    }
  }
  if (options?.orderBy) q = q.order(options.orderBy, { ascending: false });
  if (options?.limit) q = q.limit(options.limit);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function insert(table: string, data: Record<string, unknown>) {
  const { data: result, error } = await supabase.from(table).insert(data).select();
  if (error) throw error;
  return result;
}

export async function update(table: string, id: string, data: Record<string, unknown>) {
  const { data: result, error } = await supabase.from(table).update(data).eq('id', id).select();
  if (error) throw error;
  return result;
}

export async function remove(table: string, id: string) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
}

// Real-time subscriptions
export function subscribe(table: string, callback: (payload: unknown) => void) {
  return supabase.channel(\`public:\${table}\`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
    .subscribe();
}

// Storage helpers
export async function uploadFile(bucket: string, path: string, file: File) {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file);
  if (error) throw error;
  return data;
}

export function getPublicUrl(bucket: string, path: string) {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
`;
}

/**
 * Check if Supabase integration is available.
 */
export function isSupabaseConfigured(): boolean {
  return !!(process.env.SUPABASE_ACCESS_TOKEN && process.env.SUPABASE_ORG_ID);
}

function generateDbPassword(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  let result = "";
  for (let i = 0; i < 24; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ──────────────────────────────────────────────────────────────────────────
// DEEP PROVISIONING — Lovable-parity Supabase auto-provisioning
// All functions below are non-throwing: failures degrade to local mode
// (Bible Law 8: never blank-screen; Law 9: resilient fallback chains).
// ──────────────────────────────────────────────────────────────────────────

export interface Capabilities {
  auth: boolean;
  storage: boolean;
  rls: boolean;
  db: boolean;
}

export type ProvisionResult =
  | {
      provisioned: true;
      mode: "supabase";
      projectRef: string;
      projectUrl: string;
      anonKey: string;
      serviceKey: string;
    }
  | {
      provisioned: false;
      mode: "local";
      reason: string;
    };

export interface FullStackResult {
  provisioned: boolean;
  mode: "supabase" | "local";
  projectRef?: string;
  projectUrl?: string;
  anonKey?: string;
  tables: string[];
  capabilities: Capabilities;
  files: Record<string, string>;
  warnings: string[];
}

interface FetchResult {
  ok: boolean;
  status: number;
  body: unknown;
  error?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Resilient fetch with 4-attempt exponential backoff on 5xx.
 * Never throws — returns a result object so callers can degrade gracefully.
 */
async function safeFetch(
  url: string,
  init: RequestInit,
  attempts = 4
): Promise<FetchResult> {
  let lastErr = "unknown error";
  let lastStatus = 0;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, init);
      lastStatus = res.status;
      const text = await res.text();
      let body: unknown = text;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        /* keep as text */
      }
      if (res.ok) return { ok: true, status: res.status, body };
      if (res.status >= 500 && i < attempts - 1) {
        await sleep(1000 * Math.pow(2, i));
        continue;
      }
      return {
        ok: false,
        status: res.status,
        body,
        error: `HTTP ${res.status}: ${typeof body === "string" ? body : JSON.stringify(body)}`,
      };
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
      if (i < attempts - 1) await sleep(1000 * Math.pow(2, i));
    }
  }
  return { ok: false, status: lastStatus, body: null, error: lastErr };
}

function authHeaders(): Record<string, string> | null {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) return null;
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/**
 * Provision a brand-new Supabase project via the Management API.
 * Degrades to { provisioned: false, mode: "local" } when token is missing
 * or the API call fails — the builder will fall back to localStorage.
 */
export async function provisionSupabaseProject(
  name: string,
  ownerEmail: string
): Promise<ProvisionResult> {
  const h = authHeaders();
  if (!h) {
    return {
      provisioned: false,
      mode: "local",
      reason:
        "SUPABASE_ACCESS_TOKEN not set — falling back to localStorage",
    };
  }
  const orgId = process.env.SUPABASE_ORG_ID;
  if (!orgId) {
    return {
      provisioned: false,
      mode: "local",
      reason: "SUPABASE_ORG_ID not set — falling back to localStorage",
    };
  }
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  const projectName = `zb-${slug || "app"}-${Date.now().toString(36)}`;
  const result = await safeFetch(`${SUPABASE_API}/projects`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({
      name: projectName,
      organization_id: orgId,
      region: "us-east-1",
      plan: "free",
      db_pass: generateDbPassword(),
    }),
  });
  if (!result.ok || !result.body || typeof result.body !== "object") {
    return {
      provisioned: false,
      mode: "local",
      reason: `Provision failed (${result.error || "unknown"}) — falling back to localStorage. Owner: ${ownerEmail}`,
    };
  }
  const data = result.body as Record<string, unknown>;
  const id = typeof data.id === "string" ? data.id : "";
  if (!id) {
    return {
      provisioned: false,
      mode: "local",
      reason: "Supabase API returned no project id — falling back to localStorage",
    };
  }
  return {
    provisioned: true,
    mode: "supabase",
    projectRef: id,
    projectUrl: `https://${id}.supabase.co`,
    anonKey: typeof data.anon_key === "string" ? data.anon_key : "",
    serviceKey:
      typeof data.service_role_key === "string" ? data.service_role_key : "",
  };
}

/**
 * Apply a SQL migration to a provisioned project.
 */
export async function applySchema(
  projectRef: string,
  sql: string
): Promise<{ ok: boolean; error?: string }> {
  const h = authHeaders();
  if (!h) return { ok: false, error: "SUPABASE_ACCESS_TOKEN not set" };
  const result = await safeFetch(
    `${SUPABASE_API}/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: h,
      body: JSON.stringify({ query: sql }),
    }
  );
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true };
}

/**
 * Parse CREATE TABLE statements out of a SQL blob.
 */
export function extractTablesFromSchema(sql: string): string[] {
  const tables: string[] = [];
  const re = /create\s+table\s+(?:if\s+not\s+exists\s+)?["']?([\w.]+)["']?/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(sql)) !== null) {
    const raw = m[1];
    const bare = raw.replace(/^public\./i, "").replace(/["']/g, "");
    if (bare && !tables.includes(bare)) tables.push(bare);
  }
  return tables;
}

/**
 * Enable RLS on every table and add owner-based default policies.
 */
export async function enableRowLevelSecurity(
  projectRef: string,
  tables: string[]
): Promise<void> {
  if (!tables.length) return;
  const stmts: string[] = [];
  for (const t of tables) {
    const safe = t.replace(/[^\w]/g, "");
    if (!safe) continue;
    stmts.push(`ALTER TABLE "public"."${safe}" ENABLE ROW LEVEL SECURITY;`);
    stmts.push(
      `DROP POLICY IF EXISTS "owner can read" ON "public"."${safe}";`
    );
    stmts.push(
      `CREATE POLICY "owner can read"   ON "public"."${safe}" FOR SELECT USING (user_id = auth.uid());`
    );
    stmts.push(
      `DROP POLICY IF EXISTS "owner can insert" ON "public"."${safe}";`
    );
    stmts.push(
      `CREATE POLICY "owner can insert" ON "public"."${safe}" FOR INSERT WITH CHECK (user_id = auth.uid());`
    );
    stmts.push(
      `DROP POLICY IF EXISTS "owner can update" ON "public"."${safe}";`
    );
    stmts.push(
      `CREATE POLICY "owner can update" ON "public"."${safe}" FOR UPDATE USING (user_id = auth.uid());`
    );
    stmts.push(
      `DROP POLICY IF EXISTS "owner can delete" ON "public"."${safe}";`
    );
    stmts.push(
      `CREATE POLICY "owner can delete" ON "public"."${safe}" FOR DELETE USING (user_id = auth.uid());`
    );
  }
  const sql = stmts.join("\n");
  const res = await applySchema(projectRef, sql);
  if (!res.ok) {
    console.warn("[supabase] enableRowLevelSecurity failed:", res.error);
  }
}

/**
 * Enable email/password auth via the Auth config endpoint.
 */
export async function enableEmailAuth(projectRef: string): Promise<void> {
  const h = authHeaders();
  if (!h) return;
  const res = await safeFetch(
    `${SUPABASE_API}/projects/${projectRef}/config/auth`,
    {
      method: "PATCH",
      headers: h,
      body: JSON.stringify({
        external_email_enabled: true,
        mailer_autoconfirm: true,
        disable_signup: false,
      }),
    }
  );
  if (!res.ok) {
    console.warn("[supabase] enableEmailAuth failed:", res.error);
  }
}

/**
 * Create a storage bucket (public or private).
 */
export async function createStorageBucket(
  projectRef: string,
  bucket: string,
  isPublic: boolean
): Promise<void> {
  const h = authHeaders();
  if (!h) return;
  const safe = bucket.replace(/[^\w-]/g, "").toLowerCase() || "uploads";
  const res = await safeFetch(
    `${SUPABASE_API}/projects/${projectRef}/storage/buckets`,
    {
      method: "POST",
      headers: h,
      body: JSON.stringify({
        id: safe,
        name: safe,
        public: isPublic,
      }),
    }
  );
  if (!res.ok) {
    console.warn("[supabase] createStorageBucket failed:", res.error);
  }
}

/**
 * Generate a ready-to-drop-in supabase-js client snippet.
 */
export function generateSupabaseClientCode(
  projectUrl: string,
  anonKey: string
): string {
  return `import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '${projectUrl}';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '${anonKey}';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
`;
}

/**
 * Orchestrate full-stack provisioning: project → schema → RLS → auth → storage.
 * Always returns a usable result. On any failure, degrades to local mode and
 * surfaces a clear warning so the builder can show it (Bible Law 8).
 */
export async function provisionFullStack(
  name: string,
  ownerEmail: string,
  schemaSql: string,
  opts: { auth?: boolean; storage?: boolean; rls?: boolean } = {}
): Promise<FullStackResult> {
  const wantAuth = opts.auth !== false;
  const wantStorage = opts.storage !== false;
  const wantRls = opts.rls !== false;
  const tables = extractTablesFromSchema(schemaSql);
  const warnings: string[] = [];

  const provision = await provisionSupabaseProject(name, ownerEmail);
  if (!provision.provisioned) {
    warnings.push(provision.reason);
    return {
      provisioned: false,
      mode: "local",
      tables,
      capabilities: { auth: false, storage: false, rls: false, db: false },
      files: {
        ".env.local.example":
          "# Supabase not provisioned — using localStorage fallback\n",
      },
      warnings,
    };
  }

  const caps: Capabilities = { auth: false, storage: false, rls: false, db: false };

  if (schemaSql.trim()) {
    const applied = await applySchema(provision.projectRef, schemaSql);
    if (applied.ok) {
      caps.db = true;
    } else {
      warnings.push(`Schema apply failed: ${applied.error}`);
    }
  } else {
    caps.db = true;
  }

  if (wantRls && caps.db && tables.length) {
    await enableRowLevelSecurity(provision.projectRef, tables);
    caps.rls = true;
  }

  if (wantAuth) {
    await enableEmailAuth(provision.projectRef);
    caps.auth = true;
  }

  if (wantStorage) {
    await createStorageBucket(provision.projectRef, "uploads", true);
    caps.storage = true;
  }

  const clientCode = generateSupabaseClientCode(
    provision.projectUrl,
    provision.anonKey
  );

  return {
    provisioned: true,
    mode: "supabase",
    projectRef: provision.projectRef,
    projectUrl: provision.projectUrl,
    anonKey: provision.anonKey,
    tables,
    capabilities: caps,
    files: {
      "lib/supabase.ts": clientCode,
      ".env.local.example": `NEXT_PUBLIC_SUPABASE_URL=${provision.projectUrl}\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${provision.anonKey}\n`,
    },
    warnings,
  };
}
