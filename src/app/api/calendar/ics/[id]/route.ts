import { NextRequest, NextResponse } from 'next/server';
import { getEvent } from '@/lib/calendar-scheduler';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  ctx: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const event = await getEvent(ctx.params.id);
    if (!event) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return new NextResponse(event.ics, {
      status: 200,
      headers: {
        'content-type': 'text/calendar; charset=utf-8',
        'content-disposition': `attachment; filename="${event.id}.ics"`,
      },
    });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
