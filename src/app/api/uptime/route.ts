import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const monitors = [
    { id: '1', name: 'zoobicon.com', url: 'https://zoobicon.com', status: 'up', uptime: 99.98, responseTime: 142, checkInterval: 60, lastCheck: '2026-03-23T12:00:00Z' },
    { id: '2', name: 'API Server', url: 'https://zoobicon.com/api/health', status: 'up', uptime: 99.95, responseTime: 89, checkInterval: 30, lastCheck: '2026-03-23T12:00:00Z' },
    { id: '3', name: 'zoobicon.sh', url: 'https://zoobicon.sh', status: 'up', uptime: 99.99, responseTime: 45, checkInterval: 60, lastCheck: '2026-03-23T12:00:00Z' },
    { id: '4', name: 'zoobicon.ai', url: 'https://zoobicon.ai', status: 'up', uptime: 99.97, responseTime: 156, checkInterval: 300, lastCheck: '2026-03-23T12:00:00Z' },
    { id: '5', name: 'Database', url: 'tcp://db.zoobicon.com:5432', status: 'up', uptime: 99.99, responseTime: 12, checkInterval: 30, lastCheck: '2026-03-23T12:00:00Z' },
    { id: '6', name: 'Email Service', url: 'https://api.mailgun.net/v3', status: 'degraded', uptime: 99.85, responseTime: 456, checkInterval: 60, lastCheck: '2026-03-23T12:00:00Z' },
  ];
  return NextResponse.json({ monitors, overallUptime: 99.96 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({ id: `mon_${Date.now()}`, ...body, status: 'up', uptime: 100, createdAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create monitor' }, { status: 500 });
  }
}
