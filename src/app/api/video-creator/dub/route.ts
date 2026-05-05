/**
 * One-Click Multi-Language Video Dub
 *
 * POST /api/video-creator/dub
 *
 * Streams Server-Sent Events as each language progresses through the
 * three-stage dub pipeline:
 *
 *   1. Translate (Claude Haiku in parallel — language-aware prompts)
 *   2. Voice (Fish Audio S1 native multi-language TTS, Replicate fallback)
 *   3. Lip-sync (Hedra Character-3 → SadTalker → Wav2Lip fallback)
 *
 * HeyGen sells the same feature for $29-149/mo across 175 languages and
 * built a $100M ARR business on it. Fish Audio S1 supports 50+ languages
 * natively at ~$0.0015/character — we ship the same feature for cents.
 *
 * Request body:
 *   {
 *     sourceVideoUrl?: string;       // existing rendered video (optional, used as visual reference)
 *     sourceAudioUrl?: string;       // existing voiceover (optional baseline)
 *     sourceScript: string;          // English source — REQUIRED
 *     sourceImageUrl?: string;       // avatar still — required if no sourceVideoUrl
 *     languages: string[];           // ISO 639-1 codes — e.g. ["es", "fr", "de"]
 *     voiceMatchSource?: boolean;    // future: clone source narrator voice
 *   }
 *
 * Response: text/event-stream — events shaped as
 *   { type: "translation-start" | "translation-done" | "voice-done" |
 *           "lip-sync-done" | "language-error" | "warning" | "complete" |
 *           "error", language?: string, ... }
 *
 * Bible Law 8: every step that fails surfaces a clear error message
 * naming the exact language and the underlying cause.
 */

import { NextRequest } from "next/server";
import { callLLMWithFailover, describeLLMError } from "@/lib/llm-provider";
import {
  generateVoice,
  generateLipSync,
  isReplicatePoisoned,
} from "@/lib/video-pipeline";
import { hasFishAudioKey, generateFishAudioS1 } from "@/lib/fish-audio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// ─────────────────────────────────────────────────────────────────────────────
// Language metadata — shared with /lib/video-translate but extended to cover
// Fish Audio S1's 50+ language list. Native names included so the UI can
// render them without a second round-trip.
// ─────────────────────────────────────────────────────────────────────────────

interface DubLanguage {
  code: string;          // ISO 639-1
  name: string;          // English label
  nativeName: string;    // Native script
  flag: string;          // Emoji flag
  region: "European" | "Asian" | "Latin American" | "Middle Eastern" | "African";
  // Free-form direction hint passed to the translator so it knows the
  // localisation register (formal vs informal, regional variant, etc.)
  translationHint?: string;
}

// Curated subset — every entry is verified supported by Fish Audio S1.
// (https://fish.audio/voices — the marketplace lists per-language voices.)
export const DUB_LANGUAGES: DubLanguage[] = [
  // European
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸", region: "European", translationHint: "Use neutral Castilian Spanish (suitable for both Spain and LatAm)." },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷", region: "European" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪", region: "European", translationHint: "Use Hochdeutsch (standard German), formal 'Sie' register." },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹", region: "European" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇵🇹", region: "European", translationHint: "Use European Portuguese unless the script obviously targets Brazil." },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", flag: "🇳🇱", region: "European" },
  { code: "sv", name: "Swedish", nativeName: "Svenska", flag: "🇸🇪", region: "European" },
  { code: "no", name: "Norwegian", nativeName: "Norsk", flag: "🇳🇴", region: "European" },
  { code: "da", name: "Danish", nativeName: "Dansk", flag: "🇩🇰", region: "European" },
  { code: "fi", name: "Finnish", nativeName: "Suomi", flag: "🇫🇮", region: "European" },
  { code: "pl", name: "Polish", nativeName: "Polski", flag: "🇵🇱", region: "European" },
  { code: "cs", name: "Czech", nativeName: "Čeština", flag: "🇨🇿", region: "European" },
  { code: "el", name: "Greek", nativeName: "Ελληνικά", flag: "🇬🇷", region: "European" },
  { code: "ro", name: "Romanian", nativeName: "Română", flag: "🇷🇴", region: "European" },
  { code: "hu", name: "Hungarian", nativeName: "Magyar", flag: "🇭🇺", region: "European" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська", flag: "🇺🇦", region: "European" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺", region: "European" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷", region: "European" },

  // Asian
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵", region: "Asian", translationHint: "Use polite (です/ます) form unless script is conversational." },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷", region: "Asian", translationHint: "Use polite (-습니다/-요) speech level." },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳", region: "Asian", translationHint: "Output Simplified Chinese (Mandarin). Use professional, broadcast-natural cadence." },
  { code: "zh-tw", name: "Chinese (Traditional)", nativeName: "繁體中文", flag: "🇹🇼", region: "Asian", translationHint: "Output Traditional Chinese (Taiwan)." },
  { code: "th", name: "Thai", nativeName: "ภาษาไทย", flag: "🇹🇭", region: "Asian" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳", region: "Asian" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩", region: "Asian" },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu", flag: "🇲🇾", region: "Asian" },
  { code: "tl", name: "Filipino", nativeName: "Filipino", flag: "🇵🇭", region: "Asian" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳", region: "Asian" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇧🇩", region: "Asian" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", flag: "🇱🇰", region: "Asian" },
  { code: "ur", name: "Urdu", nativeName: "اردو", flag: "🇵🇰", region: "Asian" },

  // Latin American
  { code: "es-mx", name: "Spanish (Mexico)", nativeName: "Español (México)", flag: "🇲🇽", region: "Latin American", translationHint: "Use Mexican Spanish — friendlier, broadcast-natural." },
  { code: "pt-br", name: "Portuguese (Brazil)", nativeName: "Português (Brasil)", flag: "🇧🇷", region: "Latin American", translationHint: "Use Brazilian Portuguese with informal warmth." },

  // Middle Eastern
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦", region: "Middle Eastern", translationHint: "Use Modern Standard Arabic (MSA) — pan-regional, broadcast register." },
  { code: "he", name: "Hebrew", nativeName: "עברית", flag: "🇮🇱", region: "Middle Eastern" },
  { code: "fa", name: "Persian", nativeName: "فارسی", flag: "🇮🇷", region: "Middle Eastern" },

  // African
  { code: "sw", name: "Swahili", nativeName: "Kiswahili", flag: "🇰🇪", region: "African" },
  { code: "af", name: "Afrikaans", nativeName: "Afrikaans", flag: "🇿🇦", region: "African" },
];

const LANG_BY_CODE = new Map(DUB_LANGUAGES.map((l) => [l.code, l]));

export function getDubLanguage(code: string): DubLanguage | undefined {
  return LANG_BY_CODE.get(code);
}

// ─────────────────────────────────────────────────────────────────────────────
// Concurrency primitives — Fish Audio is happy with 4 in flight, Replicate
// rate-limits aggressively at >2 lip-sync jobs.
// ─────────────────────────────────────────────────────────────────────────────

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 — Translate via Claude Haiku
// ─────────────────────────────────────────────────────────────────────────────

async function translateScript(opts: {
  sourceScript: string;
  language: DubLanguage;
}): Promise<string> {
  const { sourceScript, language } = opts;
  const hint = language.translationHint
    ? `\nLocalisation guidance: ${language.translationHint}`
    : "";

  const system = [
    "You are a professional video script translator and localiser.",
    "Translate scripts into the target language with broadcast-natural cadence.",
    "Preserve brand names, proper nouns, product names, and URLs verbatim.",
    "Match the original sentence count so on-screen pacing stays in sync with the avatar's lip-sync.",
    "Never output explanations, notes, brackets, or any text that isn't the translation itself.",
  ].join(" ");

  const userMessage = [
    `Target language: ${language.name} (${language.nativeName}, ISO ${language.code}).${hint}`,
    "",
    "Translate the following script. Output ONLY the translated script — no preamble, no quotes, no markdown.",
    "",
    "--- SOURCE ---",
    sourceScript.trim(),
    "--- END SOURCE ---",
  ].join("\n");

  const res = await callLLMWithFailover({
    model: "claude-haiku-4-5-20251001",
    system,
    userMessage,
    maxTokens: 2000,
  });

  const text = (res.text || "").trim();
  if (!text) {
    throw new Error("translator returned an empty response");
  }
  // Strip accidental wrapping quotes / fences if the model added any.
  return text
    .replace(/^```(?:[a-z]*)?\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .replace(/^["'“”]/, "")
    .replace(/["'“”]$/, "")
    .trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 — TTS per language
// ─────────────────────────────────────────────────────────────────────────────

interface VoiceResult {
  audioUrl: string;
  durationSec: number;
  provider: "fish-audio-s1" | "replicate-fallback";
}

async function synthesizeVoice(opts: {
  text: string;
  language: DubLanguage;
}): Promise<VoiceResult> {
  // Fish-only language code: Fish accepts the bare ISO code; for regional
  // variants (es-mx, pt-br, zh-tw) we hand the regional tag through and let
  // Fish pick the closest voice. If Fish rejects it we fall through to
  // Replicate.
  if (hasFishAudioKey()) {
    try {
      const fish = await generateFishAudioS1({
        text: opts.text,
        language: opts.language.code,
        format: "mp3",
        emotion: "neutral",
      });
      if (fish && /^https?:\/\//i.test(fish.audioUrl)) {
        return {
          audioUrl: fish.audioUrl,
          durationSec: fish.durationSec,
          provider: "fish-audio-s1",
        };
      }
      if (fish) {
        // Fish returned a data URL — Replicate lip-sync can't fetch
        // base64. Fall through to the Replicate TTS chain so we get a
        // hosted URL.
        console.warn(
          `[dub] Fish Audio returned data URL for ${opts.language.code}; falling back to Replicate so lip-sync can fetch the audio.`
        );
      }
    } catch (err) {
      console.warn(
        `[dub] Fish Audio failed for ${opts.language.code}: ${err instanceof Error ? err.message : err}`
      );
    }
  }

  // Replicate fallback (Kokoro → XTTS → Bark → OpenVoice → Seamless).
  // Note: Kokoro is English-only so for non-English the chain will likely
  // skip it and land on XTTS or OpenVoice. We still surface that we used
  // a fallback voice (per Bible Law 8) so the UI can warn the user the
  // voice quality may be lower than Fish S1.
  const fallback = await generateVoice(opts.text, {
    gender: "female",
  });
  return {
    audioUrl: fallback.audioUrl,
    durationSec: fallback.duration,
    provider: "replicate-fallback",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SSE writer
// ─────────────────────────────────────────────────────────────────────────────

interface SSEWriter {
  send: (event: Record<string, unknown>) => void;
  close: () => void;
}

function makeSSE(): { stream: ReadableStream<Uint8Array>; writer: SSEWriter } {
  const encoder = new TextEncoder();
  let controllerRef: ReadableStreamDefaultController<Uint8Array> | null = null;
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controllerRef = controller;
    },
    cancel() {
      closed = true;
    },
  });

  return {
    stream,
    writer: {
      send(event) {
        if (closed || !controllerRef) return;
        try {
          controllerRef.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          closed = true;
        }
      },
      close() {
        if (closed || !controllerRef) return;
        try {
          controllerRef.close();
        } catch {
          /* ignore */
        }
        closed = true;
      },
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Route handler
// ─────────────────────────────────────────────────────────────────────────────

interface DubRequestBody {
  sourceVideoUrl?: string;
  sourceAudioUrl?: string;
  sourceScript: string;
  sourceImageUrl?: string;
  languages: string[];
  voiceMatchSource?: boolean;
}

function validate(body: unknown): { ok: true; value: DubRequestBody } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Request body must be a JSON object." };
  }
  const b = body as Partial<DubRequestBody>;
  if (!b.sourceScript || typeof b.sourceScript !== "string" || !b.sourceScript.trim()) {
    return { ok: false, error: "sourceScript is required (the English text to translate)." };
  }
  if (!Array.isArray(b.languages) || b.languages.length === 0) {
    return { ok: false, error: "languages must be a non-empty array of ISO 639-1 codes." };
  }
  if (b.languages.length > 12) {
    return { ok: false, error: "Maximum 12 languages per dub request. Run the rest in a second batch." };
  }
  const invalid = b.languages.filter((c) => !LANG_BY_CODE.has(c));
  if (invalid.length > 0) {
    return { ok: false, error: `Unsupported language code(s): ${invalid.join(", ")}` };
  }
  if (!b.sourceVideoUrl && !b.sourceImageUrl) {
    return {
      ok: false,
      error: "Provide either sourceVideoUrl (existing rendered video) or sourceImageUrl (avatar still) so we can re-lip-sync the dubbed audio.",
    };
  }
  return {
    ok: true,
    value: {
      sourceVideoUrl: b.sourceVideoUrl,
      sourceAudioUrl: b.sourceAudioUrl,
      sourceScript: b.sourceScript.trim(),
      sourceImageUrl: b.sourceImageUrl,
      languages: b.languages,
      voiceMatchSource: b.voiceMatchSource === true,
    },
  };
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const validation = validate(body);
  if (!validation.ok) {
    return Response.json({ error: validation.error }, { status: 400 });
  }
  const input = validation.value;

  // Hard early-fail: if Replicate is poisoned we can't lip-sync — surface
  // immediately so the UI doesn't burn 60s before showing the same error.
  const replicateState = isReplicatePoisoned();
  if (replicateState.poisoned && !process.env.HEDRA_API_KEY) {
    return Response.json(
      {
        error: `Lip-sync provider unavailable: ${replicateState.reason}. Rotate REPLICATE_API_TOKEN in Vercel or add HEDRA_API_KEY to use Hedra Character-3 directly.`,
      },
      { status: 503 }
    );
  }

  const { stream, writer } = makeSSE();

  // Run the dub pipeline asynchronously while we hand the SSE stream back
  // to the client.
  void runDubPipeline(input, writer).catch((err) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[dub] fatal pipeline error:", msg);
    writer.send({ type: "error", error: msg });
    writer.close();
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Vercel/Nginx — disable buffering for SSE
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline orchestrator
// ─────────────────────────────────────────────────────────────────────────────

interface CompletedDub {
  language: string;
  languageName: string;
  nativeName: string;
  flag: string;
  videoUrl: string;
  audioUrl?: string;
  translatedScript: string;
  durationSec: number;
  voiceProvider: "fish-audio-s1" | "replicate-fallback";
}

async function runDubPipeline(input: DubRequestBody, writer: SSEWriter): Promise<void> {
  const langs: DubLanguage[] = input.languages
    .map((c) => LANG_BY_CODE.get(c))
    .filter((l): l is DubLanguage => Boolean(l));

  writer.send({
    type: "started",
    languages: langs.map((l) => ({ code: l.code, name: l.name, nativeName: l.nativeName, flag: l.flag })),
    fishAudioReady: hasFishAudioKey(),
    voiceMatchSource: input.voiceMatchSource === true,
  });

  if (!hasFishAudioKey()) {
    writer.send({
      type: "warning",
      message:
        "FISH_AUDIO_API_KEY not configured. Falling back to the Replicate TTS chain — voice quality will be lower than Fish Audio S1. Sign up at https://fish.audio/ and set FISH_AUDIO_API_KEY in Vercel to enable native multi-language voices.",
    });
  }

  if (input.voiceMatchSource && !input.sourceAudioUrl) {
    writer.send({
      type: "warning",
      message:
        "voiceMatchSource was requested but sourceAudioUrl was not provided. Ignoring voice-match — using default Fish Audio voice for each language.",
    });
  }

  const completed: CompletedDub[] = [];
  const errors: { language: string; step: string; error: string }[] = [];

  // ── Stage 1 — Translate all languages in parallel ──────────────────────
  const translations = await Promise.all(
    langs.map(async (lang) => {
      writer.send({ type: "translation-start", language: lang.code });
      try {
        const translated = await translateScript({
          sourceScript: input.sourceScript,
          language: lang,
        });
        writer.send({
          type: "translation-done",
          language: lang.code,
          languageName: lang.name,
          translatedScript: translated,
        });
        return { lang, translated };
      } catch (err) {
        const reason = err instanceof Error ? describeLLMError(err) : String(err);
        errors.push({ language: lang.code, step: "translate", error: reason });
        writer.send({
          type: "language-error",
          language: lang.code,
          languageName: lang.name,
          step: "translate",
          error: `Translation failed for ${lang.name}: ${reason}`,
        });
        return null;
      }
    })
  );

  const translatedOk = translations.filter(
    (t): t is { lang: DubLanguage; translated: string } => t !== null
  );

  // ── Stage 2 — TTS, concurrency-capped at 4 ─────────────────────────────
  const voiced = await mapLimit(translatedOk, 4, async ({ lang, translated }) => {
    try {
      const voice = await synthesizeVoice({ text: translated, language: lang });
      writer.send({
        type: "voice-done",
        language: lang.code,
        languageName: lang.name,
        audioUrl: voice.audioUrl,
        provider: voice.provider,
        durationSec: voice.durationSec,
      });
      return { lang, translated, voice };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push({ language: lang.code, step: "voice", error: msg });
      writer.send({
        type: "language-error",
        language: lang.code,
        languageName: lang.name,
        step: "voice",
        error: `Voice synthesis failed for ${lang.name}: ${msg}`,
      });
      return null;
    }
  });

  const voicedOk = voiced.filter(
    (v): v is { lang: DubLanguage; translated: string; voice: VoiceResult } => v !== null
  );

  // ── Stage 3 — Lip-sync, concurrency-capped at 2 ───────────────────────
  // We need the avatar still as the visual driver. Prefer the explicit
  // sourceImageUrl; otherwise the source video URL (Hedra accepts both).
  const visualDriver = input.sourceImageUrl || input.sourceVideoUrl || "";

  await mapLimit(voicedOk, 2, async ({ lang, translated, voice }) => {
    try {
      // Lip-sync needs an http(s) audio URL — Replicate cannot fetch
      // data: URLs. We already enforce that in synthesizeVoice but
      // double-check here for safety.
      if (!/^https?:\/\//i.test(voice.audioUrl)) {
        throw new Error(
          "voice audio is a data URL; cannot run lip-sync. Configure BLOB_READ_WRITE_TOKEN so Fish Audio uploads to Vercel Blob and returns a hosted URL."
        );
      }

      const result = await generateLipSync(visualDriver, voice.audioUrl, {
        enhanceFace: true,
      });

      const dub: CompletedDub = {
        language: lang.code,
        languageName: lang.name,
        nativeName: lang.nativeName,
        flag: lang.flag,
        videoUrl: result.videoUrl,
        audioUrl: voice.audioUrl,
        translatedScript: translated,
        durationSec: voice.durationSec,
        voiceProvider: voice.provider,
      };
      completed.push(dub);

      writer.send({
        type: "lip-sync-done",
        language: lang.code,
        languageName: lang.name,
        nativeName: lang.nativeName,
        flag: lang.flag,
        videoUrl: result.videoUrl,
        durationSec: voice.durationSec,
        voiceProvider: voice.provider,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push({ language: lang.code, step: "lip-sync", error: msg });
      writer.send({
        type: "language-error",
        language: lang.code,
        languageName: lang.name,
        step: "lip-sync",
        error: `Lip-sync failed for ${lang.name}: ${msg}`,
      });
    }
  });

  writer.send({
    type: "complete",
    videos: completed,
    errors,
    succeeded: completed.length,
    failed: langs.length - completed.length,
    total: langs.length,
  });
  writer.close();
}
