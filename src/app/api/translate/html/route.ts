import { NextResponse } from 'next/server';
import { translateHtml, TranslatorError } from '@/lib/translator';

export const runtime = 'nodejs';

interface HtmlBody {
  html?: unknown;
  targetLang?: unknown;
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 });
  }
  let body: HtmlBody;
  try {
    body = (await req.json()) as HtmlBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { html, targetLang } = body;
  if (typeof html !== 'string' || typeof targetLang !== 'string') {
    return NextResponse.json(
      { error: 'html (string) and targetLang (string) required' },
      { status: 400 },
    );
  }
  try {
    const out = await translateHtml(html, targetLang);
    return NextResponse.json({ html: out, targetLang });
  } catch (err) {
    if (err instanceof TranslatorError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
