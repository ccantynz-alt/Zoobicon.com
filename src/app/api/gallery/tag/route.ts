import { NextRequest, NextResponse } from 'next/server';
import { tagPhotos } from '@/lib/photo-gallery';

export const runtime = 'nodejs';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as { photoIds?: string[] };
    if (!body.photoIds || !Array.isArray(body.photoIds) || body.photoIds.length === 0) {
      return NextResponse.json({ error: 'photoIds[] required' }, { status: 400 });
    }
    const results = await tagPhotos(body.photoIds);
    return NextResponse.json({ results });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
