import { NextRequest, NextResponse } from 'next/server';
import { generateFeed, type Feed } from '@/lib/rss';

export const runtime = 'nodejs';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as Feed;
    if (!body || typeof body.title !== 'string' || typeof body.link !== 'string' || !Array.isArray(body.items)) {
      return NextResponse.json({ error: 'Invalid feed payload' }, { status: 400 });
    }
    const xml = generateFeed(body);
    return new NextResponse(xml, {
      status: 200,
      headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to generate feed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
