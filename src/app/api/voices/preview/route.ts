import { NextRequest, NextResponse } from 'next/server';
import { synthesizeVoice, getVoice } from '@/lib/voice-library';

export const runtime = 'nodejs';
export const maxDuration = 90;

interface PreviewBody {
  voiceId?: string;
  text?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json(
      { error: 'REPLICATE_API_TOKEN not configured' },
      { status: 503 }
    );
  }

  let body: PreviewBody;
  try {
    body = (await req.json()) as PreviewBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { voiceId, text } = body;
  if (!voiceId || !text) {
    return NextResponse.json(
      { error: 'voiceId and text are required' },
      { status: 400 }
    );
  }

  const voice = getVoice(voiceId);
  if (!voice) {
    return NextResponse.json({ error: `Unknown voice: ${voiceId}` }, { status: 404 });
  }

  const sample = text.slice(0, 500);

  try {
    const audioUrl = await synthesizeVoice(voiceId, sample);
    return NextResponse.json({ audioUrl, voice: voice.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Synthesis failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
