import { NextRequest, NextResponse } from "next/server";
import { getPayoutQueue, markPaid } from "@/lib/affiliate-program";
import { authenticateRequest } from "@/lib/auth-guard";

async function adminGuard(req: NextRequest): Promise<NextResponse | null> {
  const { user, error } = await authenticateRequest(req, { requireAuth: true });
  if (error) return error as NextResponse;
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Admin required" }, { status: 403 });
  }
  return null;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const denied = await adminGuard(req);
  if (denied) return denied;
  try {
    const queue = await getPayoutQueue();
    return NextResponse.json({ queue });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const denied = await adminGuard(req);
  if (denied) return denied;
  try {
    const body = (await req.json()) as { conversionIds?: number[] };
    if (!Array.isArray(body.conversionIds)) {
      return NextResponse.json({ error: "conversionIds array required" }, { status: 400 });
    }
    await markPaid(body.conversionIds);
    return NextResponse.json({ ok: true, count: body.conversionIds.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
