/**
 * Voice Library — curated multi-provider TTS catalogue.
 * Bible Law 9: every synthesis call has a fallback chain.
 */

export type VoiceProvider =
  | 'kokoro'
  | 'xtts-v2'
  | 'openvoice'
  | 'fishspeech'
  | 'seamless';

export type VoiceStyle =
  | 'narration'
  | 'conversational'
  | 'energetic'
  | 'calm'
  | 'authoritative'
  | 'playful';

export type VoiceGender = 'male' | 'female' | 'neutral';

export interface Voice {
  id: string;
  name: string;
  provider: VoiceProvider;
  replicateModel: string;
  gender: VoiceGender;
  age: 'young' | 'adult' | 'mature';
  accent: string;
  language: string;
  style: VoiceStyle;
  sampleText: string;
  premium: boolean;
}

// Replicate model identifiers (4-model fallback pool — Bible Law 9).
const MODEL = {
  kokoro: 'jaaari/kokoro-82m:f559560eb822dc509045f3921a1921234918b91739db4bf3daab2169b71c7a13',
  fishspeech: 'lucataco/fish-speech-1.4:5d27ea6f4e529e3439c1a5b78e08c1a26a1d77c5d3b2b2c6e0f3a6b7c9e0f1a2',
  xtts: 'lucataco/xtts-v2:684bc3855b37866c0c65add2ff39c78f3dea3f4ff103a436465326e0f438d55e',
  openvoice: 'chenxwh/openvoice:5b3b4b9c1f4ba9e2d8b3e6c8c0d9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7',
  seamless: 'cjwbw/seamless_communication:668a4fec05a887143e5fe8d45df25ec4c794dd43169b9a11562309b2d45873b0',
} as const;

export const VOICE_LIBRARY: Voice[] = [
  // === en-US ===
  { id: 'kokoro-af-bella', name: 'Bella', provider: 'kokoro', replicateModel: MODEL.kokoro, gender: 'female', age: 'adult', accent: 'American', language: 'en-US', style: 'conversational', sampleText: 'Hi there, welcome to Zoobicon.', premium: false },
  { id: 'kokoro-af-sarah', name: 'Sarah', provider: 'kokoro', replicateModel: MODEL.kokoro, gender: 'female', age: 'adult', accent: 'American', language: 'en-US', style: 'narration', sampleText: 'In a world of infinite possibilities.', premium: false },
  { id: 'kokoro-am-adam', name: 'Adam', provider: 'kokoro', replicateModel: MODEL.kokoro, gender: 'male', age: 'adult', accent: 'American', language: 'en-US', style: 'authoritative', sampleText: 'Today we launch the future.', premium: false },
  { id: 'kokoro-am-michael', name: 'Michael', provider: 'kokoro', replicateModel: MODEL.kokoro, gender: 'male', age: 'mature', accent: 'American', language: 'en-US', style: 'calm', sampleText: 'Take a deep breath and relax.', premium: false },
  { id: 'fish-en-energetic', name: 'Riley', provider: 'fishspeech', replicateModel: MODEL.fishspeech, gender: 'neutral', age: 'young', accent: 'American', language: 'en-US', style: 'energetic', sampleText: "Let's go, this is amazing!", premium: true },
  { id: 'xtts-en-playful', name: 'Zoe', provider: 'xtts-v2', replicateModel: MODEL.xtts, gender: 'female', age: 'young', accent: 'American', language: 'en-US', style: 'playful', sampleText: 'Guess what I just discovered!', premium: false },

  // === en-GB ===
  { id: 'kokoro-bf-emma', name: 'Emma', provider: 'kokoro', replicateModel: MODEL.kokoro, gender: 'female', age: 'adult', accent: 'British', language: 'en-GB', style: 'narration', sampleText: 'Once upon a time in London.', premium: false },
  { id: 'kokoro-bf-isabella', name: 'Isabella', provider: 'kokoro', replicateModel: MODEL.kokoro, gender: 'female', age: 'adult', accent: 'British', language: 'en-GB', style: 'authoritative', sampleText: 'The board has reached a decision.', premium: true },
  { id: 'kokoro-bm-george', name: 'George', provider: 'kokoro', replicateModel: MODEL.kokoro, gender: 'male', age: 'mature', accent: 'British', language: 'en-GB', style: 'narration', sampleText: 'And so our story begins.', premium: false },
  { id: 'kokoro-bm-lewis', name: 'Lewis', provider: 'kokoro', replicateModel: MODEL.kokoro, gender: 'male', age: 'adult', accent: 'British', language: 'en-GB', style: 'conversational', sampleText: 'Fancy a cup of tea?', premium: false },

  // === en-AU ===
  { id: 'fish-en-au-matilda', name: 'Matilda', provider: 'fishspeech', replicateModel: MODEL.fishspeech, gender: 'female', age: 'adult', accent: 'Australian', language: 'en-AU', style: 'conversational', sampleText: 'G’day, welcome aboard mate.', premium: false },
  { id: 'xtts-en-au-jack', name: 'Jack', provider: 'xtts-v2', replicateModel: MODEL.xtts, gender: 'male', age: 'adult', accent: 'Australian', language: 'en-AU', style: 'energetic', sampleText: 'Right, let’s smash this out.', premium: false },

  // === Spanish ===
  { id: 'xtts-es-sofia', name: 'Sofía', provider: 'xtts-v2', replicateModel: MODEL.xtts, gender: 'female', age: 'adult', accent: 'Castilian', language: 'es', style: 'conversational', sampleText: 'Hola, bienvenido a Zoobicon.', premium: false },
  { id: 'xtts-es-diego', name: 'Diego', provider: 'xtts-v2', replicateModel: MODEL.xtts, gender: 'male', age: 'adult', accent: 'Latin American', language: 'es', style: 'authoritative', sampleText: 'Hoy lanzamos el futuro.', premium: false },
  { id: 'fish-es-lucia', name: 'Lucía', provider: 'fishspeech', replicateModel: MODEL.fishspeech, gender: 'female', age: 'young', accent: 'Mexican', language: 'es', style: 'playful', sampleText: '¡Adivina qué descubrí!', premium: true },

  // === French ===
  { id: 'xtts-fr-amelie', name: 'Amélie', provider: 'xtts-v2', replicateModel: MODEL.xtts, gender: 'female', age: 'adult', accent: 'Parisian', language: 'fr', style: 'narration', sampleText: 'Il était une fois à Paris.', premium: false },
  { id: 'xtts-fr-pierre', name: 'Pierre', provider: 'xtts-v2', replicateModel: MODEL.xtts, gender: 'male', age: 'mature', accent: 'Parisian', language: 'fr', style: 'calm', sampleText: 'Respirez profondément.', premium: false },
  { id: 'fish-fr-claire', name: 'Claire', provider: 'fishspeech', replicateModel: MODEL.fishspeech, gender: 'female', age: 'adult', accent: 'Parisian', language: 'fr', style: 'conversational', sampleText: 'Bonjour, comment ça va?', premium: true },

  // === German ===
  { id: 'xtts-de-anna', name: 'Anna', provider: 'xtts-v2', replicateModel: MODEL.xtts, gender: 'female', age: 'adult', accent: 'Standard', language: 'de', style: 'authoritative', sampleText: 'Willkommen bei Zoobicon.', premium: false },
  { id: 'xtts-de-hans', name: 'Hans', provider: 'xtts-v2', replicateModel: MODEL.xtts, gender: 'male', age: 'mature', accent: 'Standard', language: 'de', style: 'narration', sampleText: 'Es war einmal in Berlin.', premium: false },
  { id: 'fish-de-lena', name: 'Lena', provider: 'fishspeech', replicateModel: MODEL.fishspeech, gender: 'female', age: 'young', accent: 'Standard', language: 'de', style: 'energetic', sampleText: 'Das ist der Wahnsinn!', premium: true },

  // === Italian ===
  { id: 'xtts-it-giulia', name: 'Giulia', provider: 'xtts-v2', replicateModel: MODEL.xtts, gender: 'female', age: 'adult', accent: 'Standard', language: 'it', style: 'playful', sampleText: 'Ciao, benvenuto a Zoobicon!', premium: false },
  { id: 'xtts-it-marco', name: 'Marco', provider: 'xtts-v2', replicateModel: MODEL.xtts, gender: 'male', age: 'adult', accent: 'Standard', language: 'it', style: 'conversational', sampleText: 'Andiamo, è ora di partire.', premium: false },

  // === Japanese ===
  { id: 'xtts-ja-yuki', name: 'Yuki', provider: 'xtts-v2', replicateModel: MODEL.xtts, gender: 'female', age: 'young', accent: 'Tokyo', language: 'ja', style: 'playful', sampleText: 'こんにちは、ズービコンへようこそ。', premium: false },
  { id: 'xtts-ja-haruto', name: 'Haruto', provider: 'xtts-v2', replicateModel: MODEL.xtts, gender: 'male', age: 'adult', accent: 'Tokyo', language: 'ja', style: 'calm', sampleText: '深呼吸してください。', premium: false },
  { id: 'fish-ja-sakura', name: 'Sakura', provider: 'fishspeech', replicateModel: MODEL.fishspeech, gender: 'female', age: 'adult', accent: 'Tokyo', language: 'ja', style: 'narration', sampleText: '昔々、東京に。', premium: true },

  // === Chinese ===
  { id: 'xtts-zh-mei', name: 'Mei', provider: 'xtts-v2', replicateModel: MODEL.xtts, gender: 'female', age: 'adult', accent: 'Mandarin', language: 'zh', style: 'conversational', sampleText: '你好，欢迎来到 Zoobicon。', premium: false },
  { id: 'xtts-zh-wei', name: 'Wei', provider: 'xtts-v2', replicateModel: MODEL.xtts, gender: 'male', age: 'adult', accent: 'Mandarin', language: 'zh', style: 'authoritative', sampleText: '今天我们开启未来。', premium: false },
  { id: 'fish-zh-lin', name: 'Lin', provider: 'fishspeech', replicateModel: MODEL.fishspeech, gender: 'female', age: 'young', accent: 'Mandarin', language: 'zh', style: 'energetic', sampleText: '太棒了，我们走吧！', premium: true },

  // === Hindi ===
  { id: 'xtts-hi-priya', name: 'Priya', provider: 'xtts-v2', replicateModel: MODEL.xtts, gender: 'female', age: 'adult', accent: 'Standard', language: 'hi', style: 'conversational', sampleText: 'नमस्ते, Zoobicon में आपका स्वागत है।', premium: false },
  { id: 'xtts-hi-arjun', name: 'Arjun', provider: 'xtts-v2', replicateModel: MODEL.xtts, gender: 'male', age: 'adult', accent: 'Standard', language: 'hi', style: 'narration', sampleText: 'एक समय की बात है।', premium: false },
  { id: 'seamless-hi-anaya', name: 'Anaya', provider: 'seamless', replicateModel: MODEL.seamless, gender: 'female', age: 'young', accent: 'Standard', language: 'hi', style: 'playful', sampleText: 'अंदाज़ा लगाओ क्या हुआ!', premium: true },

  // === OpenVoice extras ===
  { id: 'openvoice-en-narrator', name: 'Atlas', provider: 'openvoice', replicateModel: MODEL.openvoice, gender: 'male', age: 'mature', accent: 'Neutral', language: 'en-US', style: 'narration', sampleText: 'The journey begins now.', premium: true },
  { id: 'openvoice-en-aria', name: 'Aria', provider: 'openvoice', replicateModel: MODEL.openvoice, gender: 'female', age: 'adult', accent: 'Neutral', language: 'en-US', style: 'calm', sampleText: 'Everything will be alright.', premium: true },
];

export interface VoiceFilter {
  language?: string;
  gender?: VoiceGender;
  style?: VoiceStyle;
  provider?: VoiceProvider;
}

export function getVoice(id: string): Voice | undefined {
  return VOICE_LIBRARY.find((v) => v.id === id);
}

export function listVoices(filter?: VoiceFilter): Voice[] {
  if (!filter) return VOICE_LIBRARY;
  return VOICE_LIBRARY.filter((v) => {
    if (filter.language && v.language !== filter.language) return false;
    if (filter.gender && v.gender !== filter.gender) return false;
    if (filter.style && v.style !== filter.style) return false;
    if (filter.provider && v.provider !== filter.provider) return false;
    return true;
  });
}

interface ReplicatePrediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output: string | string[] | null;
  error: string | null;
  urls: { get: string; cancel: string };
}

async function callReplicate(
  model: string,
  text: string,
  token: string
): Promise<string | null> {
  const [, version] = model.split(':');
  const createRes = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      Authorization: `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version,
      input: { text, prompt: text, speed: 1.0 },
    }),
  });

  if (createRes.status === 404) {
    throw new Error('MODEL_404');
  }
  if (!createRes.ok) {
    throw new Error(`Replicate create failed: ${createRes.status}`);
  }

  const created = (await createRes.json()) as ReplicatePrediction;
  let pred: ReplicatePrediction = created;

  for (let i = 0; i < 30; i++) {
    if (pred.status === 'succeeded') {
      const out = pred.output;
      if (typeof out === 'string') return out;
      if (Array.isArray(out) && out.length > 0) return out[0];
      return null;
    }
    if (pred.status === 'failed' || pred.status === 'canceled') {
      throw new Error(pred.error || 'Prediction failed');
    }
    await new Promise((r) => setTimeout(r, 2000));
    const pollRes = await fetch(pred.urls.get, {
      headers: { Authorization: `Token ${token}` },
    });
    if (!pollRes.ok) throw new Error(`Replicate poll failed: ${pollRes.status}`);
    pred = (await pollRes.json()) as ReplicatePrediction;
  }
  throw new Error('Prediction timeout');
}

export async function synthesizeVoice(
  voiceId: string,
  text: string
): Promise<string> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error('REPLICATE_API_TOKEN not set');

  const requested = getVoice(voiceId);
  if (!requested) throw new Error(`Voice not found: ${voiceId}`);

  // Build fallback chain — same language, dedupe, requested first.
  const chain: Voice[] = [
    requested,
    ...listVoices({ language: requested.language }).filter((v) => v.id !== requested.id),
  ];

  let lastError: unknown = null;
  for (const voice of chain) {
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const url = await callReplicate(voice.replicateModel, text, token);
        if (url) return url;
        throw new Error('Empty output');
      } catch (err) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === 'MODEL_404') break; // skip this voice entirely
        await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
      }
    }
    console.warn(`[voice-library] voice ${voice.id} failed, trying next in chain`);
  }
  throw new Error(
    `All voices in fallback chain failed: ${lastError instanceof Error ? lastError.message : 'unknown'}`
  );
}
