import { NextRequest, NextResponse } from 'next/server';
import { findFreeSlots } from '@/lib/calendar-scheduler';

export const runtime = 'nodejs';

interface FreeBody {
  userId: string;
  range: { start: string; end: string };
  durationMin: number;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as FreeBody;
    if (!body.userId || !body.range || !body.durationMin) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const slots = await findFreeSlots(body.userId, body.range, body.durationMin);
    return NextResponse.json({ slots });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
