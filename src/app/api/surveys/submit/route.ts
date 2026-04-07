import { NextResponse } from "next/server";
import { submitResponse, type AnswerValue } from "@/lib/survey-engine";

export const runtime = "nodejs";

interface SubmitBody {
  surveyId?: string;
  answers?: Record<string, AnswerValue>;
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL is not set" }, { status: 503 });
  }
  try {
    const body = (await req.json()) as SubmitBody;
    if (!body.surveyId || !body.answers || typeof body.answers !== "object") {
      return NextResponse.json({ error: "surveyId and answers required" }, { status: 400 });
    }
    const response = await submitResponse(body.surveyId, body.answers);
    return NextResponse.json({ response });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
