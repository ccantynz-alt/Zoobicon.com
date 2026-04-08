import { NextRequest, NextResponse } from "next/server";
import { getProgress, getRecommendation } from "@/lib/onboarding-tracker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json(
        { error: "userId query parameter is required" },
        { status: 400 }
      );
    }
    const progress = await getProgress(userId);
    const recommendation = await getRecommendation(userId);
    return NextResponse.json({
      progress: progress.row,
      nextStep: progress.nextStep,
      completionPct: progress.completionPct,
      recommendation,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to load onboarding state", detail: message },
      { status: 500 }
    );
  }
}
