import { NextRequest, NextResponse } from 'next/server';
import { validateEmailDeliverability } from '@/lib/email-validator';

export const maxDuration = 30;
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }
    const result = await validateEmailDeliverability(email);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Validation failed' },
      { status: 500 }
    );
  }
}
