import { NextRequest, NextResponse } from 'next/server';
import { createAlbum } from '@/lib/photo-gallery';

export const runtime = 'nodejs';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as { userId?: string; name?: string; photoIds?: string[] };
    if (!body.userId || !body.name || !Array.isArray(body.photoIds)) {
      return NextResponse.json({ error: 'userId, name, photoIds[] required' }, { status: 400 });
    }
    const album = await createAlbum({ userId: body.userId, name: body.name, photoIds: body.photoIds });
    return NextResponse.json({ album });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
