/**
 * Image tools — background removal + upscaling via Replicate.
 * 4-model fallback chain for each operation. Per Law 9.
 */

interface ReplicatePrediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output: string | string[] | null;
  error: string | null;
  urls: { get: string; cancel: string };
}

export function getReplicateToken(): string | null {
  return process.env.REPLICATE_API_TOKEN ?? null;
}

export async function safeFetch(
  url: string,
  init: RequestInit,
  attempts = 4,
): Promise<Response> {
  let lastErr: unknown = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, init);
      if (res.status >= 500) {
        lastErr = new Error(`HTTP ${res.status}`);
      } else {
        return res;
      }
    } catch (err) {
      lastErr = err;
    }
    await new Promise((r) => setTimeout(r, 500 * Math.pow(2, i)));
  }
  throw lastErr instanceof Error ? lastErr : new Error('safeFetch failed');
}

interface ModelEntry {
  slug: string;
  version: string;
  inputKey: string;
  extra?: Record<string, unknown>;
}

const REMOVE_BG_CHAIN: ModelEntry[] = [
  {
    slug: 'cjwbw/rembg',
    version: 'fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003',
    inputKey: 'image',
  },
  {
    slug: 'lucataco/remove-bg',
    version: '95fcc2a26d3899cd6c2691c900465aaeff04d8fadaface31edcb5e0fa6b8d4f5',
    inputKey: 'image',
  },
  {
    slug: '851-labs/background-remover',
    version: 'a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc',
    inputKey: 'image',
  },
  {
    slug: 'ilkerc/rembg',
    version: 'a1ea7f6e4f29b66a5c19f0f2b3a3f0b7e6cc1a0fb8e8e6fbb0c4fc7c9d2c6f1d',
    inputKey: 'image',
  },
];

const UPSCALE_CHAIN: ModelEntry[] = [
  {
    slug: 'nightmareai/real-esrgan',
    version: 'f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa',
    inputKey: 'image',
  },
  {
    slug: 'philz1337x/clarity-upscaler',
    version: 'dfad41707589d68ecdccd1dfa600d55a208f9310748e44bfe35b4a6291453d5e',
    inputKey: 'image',
  },
  {
    slug: 'tencentarc/gfpgan',
    version: '0fbacf7afc6c144e5be9767cff80f25aff23e52b0708f17e20f9879b2f21516c',
    inputKey: 'img',
  },
  {
    slug: 'mv-lab/swin2sr',
    version: 'a01b0512004918ca55d02e554914a9eca63909fa83a29ff0f115c78a7045574f',
    inputKey: 'image',
  },
];

async function runPrediction(
  token: string,
  model: ModelEntry,
  input: Record<string, unknown>,
): Promise<string | null> {
  const createRes = await safeFetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      Authorization: `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ version: model.version, input }),
  });

  if (!createRes.ok) {
    console.warn(`[image-tools] ${model.slug} create failed: ${createRes.status}`);
    return null;
  }

  const created = (await createRes.json()) as ReplicatePrediction;
  let pred = created;
  const start = Date.now();

  while (pred.status !== 'succeeded' && pred.status !== 'failed' && pred.status !== 'canceled') {
    if (Date.now() - start > 60_000) {
      console.warn(`[image-tools] ${model.slug} timeout`);
      return null;
    }
    await new Promise((r) => setTimeout(r, 2000));
    const pollRes = await safeFetch(pred.urls.get, {
      headers: { Authorization: `Token ${token}` },
    });
    if (!pollRes.ok) {
      console.warn(`[image-tools] ${model.slug} poll failed: ${pollRes.status}`);
      return null;
    }
    pred = (await pollRes.json()) as ReplicatePrediction;
  }

  if (pred.status !== 'succeeded' || pred.output === null) {
    console.warn(`[image-tools] ${model.slug} status=${pred.status} err=${pred.error ?? 'none'}`);
    return null;
  }

  const out = pred.output;
  const url = Array.isArray(out) ? out[out.length - 1] : out;
  if (typeof url !== 'string') return null;
  console.log(`[image-tools] success via ${model.slug}`);
  return url;
}

export async function removeBackground(imageUrl: string): Promise<{ url: string }> {
  const token = getReplicateToken();
  if (!token) throw new Error('REPLICATE_API_TOKEN not set');

  for (const model of REMOVE_BG_CHAIN) {
    const url = await runPrediction(token, model, { [model.inputKey]: imageUrl });
    if (url) return { url };
  }
  throw new Error('All background removal models failed');
}

export async function upscaleImage(
  imageUrl: string,
  scale = 4,
): Promise<{ url: string }> {
  const token = getReplicateToken();
  if (!token) throw new Error('REPLICATE_API_TOKEN not set');

  for (const model of UPSCALE_CHAIN) {
    const input: Record<string, unknown> = { [model.inputKey]: imageUrl, scale };
    const url = await runPrediction(token, model, input);
    if (url) return { url };
  }
  throw new Error('All upscale models failed');
}
