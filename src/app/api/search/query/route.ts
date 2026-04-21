import { NextRequest, NextResponse } from 'next/server';
import { search, hybridSearch } from '@/lib/semantic-search';

export const runtime = 'nodejs';

interface QueryBody {
  userId?: string;
  collection?: string;
  query?: string;
  limit?: number;
  hybrid?: boolean;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'DATABASE_URL not configured' }, { status: 503 });
  }
  try {
    const body = (await req.json()) as QueryBody;
    if (!body.userId || !body.collection || !body.query) {
      return NextResponse.json({ error: 'userId, collection, query required' }, { status: 400 });
    }
    const fn = body.hybrid ? hybridSearch : search;
    const results = await fn({
      userId: body.userId,
      collection: body.collection,
      query: body.query,
      limit: body.limit,
    });
    return NextResponse.json({ results });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
