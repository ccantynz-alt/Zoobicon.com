/**
 * Video Captions — Whisper transcription + styled caption overlay
 *
 * 4-model fallback chain (Bible Law 9):
 *   1. fal-ai/whisper (primary, if FAL_KEY)
 *   2. fal-ai/wizper (fallback)
 *   3. openai/whisper on Replicate
 *   4. incredibly-fast-whisper on Replicate
 *
 * Caption styles match CapCut quality (300M MAU standard):
 *   - modern: white text, black outline, bottom-center
 *   - bold: large yellow, word-by-word highlight (viral TikTok style)
 *   - minimal: small white, lower-third
 *   - karaoke: word highlights synced to audio
 */

export interface CaptionCue {
  start: number;
  end: number;
  text: string;
  words?: Array<{ word: string; start: number; end: number }>;
}

export type CaptionStyle = "modern" | "bold" | "minimal" | "karaoke";

export interface CaptionStyleConfig {
  fontFamily: string;
  fontSize: number;
  color: string;
  strokeColor: string;
  strokeWidth: number;
  position: "bottom" | "center" | "lower-third";
  animation: "none" | "word-highlight" | "fade-in" | "pop";
  backgroundColor?: string;
}

export interface TranscriptionResult {
  cues: CaptionCue[];
  srt: string;
  fullText: string;
  language: string;
  model: string;
  durationSec: number;
}

export interface StyledCaptionResult {
  style: CaptionStyle;
  config: CaptionStyleConfig;
  cues: CaptionCue[];
  srt: string;
  ass: string; // Advanced SubStation Alpha for styled rendering
}

const CAPTION_STYLES: Record<CaptionStyle, CaptionStyleConfig> = {
  modern: {
    fontFamily: "Inter, sans-serif",
    fontSize: 48,
    color: "#FFFFFF",
    strokeColor: "#000000",
    strokeWidth: 3,
    position: "bottom",
    animation: "fade-in",
  },
  bold: {
    fontFamily: "Inter, sans-serif",
    fontSize: 64,
    color: "#FFD700",
    strokeColor: "#000000",
    strokeWidth: 4,
    position: "center",
    animation: "word-highlight",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  minimal: {
    fontFamily: "Inter, sans-serif",
    fontSize: 32,
    color: "#FFFFFF",
    strokeColor: "transparent",
    strokeWidth: 0,
    position: "lower-third",
    animation: "none",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  karaoke: {
    fontFamily: "Inter, sans-serif",
    fontSize: 52,
    color: "#FFFFFF",
    strokeColor: "#000000",
    strokeWidth: 2,
    position: "bottom",
    animation: "word-highlight",
  },
};

// ── Transcription ──

export async function transcribeAudio(
  audioUrl: string,
  options?: { language?: string }
): Promise<TranscriptionResult> {
  const falKey = process.env.FAL_KEY;
  const replicateToken =
    process.env.REPLICATE_API_TOKEN ||
    process.env.REPLICATE_API_KEY ||
    process.env.REPLICATE_TOKEN;

  const errors: string[] = [];

  // Model 1: fal-ai/whisper
  if (falKey) {
    try {
      const result = await runFalWhisper(
        falKey,
        "fal-ai/whisper",
        audioUrl,
        options?.language
      );
      if (result) return { ...result, model: "fal-ai/whisper" };
    } catch (e) {
      errors.push(`fal-ai/whisper: ${errMsg(e)}`);
    }

    // Model 2: fal-ai/wizper
    try {
      const result = await runFalWhisper(
        falKey,
        "fal-ai/wizper",
        audioUrl,
        options?.language
      );
      if (result) return { ...result, model: "fal-ai/wizper" };
    } catch (e) {
      errors.push(`fal-ai/wizper: ${errMsg(e)}`);
    }
  }

  // Model 3: openai/whisper on Replicate
  if (replicateToken) {
    try {
      const result = await runReplicateWhisper(
        replicateToken,
        "openai/whisper",
        audioUrl,
        options?.language
      );
      if (result) return { ...result, model: "replicate/openai-whisper" };
    } catch (e) {
      errors.push(`replicate/openai-whisper: ${errMsg(e)}`);
    }

    // Model 4: incredibly-fast-whisper
    try {
      const result = await runReplicateWhisper(
        replicateToken,
        "vaibhavs10/incredibly-fast-whisper",
        audioUrl,
        options?.language
      );
      if (result) return { ...result, model: "replicate/incredibly-fast-whisper" };
    } catch (e) {
      errors.push(`replicate/incredibly-fast-whisper: ${errMsg(e)}`);
    }
  }

  throw new Error(
    `All transcription models failed. ${
      !falKey && !replicateToken
        ? "Set FAL_KEY or REPLICATE_API_TOKEN in env."
        : `Errors: ${errors.join("; ")}`
    }`
  );
}

// ── Styled Captions ──

export function generateStyledCaptions(
  cues: CaptionCue[],
  style: CaptionStyle = "modern"
): StyledCaptionResult {
  const config = CAPTION_STYLES[style];
  const srt = cuesToSrt(cues);
  const ass = cuesToAss(cues, config, style);
  return { style, config, cues, srt, ass };
}

export function getAvailableCaptionStyles(): Array<{
  id: CaptionStyle;
  name: string;
  description: string;
}> {
  return [
    { id: "modern", name: "Modern", description: "Clean white text with black outline" },
    { id: "bold", name: "Bold", description: "Large yellow text, viral TikTok style" },
    { id: "minimal", name: "Minimal", description: "Subtle lower-third text" },
    { id: "karaoke", name: "Karaoke", description: "Word-by-word highlight synced to audio" },
  ];
}

// ── SRT Format ──

function cuesToSrt(cues: CaptionCue[]): string {
  return cues
    .map((cue, i) => {
      const start = formatSrtTime(cue.start);
      const end = formatSrtTime(cue.end);
      return `${i + 1}\n${start} --> ${end}\n${cue.text}\n`;
    })
    .join("\n");
}

function formatSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad3(ms)}`;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}
function pad3(n: number): string {
  return n.toString().padStart(3, "0");
}

// ── ASS Format (for styled burn-in) ──

function cuesToAss(
  cues: CaptionCue[],
  config: CaptionStyleConfig,
  style: CaptionStyle
): string {
  const alignment =
    config.position === "bottom" ? 2 : config.position === "center" ? 5 : 2;
  const marginV = config.position === "lower-third" ? 40 : 20;
  const hexColor = cssToAssColor(config.color);
  const hexStroke = cssToAssColor(config.strokeColor);

  let header = `[Script Info]
Title: Zoobicon Captions
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${config.fontFamily.split(",")[0]},${config.fontSize},${hexColor},${hexColor},${hexStroke},&H80000000,1,0,0,0,100,100,0,0,1,${config.strokeWidth},0,${alignment},40,40,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  for (const cue of cues) {
    const start = formatAssTime(cue.start);
    const end = formatAssTime(cue.end);

    if (style === "karaoke" && cue.words && cue.words.length > 0) {
      // Word-by-word karaoke timing
      const karaokeLine = cue.words
        .map((w) => {
          const dur = Math.round((w.end - w.start) * 100);
          return `{\\kf${dur}}${w.word}`;
        })
        .join(" ");
      header += `Dialogue: 0,${start},${end},Default,,0,0,0,,${karaokeLine}\n`;
    } else if (style === "bold") {
      // Pop-in animation
      header += `Dialogue: 0,${start},${end},Default,,0,0,0,,{\\fad(150,100)}${cue.text}\n`;
    } else {
      header += `Dialogue: 0,${start},${end},Default,,0,0,0,,${cue.text}\n`;
    }
  }

  return header;
}

function formatAssTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.round((seconds % 1) * 100);
  return `${h}:${pad(m)}:${pad(s)}.${pad(cs)}`;
}

function cssToAssColor(css: string): string {
  if (css === "transparent") return "&H00000000";
  const hex = css.replace("#", "");
  if (hex.length === 6) {
    const r = hex.substring(0, 2);
    const g = hex.substring(2, 4);
    const b = hex.substring(4, 6);
    return `&H00${b}${g}${r}`;
  }
  return "&H00FFFFFF";
}

// ── fal.ai Whisper ──

async function runFalWhisper(
  key: string,
  model: string,
  audioUrl: string,
  language?: string
): Promise<Omit<TranscriptionResult, "model"> | null> {
  // Submit
  const submitRes = await fetch(`https://queue.fal.run/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      audio_url: audioUrl,
      task: "transcribe",
      chunk_level: "segment",
      ...(language ? { language } : {}),
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!submitRes.ok) {
    throw new Error(`fal submit ${submitRes.status}`);
  }

  const submitData = await submitRes.json();
  const requestId = submitData.request_id;

  if (!requestId) {
    // Synchronous result
    return parseFalWhisperOutput(submitData);
  }

  // Poll
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const statusRes = await fetch(
      `https://queue.fal.run/${model}/requests/${requestId}/status`,
      {
        headers: { Authorization: `Key ${key}` },
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!statusRes.ok) continue;
    const status = await statusRes.json();
    if (status.status === "COMPLETED") {
      const resultRes = await fetch(
        `https://queue.fal.run/${model}/requests/${requestId}`,
        {
          headers: { Authorization: `Key ${key}` },
          signal: AbortSignal.timeout(15000),
        }
      );
      if (!resultRes.ok) throw new Error(`fal result ${resultRes.status}`);
      return parseFalWhisperOutput(await resultRes.json());
    }
    if (status.status === "FAILED") {
      throw new Error(`fal whisper failed: ${status.error || "unknown"}`);
    }
  }
  throw new Error("fal whisper timed out after 120s");
}

function parseFalWhisperOutput(
  data: Record<string, unknown>
): Omit<TranscriptionResult, "model"> | null {
  const chunks = (data.chunks || data.segments) as
    | Array<{
        timestamp?: [number, number];
        start?: number;
        end?: number;
        text?: string;
        words?: Array<{ word: string; start: number; end: number }>;
      }>
    | undefined;

  if (!chunks || !Array.isArray(chunks) || chunks.length === 0) return null;

  const cues: CaptionCue[] = chunks.map((c) => ({
    start: c.start ?? c.timestamp?.[0] ?? 0,
    end: c.end ?? c.timestamp?.[1] ?? 0,
    text: (c.text || "").trim(),
    words: c.words,
  }));

  const fullText = cues.map((c) => c.text).join(" ");
  const durationSec = cues[cues.length - 1]?.end ?? 0;

  return {
    cues,
    srt: cuesToSrt(cues),
    fullText,
    language: (data.language as string) || "en",
    durationSec,
  };
}

// ── Replicate Whisper ──

async function runReplicateWhisper(
  token: string,
  model: string,
  audioUrl: string,
  language?: string
): Promise<Omit<TranscriptionResult, "model"> | null> {
  const input: Record<string, unknown> = { audio: audioUrl };
  if (language) input.language = language;
  if (model.includes("incredibly-fast")) {
    input.task = "transcribe";
    input.timestamp = "word";
    input.batch_size = 64;
  } else {
    input.model = "large-v3";
    input.transcription = "srt";
    input.translate = false;
  }

  // Create prediction
  const createRes = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ version: undefined, model, input }),
    signal: AbortSignal.timeout(30000),
  });

  if (!createRes.ok) throw new Error(`replicate create ${createRes.status}`);
  const prediction = await createRes.json();

  // Poll
  const getUrl = prediction.urls?.get || `https://api.replicate.com/v1/predictions/${prediction.id}`;
  for (let i = 0; i < 90; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const pollRes = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!pollRes.ok) continue;
    const data = await pollRes.json();
    if (data.status === "succeeded") {
      return parseReplicateWhisperOutput(data);
    }
    if (data.status === "failed" || data.status === "canceled") {
      throw new Error(data.error || `Prediction ${data.status}`);
    }
  }
  throw new Error("replicate whisper timed out after 270s");
}

function parseReplicateWhisperOutput(
  data: Record<string, unknown>
): Omit<TranscriptionResult, "model"> | null {
  const output = data.output;

  // incredibly-fast-whisper returns { text, chunks: [...] }
  if (output && typeof output === "object" && !Array.isArray(output)) {
    const o = output as Record<string, unknown>;
    const chunks = o.chunks as Array<{
      timestamp: [number, number];
      text: string;
    }> | undefined;

    if (chunks && chunks.length > 0) {
      const cues: CaptionCue[] = chunks.map((c) => ({
        start: c.timestamp[0],
        end: c.timestamp[1],
        text: c.text.trim(),
      }));
      return {
        cues,
        srt: cuesToSrt(cues),
        fullText: cues.map((c) => c.text).join(" "),
        language: "en",
        durationSec: cues[cues.length - 1]?.end ?? 0,
      };
    }

    // SRT format output
    const srt = (o.transcription || o.srt || o.text || "") as string;
    if (srt) {
      const cues = parseSrt(srt);
      if (cues.length > 0) {
        return {
          cues,
          srt: cuesToSrt(cues),
          fullText: cues.map((c) => c.text).join(" "),
          language: "en",
          durationSec: cues[cues.length - 1]?.end ?? 0,
        };
      }
    }
  }

  // String output (raw SRT)
  if (typeof output === "string" && output.includes("-->")) {
    const cues = parseSrt(output);
    if (cues.length > 0) {
      return {
        cues,
        srt: cuesToSrt(cues),
        fullText: cues.map((c) => c.text).join(" "),
        language: "en",
        durationSec: cues[cues.length - 1]?.end ?? 0,
      };
    }
  }

  return null;
}

// ── SRT Parser ──

function parseSrt(srt: string): CaptionCue[] {
  const blocks = srt.trim().split(/\n\n+/);
  const cues: CaptionCue[] = [];

  for (const block of blocks) {
    const lines = block.trim().split("\n");
    if (lines.length < 2) continue;

    // Find the timestamp line
    const tsLine = lines.find((l) => l.includes("-->"));
    if (!tsLine) continue;

    const [startStr, endStr] = tsLine.split("-->").map((s) => s.trim());
    const start = parseSrtTimestamp(startStr);
    const end = parseSrtTimestamp(endStr);

    // Text is everything after the timestamp line
    const tsIdx = lines.indexOf(tsLine);
    const text = lines
      .slice(tsIdx + 1)
      .join(" ")
      .trim();

    if (text && !isNaN(start) && !isNaN(end)) {
      cues.push({ start, end, text });
    }
  }

  return cues;
}

function parseSrtTimestamp(ts: string): number {
  const m = ts.match(/(\d+):(\d+):(\d+)[,.](\d+)/);
  if (!m) return NaN;
  return (
    parseInt(m[1]) * 3600 +
    parseInt(m[2]) * 60 +
    parseInt(m[3]) +
    parseInt(m[4]) / 1000
  );
}

// ── Helpers ──

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
