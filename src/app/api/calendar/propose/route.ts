import { NextRequest, NextResponse } from 'next/server';
import { proposeMeeting } from '@/lib/calendar-scheduler';

export const runtime = 'nodejs';

interface ProposeBody {
  participants: string[];
  duration: number;
  range: { start: string; end: string };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as ProposeBody;
    if (!body.participants || !body.duration || !body.range) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const proposals = await proposeMeeting(body.participants, body.duration, body.range);
    return NextResponse.json({ proposals });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
