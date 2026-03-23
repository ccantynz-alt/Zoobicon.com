import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  // Demo forms data
  const forms = [
    { id: '1', name: 'Contact Form', type: 'contact', submissions: 247, conversionRate: 34.2, status: 'active', createdAt: '2026-03-01' },
    { id: '2', name: 'Event RSVP', type: 'event', submissions: 89, conversionRate: 67.1, status: 'active', createdAt: '2026-03-05' },
    { id: '3', name: 'Job Application', type: 'application', submissions: 156, conversionRate: 22.8, status: 'active', createdAt: '2026-03-10' },
    { id: '4', name: 'Feedback Survey', type: 'survey', submissions: 412, conversionRate: 45.6, status: 'paused', createdAt: '2026-02-15' },
    { id: '5', name: 'Newsletter Signup', type: 'signup', submissions: 1893, conversionRate: 78.3, status: 'active', createdAt: '2026-01-20' },
  ];

  return NextResponse.json({ forms, total: forms.length });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, fields, settings } = body;

    if (!name || !fields) {
      return NextResponse.json({ error: 'Name and fields are required' }, { status: 400 });
    }

    // Generate form ID and embed code
    const formId = `form_${Date.now()}`;
    const embedCode = `<script src="https://zoobicon.com/embed/forms/${formId}.js"></script>\n<div id="zbk-form-${formId}"></div>`;
    const shareUrl = `https://zoobicon.sh/f/${formId}`;

    return NextResponse.json({
      id: formId,
      name,
      type: type || 'custom',
      fields,
      settings: settings || {},
      embedCode,
      shareUrl,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create form' }, { status: 500 });
  }
}
