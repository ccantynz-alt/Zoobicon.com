import { NextRequest, NextResponse } from 'next/server';
import { checkGrammar, GrammarCheckerError, type GrammarCheckOptions } from '@/lib/grammar-checker';

export const runtime = 'nodejs';

interface CheckBody {
  text?: unknown;
  opts?: unknown;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as CheckBody;
    if (typeof body.text !== 'string') {
      return NextResponse.json({ error: 'text is required and must be a string' }, { status: 400 });
    }
    const opts: GrammarCheckOptions =
      body.opts && typeof body.opts === 'object' ? (body.opts as GrammarCheckOptions) : {};
    const result = await checkGrammar(body.text, opts);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof GrammarCheckerError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
