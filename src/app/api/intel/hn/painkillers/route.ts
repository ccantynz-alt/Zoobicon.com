/**
 * /api/intel/hn/painkillers — list recent painkillers and update status.
 *
 * GET  ?status=new|triaged|building|shipped|dismissed&limit=50
 * PATCH { id, status }
 */

import { NextResponse } from "next/server";
import {
  ensureHnTables,
  listRecentPainkillers,
  setPainkillerStatus,
} from "@/lib/hn-flywheel";

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["new", "triaged", "building", "shipped", "dismissed"];

export async function GET(request: Request) {
  try {
    await ensureHnTables();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);
    const rows = await listRecentPainkillers(limit, status);
    return NextResponse.json({ painkillers: rows });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { id?: string; status?: string };
    if (!body.id || !body.status) {
      return NextResponse.json({ error: "id and status required" }, { status: 400 });
    }
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { error: `status must be one of ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }
    await setPainkillerStatus(body.id, body.status);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
