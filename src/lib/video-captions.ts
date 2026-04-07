/**
 * Zoobicon Video Captions Engine
 *
 * Audio-to-text transcription via Whisper on Replicate, plus format conversion
 * (SRT, VTT, ASS), caption burning, and AI-powered translation.
 *
 * All Replicate calls use raw fetch (no SDK) with a 4-model fallback chain
 * per CLAUDE.md rule 9/32. No new npm dependencies.
 *
 * Exports:
 *   transcribeAudio()   — Whisper transcription with 4-model fallback
 *   generateSRT()       — Segments → SRT string
 *   generateVTT()       — Segments → WebVTT string
 *   generateASS()       — Segments → ASS/SSA string with styling
 *   burnCaptions()      — Hardcode captions into video via Replicate
 *   translateCaptions() — Claude-powered segment translation
 *   detectLanguage()    — Character-analysis language detection
 */

import Anthropic from "@anthropic-ai/sdk";

// ── Constants ──

const REPLICATE_API = "https://api.replicate.com/v1";

// ── Types ──

export interface CaptionSegment {
  start: number; // seconds
  end: number;   // seconds
  text: string;
}

export interface CaptionStyle {
  font?: string;
  fontSize?: number;
  color?: string;         // hex "#FFFFFF"
  outlineColor?: string;  // hex "#000000"
  outlineWidth?: number;
  shadowDepth?: number;
  position?: "top" | "bottom" | "center";
  animation?: "none" | "fade" | "pop" | "karaoke";
}

export interface TranscriptionResult {
  segments: CaptionSegment[];
  language: string;
  duration: number;
}

// ── Replicate helpers (standalone — no imports from video-pipeline to avoid circular deps) ──

function getReplicateToken(): string {
  const token =
    process.env.REPLICATE_API_TOKEN ||
    process.env.REPLICATE_API_KEY ||
    process.env.REPLICATE_TOKEN ||
    process.env.REPLICATE_KEY;
  if (!token) {
    throw new Error(
      "REPLICATE_API_TOKEN is not set. Set it in Vercel environment variables to enable captions."
    );
  }
  return token;
}

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function extractOutputUrl(data: Record<string, unknown>): string | null {
  const out = data.output;
  if (typeof out === "string") return out;
  if (Array.isArray(out)) {
    const first = out[0];
    return typeof first === "string" ? first : null;
  }
  if (out && typeof out === "object") {
    const o = out as Record<string, unknown>;
    for (const k of ["video", "output", "url", "file"]) {
      const v = o[k];
      if (typeof v === "string") return v;
    }
  }
  return null;
}

/**
 * Extract structured transcription output from Replicate prediction result.
 * Whisper models return varying shapes — we normalize them all.
 */
function extractTranscription(data: Record<string, unknown>): {
  segments: CaptionSegment[];
  language: string;
  duration: number;
} | null {
  const out = data.output as unknown;
  if (!out) return null;

  // Shape 1: { segments: [...], language: "en", ... }  (openai/whisper)
  if (typeof out === "object" && !Array.isArray(out)) {
    const obj = out as Record<string, unknown>;

    // Direct segments array
    if (Array.isArray(obj.segments)) {
      return {
        segments: normalizeSegments(obj.segments as Record<string, unknown>[]),
        language: (obj.language as string) || "en",
        duration: (obj.duration as number) || 0,
      };
    }

    // Nested transcription
    if (obj.transcription && typeof obj.transcription === "object") {
      const t = obj.transcription as Record<string, unknown>;
      if (Array.isArray(t.segments)) {
        return {
          segments: normalizeSegments(t.segments as Record<string, unknown>[]),
          language: (t.language as string) || (obj.language as string) || "en",
          duration: (t.duration as number) || 0,
        };
      }
    }

    // Plain text output — create a single segment
    if (typeof obj.text === "string" || typeof obj.transcription === "string") {
      const text = (obj.text as string) || (obj.transcription as string);
      return {
        segments: [{ start: 0, end: (obj.duration as number) || 30, text: text.trim() }],
        language: (obj.language as string) || "en",
        duration: (obj.duration as number) || 30,
      };
    }
  }

  // Shape 2: plain text string — single segment
  if (typeof out === "string") {
    return {
      segments: [{ start: 0, end: 30, text: out.trim() }],
      language: "en",
      duration: 30,
    };
  }

  return null;
}

function normalizeSegments(raw: Record<string, unknown>[]): CaptionSegment[] {
  return raw
    .map((s) => ({
      start: Number(s.start ?? s.startTime ?? 0),
      end: Number(s.end ?? s.endTime ?? s.start ?? 0),
      text: String(s.text ?? s.value ?? "").trim(),
    }))
    .filter((s) => s.text.length > 0);
}

async function pollPrediction(
  getUrl: string,
  token: string,
  maxAttempts = 150,
  intervalMs = 2000
): Promise<Record<string, unknown>> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));
    const res = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) continue;
    const data = (await res.json()) as Record<string, unknown>;
    const status = data.status as string | undefined;
    if (status === "succeeded") return data;
    if (status === "failed" || status === "canceled") {
      const err = (data.error as string) || "Replicate prediction failed.";
      throw new Error(err);
    }
  }
  throw new Error("Replicate prediction timed out after 5 minutes.");
}

async function createPrediction(
  modelPath: string,
  input: Record<string, unknown>,
  token: string
): Promise<{ getUrl: string }> {
  const headers = authHeaders(token);

  let res = await fetch(`${REPLICATE_API}/models/${modelPath}/predictions`, {
    method: "POST",
    headers,
    body: JSON.stringify({ input }),
  });

  if (res.status === 404 || res.status === 422) {
    const info = await fetch(`${REPLICATE_API}/models/${modelPath}`, { headers });
    if (info.ok) {
      const meta = (await info.json()) as Record<string, unknown>;
      const latest = meta.latest_version as { id?: string } | undefined;
      const version = latest?.id;
      if (version) {
        res = await fetch(`${REPLICATE_API}/predictions`, {
          method: "POST",
          headers,
          body: JSON.stringify({ version, input }),
        });
      }
    }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Replicate ${modelPath} ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as Record<string, unknown>;
  const urls = data.urls as { get?: string } | undefined;
  if (!urls?.get) throw new Error(`Replicate ${modelPath} returned no polling URL.`);
  return { getUrl: urls.get };
}

// ── 1. Transcription ──

/**
 * Transcribe audio using Whisper on Replicate with 4-model fallback chain.
 * Returns timed caption segments, detected language, and total duration.
 */
export async function transcribeAudio(audioUrl: string): Promise<TranscriptionResult> {
  const token = getReplicateToken();

  const whisperModels = [
    {
      name: "openai/whisper",
      modelPath: "openai/whisper",
      input: {
        audio: audioUrl,
        model: "large-v3",
        language: "auto",
        translate: false,
        transcription: "srt",
        word_timestamps: true,
      },
    },
    {
      name: "incredibly-fast-whisper",
      modelPath: "vaibhavs10/incredibly-fast-whisper",
      input: {
        audio: audioUrl,
        task: "transcribe",
        timestamp: "word",
        batch_size: 64,
      },
    },
    {
      name: "insanely-fast-whisper",
      modelPath: "turian/insanely-fast-whisper",
      input: {
        audio: audioUrl,
        task: "transcribe",
        timestamp: "word",
      },
    },
    {
      name: "m1guelpf/whisper",
      modelPath: "m1guelpf/whisper",
      input: {
        audio: audioUrl,
        model: "large",
        language: "auto",
      },
    },
  ];

  let lastError = "";

  for (const model of whisperModels) {
    try {
      console.log(`[video-captions] Trying ${model.name} for transcription...`);
      const { getUrl } = await createPrediction(model.modelPath, model.input, token);
      const result = await pollPrediction(getUrl, token);

      const transcription = extractTranscription(result);
      if (transcription && transcription.segments.length > 0) {
        console.log(
          `[video-captions] ${model.name} succeeded — ${transcription.segments.length} segments, ` +
          `language: ${transcription.language}`
        );
        return transcription;
      }

      console.warn(`[video-captions] ${model.name} returned no usable transcription`);
      lastError = `${model.name}: no usable output`;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[video-captions] ${model.name} failed: ${msg}`);
      lastError = `${model.name}: ${msg}`;
    }
  }

  throw new Error(`Audio transcription failed after trying all models. Last error: ${lastError}`);
}

// ── 2. SRT Generation ──

/**
 * Convert caption segments to SRT format.
 *
 * Example output:
 *   1
 *   00:00:01,000 --> 00:00:04,500
 *   Hello and welcome to our video.
 */
export function generateSRT(segments: CaptionSegment[]): string {
  return segments
    .map((seg, i) => {
      const idx = i + 1;
      const startTs = formatTimeSRT(seg.start);
      const endTs = formatTimeSRT(seg.end);
      return `${idx}\n${startTs} --> ${endTs}\n${seg.text}\n`;
    })
    .join("\n");
}

function formatTimeSRT(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return (
    String(h).padStart(2, "0") +
    ":" +
    String(m).padStart(2, "0") +
    ":" +
    String(s).padStart(2, "0") +
    "," +
    String(ms).padStart(3, "0")
  );
}

// ── 3. WebVTT Generation ──

/**
 * Convert caption segments to WebVTT format.
 */
export function generateVTT(segments: CaptionSegment[]): string {
  const header = "WEBVTT\n\n";
  const body = segments
    .map((seg, i) => {
      const idx = i + 1;
      const startTs = formatTimeVTT(seg.start);
      const endTs = formatTimeVTT(seg.end);
      return `${idx}\n${startTs} --> ${endTs}\n${seg.text}\n`;
    })
    .join("\n");
  return header + body;
}

function formatTimeVTT(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return (
    String(h).padStart(2, "0") +
    ":" +
    String(m).padStart(2, "0") +
    ":" +
    String(s).padStart(2, "0") +
    "." +
    String(ms).padStart(3, "0")
  );
}

// ── 4. ASS/SSA Generation ──

const DEFAULT_STYLE: Required<CaptionStyle> = {
  font: "Arial",
  fontSize: 24,
  color: "#FFFFFF",
  outlineColor: "#000000",
  outlineWidth: 3,
  shadowDepth: 0,
  position: "bottom",
  animation: "none",
};

/**
 * Convert caption segments to ASS (Advanced SubStation Alpha) format with styling.
 *
 * Supports:
 *   - Font, size, color, outline, shadow
 *   - Position (top/bottom/center)
 *   - Animation effects (fade in, pop in, karaoke word-by-word)
 */
export function generateASS(segments: CaptionSegment[], style?: CaptionStyle): string {
  const s = { ...DEFAULT_STYLE, ...style };
  const primaryColor = assColor(s.color);
  const outlineColor = assColor(s.outlineColor);
  const alignment = s.position === "top" ? 8 : s.position === "center" ? 5 : 2;
  const marginV = s.position === "center" ? 0 : 40;

  let header = `[Script Info]
Title: Zoobicon Auto-Captions
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${s.font},${s.fontSize},${primaryColor},&H000000FF,${outlineColor},&H00000000,-1,0,0,0,100,100,0,0,1,${s.outlineWidth},${s.shadowDepth},${alignment},30,30,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  for (const seg of segments) {
    const start = formatTimeASS(seg.start);
    const end = formatTimeASS(seg.end);
    const text = applyASSAnimation(seg.text, seg.start, seg.end, s.animation);
    header += `Dialogue: 0,${start},${end},Default,,0,0,0,,${text}\n`;
  }

  return header;
}

function assColor(hex: string): string {
  // ASS uses &HAABBGGRR format (alpha, blue, green, red)
  const clean = hex.replace("#", "");
  const r = clean.substring(0, 2);
  const g = clean.substring(2, 4);
  const b = clean.substring(4, 6);
  return `&H00${b}${g}${r}`.toUpperCase();
}

function formatTimeASS(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.round((seconds % 1) * 100);
  return (
    String(h) +
    ":" +
    String(m).padStart(2, "0") +
    ":" +
    String(s).padStart(2, "0") +
    "." +
    String(cs).padStart(2, "0")
  );
}

function applyASSAnimation(
  text: string,
  _start: number,
  _end: number,
  animation: CaptionStyle["animation"]
): string {
  switch (animation) {
    case "fade":
      // Fade in over 300ms, fade out over 200ms
      return `{\\fad(300,200)}${text}`;
    case "pop":
      // Scale from 0 to 100 over 200ms
      return `{\\t(0,200,\\fscx100\\fscy100)\\fscx0\\fscy0}${text}`;
    case "karaoke":
      // Word-by-word highlight (karaoke fill effect)
      return wordByWordKaraoke(text, _start, _end);
    default:
      return text;
  }
}

function wordByWordKaraoke(text: string, start: number, end: number): string {
  const words = text.split(/\s+/);
  if (words.length === 0) return text;
  const totalDurationCs = Math.round((end - start) * 100);
  const perWordCs = Math.max(1, Math.floor(totalDurationCs / words.length));
  return words.map((w) => `{\\kf${perWordCs}}${w}`).join(" ");
}

// ── 5. Burn Captions Into Video ──

/**
 * Hardcode captions into a video using Replicate models.
 * Returns the URL of the new video with burned-in captions.
 *
 * Uses 4-model fallback chain (autocaption → ffmpeg → toolkit → ffmpeg-concat).
 */
export async function burnCaptions(
  videoUrl: string,
  srtContent: string,
  style?: CaptionStyle
): Promise<string> {
  if (!srtContent || srtContent.trim().length === 0) return videoUrl;
  const token = getReplicateToken();
  const s = { ...DEFAULT_STYLE, ...style };

  const subtitleStyle =
    `FontName=${s.font},FontSize=${s.fontSize},` +
    `PrimaryColour=${assColor(s.color)},OutlineColour=${assColor(s.outlineColor)},` +
    `BorderStyle=1,Outline=${s.outlineWidth},Shadow=${s.shadowDepth},` +
    `Alignment=${s.position === "top" ? 8 : s.position === "center" ? 5 : 2},MarginV=40`;

  const models = [
    {
      name: "fictions-ai/autocaption",
      modelPath: "fictions-ai/autocaption",
      input: {
        video_file_input: videoUrl,
        subtitles: srtContent,
        font: s.font,
        color: s.color.replace("#", ""),
        stroke_color: (s.outlineColor || "#000000").replace("#", ""),
        stroke_width: s.outlineWidth,
        position: s.position || "bottom",
      },
    },
    {
      name: "meta/ffmpeg (subtitle burn)",
      modelPath: "meta/ffmpeg",
      input: {
        inputs: [videoUrl],
        subtitles: srtContent,
        command: `-i input.mp4 -vf "subtitles=subs.srt:force_style='${subtitleStyle}'" -c:a copy output.mp4`,
      },
    },
    {
      name: "fofr/toolkit (subtitle burn)",
      modelPath: "fofr/toolkit",
      input: {
        task: "burn-subtitles",
        video: videoUrl,
        srt: srtContent,
        style: subtitleStyle,
      },
    },
    {
      name: "lucataco/ffmpeg-concat (subtitle burn)",
      modelPath: "lucataco/ffmpeg-concat",
      input: {
        videos: [videoUrl],
        subtitles: srtContent,
      },
    },
  ];

  let lastError = "";
  for (const model of models) {
    try {
      console.log(`[video-captions] Trying ${model.name} for caption burn...`);
      const { getUrl } = await createPrediction(model.modelPath, model.input, token);
      const result = await pollPrediction(getUrl, token);
      const url = extractOutputUrl(result);
      if (url) {
        console.log(`[video-captions] ${model.name} succeeded — burned captions into video.`);
        return url;
      }
      lastError = `${model.name}: no output URL`;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[video-captions] ${model.name} failed: ${msg}`);
      lastError = `${model.name}: ${msg}`;
    }
  }

  throw new Error(`Caption burning failed after trying all models. Last error: ${lastError}`);
}

// ── 6. Translation ──

/**
 * Translate caption segments to another language using Claude.
 * Preserves original timing — only the text is translated.
 */
export async function translateCaptions(
  segments: CaptionSegment[],
  targetLanguage: string
): Promise<CaptionSegment[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set. Translation requires the Claude API.");
  }

  const client = new Anthropic({ apiKey });

  // Build a compact representation for the LLM
  const lines = segments.map((s, i) => `[${i}] ${s.text}`).join("\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Translate each numbered subtitle line below to ${targetLanguage}. Return ONLY a JSON array of strings, where index 0 is the translation of line [0], index 1 is the translation of line [1], etc. Preserve meaning, tone, and brevity — subtitles must stay short. Do not add numbering or brackets in the output.\n\n${lines}`,
      },
    ],
  });

  // Extract text from response
  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text response for translation.");
  }

  // Parse the JSON array from the response
  const jsonMatch = textBlock.text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Claude translation response did not contain a valid JSON array.");
  }

  let translations: string[];
  try {
    translations = JSON.parse(jsonMatch[0]) as string[];
  } catch {
    throw new Error("Failed to parse translation JSON from Claude response.");
  }

  if (translations.length !== segments.length) {
    console.warn(
      `[video-captions] Translation count mismatch: got ${translations.length}, expected ${segments.length}. Using available translations.`
    );
  }

  return segments.map((seg, i) => ({
    start: seg.start,
    end: seg.end,
    text: i < translations.length ? translations[i] : seg.text,
  }));
}

// ── 7. Language Detection ──

/**
 * Detect the language of caption segments using character analysis.
 * Returns ISO 639-1 code (e.g., "en", "ja", "zh", "ko", "ar", "hi").
 */
export function detectLanguage(segments: CaptionSegment[]): string {
  const allText = segments.map((s) => s.text).join(" ");
  if (allText.length === 0) return "en";

  // CJK characters
  const cjkCount = (allText.match(/[\u4e00-\u9fff]/g) || []).length;
  // Japanese-specific (Hiragana + Katakana)
  const jpCount = (allText.match(/[\u3040-\u309f\u30a0-\u30ff]/g) || []).length;
  // Korean (Hangul)
  const koCount = (allText.match(/[\uac00-\ud7af\u1100-\u11ff]/g) || []).length;
  // Arabic
  const arCount = (allText.match(/[\u0600-\u06ff]/g) || []).length;
  // Devanagari (Hindi)
  const hiCount = (allText.match(/[\u0900-\u097f]/g) || []).length;
  // Cyrillic (Russian)
  const ruCount = (allText.match(/[\u0400-\u04ff]/g) || []).length;
  // Thai
  const thCount = (allText.match(/[\u0e00-\u0e7f]/g) || []).length;
  // Latin
  const latinCount = (allText.match(/[a-zA-Z]/g) || []).length;

  const totalChars = allText.replace(/\s/g, "").length;
  if (totalChars === 0) return "en";

  const threshold = 0.3; // 30% of characters in a script = that language

  if (jpCount / totalChars > threshold) return "ja";
  if (koCount / totalChars > threshold) return "ko";
  if (cjkCount / totalChars > threshold) return "zh";
  if (arCount / totalChars > threshold) return "ar";
  if (hiCount / totalChars > threshold) return "hi";
  if (ruCount / totalChars > threshold) return "ru";
  if (thCount / totalChars > threshold) return "th";

  // For Latin scripts, default to English (could be Spanish, French, etc.)
  if (latinCount / totalChars > threshold) return "en";

  return "en";
}
