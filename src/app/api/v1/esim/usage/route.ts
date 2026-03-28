import { NextRequest, NextResponse } from "next/server";
import { getEsimUsage } from "@/lib/esim-provider";

/**
 * GET /api/v1/esim/usage?esimId=xxx
 *
 * Returns real-time usage data for an eSIM.
 */
export async function GET(req: NextRequest) {
  try {
    const esimId = req.nextUrl.searchParams.get("esimId");

    if (!esimId) {
      return NextResponse.json(
        { error: "esimId query parameter is required" },
        { status: 400 }
      );
    }

    const usage = await getEsimUsage(esimId);

    return NextResponse.json({
      esimId: usage.esimId,
      data: {
        usedMB: usage.dataUsedMB,
        remainingMB: usage.dataRemainingMB,
        totalMB: usage.dataTotalMB,
        usedGB: +(usage.dataUsedMB / 1024).toFixed(2),
        remainingGB: +(usage.dataRemainingMB / 1024).toFixed(2),
        totalGB: +(usage.dataTotalMB / 1024).toFixed(2),
        percentUsed: usage.percentUsed,
      },
      status: usage.status,
      validUntil: usage.validUntil,
      lastUpdated: usage.lastUpdated,
    });
  } catch (err) {
    console.error("eSIM usage error:", err);
    return NextResponse.json(
      { error: "Failed to fetch eSIM usage" },
      { status: 500 }
    );
  }
}
