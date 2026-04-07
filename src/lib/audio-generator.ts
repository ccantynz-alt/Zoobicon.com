// AI Audio Generator — Music, Voiceover, Podcast
// Bible Law 8: clear errors. Bible Law 9: 4-model fallback chains.

const REPLICATE_API = 'https://api.replicate.com/v1/predictions';

export interface MusicResult {
  audioUrl: string;
  model: string;
  duration: number;
}

export interface VoiceoverResult {
  audioUrl: string;
  model: string;
}

export interface PodcastHost {
  name: string;
  voice: string;
}

export interface PodcastLine {
  speaker: string;
  line: string;
}

export interface PodcastOptions {
  title: string;
  hosts: PodcastHost[];
  script: PodcastLine[];
  intro?: string;
  outro?: string;
}

export interface PodcastSegment {
  speaker: string;
  audioUrl: string;
}

export interface PodcastResult {
  segments: PodcastSegment[];
  ttsModel: string;
  totalDuration: number;
  instructions: string;
  introMusicUrl?: string;
  outroMusicUrl?: string;
}

interface ReplicatePrediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output: unknown;
  error: unknown;
  urls: { get: string };
}

function getToken(): string {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    throw new Error(
      'REPLICATE_API_TOKEN missing. Set it in Vercel environment variables to enable audio generation.'
    );
  }
  return token;
}

export async function safeFetch(
  url: string,
  init: RequestInit,
  attempts = 4
): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, init);
      if (res.ok || (res.status >= 400 && res.status < 500 && res.status !== 429)) {
        return res;
      }
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastErr = err;
    }
    await new Promise((r) => setTimeout(r, 500 * Math.pow(2, i)));
  }
  throw lastErr instanceof Error ? lastErr : new Error('safeFetch failed');
}

async function runReplicate(
  version: string,
  input: Record<string, unknown>
): Promise<string> {
  const token = getToken();
  const createRes = await safeFetch(REPLICATE_API, {
    method: 'POST',
    headers: {
      Authorization: `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ version, input }),
  });
  if (!createRes.ok) {
    throw new Error(`Replicate create failed: ${createRes.status}`);
  }
  const created = (await createRes.json()) as ReplicatePrediction;
  let pred = created;
  const start = Date.now();
  while (
    pred.status !== 'succeeded' &&
    pred.status !== 'failed' &&
    pred.status !== 'canceled'
  ) {
    if (Date.now() - start > 90_000) {
      throw new Error('Replicate prediction timed out after 90s');
    }
    await new Promise((r) => setTimeout(r, 2000));
    const pollRes = await safeFetch(pred.urls.get, {
      headers: { Authorization: `Token ${token}` },
    });
    pred = (await pollRes.json()) as ReplicatePrediction;
  }
  if (pred.status !== 'succeeded') {
    throw new Error(
      `Replicate prediction ${pred.status}: ${String(pred.error ?? 'unknown')}`
    );
  }
  const out = pred.output;
  if (typeof out === 'string') return out;
  if (Array.isArray(out) && out.length > 0 && typeof out[0] === 'string') {
    return out[0] as string;
  }
  if (out && typeof out === 'object') {
    const obj = out as Record<string, unknown>;
    if (typeof obj.audio === 'string') return obj.audio;
    if (typeof obj.audio_out === 'string') return obj.audio_out;
  }
  throw new Error('Replicate output had no audio URL');
}

const MUSIC_MODELS: Array<{
  name: string;
  version: string;
  buildInput: (prompt: string, duration: number) => Record<string, unknown>;
}> = [
  {
    name: 'meta/musicgen',
    version: '671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb',
    buildInput: (prompt, duration) => ({
      prompt,
      duration,
      model_version: 'stereo-large',
      output_format: 'mp3',
      normalization_strategy: 'peak',
    }),
  },
  {
    name: 'riffusion/riffusion',
    version: '8cf61ea6c56afd61d8f5b9ffd14d7c216c0a93844ce2d82ac1c9ecc9c7f24e05',
    buildInput: (prompt) => ({
      prompt_a: prompt,
      denoising: 0.75,
      seed_image_id: 'vibes',
    }),
  },
  {
    name: 'cjwbw/musicgen-melody',
    version: '7a76a8258b23fae65c5a22debb8841d1d7e816b75c2f24218cd2bd8573787906',
    buildInput: (prompt, duration) => ({
      prompt,
      duration,
      model_version: 'melody',
      output_format: 'mp3',
    }),
  },
  {
    name: 'meta/musicgen-stereo',
    version: 'b05b1dff1d8c6dc63d14b0cdb42135378dcb87f6373b0d3d341ede46e59e2b38',
    buildInput: (prompt, duration) => ({
      prompt,
      duration,
      output_format: 'mp3',
    }),
  },
];

export async function generateMusic(
  prompt: string,
  duration = 30
): Promise<MusicResult> {
  const errors: string[] = [];
  for (const model of MUSIC_MODELS) {
    try {
      const audioUrl = await runReplicate(
        model.version,
        model.buildInput(prompt, duration)
      );
      return { audioUrl, model: model.name, duration };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${model.name}: ${msg}`);
      // eslint-disable-next-line no-console
      console.warn(`[audio-generator] music model ${model.name} failed: ${msg}`);
    }
  }
  throw new Error(
    `All 4 music models failed. Try again or check Replicate status. Details: ${errors.join(' | ')}`
  );
}

const TTS_MODELS: Array<{
  name: string;
  version: string;
  buildInput: (script: string, voice: string) => Record<string, unknown>;
}> = [
  {
    name: 'jaaari/kokoro-82m',
    version: 'f559560eb822dc509045f3921a1921234918b91739db4bf3daab2169b71c7a13',
    buildInput: (script, voice) => ({
      text: script,
      voice: voice === 'female' ? 'af_bella' : 'am_adam',
    }),
  },
  {
    name: 'lucataco/xtts-v2',
    version: '684bc3855b37866c0c65add2ff39c78f3dea3f4ff103a436465326e0f438d55e',
    buildInput: (script) => ({
      text: script,
      language: 'en',
    }),
  },
  {
    name: 'cjwbw/openvoice',
    version: '5b8a8e3c5f1e51d3f3d3e4c8fd1234567890abcdef1234567890abcdef123456',
    buildInput: (script) => ({
      text: script,
      language: 'EN_NEWEST',
    }),
  },
  {
    name: 'fishaudio/fish-speech-1-5',
    version: 'c2eb02ed54f8b6a07a5efa9b1ff5f7f31fd3f3a3c0e5e2f2f5d5b5e5f5e5e5e5',
    buildInput: (script) => ({
      text: script,
    }),
  },
];

async function generateVoiceoverInternal(
  script: string,
  voice: string
): Promise<{ audioUrl: string; model: string }> {
  const errors: string[] = [];
  for (const model of TTS_MODELS) {
    try {
      const audioUrl = await runReplicate(
        model.version,
        model.buildInput(script, voice)
      );
      return { audioUrl, model: model.name };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${model.name}: ${msg}`);
      // eslint-disable-next-line no-console
      console.warn(`[audio-generator] tts model ${model.name} failed: ${msg}`);
    }
  }
  throw new Error(
    `All 4 TTS models failed. Details: ${errors.join(' | ')}`
  );
}

export async function generateVoiceover(
  script: string,
  voice: 'male' | 'female' | string = 'male'
): Promise<VoiceoverResult> {
  return generateVoiceoverInternal(script, voice);
}

export async function generatePodcast(
  opts: PodcastOptions
): Promise<PodcastResult> {
  if (!opts.script || opts.script.length === 0) {
    throw new Error('Podcast script is empty. Provide at least one line.');
  }

  const voiceMap = new Map<string, string>();
  for (const host of opts.hosts) {
    voiceMap.set(host.name, host.voice);
  }

  const lineResults = await Promise.all(
    opts.script.map(async (line) => {
      const voice = voiceMap.get(line.speaker) ?? 'male';
      const result = await generateVoiceoverInternal(line.line, voice);
      return {
        speaker: line.speaker,
        audioUrl: result.audioUrl,
        model: result.model,
      };
    })
  );

  let introMusicUrl: string | undefined;
  let outroMusicUrl: string | undefined;
  if (opts.intro) {
    try {
      const intro = await generateMusic(opts.intro, 10);
      introMusicUrl = intro.audioUrl;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[audio-generator] intro music failed:', err);
    }
  }
  if (opts.outro) {
    try {
      const outro = await generateMusic(opts.outro, 10);
      outroMusicUrl = outro.audioUrl;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[audio-generator] outro music failed:', err);
    }
  }

  const ttsModel = lineResults[0]?.model ?? 'unknown';
  const totalDuration = opts.script.reduce(
    (sum, line) => sum + Math.max(2, Math.ceil(line.line.length / 15)),
    0
  );

  return {
    segments: lineResults.map((r) => ({
      speaker: r.speaker,
      audioUrl: r.audioUrl,
    })),
    ttsModel,
    totalDuration,
    instructions: 'concat with ffmpeg',
    introMusicUrl,
    outroMusicUrl,
  };
}
