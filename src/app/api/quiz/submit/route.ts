import { NextResponse } from "next/server";
import { submitAttempt, MissingEnvError } from "@/lib/quiz-engine";

export const runtime = "nodejs";

interface SubmitBody {
  quizId: string;
  userId: string;
  answers: Record<string, string>;
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = (await req.json()) as SubmitBody;
    if (!body.quizId || !body.userId || !body.answers) {
      return NextResponse.json({ error: "quizId, userId, answers required" }, { status: 400 });
    }
    const result = await submitAttempt(body.quizId, body.answers, body.userId);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof MissingEnvError) {
      return NextResponse.json({ error: err.message, envVar: err.envVar }, { status: 503 });
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
