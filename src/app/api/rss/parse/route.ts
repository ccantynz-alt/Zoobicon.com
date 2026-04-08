import { NextRequest, NextResponse } from 'next/server';
import { parseFeed } from '@/lib/rss';

export const runtime = 'nodejs';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }
  try {
    const feed = await parseFeed(url);
    return NextResponse.json(feed);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to parse feed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
