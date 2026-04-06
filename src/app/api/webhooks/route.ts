import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    endpoints: [
      { id: '1', url: 'https://api.myapp.com/webhooks/zoobicon', events: ['site.deployed', 'form.submitted'], status: 'active', deliveries: 234, failRate: 0.5 },
      { id: '2', url: 'https://hooks.slack.com/services/xxx', events: ['site.deployed'], status: 'active', deliveries: 89, failRate: 0 },
    ],
    events: ['site.created', 'site.deployed', 'site.updated', 'site.deleted', 'form.submitted', 'payment.received', 'user.signup', 'generation.completed', 'generation.failed'],
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({ id: `wh_${Date.now()}`, ...body, status: 'active', createdAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 });
  }
}
