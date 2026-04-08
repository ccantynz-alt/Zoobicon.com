import { sql } from "./db";

const WHISPER_MODELS: string[] = [
  "openai/whisper",
  "vaibhavs10/incredibly-fast-whisper",
  "victor-upmeet/whisperx",
  "carnifexer/whisperx",
];

export interface MeetingSummary {
  summary: string;
  action_items: string[];
  decisions: string[];
  participants: string[];
  sentiment: string;
}

export interface MeetingRecord {
  id: string;
  user_id: string;
  audio_url: string;
  transcript: string;
  summary: MeetingSummary;
  action_items: string[];
  created_at: string;
}

interface ReplicatePrediction {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output: unknown;
  error: string | null;
  urls: { get: string };
}

let tableReady = false;

async function ensureTable(): Promise<void> {
  if (tableReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS meetings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      audio_url TEXT NOT NULL,
      transcript TEXT NOT NULL,
      summary JSONB NOT NULL,
      action_items JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  tableReady = true;
}

function requireReplicateToken(): string {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    throw new Error(
      "REPLICATE_API_TOKEN is not set. Add it in Vercel environment variables to enable meeting transcription."
    );
  }
  return token;
}

function requireAnthropicKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it in Vercel environment variables to enable meeting summarization."
    );
  }
  return key;
}

async function runWhisperModel(
  model: string,
  audioUrl: string,
  token: string
): Promise<string> {
  const createRes = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: { audio: audioUrl },
    }),
  });

  if (!createRes.ok) {
    throw new Error(`Replicate ${model} create failed: ${createRes.status}`);
  }

  let prediction = (await createRes.json()) as ReplicatePrediction;
  const deadline = Date.now() + 5 * 60 * 1000;

  while (
    prediction.status !== "succeeded" &&
    prediction.status !== "failed" &&
    prediction.status !== "canceled"
  ) {
    if (Date.now() > deadline) {
      throw new Error(`Replicate ${model} timed out`);
    }
    await new Promise((r) => setTimeout(r, 2000));
    const pollRes = await fetch(prediction.urls.get, {
      headers: { Authorization: `Token ${token}` },
    });
    if (!pollRes.ok) {
      throw new Error(`Replicate ${model} poll failed: ${pollRes.status}`);
    }
    prediction = (await pollRes.json()) as ReplicatePrediction;
  }

  if (prediction.status !== "succeeded") {
    throw new Error(
      `Replicate ${model} ${prediction.status}: ${prediction.error ?? "unknown"}`
    );
  }

  const output = prediction.output;
  if (typeof output === "string") return output;
  if (output && typeof output === "object") {
    const obj = output as Record<string, unknown>;
    if (typeof obj.transcription === "string") return obj.transcription;
    if (typeof obj.text === "string") return obj.text;
    if (Array.isArray(obj.segments)) {
      return obj.segments
        .map((s) => {
          if (s && typeof s === "object" && "text" in s) {
            const t = (s as Record<string, unknown>).text;
            return typeof t === "string" ? t : "";
          }
          return "";
        })
        .join(" ")
        .trim();
    }
  }
  if (Array.isArray(output)) return output.join(" ");
  throw new Error(`Replicate ${model} returned unrecognized output`);
}

export async function transcribeMeeting(audioUrl: string): Promise<string> {
  const token = requireReplicateToken();
  const errors: string[] = [];
  for (const model of WHISPER_MODELS) {
    try {
      const text = await runWhisperModel(model, audioUrl, token);
      if (text && text.trim().length > 0) return text;
      errors.push(`${model}: empty output`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(msg);
      console.warn(`[meeting-recorder] ${model} failed: ${msg}`);
    }
  }
  throw new Error(
    `All Whisper fallback models failed: ${errors.join(" | ")}`
  );
}

export async function summarizeMeeting(
  transcript: string
): Promise<MeetingSummary> {
  const key = requireAnthropicKey();
  const prompt = `You analyze meeting transcripts. Return STRICT JSON only matching:
{"summary":string,"action_items":string[],"decisions":string[],"participants":string[],"sentiment":string}

Transcript:
"""
${transcript.slice(0, 50000)}
"""

Output ONLY the JSON object, no prose.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic summarize failed: ${res.status}`);
  }

  const data = (await res.json()) as {
    content: Array<{ type: string; text?: string }>;
  };
  const text = data.content
    .map((c) => (c.type === "text" && c.text ? c.text : ""))
    .join("")
    .trim();

  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("Anthropic returned no JSON object");
  }
  const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as Partial<MeetingSummary>;

  return {
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    action_items: Array.isArray(parsed.action_items)
      ? parsed.action_items.filter((x): x is string => typeof x === "string")
      : [],
    decisions: Array.isArray(parsed.decisions)
      ? parsed.decisions.filter((x): x is string => typeof x === "string")
      : [],
    participants: Array.isArray(parsed.participants)
      ? parsed.participants.filter((x): x is string => typeof x === "string")
      : [],
    sentiment: typeof parsed.sentiment === "string" ? parsed.sentiment : "neutral",
  };
}

export async function extractActionItems(transcript: string): Promise<string[]> {
  const summary = await summarizeMeeting(transcript);
  return summary.action_items;
}

export async function saveMeeting(params: {
  userId: string;
  audioUrl: string;
  transcript: string;
  summary: MeetingSummary;
}): Promise<MeetingRecord> {
  await ensureTable();
  const id = `mtg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  await sql`
    INSERT INTO meetings (id, user_id, audio_url, transcript, summary, action_items)
    VALUES (${id}, ${params.userId}, ${params.audioUrl}, ${params.transcript},
      ${JSON.stringify(params.summary)}::jsonb, ${JSON.stringify(params.summary.action_items)}::jsonb)
  `;
  return {
    id,
    user_id: params.userId,
    audio_url: params.audioUrl,
    transcript: params.transcript,
    summary: params.summary,
    action_items: params.summary.action_items,
    created_at: new Date().toISOString(),
  };
}

export async function listMeetings(userId: string): Promise<MeetingRecord[]> {
  await ensureTable();
  const rows = (await sql`
    SELECT id, user_id, audio_url, transcript, summary, action_items, created_at
    FROM meetings WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 100
  `) as unknown as MeetingRecord[];
  return rows;
}

export async function getMeeting(id: string): Promise<MeetingRecord | null> {
  await ensureTable();
  const rows = (await sql`
    SELECT id, user_id, audio_url, transcript, summary, action_items, created_at
    FROM meetings WHERE id = ${id} LIMIT 1
  `) as unknown as MeetingRecord[];
  return rows[0] ?? null;
}
