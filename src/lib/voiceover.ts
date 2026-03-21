// ---------------------------------------------------------------------------
// Voiceover Generation — Multi-Provider TTS
//
// Providers:
//   - ElevenLabs (primary) — Best quality, 29 languages
//   - PlayHT (fallback) — Good quality, lower cost
//   - Browser TTS (demo) — Free, no API key needed, lower quality
//
// Env vars:
//   ELEVENLABS_API_KEY   — ElevenLabs API key
//   PLAYHT_API_KEY       — PlayHT API key
//   PLAYHT_USER_ID       — PlayHT user ID
// ---------------------------------------------------------------------------

export type VoiceProvider = "elevenlabs" | "playht" | "browser";

export interface VoiceConfig {
  provider?: VoiceProvider;
  voiceId?: string;
  speed?: number;       // 0.5 - 2.0 (1.0 = normal)
  stability?: number;   // 0 - 1 (ElevenLabs: voice consistency)
  clarity?: number;     // 0 - 1 (ElevenLabs: similarity boost)
}

export interface VoiceResult {
  audioUrl: string;
  provider: VoiceProvider;
  durationEstimate: number; // seconds
  format: string;
}

// --- Voice presets ---

export interface VoicePreset {
  id: string;
  name: string;
  description: string;
  provider: VoiceProvider;
  voiceId: string;
  category: "male" | "female" | "neutral";
  tone: string;
}

export const VOICE_PRESETS: VoicePreset[] = [
  // ElevenLabs voices
  { id: "rachel", name: "Rachel", description: "Calm, professional female narrator", provider: "elevenlabs", voiceId: "21m00Tcm4TlvDq8ikWAM", category: "female", tone: "professional" },
  { id: "drew", name: "Drew", description: "Confident, warm male narrator", provider: "elevenlabs", voiceId: "29vD33N1CtxCmqQRPOHJ", category: "male", tone: "warm" },
  { id: "clyde", name: "Clyde", description: "Deep, authoritative male voice", provider: "elevenlabs", voiceId: "2EiwWnXFnvU5JabPnv8n", category: "male", tone: "authoritative" },
  { id: "domi", name: "Domi", description: "Energetic, youthful female voice", provider: "elevenlabs", voiceId: "AZnzlk1XvdvUeBnXmlld", category: "female", tone: "energetic" },
  { id: "bella", name: "Bella", description: "Soft, elegant female narrator", provider: "elevenlabs", voiceId: "EXAVITQu4vr4xnSDxMaL", category: "female", tone: "elegant" },
  { id: "antoni", name: "Antoni", description: "Friendly, casual male voice", provider: "elevenlabs", voiceId: "ErXwobaYiN019PkySvjV", category: "male", tone: "casual" },
  { id: "elli", name: "Elli", description: "Crisp, clear young female voice", provider: "elevenlabs", voiceId: "MF3mGyEYCl7XYWbV9V6O", category: "female", tone: "crisp" },
  { id: "josh", name: "Josh", description: "Dynamic storyteller male voice", provider: "elevenlabs", voiceId: "TxGEqnHWrfWFTfGW9XjX", category: "male", tone: "dynamic" },
  // PlayHT voices
  { id: "matt-playht", name: "Matt", description: "Natural American male", provider: "playht", voiceId: "s3://voice-cloning-zero-shot/775ae416-49bb-4fb6-bd45-740f205d3e11/original/manifest.json", category: "male", tone: "natural" },
  { id: "jennifer-playht", name: "Jennifer", description: "Warm American female", provider: "playht", voiceId: "s3://voice-cloning-zero-shot/e040bd1b-f190-4bdb-83f0-75ef85b18f84/original/manifest.json", category: "female", tone: "warm" },
];

// --- Provider detection ---

export function getAvailableVoiceProvider(): VoiceProvider | null {
  if (process.env.ELEVENLABS_API_KEY) return "elevenlabs";
  if (process.env.PLAYHT_API_KEY && process.env.PLAYHT_USER_ID) return "playht";
  return null;
}

export function getConfiguredVoiceProviders(): { provider: VoiceProvider; configured: boolean }[] {
  return [
    { provider: "elevenlabs", configured: !!process.env.ELEVENLABS_API_KEY },
    { provider: "playht", configured: !!(process.env.PLAYHT_API_KEY && process.env.PLAYHT_USER_ID) },
    { provider: "browser", configured: true },
  ];
}

// --- ElevenLabs ---

async function generateElevenLabs(
  text: string,
  config: VoiceConfig
): Promise<VoiceResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY not configured");

  const voiceId = config.voiceId || "21m00Tcm4TlvDq8ikWAM"; // Rachel default
  const stability = config.stability ?? 0.5;
  const clarity = config.clarity ?? 0.75;

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: cleanScriptForTTS(text),
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability,
          similarity_boost: clarity,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ElevenLabs API error: ${res.status} ${errText}`);
  }

  // Convert audio to base64 data URL
  const arrayBuffer = await res.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const audioUrl = `data:audio/mpeg;base64,${base64}`;

  const wordCount = text.split(/\s+/).length;
  const durationEstimate = (wordCount / 150) * 60; // ~150 wpm

  return {
    audioUrl,
    provider: "elevenlabs",
    durationEstimate: Math.round(durationEstimate),
    format: "mp3",
  };
}

// --- PlayHT ---

async function generatePlayHT(
  text: string,
  config: VoiceConfig
): Promise<VoiceResult> {
  const apiKey = process.env.PLAYHT_API_KEY;
  const userId = process.env.PLAYHT_USER_ID;
  if (!apiKey || !userId) throw new Error("PLAYHT_API_KEY or PLAYHT_USER_ID not configured");

  const voiceId = config.voiceId || "s3://voice-cloning-zero-shot/775ae416-49bb-4fb6-bd45-740f205d3e11/original/manifest.json";
  const speed = config.speed ?? 1.0;

  const res = await fetch("https://api.play.ht/api/v2/tts/stream", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "X-User-ID": userId,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: cleanScriptForTTS(text),
      voice: voiceId,
      output_format: "mp3",
      speed,
      quality: "premium",
      voice_engine: "PlayHT2.0-turbo",
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`PlayHT API error: ${res.status} ${errText}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const audioUrl = `data:audio/mpeg;base64,${base64}`;

  const wordCount = text.split(/\s+/).length;
  const durationEstimate = (wordCount / (150 * speed)) * 60;

  return {
    audioUrl,
    provider: "playht",
    durationEstimate: Math.round(durationEstimate),
    format: "mp3",
  };
}

// --- Unified API ---

export async function generateVoiceover(
  text: string,
  config: VoiceConfig = {}
): Promise<VoiceResult> {
  const provider = config.provider || getAvailableVoiceProvider();

  if (!provider) {
    throw new Error(
      "No voice provider configured. Set ELEVENLABS_API_KEY or PLAYHT_API_KEY + PLAYHT_USER_ID."
    );
  }

  switch (provider) {
    case "elevenlabs":
      return generateElevenLabs(text, config);
    case "playht":
      return generatePlayHT(text, config);
    case "browser":
      // Browser TTS is client-side only — return a marker
      return {
        audioUrl: "",
        provider: "browser",
        durationEstimate: Math.round((text.split(/\s+/).length / 150) * 60),
        format: "browser-tts",
      };
    default:
      throw new Error(`Unknown voice provider: ${provider}`);
  }
}

/**
 * Generate voiceover for each scene individually (for per-scene timing).
 */
export async function generateSceneVoiceovers(
  scenes: { sceneNumber: number; narration: string }[],
  config: VoiceConfig = {}
): Promise<{ sceneNumber: number; audio: VoiceResult }[]> {
  const results: { sceneNumber: number; audio: VoiceResult }[] = [];

  for (const scene of scenes) {
    if (!scene.narration.trim()) continue;
    const audio = await generateVoiceover(scene.narration, config);
    results.push({ sceneNumber: scene.sceneNumber, audio });
  }

  return results;
}

// --- Helpers ---

/**
 * Clean script markers for TTS consumption.
 * Removes [PAUSE], (VISUAL CUE: ...) markers, stage directions.
 */
function cleanScriptForTTS(text: string): string {
  return text
    .replace(/\[PAUSE\]/gi, "...")          // Convert pauses to ellipsis (natural pause)
    .replace(/\(VISUAL CUE:.*?\)/gi, "")   // Remove visual cues
    .replace(/\(SFX:.*?\)/gi, "")           // Remove sound effect cues
    .replace(/\[SCENE \d+\]/gi, "")         // Remove scene markers
    .replace(/\n{3,}/g, "\n\n")             // Collapse excessive newlines
    .trim();
}

/**
 * Estimate voiceover duration from text length.
 */
export function estimateVoiceoverDuration(text: string, speed: number = 1.0): number {
  const cleanText = cleanScriptForTTS(text);
  const wordCount = cleanText.split(/\s+/).filter(Boolean).length;
  const pauseCount = (text.match(/\[PAUSE\]/gi) || []).length;
  const wpm = 150 * speed;
  return Math.round((wordCount / wpm) * 60 + pauseCount * 0.8);
}
