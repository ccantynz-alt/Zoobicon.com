import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// QStash sends POST — reuse the GET handler
export async function POST(req: NextRequest): Promise<NextResponse> {
  // If QStash signing keys are configured, verify the signature
  if (process.env.QSTASH_CURRENT_SIGNING_KEY) {
    try {
      const { verifySignatureAppRouter } = await import("@upstash/qstash/nextjs");
      const verified = verifySignatureAppRouter((r: Request) => GET(r as NextRequest));
      return verified(req) as Promise<NextResponse>;
    } catch {
      // fall through to normal handler
    }
  }
  return GET(req);
}

const MODELS = [
  'jaaari/kokoro-82m',
  'lucataco/xtts-v2',
  'cjwbw/sadtalker',
  'black-forest-labs/flux-schnell',
  'lucataco/ffmpeg-concat',
] as const;

interface WarmResult {
  model: string;
  ok: boolean;
  error?: string;
}

async function pingModel(slug: string, token: string): Promise<WarmResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`https://api.replicate.com/v1/models/${slug}/predictions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'wait=1',
      },
      body: JSON.stringify({ input: {} }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    // Any response (even 422 invalid input) means the model is warm
    if (res.status >= 500) {
      return { model: slug, ok: false, error: `HTTP ${res.status}` };
    }
    return { model: slug, ok: true };
  } catch (err) {
    clearTimeout(timeout);
    const msg = err instanceof Error ? err.message : 'unknown';
    // AbortError means we triggered the job and bailed — that's success
    if (msg.includes('abort')) {
      return { model: slug, ok: true };
    }
    return { model: slug, ok: false, error: msg };
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const start = Date.now();
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');

  let devWarning: string | undefined;
  if (cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized: invalid or missing CRON_SECRET bearer token' },
        { status: 401 }
      );
    }
  } else {
    devWarning = 'CRON_SECRET not set — running in dev mode with no auth';
  }

  const token =
    process.env.REPLICATE_API_TOKEN ||
    process.env.REPLICATE_API_KEY ||
    process.env.REPLICATE_TOKEN ||
    process.env.REPLICATE_KEY;

  if (!token) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Replicate token missing. Set REPLICATE_API_TOKEN (or REPLICATE_API_KEY/REPLICATE_TOKEN/REPLICATE_KEY) in Vercel env vars.',
      },
      { status: 503 }
    );
  }

  const results = await Promise.allSettled(MODELS.map((m) => pingModel(m, token)));

  const warmed: string[] = [];
  const failed: { model: string; error: string }[] = [];

  results.forEach((r, i) => {
    const slug = MODELS[i];
    if (r.status === 'fulfilled' && r.value.ok) {
      warmed.push(slug);
    } else {
      const error =
        r.status === 'fulfilled' ? r.value.error || 'unknown' : r.reason?.message || 'rejected';
      failed.push({ model: slug, error });
    }
  });

  return NextResponse.json({
    ok: true,
    warmed,
    failed,
    elapsedMs: Date.now() - start,
    ...(devWarning ? { warning: devWarning } : {}),
  });
}
