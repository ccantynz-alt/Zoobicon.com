import { NextResponse } from "next/server";
import { generateQuiz, MissingEnvError } from "@/lib/quiz-engine";

export const runtime = "nodejs";

interface GenerateBody {
  topic: string;
  count: number;
  difficulty: "easy" | "medium" | "hard";
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = (await req.json()) as GenerateBody;
    if (!body.topic || !body.count || !body.difficulty) {
      return NextResponse.json({ error: "topic, count, difficulty required" }, { status: 400 });
    }
    const questions = await generateQuiz(body);
    return NextResponse.json({ questions });
  } catch (err) {
    if (err instanceof MissingEnvError) {
      return NextResponse.json({ error: err.message, envVar: err.envVar }, { status: 503 });
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
