/**
 * Supabase Provisioner — Lovable-style auto-provision
 *
 * Raw fetch against Supabase Management API (https://api.supabase.com).
 * Requires env: SUPABASE_ACCESS_TOKEN, SUPABASE_ORG_ID.
 *
 * Bible Law 8: every failure surfaces the exact endpoint + status.
 */

const SUPABASE_API = "https://api.supabase.com";

export interface ProvisionerError extends Error {
  endpoint: string;
  status: number;
  body: string;
}

export interface CreateProjectInput {
  name: string;
  region?: string;
  dbPass?: string;
}

export interface CreateProjectResult {
  projectRef: string;
  anonKey: string;
  serviceKey: string;
  dbUrl: string;
}

export interface ColumnSpec {
  name: string;
  type: string;
  primary?: boolean;
  default?: string;
  nullable?: boolean;
  foreignKey?: { table: string; column: string };
}

export type RlsMode = "public" | "authenticated" | "owner";

export interface TableSpec {
  columns: ColumnSpec[];
  rls?: RlsMode;
}

export interface SchemaSpec {
  [tableName: string]: TableSpec;
}

export interface SqlRow {
  [column: string]: unknown;
}

interface SupabaseProjectCreateResponse {
  id: string;
  name: string;
  region: string;
  database?: { host?: string; password?: string };
  anon_key?: string;
  service_role_key?: string;
}

interface SupabaseApiKey {
  name: string;
  api_key: string;
}

interface SupabaseProjectListItem {
  id: string;
  name: string;
  region: string;
  status: string;
  created_at: string;
}

/**
 * Module-level circuit breaker. Once the Supabase Management API has
 * returned 401 / 403 / "JWT could not be decoded" in this process, mark
 * the token as poisoned for the rest of the cold start so subsequent
 * builds skip provisioning entirely instead of paying the round-trip
 * and surfacing the same error to users over and over.
 *
 * Resets naturally on the next cold start (Vercel typically recycles
 * lambdas within minutes of idle).
 */
let _tokenPoisoned = false;
let _tokenPoisonReason = "";

export function markTokenPoisoned(reason: string): void {
  _tokenPoisoned = true;
  _tokenPoisonReason = reason;
  console.warn(`[supabase-provisioner] token poisoned for this cold start: ${reason}`);
}

export function isTokenPoisoned(): { poisoned: boolean; reason: string } {
  return { poisoned: _tokenPoisoned, reason: _tokenPoisonReason };
}

export function isConfigured(): boolean {
  if (_tokenPoisoned) return false;
  return Boolean(process.env.SUPABASE_ACCESS_TOKEN && process.env.SUPABASE_ORG_ID);
}

function requireToken(): string {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) {
    const err = new Error(
      "SUPABASE_ACCESS_TOKEN missing. Set it in Vercel env vars."
    ) as ProvisionerError;
    err.endpoint = "env";
    err.status = 503;
    err.body = "missing SUPABASE_ACCESS_TOKEN";
    throw err;
  }
  return token;
}

function requireOrg(): string {
  const org = process.env.SUPABASE_ORG_ID;
  if (!org) {
    const err = new Error(
      "SUPABASE_ORG_ID missing. Set it in Vercel env vars."
    ) as ProvisionerError;
    err.endpoint = "env";
    err.status = 503;
    err.body = "missing SUPABASE_ORG_ID";
    throw err;
  }
  return org;
}

async function sbFetch<T>(
  path: string,
  init: { method: string; body?: unknown }
): Promise<T> {
  const token = requireToken();
  const url = `${SUPABASE_API}${path}`;
  const res = await fetch(url, {
    method: init.method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    // Trip the circuit breaker on auth failures so subsequent builds in
    // this cold start skip Supabase entirely. The Management API returns
    // "JWT could not be decoded" (literal string) for expired / invalid
    // personal access tokens — catch that explicitly too.
    if (
      res.status === 401 ||
      res.status === 403 ||
      /JWT could not be decoded/i.test(text)
    ) {
      markTokenPoisoned(
        `${res.status} ${res.statusText} on ${init.method} ${path} — token appears invalid. Set a fresh SUPABASE_ACCESS_TOKEN in Vercel.`
      );
    }
    const err = new Error(
      `Supabase API ${init.method} ${path} failed: ${res.status} ${res.statusText} — ${text}`
    ) as ProvisionerError;
    err.endpoint = `${init.method} ${path}`;
    err.status = res.status;
    err.body = text;
    throw err;
  }
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}

function randomDbPass(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let out = "";
  for (let i = 0; i < 32; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

export async function createProject(
  input: CreateProjectInput
): Promise<CreateProjectResult> {
  const orgId = requireOrg();
  const dbPass = input.dbPass ?? randomDbPass();
  const region = input.region ?? "us-east-1";

  const created = await sbFetch<SupabaseProjectCreateResponse>("/v1/projects", {
    method: "POST",
    body: {
      name: input.name,
      organization_id: orgId,
      region,
      db_pass: dbPass,
      plan: "free",
    },
  });

  const projectRef = created.id;

  // Fetch API keys (newer endpoint — keys not always returned in create response).
  let anonKey = created.anon_key ?? "";
  let serviceKey = created.service_role_key ?? "";
  if (!anonKey || !serviceKey) {
    try {
      const keys = await sbFetch<SupabaseApiKey[]>(
        `/v1/projects/${projectRef}/api-keys`,
        { method: "GET" }
      );
      for (const k of keys) {
        if (k.name === "anon") anonKey = k.api_key;
        if (k.name === "service_role") serviceKey = k.api_key;
      }
    } catch {
      // Keys may take a moment to provision; caller can retry via list.
    }
  }

  const host = created.database?.host ?? `db.${projectRef}.supabase.co`;
  const dbUrl = `postgresql://postgres:${encodeURIComponent(dbPass)}@${host}:5432/postgres`;

  return { projectRef, anonKey, serviceKey, dbUrl };
}

export async function listProjects(): Promise<SupabaseProjectListItem[]> {
  return sbFetch<SupabaseProjectListItem[]>("/v1/projects", { method: "GET" });
}

export async function runSql(
  projectRef: string,
  sql: string
): Promise<SqlRow[]> {
  const result = await sbFetch<SqlRow[]>(
    `/v1/projects/${projectRef}/database/query`,
    { method: "POST", body: { query: sql } }
  );
  return result;
}

function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

function buildCreateTableSql(tableName: string, spec: TableSpec): string {
  const colDefs: string[] = [];
  const fkDefs: string[] = [];
  for (const col of spec.columns) {
    const parts: string[] = [quoteIdent(col.name), col.type];
    if (col.primary) parts.push("PRIMARY KEY");
    if (col.nullable === false) parts.push("NOT NULL");
    if (col.default !== undefined) parts.push(`DEFAULT ${col.default}`);
    colDefs.push(parts.join(" "));
    if (col.foreignKey) {
      fkDefs.push(
        `FOREIGN KEY (${quoteIdent(col.name)}) REFERENCES ${quoteIdent(
          col.foreignKey.table
        )}(${quoteIdent(col.foreignKey.column)}) ON DELETE CASCADE`
      );
    }
  }
  const allDefs = [...colDefs, ...fkDefs].join(",\n  ");
  return `CREATE TABLE IF NOT EXISTS ${quoteIdent(tableName)} (\n  ${allDefs}\n);`;
}

function buildRlsSql(tableName: string, mode: RlsMode): string {
  const t = quoteIdent(tableName);
  const stmts: string[] = [
    `ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY;`,
    `DROP POLICY IF EXISTS "${tableName}_select" ON ${t};`,
    `DROP POLICY IF EXISTS "${tableName}_insert" ON ${t};`,
    `DROP POLICY IF EXISTS "${tableName}_update" ON ${t};`,
    `DROP POLICY IF EXISTS "${tableName}_delete" ON ${t};`,
  ];
  if (mode === "public") {
    stmts.push(
      `CREATE POLICY "${tableName}_select" ON ${t} FOR SELECT USING (true);`,
      `CREATE POLICY "${tableName}_insert" ON ${t} FOR INSERT WITH CHECK (true);`,
      `CREATE POLICY "${tableName}_update" ON ${t} FOR UPDATE USING (true);`,
      `CREATE POLICY "${tableName}_delete" ON ${t} FOR DELETE USING (true);`
    );
  } else if (mode === "authenticated") {
    stmts.push(
      `CREATE POLICY "${tableName}_select" ON ${t} FOR SELECT USING (auth.role() = 'authenticated');`,
      `CREATE POLICY "${tableName}_insert" ON ${t} FOR INSERT WITH CHECK (auth.role() = 'authenticated');`,
      `CREATE POLICY "${tableName}_update" ON ${t} FOR UPDATE USING (auth.role() = 'authenticated');`,
      `CREATE POLICY "${tableName}_delete" ON ${t} FOR DELETE USING (auth.role() = 'authenticated');`
    );
  } else {
    // owner
    stmts.push(
      `CREATE POLICY "${tableName}_select" ON ${t} FOR SELECT USING (auth.uid() = user_id);`,
      `CREATE POLICY "${tableName}_insert" ON ${t} FOR INSERT WITH CHECK (auth.uid() = user_id);`,
      `CREATE POLICY "${tableName}_update" ON ${t} FOR UPDATE USING (auth.uid() = user_id);`,
      `CREATE POLICY "${tableName}_delete" ON ${t} FOR DELETE USING (auth.uid() = user_id);`
    );
  }
  return stmts.join("\n");
}

export async function createTablesFromSchema(
  projectRef: string,
  schema: SchemaSpec
): Promise<{ tablesCreated: string[] }> {
  const tablesCreated: string[] = [];
  const sqlChunks: string[] = [];
  for (const [tableName, spec] of Object.entries(schema)) {
    sqlChunks.push(buildCreateTableSql(tableName, spec));
    if (spec.rls) sqlChunks.push(buildRlsSql(tableName, spec.rls));
    tablesCreated.push(tableName);
  }
  if (sqlChunks.length === 0) return { tablesCreated };
  await runSql(projectRef, sqlChunks.join("\n\n"));
  return { tablesCreated };
}

export type AuthProvider = "email" | "google" | "github";

export async function enableAuth(
  projectRef: string,
  providers: AuthProvider[]
): Promise<{ enabled: AuthProvider[] }> {
  const body: Record<string, unknown> = {
    site_url: `https://${projectRef}.supabase.co`,
  };
  for (const p of providers) {
    if (p === "email") {
      body.external_email_enabled = true;
      body.mailer_autoconfirm = true;
    } else if (p === "google") {
      body.external_google_enabled = true;
    } else if (p === "github") {
      body.external_github_enabled = true;
    }
  }
  await sbFetch<unknown>(`/v1/projects/${projectRef}/config/auth`, {
    method: "PATCH",
    body,
  });
  return { enabled: providers };
}

export interface StorageBucket {
  name: string;
  id: string;
  public: boolean;
}

export async function createStorageBucket(
  projectRef: string,
  name: string,
  isPublic = false
): Promise<StorageBucket> {
  const result = await sbFetch<StorageBucket>(
    `/v1/projects/${projectRef}/storage/buckets`,
    { method: "POST", body: { name, public: isPublic } }
  );
  return { name, id: result.id ?? name, public: isPublic };
}

export interface ClientCodeInput {
  projectRef: string;
  anonKey: string;
}

export function generateClientCode(input: ClientCodeInput): string {
  const url = `https://${input.projectRef}.supabase.co`;
  return `// src/lib/supabase.ts — auto-generated by Zoobicon
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "${url}";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "${input.anonKey}";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
`;
}

export async function provisionFullStack(opts: {
  name: string;
  region?: string;
  schema?: SchemaSpec;
  auth?: AuthProvider[];
  buckets?: { name: string; public?: boolean }[];
}): Promise<{
  project: CreateProjectResult;
  tables: string[];
  auth: AuthProvider[];
  buckets: StorageBucket[];
  clientCode: string;
  envVars: { NEXT_PUBLIC_SUPABASE_URL: string; NEXT_PUBLIC_SUPABASE_ANON_KEY: string };
}> {
  const project = await createProject({ name: opts.name, region: opts.region });
  let tables: string[] = [];
  if (opts.schema) {
    const r = await createTablesFromSchema(project.projectRef, opts.schema);
    tables = r.tablesCreated;
  }
  let authEnabled: AuthProvider[] = [];
  if (opts.auth && opts.auth.length > 0) {
    const r = await enableAuth(project.projectRef, opts.auth);
    authEnabled = r.enabled;
  }
  const buckets: StorageBucket[] = [];
  if (opts.buckets) {
    for (const b of opts.buckets) {
      buckets.push(
        await createStorageBucket(project.projectRef, b.name, b.public ?? false)
      );
    }
  }
  return {
    project,
    tables,
    auth: authEnabled,
    buckets,
    clientCode: generateClientCode({
      projectRef: project.projectRef,
      anonKey: project.anonKey,
    }),
    envVars: {
      NEXT_PUBLIC_SUPABASE_URL: `https://${project.projectRef}.supabase.co`,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: project.anonKey,
    },
  };
}
