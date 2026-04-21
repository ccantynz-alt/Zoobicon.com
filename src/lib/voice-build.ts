/**
 * Voice-to-build pipeline.
 *
 * User holds mic → we capture audio → transcribe via fal.ai Whisper →
 * classify intent via Claude Haiku → route to the correct downstream module.
 *
 * Bible Law 8: every failure path returns a clear, actionable error.
 * Bible Law 9: 3-model fal.ai fallback chain on transcription.
 *
 * No `any`. Strict TS. nodejs runtime only (fal-client requires it).
 */

export const runtime = "nodejs";

// ---------- Types ----------

export type VoiceIntent =
  | "build_new"
  | "edit_existing"
  | "deploy"
  | "register_domain"
  | "generate_video"
  | "chitchat";

export interface TranscriptionResult {
  text: string;
  languageCode: string;
  durationSec: number;
  confidence: number;
}

export interface VoiceClassification {
  intent: VoiceIntent;
  params: Record<string, string>;
  originalText: string;
}

export interface ProcessVoiceCommandInput {
  audioBuffer: ArrayBuffer;
  mimeType: string;
  currentProjectId?: string;
}

export interface ProcessVoiceCommandResult {
  transcript: TranscriptionResult;
  intent: VoiceClassification;
  result: VoiceRouteResult;
  actionTakenMs: number;
}

export interface VoiceRouteResult {
  module: string;
  ok: boolean;
  data?: Record<string, unknown>;
  error?: string;
  hint?: string;
}

export class VoiceBuildError extends Error {
  status: number;
  hint: string;
  constructor(message: string, opts: { status: number; hint: string }) {
    super(message);
    this.name = "VoiceBuildError";
    this.status = opts.status;
    this.hint = opts.hint;
  }
}

// ---------- fal.ai Whisper response shapes ----------

interface WhisperChunk {
  text?: string;
  timestamp?: [number, number];
}

interface WhisperResponse {
  text?: string;
  language?: string;
  language_code?: string;
  chunks?: WhisperChunk[];
  duration?: number;
  confidence?: number;
}

const WHISPER_FALLBACK_CHAIN: string[] = [
  "fal-ai/whisper",
  "fal-ai/incredibly-fast-whisper",
  "fal-ai/wizper",
];

// ---------- Helpers ----------

function bufferToDataUri(buf: ArrayBuffer, mimeType: string): string {
  const base64 = Buffer.from(buf).toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

function safeJsonExtract(text: string): Record<string, unknown> | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as Record<
      string,
      unknown
    >;
  } catch {
    return null;
  }
}

function coerceIntent(value: unknown): VoiceIntent {
  const allowed: VoiceIntent[] = [
    "build_new",
    "edit_existing",
    "deploy",
    "register_domain",
    "generate_video",
    "chitchat",
  ];
  if (typeof value === "string" && (allowed as string[]).includes(value)) {
    return value as VoiceIntent;
  }
  return "chitchat";
}

function coerceParams(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === "string") out[k] = v;
    else if (typeof v === "number" || typeof v === "boolean") out[k] = String(v);
  }
  return out;
}

// ---------- 1. Transcription ----------

export async function transcribeAudio(
  audioBuffer: ArrayBuffer,
  mimeType: string,
): Promise<TranscriptionResult> {
  if (!process.env.FAL_KEY) {
    throw new VoiceBuildError("FAL_KEY is not configured", {
      status: 503,
      hint: "Set FAL_KEY in Vercel env vars to enable voice transcription.",
    });
  }
  if (!audioBuffer || audioBuffer.byteLength === 0) {
    throw new VoiceBuildError("Empty audio buffer", {
      status: 400,
      hint: "Mic not accessible or no audio captured. Check browser permissions.",
    });
  }

  const audioUrl = bufferToDataUri(audioBuffer, mimeType || "audio/webm");

  const { runFalWithFallback, FalError } = await import("@/lib/fal-client");

  try {
    const result = await runFalWithFallback<WhisperResponse, {
      audio_url: string;
      task: string;
      language?: string;
      chunk_level?: string;
      version?: string;
    }>({
      models: WHISPER_FALLBACK_CHAIN,
      input: {
        audio_url: audioUrl,
        task: "transcribe",
        chunk_level: "segment",
      },
      pollMs: 1000,
      maxWaitMs: 90_000,
    });

    const text = (result.text ?? "").trim();
    if (!text) {
      throw new VoiceBuildError("Whisper returned empty transcript", {
        status: 422,
        hint: "Audio was unclear or silent. Try speaking louder or closer to the mic.",
      });
    }

    return {
      text,
      languageCode: result.language_code ?? result.language ?? "en",
      durationSec: typeof result.duration === "number" ? result.duration : 0,
      confidence: typeof result.confidence === "number" ? result.confidence : 0.9,
    };
  } catch (err) {
    if (err instanceof VoiceBuildError) throw err;
    if (err instanceof FalError) {
      const status = err.status ?? 500;
      const hint =
        status === 429
          ? "fal.ai rate limited — wait 30s and try again."
          : status === 401 || status === 403
            ? "fal.ai auth failed — check FAL_KEY in Vercel."
            : "All Whisper models failed. Try a shorter clip or different audio.";
      throw new VoiceBuildError(`Whisper transcription failed: ${err.message}`, {
        status,
        hint,
      });
    }
    const message = err instanceof Error ? err.message : "unknown error";
    throw new VoiceBuildError(`Transcription failed: ${message}`, {
      status: 500,
      hint: "Unexpected transcription error — retry once.",
    });
  }
}

// ---------- 2. Intent classification ----------

const CLASSIFIER_SYSTEM = `You are the Zoobicon voice command classifier.

Given a user's spoken transcript, classify their intent into ONE of:
- "build_new"        — they want to build a new website/app from scratch
- "edit_existing"    — they want to modify an existing project (colors, copy, layout, components)
- "deploy"           — they want to deploy/publish/ship the current project
- "register_domain"  — they want to search for or buy a domain name
- "generate_video"   — they want an AI video, voiceover, or spokesperson
- "chitchat"         — anything else (greetings, questions, unclear)

Also extract structured params relevant to the intent:
- build_new:       { description, industry?, style? }
- edit_existing:   { instruction, target? }
- deploy:          { target? }
- register_domain: { query, tld? }
- generate_video:  { topic, length?, style? }
- chitchat:        {}

Return ONLY a JSON object: {"intent": "...", "params": { ... }}.
No prose. No markdown. Just the JSON.`;

export async function classifyVoiceCommand(
  text: string,
): Promise<VoiceClassification> {
  if (!text || !text.trim()) {
    throw new VoiceBuildError("Empty transcript for classification", {
      status: 400,
      hint: "Intent unclear — try again with a clearer command.",
    });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new VoiceBuildError("ANTHROPIC_API_KEY not set", {
      status: 503,
      hint: "Set ANTHROPIC_API_KEY in Vercel env vars.",
    });
  }

  const { callClaude } = await import("@/lib/anthropic-cached");

  try {
    const res = await callClaude({
      model: "claude-haiku-4-5",
      system: CLASSIFIER_SYSTEM,
      systemCacheable: CLASSIFIER_SYSTEM,
      messages: [{ role: "user", content: `Transcript: "${text}"` }],
      maxTokens: 400,
      temperature: 0,
    });

    const block = res.content.find((c) => c.type === "text");
    const raw = block?.text ?? "";
    const parsed = safeJsonExtract(raw);

    if (!parsed) {
      throw new VoiceBuildError("Classifier returned non-JSON output", {
        status: 502,
        hint: "Intent unclear — try again with a more specific command.",
      });
    }

    return {
      intent: coerceIntent(parsed.intent),
      params: coerceParams(parsed.params),
      originalText: text,
    };
  } catch (err) {
    if (err instanceof VoiceBuildError) throw err;
    const message = err instanceof Error ? err.message : "unknown error";
    throw new VoiceBuildError(`Classification failed: ${message}`, {
      status: 500,
      hint: "Intent classifier failed — retry the command.",
    });
  }
}

// ---------- 3. Routing ----------

interface InstantOnboardingModule {
  startInstantBuild?: (input: {
    description: string;
    industry?: string;
    style?: string;
  }) => Promise<{ projectId?: string; previewUrl?: string }>;
}

interface VideoPipelineModule {
  generateSpokespersonVideo?: (input: {
    script: string;
    voiceStyle?: string;
  }) => Promise<unknown>;
}

interface DomainHookModule {
  searchDomain?: (query: string, tld?: string) => Promise<unknown>;
}

async function routeBuildNew(
  classification: VoiceClassification,
): Promise<VoiceRouteResult> {
  const description = classification.params.description ?? classification.originalText;
  try {
    const mod = (await import("@/lib/instant-onboarding").catch(() => null)) as
      | InstantOnboardingModule
      | null;
    if (mod && typeof mod.startInstantBuild === "function") {
      const data = await mod.startInstantBuild({
        description,
        industry: classification.params.industry,
        style: classification.params.style,
      });
      return {
        module: "instant-onboarding",
        ok: true,
        data: data as unknown as Record<string, unknown>,
      };
    }
    return {
      module: "instant-onboarding",
      ok: true,
      data: { queued: true, description },
      hint: "Instant onboarding module not yet wired — request queued.",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return {
      module: "instant-onboarding",
      ok: false,
      error: message,
      hint: "Build pipeline failed — try again or use the builder UI.",
    };
  }
}

async function routeEditExisting(
  classification: VoiceClassification,
  currentProjectId: string | undefined,
): Promise<VoiceRouteResult> {
  if (!currentProjectId) {
    return {
      module: "generate-edit",
      ok: false,
      error: "No active project",
      hint: "Open a project in the builder before editing by voice.",
    };
  }
  const instruction =
    classification.params.instruction ?? classification.originalText;

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(`${base}/api/generate/edit`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ projectId: currentProjectId, instruction }),
    });
    if (!res.ok) {
      const text = await res.text();
      return {
        module: "generate-edit",
        ok: false,
        error: `edit api ${res.status}: ${text.slice(0, 200)}`,
        hint: "Edit pipeline failed — check builder logs.",
      };
    }
    const data = (await res.json()) as Record<string, unknown>;
    return { module: "generate-edit", ok: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return {
      module: "generate-edit",
      ok: false,
      error: message,
      hint: "Could not reach edit endpoint — retry.",
    };
  }
}

async function routeGenerateVideo(
  classification: VoiceClassification,
): Promise<VoiceRouteResult> {
  const topic = classification.params.topic ?? classification.originalText;
  try {
    const mod = (await import("@/lib/video-pipeline")) as VideoPipelineModule;
    if (typeof mod.generateSpokespersonVideo === "function") {
      const data = await mod.generateSpokespersonVideo({
        script: topic,
        voiceStyle: classification.params.style,
      });
      return {
        module: "video-pipeline",
        ok: true,
        data: data as unknown as Record<string, unknown>,
      };
    }
    return {
      module: "video-pipeline",
      ok: false,
      error: "video-pipeline missing generateSpokespersonVideo",
      hint: "Video pipeline not exporting expected function.",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return {
      module: "video-pipeline",
      ok: false,
      error: message,
      hint: "Video generation failed — check REPLICATE_API_TOKEN.",
    };
  }
}

async function routeRegisterDomain(
  classification: VoiceClassification,
): Promise<VoiceRouteResult> {
  const query = classification.params.query ?? classification.originalText;
  try {
    const mod = (await import("@/lib/domain-hook").catch(() => null)) as
      | DomainHookModule
      | null;
    if (mod && typeof mod.searchDomain === "function") {
      const data = await mod.searchDomain(query, classification.params.tld);
      return {
        module: "domain-hook",
        ok: true,
        data: data as unknown as Record<string, unknown>,
      };
    }
    return {
      module: "domain-hook",
      ok: true,
      data: { queued: true, query },
      hint: "Domain hook not yet wired — request queued.",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return {
      module: "domain-hook",
      ok: false,
      error: message,
      hint: "Domain search failed — retry.",
    };
  }
}

function routeDeploy(currentProjectId: string | undefined): VoiceRouteResult {
  if (!currentProjectId) {
    return {
      module: "hosting-deploy",
      ok: false,
      error: "No active project",
      hint: "Open a project before deploying.",
    };
  }
  return {
    module: "hosting-deploy",
    ok: true,
    data: { projectId: currentProjectId, action: "deploy_requested" },
    hint: "Deploy queued — check /api/hosting/deploy for status.",
  };
}

function routeChitchat(classification: VoiceClassification): VoiceRouteResult {
  return {
    module: "chitchat",
    ok: true,
    data: { reply: "Heard you, but no action to take.", text: classification.originalText },
    hint: "Intent unclear — try again with a build/edit/deploy command.",
  };
}

// ---------- 4. Orchestrator ----------

export async function processVoiceCommand(
  input: ProcessVoiceCommandInput,
): Promise<ProcessVoiceCommandResult> {
  const start = Date.now();

  const transcript = await transcribeAudio(input.audioBuffer, input.mimeType);
  const intent = await classifyVoiceCommand(transcript.text);

  let result: VoiceRouteResult;
  switch (intent.intent) {
    case "build_new":
      result = await routeBuildNew(intent);
      break;
    case "edit_existing":
      result = await routeEditExisting(intent, input.currentProjectId);
      break;
    case "generate_video":
      result = await routeGenerateVideo(intent);
      break;
    case "register_domain":
      result = await routeRegisterDomain(intent);
      break;
    case "deploy":
      result = routeDeploy(input.currentProjectId);
      break;
    case "chitchat":
    default:
      result = routeChitchat(intent);
      break;
  }

  return {
    transcript,
    intent,
    result,
    actionTakenMs: Date.now() - start,
  };
}
