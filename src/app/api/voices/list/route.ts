import { NextRequest, NextResponse } from 'next/server';
import {
  listVoices,
  type VoiceFilter,
  type VoiceGender,
  type VoiceStyle,
  type VoiceProvider,
} from '@/lib/voice-library';

export const runtime = 'nodejs';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const filter: VoiceFilter = {};
  const language = searchParams.get('language');
  const gender = searchParams.get('gender');
  const style = searchParams.get('style');
  const provider = searchParams.get('provider');
  if (language) filter.language = language;
  if (gender) filter.gender = gender as VoiceGender;
  if (style) filter.style = style as VoiceStyle;
  if (provider) filter.provider = provider as VoiceProvider;

  const voices = listVoices(filter);
  return NextResponse.json({ voices, count: voices.length });
}
