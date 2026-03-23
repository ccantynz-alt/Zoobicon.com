import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('q');

  const articles = [
    { id: '1', title: 'Getting Started with Zoobicon', category: 'Getting Started', views: 4523, helpful: 89, slug: 'getting-started', updatedAt: '2026-03-15' },
    { id: '2', title: 'How to Deploy Your First Site', category: 'Getting Started', views: 3891, helpful: 92, slug: 'deploy-first-site', updatedAt: '2026-03-10' },
    { id: '3', title: 'Using the AI Builder', category: 'How-To Guides', views: 6734, helpful: 95, slug: 'ai-builder-guide', updatedAt: '2026-03-18' },
    { id: '4', title: 'Custom Domain Setup', category: 'How-To Guides', views: 2456, helpful: 78, slug: 'custom-domain', updatedAt: '2026-03-12' },
    { id: '5', title: 'API Authentication', category: 'API Documentation', views: 1892, helpful: 85, slug: 'api-auth', updatedAt: '2026-03-20' },
    { id: '6', title: 'Troubleshooting Build Errors', category: 'Troubleshooting', views: 3245, helpful: 72, slug: 'build-errors', updatedAt: '2026-03-08' },
    { id: '7', title: 'Billing & Plans FAQ', category: 'FAQ', views: 5621, helpful: 88, slug: 'billing-faq', updatedAt: '2026-03-05' },
    { id: '8', title: 'Multi-page Site Generation', category: 'How-To Guides', views: 2890, helpful: 91, slug: 'multipage-guide', updatedAt: '2026-03-14' },
  ];

  const filtered = search ? articles.filter(a => a.title.toLowerCase().includes(search.toLowerCase()) || a.category.toLowerCase().includes(search.toLowerCase())) : articles;

  return NextResponse.json({ articles: filtered, categories: ['Getting Started', 'How-To Guides', 'Troubleshooting', 'FAQ', 'API Documentation'] });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    if (action === 'create_article') {
      return NextResponse.json({ id: `kb_${Date.now()}`, ...data, views: 0, helpful: 0, createdAt: new Date().toISOString() });
    }
    if (action === 'ai_generate') {
      return NextResponse.json({
        title: data.topic || 'New Article',
        content: `# ${data.topic}\n\n## Overview\nThis guide covers everything you need to know about ${data.topic}.\n\n## Step 1: Getting Started\nFirst, navigate to your dashboard and...\n\n## Step 2: Configuration\nNext, configure the settings by...\n\n## Step 3: Verification\nFinally, verify everything is working by...\n\n## FAQ\n**Q: What if something goes wrong?**\nA: Check our troubleshooting guide for common solutions.\n\n## Related Articles\n- Getting Started Guide\n- API Documentation`,
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process knowledge base action' }, { status: 500 });
  }
}