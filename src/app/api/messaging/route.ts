import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    channels: [
      { id: 'sms', name: 'SMS', connected: true, sent: 1234, delivered: 1198, read: 892 },
      { id: 'whatsapp', name: 'WhatsApp', connected: false, sent: 0, delivered: 0, read: 0 },
      { id: 'push', name: 'Push Notifications', connected: true, sent: 5678, delivered: 5234, read: 3456 },
      { id: 'telegram', name: 'Telegram', connected: false, sent: 0, delivered: 0, read: 0 },
    ],
    conversations: [
      { id: '1', contact: 'Sarah Chen', channel: 'sms', lastMessage: 'Thanks for the update!', timestamp: '2026-03-23T11:30:00Z', unread: false },
      { id: '2', contact: 'Mike Wilson', channel: 'sms', lastMessage: 'When will my site be ready?', timestamp: '2026-03-23T10:45:00Z', unread: true },
    ],
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({ id: `msg_${Date.now()}`, ...body, status: 'sent', sentAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
