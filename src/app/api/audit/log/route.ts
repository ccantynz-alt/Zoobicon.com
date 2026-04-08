import { NextRequest, NextResponse } from "next/server";
import { logEvent } from "@/lib/audit-log";

export const runtime = "nodejs";

interface LogBody {
  ownerId?: string;
  actorId?: string;
  actorEmail?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: LogBody;
  try {
    body = (await req.json()) as LogBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!body.ownerId || !body.action || !body.resourceType) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing required fields: ownerId, action, resourceType",
      },
      { status: 400 }
    );
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    undefined;
  const userAgent = req.headers.get("user-agent") || undefined;

  try {
    const event = await logEvent({
      ownerId: body.ownerId,
      actorId: body.actorId,
      actorEmail: body.actorEmail,
      action: body.action,
      resourceType: body.resourceType,
      resourceId: body.resourceId,
      metadata: body.metadata,
      ip,
      userAgent,
    });
    return NextResponse.json({ ok: true, event });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to log event";
    return NextResponse.json(
      {
        ok: false,
        error: message,
        hint: "Ensure DATABASE_URL is set and audit_logs table is reachable.",
      },
      { status: 500 }
    );
  }
}
