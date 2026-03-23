import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const workflows = [
    { id: '1', name: 'New Lead Welcome', trigger: 'form.submitted', actions: ['send_email', 'create_crm_contact', 'notify_slack'], runs: 1234, lastRun: '2026-03-23T09:15:00Z', status: 'active' },
    { id: '2', name: 'Deploy Notification', trigger: 'site.deployed', actions: ['send_email', 'share_social'], runs: 567, lastRun: '2026-03-23T08:30:00Z', status: 'active' },
    { id: '3', name: 'Weekly SEO Report', trigger: 'schedule.weekly', actions: ['generate_report', 'send_email'], runs: 12, lastRun: '2026-03-17T06:00:00Z', status: 'active' },
    { id: '4', name: 'Abandoned Cart Recovery', trigger: 'cart.abandoned', actions: ['delay_1h', 'send_email', 'delay_24h', 'send_email'], runs: 89, lastRun: '2026-03-22T15:00:00Z', status: 'paused' },
  ];

  return NextResponse.json({ workflows, totalRuns: workflows.reduce((s, w) => s + w.runs, 0), activeCount: workflows.filter(w => w.status === 'active').length });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({ id: `wf_${Date.now()}`, ...body, runs: 0, status: 'active', createdAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create workflow' }, { status: 500 });
  }
}