import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const components = [
    { id: '1', name: 'Website (zoobicon.com)', status: 'operational', uptime: 99.98, responseTime: 145 },
    { id: '2', name: 'AI Generation API', status: 'operational', uptime: 99.95, responseTime: 234 },
    { id: '3', name: 'Hosting (zoobicon.sh)', status: 'operational', uptime: 99.99, responseTime: 89 },
    { id: '4', name: 'Database', status: 'operational', uptime: 99.97, responseTime: 12 },
    { id: '5', name: 'CDN', status: 'operational', uptime: 100, responseTime: 23 },
    { id: '6', name: 'Email Service', status: 'degraded', uptime: 99.85, responseTime: 456 },
    { id: '7', name: 'Authentication', status: 'operational', uptime: 99.99, responseTime: 67 },
    { id: '8', name: 'Stripe Payments', status: 'operational', uptime: 99.96, responseTime: 178 },
  ];

  const incidents = [
    { id: '1', title: 'Email delivery delays', status: 'monitoring', severity: 'minor', startedAt: '2026-03-23T10:00:00Z', updates: [
      { status: 'investigating', message: 'We are investigating reports of delayed email delivery.', timestamp: '2026-03-23T10:00:00Z' },
      { status: 'identified', message: 'Root cause identified: Mailgun rate limiting. Working on resolution.', timestamp: '2026-03-23T10:30:00Z' },
      { status: 'monitoring', message: 'Fix deployed. Monitoring email delivery times.', timestamp: '2026-03-23T11:00:00Z' },
    ]},
    { id: '2', title: 'API latency spike', status: 'resolved', severity: 'minor', startedAt: '2026-03-20T14:00:00Z', resolvedAt: '2026-03-20T14:45:00Z', updates: [
      { status: 'resolved', message: 'Latency returned to normal levels after scaling adjustment.', timestamp: '2026-03-20T14:45:00Z' },
    ]},
  ];

  return NextResponse.json({ components, incidents, overall: 'operational', lastUpdated: new Date().toISOString() });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({ id: `incident_${Date.now()}`, ...body, createdAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create incident' }, { status: 500 });
  }
}