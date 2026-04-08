import { NextRequest, NextResponse } from 'next/server';
import { indexDocument } from '@/lib/semantic-search';

export const runtime = 'nodejs';

interface IndexBody {
  userId?: string;
  collection?: string;
  id?: string;
  text?: string;
  metadata?: Record<string, unknown>;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'DATABASE_URL not configured' }, { status: 503 });
  }
  try {
    const body = (await req.json()) as IndexBody;
    if (!body.userId || !body.collection || !body.id || !body.text) {
      return NextResponse.json({ error: 'userId, collection, id, text required' }, { status: 400 });
    }
    const result = await indexDocument({
      userId: body.userId,
      collection: body.collection,
      id: body.id,
      text: body.text,
      metadata: body.metadata,
    });
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
