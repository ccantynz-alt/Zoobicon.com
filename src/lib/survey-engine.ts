import Anthropic from "@anthropic-ai/sdk";
import { sql } from "./db";

export type QuestionType = "text" | "multiple" | "single" | "rating" | "nps" | "yes_no";

export interface SurveyQuestion {
  id: string;
  type: QuestionType;
  label: string;
  options?: string[];
  required?: boolean;
}

export interface SurveyRow {
  id: string;
  user_id: string;
  title: string;
  questions: SurveyQuestion[];
  created_at: string;
}

export interface SurveyResponseRow {
  id: string;
  survey_id: string;
  answers: Record<string, string | number | string[] | boolean>;
  created_at: string;
}

export type AnswerValue = string | number | string[] | boolean;

let schemaReady = false;
async function ensureSchema(): Promise<void> {
  if (schemaReady) return;
  await sql`CREATE TABLE IF NOT EXISTS surveys (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    questions JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS survey_responses (
    id TEXT PRIMARY KEY,
    survey_id TEXT NOT NULL,
    answers JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  schemaReady = true;
}

function rid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function createSurvey(input: {
  userId: string;
  title: string;
  questions: SurveyQuestion[];
}): Promise<SurveyRow> {
  await ensureSchema();
  const id = rid("sv");
  await sql`INSERT INTO surveys (id, user_id, title, questions)
    VALUES (${id}, ${input.userId}, ${input.title}, ${JSON.stringify(input.questions)}::jsonb)`;
  const rows = (await sql`SELECT * FROM surveys WHERE id = ${id}`) as SurveyRow[];
  return rows[0];
}

export async function getSurvey(surveyId: string): Promise<SurveyRow | null> {
  await ensureSchema();
  const rows = (await sql`SELECT * FROM surveys WHERE id = ${surveyId}`) as SurveyRow[];
  return rows[0] ?? null;
}

export async function submitResponse(
  surveyId: string,
  answers: Record<string, AnswerValue>
): Promise<SurveyResponseRow> {
  await ensureSchema();
  const survey = await getSurvey(surveyId);
  if (!survey) throw new Error("Survey not found");
  for (const q of survey.questions) {
    if (q.required && (answers[q.id] === undefined || answers[q.id] === null || answers[q.id] === "")) {
      throw new Error(`Missing required answer: ${q.id}`);
    }
  }
  const id = rid("sr");
  await sql`INSERT INTO survey_responses (id, survey_id, answers)
    VALUES (${id}, ${surveyId}, ${JSON.stringify(answers)}::jsonb)`;
  const rows = (await sql`SELECT * FROM survey_responses WHERE id = ${id}`) as SurveyResponseRow[];
  return rows[0];
}

export interface QuestionStats {
  questionId: string;
  type: QuestionType;
  label: string;
  responseCount: number;
  counts?: Record<string, number>;
  average?: number;
  npsScore?: number;
  promoters?: number;
  passives?: number;
  detractors?: number;
}

export interface SurveyResults {
  surveyId: string;
  title: string;
  totalResponses: number;
  questions: QuestionStats[];
}

export async function aggregateResults(surveyId: string): Promise<SurveyResults> {
  await ensureSchema();
  const survey = await getSurvey(surveyId);
  if (!survey) throw new Error("Survey not found");
  const responses = (await sql`SELECT * FROM survey_responses WHERE survey_id = ${surveyId}`) as SurveyResponseRow[];

  const stats: QuestionStats[] = survey.questions.map((q) => {
    const values: AnswerValue[] = responses
      .map((r) => r.answers[q.id])
      .filter((v): v is AnswerValue => v !== undefined && v !== null && v !== "");
    const stat: QuestionStats = {
      questionId: q.id,
      type: q.type,
      label: q.label,
      responseCount: values.length,
    };
    if (q.type === "single" || q.type === "yes_no") {
      const counts: Record<string, number> = {};
      for (const v of values) {
        const key = String(v);
        counts[key] = (counts[key] ?? 0) + 1;
      }
      stat.counts = counts;
    } else if (q.type === "multiple") {
      const counts: Record<string, number> = {};
      for (const v of values) {
        const arr = Array.isArray(v) ? v : [String(v)];
        for (const a of arr) {
          const key = String(a);
          counts[key] = (counts[key] ?? 0) + 1;
        }
      }
      stat.counts = counts;
    } else if (q.type === "rating") {
      const nums = values.map((v) => Number(v)).filter((n) => Number.isFinite(n));
      stat.average = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
    } else if (q.type === "nps") {
      const nums = values.map((v) => Number(v)).filter((n) => Number.isFinite(n));
      let promoters = 0;
      let passives = 0;
      let detractors = 0;
      for (const n of nums) {
        if (n >= 9) promoters++;
        else if (n >= 7) passives++;
        else detractors++;
      }
      const total = nums.length || 1;
      stat.promoters = promoters;
      stat.passives = passives;
      stat.detractors = detractors;
      stat.npsScore = Math.round(((promoters - detractors) / total) * 100);
      stat.average = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
    }
    return stat;
  });

  return {
    surveyId,
    title: survey.title,
    totalResponses: responses.length,
    questions: stats,
  };
}

function csvEscape(v: unknown): string {
  const s = v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function exportCsv(surveyId: string): Promise<string> {
  await ensureSchema();
  const survey = await getSurvey(surveyId);
  if (!survey) throw new Error("Survey not found");
  const responses = (await sql`SELECT * FROM survey_responses WHERE survey_id = ${surveyId} ORDER BY created_at ASC`) as SurveyResponseRow[];
  const headers = ["response_id", "created_at", ...survey.questions.map((q) => q.id)];
  const lines = [headers.map(csvEscape).join(",")];
  for (const r of responses) {
    const row = [r.id, r.created_at, ...survey.questions.map((q) => csvEscape(r.answers[q.id]))];
    lines.push(row.join(","));
  }
  return lines.join("\n");
}

export interface GeneratedSurvey {
  title: string;
  questions: SurveyQuestion[];
}

export async function generateSurveyAI(prompt: string): Promise<GeneratedSurvey> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const msg = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Generate a survey as strict JSON for this goal: "${prompt}".
Return ONLY JSON: {"title": string, "questions": [{"id": string, "type": "text"|"multiple"|"single"|"rating"|"nps"|"yes_no", "label": string, "options"?: string[], "required"?: boolean}]}.
Use 5-8 well-designed questions. Include at least one nps question when relevant. ids must be snake_case.`,
      },
    ],
  });
  const block = msg.content[0];
  const text = block && block.type === "text" ? block.text : "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI did not return JSON");
  const parsed = JSON.parse(match[0]) as GeneratedSurvey;
  if (!parsed.title || !Array.isArray(parsed.questions)) {
    throw new Error("AI returned invalid survey shape");
  }
  return parsed;
}
