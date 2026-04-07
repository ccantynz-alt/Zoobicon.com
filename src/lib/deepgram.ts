// Deepgram REST wrapper. No SDK dependency. Strict types.

export interface DeepgramOptions {
  model?: "nova-3" | "nova-2" | "enhanced" | "base";
  language?: string;
  punctuate?: boolean;
  smart_format?: boolean;
  diarize?: boolean;
  utterances?: boolean;
}

export interface TranscriptionWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  words: TranscriptionWord[];
  duration: number;
  language: string;
}

interface DeepgramWord {
  word?: unknown;
  punctuated_word?: unknown;
  start?: unknown;
  end?: unknown;
  confidence?: unknown;
}

interface DeepgramAlternative {
  transcript?: unknown;
  confidence?: unknown;
  words?: unknown;
}

interface DeepgramChannel {
  alternatives?: unknown;
}

interface DeepgramResponse {
  results?: {
    channels?: unknown;
  };
  metadata?: {
    duration?: unknown;
  };
}

export function isDeepgramAvailable(): boolean {
  return typeof process.env.DEEPGRAM_API_KEY === "string" && process.env.DEEPGRAM_API_KEY.length > 0;
}

export function getDeepgramKey(): string {
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) {
    throw new Error(
      "DEEPGRAM_API_KEY is not set. Add DEEPGRAM_API_KEY in Vercel env vars to enable AI Dictation."
    );
  }
  return key;
}

function num(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

export async function transcribeAudio(
  audio: ArrayBuffer | Uint8Array,
  mimeType: string,
  opts?: DeepgramOptions
): Promise<TranscriptionResult> {
  const key = getDeepgramKey();

  const params = new URLSearchParams();
  params.set("model", opts?.model ?? "nova-3");
  params.set("language", opts?.language ?? "en");
  params.set("punctuate", String(opts?.punctuate ?? true));
  params.set("smart_format", String(opts?.smart_format ?? true));
  if (opts?.diarize) params.set("diarize", "true");
  if (opts?.utterances) params.set("utterances", "true");

  const body: BodyInit =
    audio instanceof Uint8Array
      ? new Uint8Array(audio).buffer.slice(audio.byteOffset, audio.byteOffset + audio.byteLength)
      : audio;

  const res = await fetch(`https://api.deepgram.com/v1/listen?${params.toString()}`, {
    method: "POST",
    headers: {
      Authorization: `Token ${key}`,
      "Content-Type": mimeType,
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Deepgram error ${res.status}: ${text || res.statusText}`);
  }

  const json = (await res.json()) as DeepgramResponse;

  const channels = Array.isArray(json.results?.channels) ? (json.results!.channels as DeepgramChannel[]) : [];
  const channel = channels[0];
  const alternatives = Array.isArray(channel?.alternatives) ? (channel!.alternatives as DeepgramAlternative[]) : [];
  const alt = alternatives[0];

  const rawWords = Array.isArray(alt?.words) ? (alt!.words as DeepgramWord[]) : [];
  const words: TranscriptionWord[] = rawWords.map((w) => ({
    word: str(w.punctuated_word) || str(w.word),
    start: num(w.start),
    end: num(w.end),
    confidence: num(w.confidence),
  }));

  return {
    text: str(alt?.transcript),
    confidence: num(alt?.confidence),
    words,
    duration: num(json.metadata?.duration),
    language: opts?.language ?? "en",
  };
}
