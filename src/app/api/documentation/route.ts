import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  const docs = {
    name: 'Zoobicon API Documentation',
    version: 'v1.0',
    pages: [
      { id: '1', title: 'Introduction', slug: 'intro', category: 'Getting Started', content: '# Introduction\n\nWelcome to the Zoobicon API documentation.' },
      { id: '2', title: 'Authentication', slug: 'auth', category: 'Getting Started', content: '# Authentication\n\nAll API requests require a Bearer token.' },
      { id: '3', title: 'Generate Website', slug: 'generate', category: 'Endpoints', content: '# Generate Website\n\n`POST /api/v1/generate`' },
      { id: '4', title: 'List Sites', slug: 'list-sites', category: 'Endpoints', content: '# List Sites\n\n`GET /api/v1/sites`' },
      { id: '5', title: 'Deploy', slug: 'deploy', category: 'Endpoints', content: '# Deploy\n\n`POST /api/v1/deploy`' },
      { id: '6', title: 'Rate Limits', slug: 'rate-limits', category: 'Reference', content: '# Rate Limits\n\nFree: 10 req/min, Pro: 60 req/min' },
      { id: '7', title: 'Error Codes', slug: 'errors', category: 'Reference', content: '# Error Codes\n\n400: Bad Request, 401: Unauthorized' },
      { id: '8', title: 'Webhooks', slug: 'webhooks', category: 'Reference', content: '# Webhooks\n\nReceive real-time event notifications.' },
    ],
    categories: ['Getting Started', 'Endpoints', 'Reference', 'SDKs'],
  };

  return NextResponse.json(docs);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({ id: `doc_${Date.now()}`, ...body, createdAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create documentation' }, { status: 500 });
  }
}