import { NextResponse } from "next/server";
import { createSurvey, type SurveyQuestion } from "@/lib/survey-engine";

export const runtime = "nodejs";

interface CreateBody {
  userId?: string;
  title?: string;
  questions?: SurveyQuestion[];
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL is not set" }, { status: 503 });
  }
  try {
    const body = (await req.json()) as CreateBody;
    if (!body.userId || !body.title || !Array.isArray(body.questions)) {
      return NextResponse.json({ error: "userId, title, questions required" }, { status: 400 });
    }
    const survey = await createSurvey({
      userId: body.userId,
      title: body.title,
      questions: body.questions,
    });
    return NextResponse.json({ survey });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
