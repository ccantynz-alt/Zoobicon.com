import { NextRequest, NextResponse } from "next/server";
import {
  createIncident,
  updateIncident,
  ensureStatusTables,
  type IncidentSeverity,
  type IncidentStatus,
  type StatusIncidentRow,
} from "@/lib/status-page";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SEVERITIES: IncidentSeverity[] = ["minor", "major", "critical"];
const STATUSES: IncidentStatus[] = ["investigating", "identified", "monitoring", "resolved"];

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { pageId?: unknown; title?: unknown; body?: unknown; severity?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const pageId = Number(body.pageId);
  const title = typeof body.title === "string" ? body.title : "";
  const text = typeof body.body === "string" ? body.body : "";
  const severity = body.severity as IncidentSeverity;
  if (!pageId || !title || !SEVERITIES.includes(severity)) {
    return NextResponse.json({ error: "pageId, title, severity required" }, { status: 400 });
  }
  try {
    const incident = await createIncident(pageId, title, text, severity);
    return NextResponse.json({ incident });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const pageId = Number(req.nextUrl.searchParams.get("pageId"));
  if (!pageId) {
    return NextResponse.json({ error: "pageId required" }, { status: 400 });
  }
  try {
    await ensureStatusTables();
    const incidents = (await sql`
      SELECT * FROM status_incidents
      WHERE page_id = ${pageId}
      ORDER BY started_at DESC
      LIMIT 100
    `) as StatusIncidentRow[];
    return NextResponse.json({ incidents });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  let body: { id?: unknown; status?: unknown; body?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const id = Number(body.id);
  const status = body.status as IncidentStatus;
  const text = typeof body.body === "string" ? body.body : undefined;
  if (!id || !STATUSES.includes(status)) {
    return NextResponse.json({ error: "id and valid status required" }, { status: 400 });
  }
  try {
    const incident = await updateIncident(id, status, text);
    return NextResponse.json({ incident });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown error" },
      { status: 500 }
    );
  }
}
