import { NextRequest, NextResponse } from 'next/server';
import { convert, getRate } from '@/lib/currency';

export const runtime = 'nodejs';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const amountStr = searchParams.get('amount');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    if (!amountStr || !from || !to) {
      return NextResponse.json(
        { error: 'Missing required params: amount, from, to' },
        { status: 400 },
      );
    }
    const amount = Number(amountStr);
    if (!Number.isFinite(amount)) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }
    const rate = await getRate(from, to);
    const converted = amount * rate;
    return NextResponse.json({
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      amount,
      converted,
      rate,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Conversion failed';
    return NextResponse.json(
      { error: 'Currency conversion failed', detail: message },
      { status: 502 },
    );
  }
}
