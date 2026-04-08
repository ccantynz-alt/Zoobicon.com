import { NextResponse } from "next/server";
import { leaderboard, MissingEnvError } from "@/lib/quiz-engine";

export const runtime = "nodejs";

export async function GET(req: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const quizId = searchParams.get("quizId");
    if (!quizId) {
      return NextResponse.json({ error: "quizId required" }, { status: 400 });
    }
    const entries = await leaderboard(quizId);
    return NextResponse.json({ entries });
  } catch (err) {
    if (err instanceof MissingEnvError) {
      return NextResponse.json({ error: err.message, envVar: err.envVar }, { status: 503 });
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
