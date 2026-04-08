import { NextRequest, NextResponse } from 'next/server';
import { autoChart, type DataRow } from '@/lib/data-viz';

export const runtime = 'nodejs';

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY missing — set it in Vercel environment variables' },
      { status: 503 },
    );
  }
  try {
    const body = (await req.json()) as { data: DataRow[] };
    if (!body || !Array.isArray(body.data)) {
      return NextResponse.json({ error: 'Missing data array' }, { status: 400 });
    }
    const result = await autoChart(body.data);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
