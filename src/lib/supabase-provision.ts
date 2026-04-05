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
