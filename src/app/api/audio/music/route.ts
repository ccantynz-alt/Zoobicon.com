import { NextRequest, NextResponse } from 'next/server';
import { generateMusic } from '@/lib/audio-generator';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { prompt?: string; duration?: number };
    if (!body.prompt || typeof body.prompt !== 'string') {
      return NextResponse.json(
        { error: 'Missing required field: prompt (string)' },
        { status: 400 }
      );
    }
    const duration =
      typeof body.duration === 'number' && body.duration > 0 ? body.duration : 30;
    const result = await generateMusic(body.prompt, duration);
    return NextResponse.json({
      audioUrl: result.audioUrl,
      model: result.model,
      duration: result.duration,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
