import { NextRequest, NextResponse } from "next/server";
import { topupEsim } from "@/lib/esim-provider";

/**
 * POST /api/v1/esim/topup
 *
 * Body: { esimId: string, planId: string }
 * Adds more data to an existing eSIM.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { esimId, planId } = body;

    if (!esimId || !planId) {
      return NextResponse.json(
        { error: "esimId and planId are required" },
        { status: 400 }
      );
    }

    const result = await topupEsim(esimId, planId);

    return NextResponse.json({
      success: result.success,
      newDataTotalGB: +(result.newDataTotalMB / 1024).toFixed(2),
      newValidUntil: result.newValidUntil,
      transactionId: result.transactionId,
    });
  } catch (err) {
    console.error("eSIM topup error:", err);
    return NextResponse.json(
      { error: "Top-up failed. Please try again." },
      { status: 500 }
    );
  }
}
