import { NextRequest, NextResponse } from 'next/server';
import { upscaleImage, getReplicateToken } from '@/lib/image-tools';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!getReplicateToken()) {
    return NextResponse.json(
      { error: 'REPLICATE_API_TOKEN not configured' },
      { status: 503 },
    );
  }

  let body: { imageUrl?: string; scale?: number };
  try {
    body = (await req.json()) as { imageUrl?: string; scale?: number };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const imageUrl = body.imageUrl;
  if (!imageUrl || typeof imageUrl !== 'string') {
    return NextResponse.json({ error: 'imageUrl required' }, { status: 400 });
  }

  const scale = typeof body.scale === 'number' ? body.scale : 4;

  try {
    const result = await upscaleImage(imageUrl, scale);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
