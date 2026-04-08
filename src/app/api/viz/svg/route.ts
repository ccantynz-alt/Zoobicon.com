import { NextRequest, NextResponse } from 'next/server';
import { svgChart, type SvgChartInput } from '@/lib/data-viz';

export const runtime = 'nodejs';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as SvgChartInput;
    if (!body || !Array.isArray(body.data) || !body.type) {
      return NextResponse.json({ error: 'Missing data or type' }, { status: 400 });
    }
    const svg = svgChart(body);
    return new NextResponse(svg, {
      status: 200,
      headers: {
        'content-type': 'image/svg+xml; charset=utf-8',
        'cache-control': 'public, max-age=300',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
