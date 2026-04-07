import { NextResponse } from "next/server";
import { createQuiz, MissingEnvError, type QuizQuestion } from "@/lib/quiz-engine";

export const runtime = "nodejs";

interface CreateBody {
  userId: string;
  title: string;
  questions: QuizQuestion[];
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = (await req.json()) as CreateBody;
    if (!body.userId || !body.title || !Array.isArray(body.questions)) {
      return NextResponse.json({ error: "userId, title, questions required" }, { status: 400 });
    }
    const quiz = await createQuiz(body);
    return NextResponse.json({ quiz });
  } catch (err) {
    if (err instanceof MissingEnvError) {
      return NextResponse.json({ error: err.message, envVar: err.envVar }, { status: 503 });
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
