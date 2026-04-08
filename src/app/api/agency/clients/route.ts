import { NextRequest, NextResponse } from "next/server";
import {
  ensureAgencyTables,
  listClients,
  createClient,
  type AgencyClient,
} from "@/lib/agency-reseller";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const agencyId = req.nextUrl.searchParams.get("agencyId");
  if (!agencyId) {
    return NextResponse.json(
      { ok: false, error: "agencyId query parameter required" },
      { status: 400 }
    );
  }
  try {
    await ensureAgencyTables();
    const clients = await listClients(agencyId);
    return NextResponse.json({ ok: true, clients });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON body" }, { status: 400 });
  }

  const agencyId = typeof body.agencyId === "string" ? body.agencyId : "";
  const name = typeof body.name === "string" ? body.name : "";
  const email = typeof body.email === "string" ? body.email : "";
  if (!agencyId || !name || !email) {
    return NextResponse.json(
      { ok: false, error: "agencyId, name, and email are required" },
      { status: 400 }
    );
  }

  const plan = (body.plan as AgencyClient["plan"]) || "starter";
  if (!["starter", "pro", "enterprise"].includes(plan)) {
    return NextResponse.json({ ok: false, error: "invalid plan" }, { status: 400 });
  }
  const status = (body.status as AgencyClient["status"]) || "active";
  if (!["active", "paused", "cancelled"].includes(status)) {
    return NextResponse.json({ ok: false, error: "invalid status" }, { status: 400 });
  }

  try {
    await ensureAgencyTables();
    const client = await createClient({
      agencyId,
      name,
      email,
      company: typeof body.company === "string" ? body.company : undefined,
      plan,
      status,
      monthlyValue: typeof body.monthlyValue === "number" ? body.monthlyValue : 0,
      ourCost: typeof body.ourCost === "number" ? body.ourCost : 0,
      metadata:
        body.metadata && typeof body.metadata === "object"
          ? (body.metadata as Record<string, unknown>)
          : undefined,
    });
    return NextResponse.json({ ok: true, client });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
