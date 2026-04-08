/**
 * AI Auto-Editor — Opus Clip killer.
 * Long video → Whisper transcription → Claude Haiku highlight detection → short-form clips.
 */

import Anthropic from "@anthropic-ai/sdk";

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface Transcript {
  text: string;
  segments: TranscriptSegment[];
}

export interface Highlight {
  start: number;
  end: number;
  title: string;
  hook: string;
  score: number;
  reason: string;
}

export interface AutoEditResult {
  transcript: Transcript;
  highlights: Highlight[];
}

interface ReplicatePrediction {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output: unknown;
  error: string | null;
  urls: { get: string };
}

const WHISPER_MODELS: Array<{ name: string; version: string; input: (url: string) => Record<string, unknown> }> = [
  {
    name: "victor-upmeet/whisperx",
    version: "84d2ad2d6194fe98a17d2b60bef1c7f910c46b2f6fd38996ca457afd9c8abfcb",
    input: (url) => ({ audio_file: url, language: "en", batch_size: 32 }),
  },
  {
    name: "openai/whisper",
    version: "4d50797290df275329f202e48c76360b3f22b08d28c196cbc54600319435f8d2",
    input: (url) => ({ audio: url, model: "large-v3", language: "en", transcription: "plain text" }),
  },
  {
    name: "vaibhavs10/incredibly-fast-whisper",
    version: "3ab86df6c8f54c11309d4d1f930ac292bad43ace52d10c80d87eb258b3c9f79c",
    input: (url) => ({ audio: url, language: "english", batch_size: 24, timestamp: "chunk" }),
  },
  {
    name: "carnifexer/whisperx",
    version: "1395e5e0a45f74e4f2fc4abfca4eb73a4a92e6f4dc4dbe8feaa62c2b2147f3e8",
    input: (url) => ({ audio_file: url, language: "en" }),
  },
];

async function callReplicate(version: string, input: Record<string, unknown>, token: string): Promise<unknown> {
  const create = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ version, input }),
  });
  if (!create.ok) {
    throw new Error(`Replicate create failed: ${create.status} ${await create.text()}`);
  }
  const prediction = (await create.json()) as ReplicatePrediction;
  let current = prediction;
  const start = Date.now();
  while (current.status !== "succeeded" && current.status !== "failed" && current.status !== "canceled") {
    if (Date.now() - start > 240_000) throw new Error("Replicate prediction timeout");
    await new Promise((r) => setTimeout(r, 2000));
    const poll = await fetch(current.urls.get, { headers: { Authorization: `Bearer ${token}` } });
    if (!poll.ok) throw new Error(`Replicate poll failed: ${poll.status}`);
    current = (await poll.json()) as ReplicatePrediction;
  }
  if (current.status !== "succeeded") {
    throw new Error(`Replicate prediction ${current.status}: ${current.error ?? "unknown"}`);
  }
  return current.output;
}

function normalizeWhisperOutput(output: unknown): Transcript {
  if (output && typeof output === "object") {
    const o = output as Record<string, unknown>;
    const segmentsRaw = (o.segments ?? o.chunks) as unknown;
    const segments: TranscriptSegment[] = [];
    if (Array.isArray(segmentsRaw)) {
      for (const seg of segmentsRaw) {
        if (!seg || typeof seg !== "object") continue;
        const s = seg as Record<string, unknown>;
        const timestamp = s.timestamp as [number, number] | undefined;
        const start = typeof s.start === "number" ? s.start : Array.isArray(timestamp) ? Number(timestamp[0]) : 0;
        const end = typeof s.end === "number" ? s.end : Array.isArray(timestamp) ? Number(timestamp[1]) : 0;
        const text = typeof s.text === "string" ? s.text : "";
        if (text) segments.push({ start, end, text });
      }
    }
    const text = typeof o.text === "string" ? o.text : segments.map((s) => s.text).join(" ");
    return { text, segments };
  }
  if (typeof output === "string") {
    return { text: output, segments: [] };
  }
  return { text: "", segments: [] };
}

export async function transcribeVideo(videoUrl: string): Promise<Transcript> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("REPLICATE_API_TOKEN not set");

  let lastError: unknown = null;
  for (const model of WHISPER_MODELS) {
    try {
      const output = await callReplicate(model.version, model.input(videoUrl), token);
      const transcript = normalizeWhisperOutput(output);
      if (transcript.text || transcript.segments.length > 0) return transcript;
      throw new Error("Empty transcript");
    } catch (err) {
      lastError = err;
      console.warn(`[auto-editor] Whisper model ${model.name} failed:`, err);
    }
  }
  throw new Error(`All Whisper models failed: ${String(lastError)}`);
}

export async function findHighlights(transcript: Transcript, count = 5): Promise<Highlight[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const client = new Anthropic({ apiKey });
  const segmentsBlock = transcript.segments.length > 0
    ? transcript.segments
        .map((s) => `[${s.start.toFixed(1)}-${s.end.toFixed(1)}] ${s.text}`)
        .join("\n")
    : transcript.text;

  const system = `You are a senior short-form video editor (TikTok, Reels, Shorts).
Find the ${count} BEST highlight moments suitable for vertical 9:16 short-form clips.

Each highlight must:
- Be 30-60 seconds long
- Have a strong hook in the first 3 seconds
- Contain narrative tension, surprising stats, emotional beats, or clear CTAs
- Stand alone without missing context
- Score 0-100 on viral potential

Output JSON only. No prose. Schema:
{ "highlights": [ { "start": number, "end": number, "title": string, "hook": string, "score": number, "reason": string } ] }`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 4096,
    system,
    messages: [
      {
        role: "user",
        content: `Transcript with timestamps:\n\n${segmentsBlock}\n\nReturn the top ${count} highlights as JSON.`,
      },
    ],
  });

  const block = response.content.find((c) => c.type === "text");
  const raw = block && block.type === "text" ? block.text : "";
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Highlight model returned no JSON");

  const parsed = JSON.parse(match[0]) as { highlights?: unknown };
  if (!parsed.highlights || !Array.isArray(parsed.highlights)) {
    throw new Error("Highlight JSON missing highlights array");
  }

  const highlights: Highlight[] = [];
  for (const h of parsed.highlights) {
    if (!h || typeof h !== "object") continue;
    const r = h as Record<string, unknown>;
    highlights.push({
      start: Number(r.start ?? 0),
      end: Number(r.end ?? 0),
      title: String(r.title ?? ""),
      hook: String(r.hook ?? ""),
      score: Number(r.score ?? 0),
      reason: String(r.reason ?? ""),
    });
  }
  return highlights;
}

export async function autoEdit(videoUrl: string): Promise<AutoEditResult> {
  const transcript = await transcribeVideo(videoUrl);
  const highlights = await findHighlights(transcript, 5);
  return { transcript, highlights };
}
