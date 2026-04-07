import { NextResponse } from 'next/server';
import { translateBatch, TranslatorError, type BatchItem } from '@/lib/translator';

export const runtime = 'nodejs';

interface BatchBody {
  items?: unknown;
  targetLang?: unknown;
}

function isBatchItem(v: unknown): v is BatchItem {
  return (
    typeof v === 'object' &&
    v !== null &&
    'id' in v &&
    'text' in v &&
    typeof (v as { id: unknown }).id === 'string' &&
    typeof (v as { text: unknown }).text === 'string'
  );
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 });
  }
  let body: BatchBody;
  try {
    body = (await req.json()) as BatchBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { items, targetLang } = body;
  if (!Array.isArray(items) || typeof targetLang !== 'string') {
    return NextResponse.json(
      { error: 'items (array) and targetLang (string) required' },
      { status: 400 },
    );
  }
  const validItems: BatchItem[] = items.filter(isBatchItem);
  try {
    const results = await translateBatch(validItems, targetLang);
    return NextResponse.json({ results, targetLang });
  } catch (err) {
    if (err instanceof TranslatorError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
