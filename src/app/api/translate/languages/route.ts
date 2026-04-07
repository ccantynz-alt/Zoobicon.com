import { NextResponse } from 'next/server';
import { supportedLanguages } from '@/lib/translator';

export const runtime = 'nodejs';

export async function GET(): Promise<NextResponse> {
  const languages = supportedLanguages();
  return NextResponse.json({ count: languages.length, languages });
}
