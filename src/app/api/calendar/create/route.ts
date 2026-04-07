import { NextRequest, NextResponse } from 'next/server';
import { createEvent } from '@/lib/calendar-scheduler';

export const runtime = 'nodejs';

interface CreateBody {
  userId: string;
  title: string;
  start: string;
  end: string;
  attendees?: string[];
  description?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as CreateBody;
    if (!body.userId || !body.title || !body.start || !body.end) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const event = await createEvent({
      userId: body.userId,
      title: body.title,
      start: body.start,
      end: body.end,
      attendees: body.attendees ?? [],
      description: body.description ?? '',
    });
    return NextResponse.json({ event });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
