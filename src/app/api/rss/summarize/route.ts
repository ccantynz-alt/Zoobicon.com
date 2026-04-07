import { NextRequest, NextResponse } from 'next/server';
import { summarizeFeedAI } from '@/lib/rss';

export const runtime = 'nodejs';

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not configured' },
      { status: 503 },
    );
  }
  try {
    const body = (await req.json()) as { url?: string };
    if (!body.url || typeof body.url !== 'string') {
      return NextResponse.json({ error: 'Missing url field' }, { status: 400 });
    }
    const result = await summarizeFeedAI(body.url);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to summarize feed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
