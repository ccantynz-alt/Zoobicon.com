import { NextRequest, NextResponse } from 'next/server';
import { searchPhotos } from '@/lib/photo-gallery';

export const runtime = 'nodejs';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const query = req.nextUrl.searchParams.get('query') ?? '';
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }
    const photos = await searchPhotos(userId, query);
    return NextResponse.json({ photos });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
