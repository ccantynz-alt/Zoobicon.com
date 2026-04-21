import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

// QStash sends POST — reuse the GET handler
export async function POST(req: NextRequest): Promise<NextResponse> {
  if (process.env.QSTASH_CURRENT_SIGNING_KEY) {
    try {
      const { verifySignatureAppRouter } = await import("@upstash/qstash/nextjs");
      const verified = verifySignatureAppRouter((r: Request) => GET(r as NextRequest));
      return verified(req) as Promise<NextResponse>;
    } catch { /* fall through */ }
  }
  return GET(req);
}

const URLS = [
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://esm.sh/react@18',
  'https://esm.sh/react-dom@18/client',
] as const;

interface WarmResult {
  url: string;
  ok: boolean;
  status?: number;
  error?: string;
}

async function pingUrl(url: string): Promise<WarmResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timeout);
    return { url, ok: res.ok, status: res.status };
  } catch (err) {
    clearTimeout(timeout);
    const msg = err instanceof Error ? err.message : 'unknown';
    return { url, ok: false, error: msg };
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

  const results = await Promise.allSettled(URLS.map((u) => pingUrl(u)));

  const warmed: string[] = [];
  const failed: { url: string; error: string }[] = [];

  results.forEach((r, i) => {
    const url = URLS[i];
    if (r.status === 'fulfilled' && r.value.ok) {
      warmed.push(url);
    } else {
      const error =
        r.status === 'fulfilled'
          ? r.value.error || `HTTP ${r.value.status ?? '?'}`
          : r.reason?.message || 'rejected';
      failed.push({ url, error });
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
