import { NextRequest, NextResponse } from 'next/server';
import { detectLanguage, GrammarCheckerError } from '@/lib/grammar-checker';

export const runtime = 'nodejs';

interface DetectBody {
  text?: unknown;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as DetectBody;
    if (typeof body.text !== 'string') {
      return NextResponse.json({ error: 'text is required and must be a string' }, { status: 400 });
    }
    const result = await detectLanguage(body.text);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof GrammarCheckerError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
