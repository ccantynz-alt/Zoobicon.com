import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const codes = [
    { id: '1', name: 'Website QR', type: 'url', content: 'https://zoobicon.com', scans: 1234, createdAt: '2026-03-01' },
    { id: '2', name: 'WiFi Access', type: 'wifi', content: 'SSID:Office;PASS:secure123', scans: 567, createdAt: '2026-03-05' },
    { id: '3', name: 'Business Card', type: 'vcard', content: 'John Doe, CEO', scans: 892, createdAt: '2026-03-10' },
    { id: '4', name: 'Menu Link', type: 'url', content: 'https://restaurant.zoobicon.sh/menu', scans: 2341, createdAt: '2026-02-20' },
  ];

  return NextResponse.json({ codes, totalScans: 5034 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, content, style } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    return NextResponse.json({
      id: `qr_${Date.now()}`,
      name: name || 'Untitled QR Code',
      type: type || 'url',
      content,
      style: style || { foreground: '#000000', background: '#ffffff', cornerStyle: 'square' },
      downloadUrl: `/api/qr-codes/download?id=qr_${Date.now()}`,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create QR code' }, { status: 500 });
  }
}
