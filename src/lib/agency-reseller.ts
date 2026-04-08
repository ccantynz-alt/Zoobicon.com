import { sql } from "@/lib/db";

export interface AgencyClient {
  id: string;
  agencyId: string;
  name: string;
  email: string;
  company?: string;
  plan: "starter" | "pro" | "enterprise";
  status: "active" | "paused" | "cancelled";
  monthlyValue: number;
  ourCost: number;
  margin: number;
  createdAt: number;
  metadata?: Record<string, unknown>;
}

export interface AgencyBillingReport {
  agencyId: string;
  totalClients: number;
  activeClients: number;
  monthlyRevenue: number;
  monthlyCost: number;
  monthlyMargin: number;
  marginPct: number;
  byPlan: Record<string, { count: number; revenue: number }>;
}

type Row = {
  id: string;
  agency_id: string;
  name: string;
  email: string;
  company: string | null;
  plan: string;
  status: string;
  monthly_value: string | number;
  our_cost: string | number;
  created_at: string | number;
  metadata: Record<string, unknown> | null;
};

function dbError(e: unknown): Error {
  const msg = e instanceof Error ? e.message : String(e);
  return new Error(`Database unavailable — set DATABASE_URL (${msg})`);
}

function mapRow(r: Row): AgencyClient {
  const monthlyValue = Number(r.monthly_value) || 0;
  const ourCost = Number(r.our_cost) || 0;
  return {
    id: r.id,
    agencyId: r.agency_id,
    name: r.name,
    email: r.email,
    company: r.company ?? undefined,
    plan: (r.plan as AgencyClient["plan"]) || "starter",
    status: (r.status as AgencyClient["status"]) || "active",
    monthlyValue,
    ourCost,
    margin: monthlyValue - ourCost,
    createdAt: Number(r.created_at) || 0,
    metadata: r.metadata ?? undefined,
  };
}

export async function ensureAgencyTables(): Promise<void> {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS agency_reseller_clients (
        id TEXT PRIMARY KEY,
        agency_id TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        company TEXT,
        plan TEXT NOT NULL DEFAULT 'starter',
        status TEXT NOT NULL DEFAULT 'active',
        monthly_value NUMERIC NOT NULL DEFAULT 0,
        our_cost NUMERIC NOT NULL DEFAULT 0,
        created_at BIGINT NOT NULL,
        metadata JSONB
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_agency_reseller_clients_agency ON agency_reseller_clients(agency_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_agency_reseller_clients_status ON agency_reseller_clients(status)`;
  } catch (e) {
    throw dbError(e);
  }
}

export async function listClients(agencyId: string): Promise<AgencyClient[]> {
  try {
    const rows = (await sql`
      SELECT * FROM agency_reseller_clients
      WHERE agency_id = ${agencyId}
      ORDER BY created_at DESC
    `) as unknown as Row[];
    return rows.map(mapRow);
  } catch (e) {
    throw dbError(e);
  }
}

export async function getClient(id: string): Promise<AgencyClient | null> {
  try {
    const rows = (await sql`
      SELECT * FROM agency_reseller_clients WHERE id = ${id} LIMIT 1
    `) as unknown as Row[];
    return rows.length > 0 ? mapRow(rows[0]) : null;
  } catch (e) {
    throw dbError(e);
  }
}

export async function createClient(
  input: Omit<AgencyClient, "id" | "createdAt" | "margin">
): Promise<AgencyClient> {
  try {
    const id = crypto.randomUUID();
    const createdAt = Date.now();
    const metadata = input.metadata ?? null;
    const rows = (await sql`
      INSERT INTO agency_reseller_clients
        (id, agency_id, name, email, company, plan, status, monthly_value, our_cost, created_at, metadata)
      VALUES
        (${id}, ${input.agencyId}, ${input.name}, ${input.email}, ${input.company ?? null},
         ${input.plan}, ${input.status}, ${input.monthlyValue}, ${input.ourCost}, ${createdAt},
         ${metadata as unknown as string})
      RETURNING *
    `) as unknown as Row[];
    return mapRow(rows[0]);
  } catch (e) {
    throw dbError(e);
  }
}

export async function updateClient(
  id: string,
  patch: Partial<AgencyClient>
): Promise<AgencyClient | null> {
  try {
    const existing = await getClient(id);
    if (!existing) return null;
    const merged = { ...existing, ...patch };
    const rows = (await sql`
      UPDATE agency_reseller_clients SET
        agency_id = ${merged.agencyId},
        name = ${merged.name},
        email = ${merged.email},
        company = ${merged.company ?? null},
        plan = ${merged.plan},
        status = ${merged.status},
        monthly_value = ${merged.monthlyValue},
        our_cost = ${merged.ourCost},
        metadata = ${(merged.metadata ?? null) as unknown as string}
      WHERE id = ${id}
      RETURNING *
    `) as unknown as Row[];
    return rows.length > 0 ? mapRow(rows[0]) : null;
  } catch (e) {
    throw dbError(e);
  }
}

export async function deleteClient(id: string): Promise<boolean> {
  try {
    const rows = (await sql`
      DELETE FROM agency_reseller_clients WHERE id = ${id} RETURNING id
    `) as unknown as { id: string }[];
    return rows.length > 0;
  } catch (e) {
    throw dbError(e);
  }
}

export async function getBillingReport(agencyId: string): Promise<AgencyBillingReport> {
  const clients = await listClients(agencyId);
  const active = clients.filter((c) => c.status === "active");
  const monthlyRevenue = active.reduce((s, c) => s + c.monthlyValue, 0);
  const monthlyCost = active.reduce((s, c) => s + c.ourCost, 0);
  const monthlyMargin = monthlyRevenue - monthlyCost;
  const byPlan: Record<string, { count: number; revenue: number }> = {};
  for (const c of active) {
    const k = c.plan;
    if (!byPlan[k]) byPlan[k] = { count: 0, revenue: 0 };
    byPlan[k].count += 1;
    byPlan[k].revenue += c.monthlyValue;
  }
  return {
    agencyId,
    totalClients: clients.length,
    activeClients: active.length,
    monthlyRevenue,
    monthlyCost,
    monthlyMargin,
    marginPct: monthlyRevenue > 0 ? (monthlyMargin / monthlyRevenue) * 100 : 0,
    byPlan,
  };
}
