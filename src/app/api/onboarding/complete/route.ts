import { NextRequest, NextResponse } from "next/server";
import { markComplete, getRecommendation } from "@/lib/onboarding-tracker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CompleteBody {
  userId?: string;
  stepId?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CompleteBody;
    const { userId, stepId } = body;
    if (!userId || !stepId) {
      return NextResponse.json(
        { error: "userId and stepId are required" },
        { status: 400 }
      );
    }
    const progress = await markComplete(userId, stepId);
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
      { error: "Failed to mark step complete", detail: message },
      { status: 500 }
    );
  }
}
