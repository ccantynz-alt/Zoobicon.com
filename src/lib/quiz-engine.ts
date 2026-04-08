import Anthropic from "@anthropic-ai/sdk";
import { sql } from "./db";

export type QuizQuestionType = "multiple" | "true_false" | "short_answer" | "essay";

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  prompt: string;
  options?: string[];
  correct: string | string[];
  points: number;
}

export interface Quiz {
  id: string;
  user_id: string;
  title: string;
  questions: QuizQuestion[];
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  answers: Record<string, string>;
  score: number;
  max_score: number;
  created_at: string;
}

export interface SubmitResult {
  attemptId: string;
  score: number;
  maxScore: number;
  pendingEssays: string[];
  breakdown: Array<{ questionId: string; awarded: number; max: number; status: "correct" | "incorrect" | "pending" }>;
}

export interface LeaderboardEntry {
  user_id: string;
  score: number;
  max_score: number;
  created_at: string;
}

export interface GenerateQuizParams {
  topic: string;
  count: number;
  difficulty: "easy" | "medium" | "hard";
}

let _anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic {
  if (!_anthropic) {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
    _anthropic = new Anthropic({ apiKey: key });
  }
  return _anthropic;
}

export class MissingEnvError extends Error {
  constructor(public envVar: string) {
    super(`Missing environment variable: ${envVar}`);
    this.name = "MissingEnvError";
  }
}

export function assertEnv(): void {
  if (!process.env.DATABASE_URL) throw new MissingEnvError("DATABASE_URL");
  if (!process.env.ANTHROPIC_API_KEY) throw new MissingEnvError("ANTHROPIC_API_KEY");
}

async function ensureTables(): Promise<void> {
  await sql`CREATE TABLE IF NOT EXISTS quizzes (
    id text PRIMARY KEY,
    user_id text NOT NULL,
    title text NOT NULL,
    questions jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS quiz_attempts (
    id text PRIMARY KEY,
    quiz_id text NOT NULL,
    user_id text NOT NULL,
    answers jsonb NOT NULL,
    score int NOT NULL,
    max_score int NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function createQuiz(params: {
  userId: string;
  title: string;
  questions: QuizQuestion[];
}): Promise<Quiz> {
  if (!process.env.DATABASE_URL) throw new MissingEnvError("DATABASE_URL");
  await ensureTables();
  const id = newId("quiz");
  const rows = (await sql`INSERT INTO quizzes (id, user_id, title, questions)
    VALUES (${id}, ${params.userId}, ${params.title}, ${JSON.stringify(params.questions)}::jsonb)
    RETURNING id, user_id, title, questions, created_at`) as unknown as Quiz[];
  return rows[0];
}

export async function getQuiz(quizId: string): Promise<Quiz | null> {
  if (!process.env.DATABASE_URL) throw new MissingEnvError("DATABASE_URL");
  await ensureTables();
  const rows = (await sql`SELECT id, user_id, title, questions, created_at FROM quizzes WHERE id = ${quizId}`) as unknown as Quiz[];
  return rows[0] ?? null;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function isObjectiveCorrect(question: QuizQuestion, answer: string | undefined): boolean {
  if (answer === undefined) return false;
  const correct = question.correct;
  if (Array.isArray(correct)) {
    return correct.some((c) => normalize(c) === normalize(answer));
  }
  return normalize(correct) === normalize(answer);
}

export async function submitAttempt(
  quizId: string,
  answers: Record<string, string>,
  userId: string
): Promise<SubmitResult> {
  if (!process.env.DATABASE_URL) throw new MissingEnvError("DATABASE_URL");
  await ensureTables();
  const quiz = await getQuiz(quizId);
  if (!quiz) throw new Error(`Quiz not found: ${quizId}`);

  let score = 0;
  let maxScore = 0;
  const pendingEssays: string[] = [];
  const breakdown: SubmitResult["breakdown"] = [];

  for (const q of quiz.questions) {
    maxScore += q.points;
    const ans = answers[q.id];
    if (q.type === "essay") {
      pendingEssays.push(q.id);
      breakdown.push({ questionId: q.id, awarded: 0, max: q.points, status: "pending" });
      continue;
    }
    if (isObjectiveCorrect(q, ans)) {
      score += q.points;
      breakdown.push({ questionId: q.id, awarded: q.points, max: q.points, status: "correct" });
    } else {
      breakdown.push({ questionId: q.id, awarded: 0, max: q.points, status: "incorrect" });
    }
  }

  const id = newId("att");
  await sql`INSERT INTO quiz_attempts (id, quiz_id, user_id, answers, score, max_score)
    VALUES (${id}, ${quizId}, ${userId}, ${JSON.stringify(answers)}::jsonb, ${score}, ${maxScore})`;

  return { attemptId: id, score, maxScore, pendingEssays, breakdown };
}

export interface EssayGrade {
  score: number;
  max: number;
  feedback: string;
}

export async function gradeEssay(answer: string, rubric: string, max = 10): Promise<EssayGrade> {
  if (!process.env.ANTHROPIC_API_KEY) throw new MissingEnvError("ANTHROPIC_API_KEY");
  const client = getAnthropic();
  const msg = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 600,
    messages: [
      {
        role: "user",
        content: `You are an exam grader. Grade the essay against the rubric. Return STRICT JSON only: {"score": number, "feedback": string}. Score 0..${max}.\n\nRUBRIC:\n${rubric}\n\nESSAY:\n${answer}`,
      },
    ],
  });
  const text = msg.content
    .map((c) => (c.type === "text" ? c.text : ""))
    .join("")
    .trim();
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Grader returned no JSON");
  const parsed = JSON.parse(match[0]) as { score: number; feedback: string };
  const clamped = Math.max(0, Math.min(max, Math.round(parsed.score)));
  return { score: clamped, max, feedback: parsed.feedback };
}

export async function generateQuiz(params: GenerateQuizParams): Promise<QuizQuestion[]> {
  if (!process.env.ANTHROPIC_API_KEY) throw new MissingEnvError("ANTHROPIC_API_KEY");
  const client = getAnthropic();
  const msg = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: `Generate a ${params.difficulty} quiz on "${params.topic}" with exactly ${params.count} questions. Mix multiple, true_false, short_answer, and one essay if count >= 4. Return STRICT JSON only as: {"questions": [{"id": "q1", "type": "multiple|true_false|short_answer|essay", "prompt": "...", "options": ["..."], "correct": "...", "points": 1}]}. options only for multiple. correct is the exact string of the right option / "true" or "false" / expected short answer / rubric for essay.`,
      },
    ],
  });
  const text = msg.content
    .map((c) => (c.type === "text" ? c.text : ""))
    .join("")
    .trim();
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Generator returned no JSON");
  const parsed = JSON.parse(match[0]) as { questions: QuizQuestion[] };
  return parsed.questions;
}

export async function leaderboard(quizId: string, limit = 20): Promise<LeaderboardEntry[]> {
  if (!process.env.DATABASE_URL) throw new MissingEnvError("DATABASE_URL");
  await ensureTables();
  const rows = (await sql`SELECT user_id, score, max_score, created_at
    FROM quiz_attempts
    WHERE quiz_id = ${quizId}
    ORDER BY score DESC, created_at ASC
    LIMIT ${limit}`) as unknown as LeaderboardEntry[];
  return rows;
}
