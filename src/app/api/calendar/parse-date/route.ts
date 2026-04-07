import { NextRequest, NextResponse } from 'next/server';
import { parseNaturalDate } from '@/lib/calendar-scheduler';

export const runtime = 'nodejs';

interface ParseBody {
  text: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as ParseBody;
    if (!body.text) {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 });
    }
    const iso = await parseNaturalDate(body.text);
    return NextResponse.json({ iso });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
