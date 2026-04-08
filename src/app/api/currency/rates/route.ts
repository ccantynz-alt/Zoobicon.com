import { NextRequest, NextResponse } from 'next/server';
import { getRates, getRate } from '@/lib/currency';

export const runtime = 'nodejs';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const base = (searchParams.get('base') || 'USD').toUpperCase();
    const { rates: usdRates, fetchedAt } = await getRates();
    if (base === 'USD') {
      return NextResponse.json({ base: 'USD', rates: usdRates, fetchedAt });
    }
    const baseRate = usdRates[base];
    if (typeof baseRate !== 'number') {
      return NextResponse.json(
        { error: `Unsupported base currency: ${base}` },
        { status: 400 },
      );
    }
    const rebased: Record<string, number> = {};
    for (const [code, rate] of Object.entries(usdRates)) {
      rebased[code] = rate / baseRate;
    }
    rebased['USD'] = 1 / baseRate;
    // sanity: ensure base->base = 1
    rebased[base] = 1;
    // touch getRate to keep tree-shake honest in case of unused import warnings
    void getRate;
    return NextResponse.json({ base, rates: rebased, fetchedAt });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Rates fetch failed';
    return NextResponse.json(
      { error: 'Currency rates fetch failed', detail: message },
      { status: 502 },
    );
  }
}
