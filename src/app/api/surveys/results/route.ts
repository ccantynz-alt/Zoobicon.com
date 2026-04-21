import { NextResponse } from "next/server";
import { aggregateResults } from "@/lib/survey-engine";

export const runtime = "nodejs";

export async function GET(req: Request): Promise<NextResponse> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL is not set" }, { status: 503 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const surveyId = searchParams.get("surveyId");
    if (!surveyId) {
      return NextResponse.json({ error: "surveyId required" }, { status: 400 });
    }
    const results = await aggregateResults(surveyId);
    return NextResponse.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
