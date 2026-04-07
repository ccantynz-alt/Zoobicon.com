import { NextResponse } from "next/server";
import { generateSurveyAI } from "@/lib/survey-engine";

export const runtime = "nodejs";

interface GenerateBody {
  prompt?: string;
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set" }, { status: 503 });
  }
  try {
    const body = (await req.json()) as GenerateBody;
    if (!body.prompt) {
      return NextResponse.json({ error: "prompt required" }, { status: 400 });
    }
    const survey = await generateSurveyAI(body.prompt);
    return NextResponse.json({ survey });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
