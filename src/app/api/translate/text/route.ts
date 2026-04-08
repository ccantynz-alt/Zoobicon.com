import { NextResponse } from 'next/server';
import { translate, TranslatorError } from '@/lib/translator';

export const runtime = 'nodejs';

interface TextBody {
  text?: unknown;
  targetLang?: unknown;
  sourceLang?: unknown;
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 });
  }
  let body: TextBody;
  try {
    body = (await req.json()) as TextBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { text, targetLang, sourceLang } = body;
  if (typeof text !== 'string' || typeof targetLang !== 'string') {
    return NextResponse.json(
      { error: 'text (string) and targetLang (string) required' },
      { status: 400 },
    );
  }
  const src = typeof sourceLang === 'string' ? sourceLang : undefined;
  try {
    const result = await translate(text, targetLang, src);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof TranslatorError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
