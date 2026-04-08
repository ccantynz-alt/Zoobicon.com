// ElevenLabs v3 TTS with multi-provider fallback chain.
// Raw fetch only. Strict TypeScript. No `any`.

const ELEVEN_BASE = "https://api.elevenlabs.io/v1";
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel
const DEFAULT_MODEL = "eleven_v3";
const DEFAULT_FORMAT = "mp3_44100_128";

export interface SynthesizeParams {
  text: string;
  voiceId?: string;
  modelId?: string;
  format?: string;
}

export interface CloneVoiceParams {
  name: string;
  files: ArrayBuffer[];
}

export interface ElevenVoice {
  voice_id: string;
  name: string;
  category?: string;
}

export interface ListVoicesResponse {
  voices: ElevenVoice[];
}

export async function synthesize(params: SynthesizeParams): Promise<ArrayBuffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY not set");
  }
  const voiceId = params.voiceId || DEFAULT_VOICE_ID;
  const modelId = params.modelId || DEFAULT_MODEL;
  const format = params.format || DEFAULT_FORMAT;

  const res = await fetch(
    `${ELEVEN_BASE}/text-to-speech/${encodeURIComponent(voiceId)}?output_format=${encodeURIComponent(format)}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: params.text,
        model_id: modelId,
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`ElevenLabs synth failed ${res.status}: ${errText}`);
  }
  return await res.arrayBuffer();
}

export async function cloneVoice(params: CloneVoiceParams): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY not set");
  }

  const form = new FormData();
  form.append("name", params.name);
  params.files.forEach((buf, i) => {
    form.append("files", new Blob([buf], { type: "audio/mpeg" }), `sample-${i}.mp3`);
  });

  const res = await fetch(`${ELEVEN_BASE}/voices/add`, {
    method: "POST",
    headers: { "xi-api-key": apiKey },
    body: form,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`ElevenLabs cloneVoice failed ${res.status}: ${errText}`);
  }
  const json = (await res.json()) as { voice_id?: string };
  if (!json.voice_id) {
    throw new Error("ElevenLabs cloneVoice returned no voice_id");
  }
  return json.voice_id;
}

export async function listVoices(): Promise<ListVoicesResponse> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY not set");
  }
  const res = await fetch(`${ELEVEN_BASE}/voices`, {
    method: "GET",
    headers: { "xi-api-key": apiKey },
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`ElevenLabs listVoices failed ${res.status}: ${errText}`);
  }
  return (await res.json()) as ListVoicesResponse;
}

export interface SynthWithFallbackParams {
  text: string;
  voiceId?: string;
}

export interface SynthWithFallbackResult {
  audio: ArrayBuffer;
  provider: string;
}

async function tryCartesia(text: string): Promise<ArrayBuffer> {
  const key = process.env.CARTESIA_API_KEY;
  if (!key) throw new Error("CARTESIA_API_KEY not set");
  const res = await fetch("https://api.cartesia.ai/tts/bytes", {
    method: "POST",
    headers: {
      "X-API-Key": key,
      "Cartesia-Version": "2024-11-13",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model_id: "sonic-3",
      transcript: text,
      voice: { mode: "id", id: "a0e99841-438c-4a64-b679-ae501e7d6091" },
      output_format: {
        container: "mp3",
        sample_rate: 44100,
        bit_rate: 128000,
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`Cartesia failed ${res.status}`);
  }
  return await res.arrayBuffer();
}

interface FalClientModule {
  runFalWithFallback: (
    models: string[],
    input: Record<string, unknown>
  ) => Promise<{ audio?: { url?: string }; audio_url?: string; url?: string }>;
}

async function tryFal(modelId: string, text: string): Promise<ArrayBuffer> {
  const mod = (await import("@/lib/fal-client")) as unknown as FalClientModule;
  if (typeof mod.runFalWithFallback !== "function") {
    throw new Error("fal-client.runFalWithFallback not available");
  }
  const result = await mod.runFalWithFallback([modelId], { text });
  const audioUrl = result.audio?.url || result.audio_url || result.url;
  if (!audioUrl) {
    throw new Error(`fal model ${modelId} returned no audio url`);
  }
  const audioRes = await fetch(audioUrl);
  if (!audioRes.ok) {
    throw new Error(`fal audio fetch failed ${audioRes.status}`);
  }
  return await audioRes.arrayBuffer();
}

async function tryFishAudio(text: string): Promise<ArrayBuffer> {
  const key = process.env.FISHAUDIO_API_KEY;
  if (!key) throw new Error("FISHAUDIO_API_KEY not set");
  const res = await fetch("https://api.fish.audio/v1/tts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      format: "mp3",
      mp3_bitrate: 128,
    }),
  });
  if (!res.ok) {
    throw new Error(`fish.audio failed ${res.status}`);
  }
  return await res.arrayBuffer();
}

export async function synthesizeWithFallback(
  params: SynthWithFallbackParams
): Promise<SynthWithFallbackResult> {
  const { text, voiceId } = params;

  // 1. ElevenLabs primary
  try {
    const audio = await synthesize({ text, voiceId });
    return { audio, provider: "elevenlabs" };
  } catch (err) {
    console.warn("[tts] ElevenLabs failed:", (err as Error).message);
  }

  // 2. Cartesia Sonic 3
  try {
    const audio = await tryCartesia(text);
    return { audio, provider: "cartesia-sonic-3" };
  } catch (err) {
    console.warn("[tts] Cartesia failed:", (err as Error).message);
  }

  // 3. fal.ai ElevenLabs proxy
  try {
    const audio = await tryFal("fal-ai/elevenlabs/tts", text);
    return { audio, provider: "fal-elevenlabs" };
  } catch (err) {
    console.warn("[tts] fal-elevenlabs failed:", (err as Error).message);
  }

  // 4. fal.ai PlayHT v3
  try {
    const audio = await tryFal("fal-ai/playht/v3", text);
    return { audio, provider: "fal-playht-v3" };
  } catch (err) {
    console.warn("[tts] fal-playht failed:", (err as Error).message);
  }

  // 5. fish.audio
  try {
    const audio = await tryFishAudio(text);
    return { audio, provider: "fish-audio" };
  } catch (err) {
    console.warn("[tts] fish.audio failed:", (err as Error).message);
  }

  const err = new Error("All TTS providers failed or missing env keys");
  (err as Error & { status?: number }).status = 503;
  throw err;
}
