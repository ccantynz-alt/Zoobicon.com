import { NextRequest, NextResponse } from 'next/server';
import { uploadPhoto } from '@/lib/photo-gallery';

export const runtime = 'nodejs';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as { userId?: string; url?: string; name?: string };
    if (!body.userId || !body.url || !body.name) {
      return NextResponse.json({ error: 'userId, url, name required' }, { status: 400 });
    }
    const photo = await uploadPhoto({ userId: body.userId, url: body.url, name: body.name });
    return NextResponse.json({ photo });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
