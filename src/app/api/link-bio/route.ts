import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  const pages = [
    { id: '1', username: 'sarah', displayName: 'Sarah Chen', bio: 'Designer & Creator', theme: 'gradient', views: 12453, clicks: 8934, links: 8 },
    { id: '2', username: 'techstartup', displayName: 'TechStart', bio: 'Building the future', theme: 'dark', views: 45231, clicks: 23456, links: 12 },
  ];

  if (username) {
    const page = pages.find(p => p.username === username);
    return NextResponse.json(page || { error: 'Page not found' });
  }

  return NextResponse.json({ pages });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, displayName, bio, links, theme } = body;

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const pageUrl = `https://zoobicon.sh/${username}`;

    return NextResponse.json({
      id: `bio_${Date.now()}`,
      username,
      displayName,
      bio,
      links: links || [],
      theme: theme || 'dark',
      pageUrl,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create bio page' }, { status: 500 });
  }
}
