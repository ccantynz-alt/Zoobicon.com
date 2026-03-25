import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    sites: [
      { id: '1', url: 'https://mysite.zoobicon.sh', sessions: 4523, clicks: 12456, scrollDepth: 67, avgDuration: 124 },
    ],
    heatmapData: {
      clicks: Array.from({ length: 50 }, (_, i) => ({ x: Math.random() * 100, y: Math.random() * 200, intensity: Math.random() })),
      scrollDepth: [100, 95, 88, 76, 65, 54, 43, 32, 21, 15],
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({ id: `hm_${Date.now()}`, ...body, createdAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process heatmap data' }, { status: 500 });
  }
}
