import { NextRequest, NextResponse } from 'next/server';
import { removeBackground, getReplicateToken } from '@/lib/image-tools';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!getReplicateToken()) {
    return NextResponse.json(
      { error: 'REPLICATE_API_TOKEN not configured' },
      { status: 503 },
    );
  }

  let body: { imageUrl?: string };
  try {
    body = (await req.json()) as { imageUrl?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const imageUrl = body.imageUrl;
  if (!imageUrl || typeof imageUrl !== 'string') {
    return NextResponse.json({ error: 'imageUrl required' }, { status: 400 });
  }

  try {
    const result = await removeBackground(imageUrl);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
