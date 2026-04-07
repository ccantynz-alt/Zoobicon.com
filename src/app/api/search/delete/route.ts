import { NextRequest, NextResponse } from 'next/server';
import { deleteDocument } from '@/lib/semantic-search';

export const runtime = 'nodejs';

interface DeleteBody {
  id?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'DATABASE_URL not configured' }, { status: 503 });
  }
  try {
    const body = (await req.json()) as DeleteBody;
    if (!body.id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }
    const result = await deleteDocument(body.id);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
