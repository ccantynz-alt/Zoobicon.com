import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const decks = [
    { id: '1', title: 'TechStart Series A Pitch', slides: 12, template: 'yc-style', views: 45, lastEdited: '2026-03-20' },
    { id: '2', title: 'GrowthLabs Seed Round', slides: 15, template: 'sequoia', views: 23, lastEdited: '2026-03-18' },
  ];
  return NextResponse.json({ decks });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    if (action === 'generate') {
      return NextResponse.json({
        id: `deck_${Date.now()}`,
        title: data.companyName ? `${data.companyName} Pitch Deck` : 'New Pitch Deck',
        slides: [
          { type: 'cover', title: data.companyName || 'Company Name', subtitle: data.tagline || 'One-line description' },
          { type: 'problem', title: 'The Problem', content: data.problem || 'Describe the problem you solve' },
          { type: 'solution', title: 'Our Solution', content: data.solution || 'How you solve it' },
          { type: 'market', title: 'Market Size', tam: data.tam || '$10B', sam: data.sam || '$2B', som: data.som || '$500M' },
          { type: 'product', title: 'Product Demo', content: 'Screenshots and demo' },
          { type: 'traction', title: 'Traction', metrics: data.metrics || ['1,000 users', '$50K MRR', '25% MoM growth'] },
          { type: 'business_model', title: 'Business Model', content: data.businessModel || 'SaaS subscription' },
          { type: 'competition', title: 'Competition', content: 'Competitive landscape' },
          { type: 'team', title: 'Our Team', members: data.team || [] },
          { type: 'financials', title: 'Financial Projections', content: '3-year projections' },
          { type: 'ask', title: 'The Ask', amount: data.fundingAmount || '$2M', use: data.useOfFunds || ['Product development', 'Go-to-market', 'Team expansion'] },
          { type: 'closing', title: 'Thank You', content: 'Contact information' },
        ],
        template: data.template || 'yc-style',
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process pitch deck' }, { status: 500 });
  }
}