import { NextRequest, NextResponse } from 'next/server';
import { chartConfig, type ChartConfigInput } from '@/lib/data-viz';

export const runtime = 'nodejs';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as ChartConfigInput;
    if (!body || !Array.isArray(body.data) || !body.type) {
      return NextResponse.json({ error: 'Missing data or type' }, { status: 400 });
    }
    const config = chartConfig(body);
    return NextResponse.json({ config });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
