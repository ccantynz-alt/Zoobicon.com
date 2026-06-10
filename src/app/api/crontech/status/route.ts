/**
 * GET /api/crontech/status?projectId=ctp_abc123
 *
 * Polls Vapron for the deploy status of a project. The builder calls
 * this every 3 seconds after a deploy that returns status "provisioning",
 * stopping once status flips to "live" or "failed".
 *
 * Wraps getCrontechStatus() in crontech-sync.ts — mock-safe (returns
 * { status: "live" } immediately when CRONTECH_PAT is unset).
 */

import { NextRequest, NextResponse } from "next/server";
import { getCrontechStatus } from "@/lib/crontech-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }
  const result = await getCrontechStatus(projectId);
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
