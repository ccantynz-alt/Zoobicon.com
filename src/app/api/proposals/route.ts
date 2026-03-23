import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const proposals = [
    { id: '1', title: 'Website Redesign for TechStart', client: 'TechStart Inc', value: 15000, status: 'signed', sentAt: '2026-03-10', viewedAt: '2026-03-10', signedAt: '2026-03-12' },
    { id: '2', title: 'SEO Strategy for GrowthLabs', client: 'GrowthLabs', value: 8500, status: 'viewed', sentAt: '2026-03-15', viewedAt: '2026-03-16', signedAt: null },
    { id: '3', title: 'E-commerce Build for FreshFoods', client: 'FreshFoods Co', value: 22000, status: 'sent', sentAt: '2026-03-20', viewedAt: null, signedAt: null },
    { id: '4', title: 'Brand Identity for CloudNine', client: 'CloudNine', value: 12000, status: 'draft', sentAt: null, viewedAt: null, signedAt: null },
    { id: '5', title: 'App Development for ScaleUp', client: 'ScaleUp', value: 45000, status: 'signed', sentAt: '2026-02-28', viewedAt: '2026-02-28', signedAt: '2026-03-02' },
  ];

  return NextResponse.json({
    proposals,
    stats: { totalValue: 102500, wonValue: 60000, pending: 30500, winRate: 66.7 }
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    if (action === 'generate') {
      return NextResponse.json({
        id: `prop_${Date.now()}`,
        title: data.title || 'New Proposal',
        sections: [
          { type: 'cover', title: data.title, client: data.client, date: new Date().toISOString() },
          { type: 'executive_summary', content: `We propose a comprehensive solution for ${data.client || 'your business'} that will deliver measurable results within the agreed timeline.` },
          { type: 'scope', items: data.scope || ['Discovery & Research', 'Design & Development', 'Testing & QA', 'Launch & Support'] },
          { type: 'timeline', weeks: data.timeline || 8 },
          { type: 'pricing', lineItems: data.lineItems || [{ item: 'Project Total', amount: data.value || 10000 }] },
          { type: 'terms', content: 'Standard terms and conditions apply. 50% deposit required to begin work.' },
        ],
        status: 'draft',
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process proposal' }, { status: 500 });
  }
}
