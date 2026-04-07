import { NextResponse } from 'next/server';
import { listCurrencies } from '@/lib/currency';

export const runtime = 'nodejs';

export async function GET(): Promise<NextResponse> {
  try {
    return NextResponse.json({ currencies: listCurrencies() });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'List failed';
    return NextResponse.json(
      { error: 'Currency list failed', detail: message },
      { status: 500 },
    );
  }
}
