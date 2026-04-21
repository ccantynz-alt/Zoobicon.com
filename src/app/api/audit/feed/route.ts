import { NextRequest, NextResponse } from "next/server";
import { getFeed, summarizeForUser } from "@/lib/audit-log";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const ownerId = url.searchParams.get("ownerId");
  if (!ownerId) {
    return NextResponse.json(
      { ok: false, error: "Missing required query param: ownerId" },
      { status: 400 }
    );
  }

  const action = url.searchParams.get("action") ?? undefined;
  const resourceType = url.searchParams.get("resourceType") ?? undefined;
  const since = url.searchParams.get("since") ?? undefined;
  const limitParam = url.searchParams.get("limit");
  const offsetParam = url.searchParams.get("offset");
  const wantSummary = url.searchParams.get("summary") === "true";
  const daysParam = url.searchParams.get("days");

  const limit = limitParam ? parseInt(limitParam, 10) : undefined;
  const offset = offsetParam ? parseInt(offsetParam, 10) : undefined;
  const days = daysParam ? parseInt(daysParam, 10) : 30;

  try {
    const events = await getFeed(ownerId, {
      limit: Number.isFinite(limit) ? limit : undefined,
      offset: Number.isFinite(offset) ? offset : undefined,
      action,
      resourceType,
      since,
    });

    if (wantSummary) {
      const summary = await summarizeForUser(
        ownerId,
        Number.isFinite(days) ? days : 30
      );
      return NextResponse.json({ ok: true, events, summary });
    }

    return NextResponse.json({ ok: true, events });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load audit feed";
    return NextResponse.json(
      {
        ok: false,
        error: message,
        hint: "Ensure DATABASE_URL is set and audit_logs table exists.",
      },
      { status: 500 }
    );
  }
}
