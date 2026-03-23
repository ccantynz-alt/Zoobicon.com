import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const portfolios = [
    { id: '1', name: 'Sarah Chen Design', template: 'masonry', projects: 12, views: 8934, url: 'https://zoobicon.sh/sarah-design' },
    { id: '2', name: 'Mike Wilson Dev', template: 'case-study', projects: 8, views: 5621, url: 'https://zoobicon.sh/mike-dev' },
  ];
  return NextResponse.json({ portfolios });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({ id: `port_${Date.now()}`, ...body, views: 0, createdAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create portfolio' }, { status: 500 });
  }
}