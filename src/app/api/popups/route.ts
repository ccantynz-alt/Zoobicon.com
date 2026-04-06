import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    popups: [
      { id: '1', name: 'Newsletter Signup', type: 'exit_intent', views: 4523, conversions: 891, rate: 19.7, status: 'active' },
      { id: '2', name: 'Holiday Sale Banner', type: 'floating_bar', views: 12456, conversions: 2341, rate: 18.8, status: 'active' },
      { id: '3', name: 'Free Ebook Download', type: 'timed', views: 3456, conversions: 567, rate: 16.4, status: 'paused' },
    ],
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({ id: `popup_${Date.now()}`, ...body, views: 0, conversions: 0, status: 'draft', createdAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create popup' }, { status: 500 });
  }
}
