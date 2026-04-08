import { NextRequest, NextResponse } from "next/server";
import { ensureAgencyTables, getBillingReport } from "@/lib/agency-reseller";

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
    const report = await getBillingReport(agencyId);
    return NextResponse.json({ ok: true, report });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
