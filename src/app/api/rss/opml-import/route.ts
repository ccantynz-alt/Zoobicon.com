import { NextRequest, NextResponse } from 'next/server';
import { opmlImport } from '@/lib/rss';

export const runtime = 'nodejs';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as { xml?: string };
    if (!body.xml || typeof body.xml !== 'string') {
      return NextResponse.json({ error: 'Missing xml field' }, { status: 400 });
    }
    const feeds = opmlImport(body.xml);
    return NextResponse.json({ feeds, count: feeds.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to import OPML';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
