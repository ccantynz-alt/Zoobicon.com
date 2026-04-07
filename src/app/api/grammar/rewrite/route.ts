import { NextRequest, NextResponse } from 'next/server';
import { rewriteText, GrammarCheckerError, type RewriteTone } from '@/lib/grammar-checker';

export const runtime = 'nodejs';

const VALID_TONES: readonly RewriteTone[] = [
  'professional',
  'casual',
  'friendly',
  'persuasive',
  'concise',
];

interface RewriteBody {
  text?: unknown;
  tone?: unknown;
}

function isTone(value: unknown): value is RewriteTone {
  return typeof value === 'string' && (VALID_TONES as readonly string[]).includes(value);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as RewriteBody;
    if (typeof body.text !== 'string') {
      return NextResponse.json({ error: 'text is required and must be a string' }, { status: 400 });
    }
    if (!isTone(body.tone)) {
      return NextResponse.json(
        { error: `tone must be one of: ${VALID_TONES.join(', ')}` },
        { status: 400 }
      );
    }
    const result = await rewriteText(body.text, body.tone);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof GrammarCheckerError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
