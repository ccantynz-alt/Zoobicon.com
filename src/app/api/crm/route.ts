import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'pipeline';

  const pipeline = {
    stages: [
      { id: 'lead', name: 'Lead', deals: [
        { id: '1', contact: 'Sarah Chen', company: 'TechStart Inc', value: 15000, lastActivity: '2h ago', score: 'hot' },
        { id: '2', contact: 'Mike Wilson', company: 'GrowthLabs', value: 8500, lastActivity: '1d ago', score: 'warm' },
      ]},
      { id: 'qualified', name: 'Qualified', deals: [
        { id: '3', contact: 'Emma Rodriguez', company: 'BrandWise', value: 22000, lastActivity: '3h ago', score: 'hot' },
      ]},
      { id: 'proposal', name: 'Proposal', deals: [
        { id: '4', contact: 'James Park', company: 'CloudNine', value: 45000, lastActivity: '5h ago', score: 'hot' },
        { id: '5', contact: 'Lisa Thompson', company: 'DataFlow', value: 12000, lastActivity: '2d ago', score: 'warm' },
      ]},
      { id: 'negotiation', name: 'Negotiation', deals: [
        { id: '6', contact: 'David Kim', company: 'ScaleUp', value: 67000, lastActivity: '1h ago', score: 'hot' },
      ]},
      { id: 'won', name: 'Won', deals: [
        { id: '7', contact: 'Rachel Green', company: 'EcoVentures', value: 35000, lastActivity: '1d ago', score: 'hot' },
      ]},
    ],
    stats: { totalPipeline: 204500, wonThisMonth: 35000, conversionRate: 28.4, avgDealSize: 29214 }
  };

  return NextResponse.json(pipeline);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    if (action === 'create_contact') {
      return NextResponse.json({ id: `contact_${Date.now()}`, ...data, createdAt: new Date().toISOString() });
    }
    if (action === 'create_deal') {
      return NextResponse.json({ id: `deal_${Date.now()}`, ...data, stage: 'lead', createdAt: new Date().toISOString() });
    }
    if (action === 'move_deal') {
      return NextResponse.json({ id: data.dealId, stage: data.newStage, updatedAt: new Date().toISOString() });
    }
    if (action === 'ai_followup') {
      return NextResponse.json({
        email: {
          subject: `Following up on our ${data.dealName || 'conversation'}`,
          body: `Hi ${data.contactName},\n\nI wanted to follow up on our recent discussion about ${data.dealName || 'the project'}. I believe we can deliver exceptional value for your team.\n\nWould you be available for a quick 15-minute call this week to discuss next steps?\n\nBest regards`
        }
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process CRM action' }, { status: 500 });
  }
}
