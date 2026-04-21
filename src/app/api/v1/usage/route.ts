import { NextRequest, NextResponse } from "next/server";
import { getUsage } from "@/lib/api-keys";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!req.headers.get("x-admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const customerId = req.nextUrl.searchParams.get("customerId")?.trim();
  const daysParam = req.nextUrl.searchParams.get("days");
  const days = daysParam ? Math.max(1, Math.min(365, parseInt(daysParam, 10) || 30)) : 30;

  if (!customerId) {
    return NextResponse.json({ error: "customerId is required" }, { status: 400 });
  }

  try {
    const result = await getUsage(customerId, days);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch usage";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
