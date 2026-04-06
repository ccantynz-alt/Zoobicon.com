import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    experiments: [
      { id: '1', name: 'Hero CTA Color Test', page: '/pricing', status: 'running', visitors: { a: 1234, b: 1198 }, conversions: { a: 89, b: 134 }, confidence: 94.2, winner: 'B', startedAt: '2026-03-10' },
      { id: '2', name: 'Pricing Layout Test', page: '/pricing', status: 'completed', visitors: { a: 5678, b: 5432 }, conversions: { a: 456, b: 512 }, confidence: 97.1, winner: 'B', startedAt: '2026-02-15' },
      { id: '3', name: 'Homepage Hero Text', page: '/', status: 'running', visitors: { a: 890, b: 912 }, conversions: { a: 67, b: 54 }, confidence: 72.3, winner: null, startedAt: '2026-03-18' },
    ],
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({ id: `exp_${Date.now()}`, ...body, status: 'draft', visitors: { a: 0, b: 0 }, conversions: { a: 0, b: 0 }, createdAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create experiment' }, { status: 500 });
  }
}
