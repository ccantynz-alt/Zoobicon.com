import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    reports: [
      { id: '1', title: 'March 2026 Performance Report', type: 'monthly', client: 'TechStart Inc', generatedAt: '2026-03-01', status: 'sent' },
      { id: '2', title: 'Q1 2026 SEO Report', type: 'quarterly', client: 'GrowthLabs', generatedAt: '2026-03-15', status: 'draft' },
      { id: '3', title: 'Weekly Traffic Report', type: 'weekly', client: 'BrandWise', generatedAt: '2026-03-22', status: 'scheduled' },
    ],
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({ id: `report_${Date.now()}`, ...body, status: 'generating', createdAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
