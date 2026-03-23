import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const entries = [
    { id: '1', title: 'AI Chatbot Builder Launch', category: 'new_feature', content: 'Build custom AI chatbots for your websites. Choose from Claude, GPT, or Gemini. Embed with one line of code.', date: '2026-03-23', reactions: { celebrate: 45, love: 23, fire: 67 } },
    { id: '2', title: 'Form Builder with 20+ Templates', category: 'new_feature', content: 'Create beautiful, conversion-optimized forms with AI. Drag-and-drop builder with conditional logic.', date: '2026-03-20', reactions: { celebrate: 34, love: 18, fire: 52 } },
    { id: '3', title: 'Pipeline Speed Improvement (95s → 80s)', category: 'improvement', content: 'Optimized parallel agent execution. Average build time reduced by 15%.', date: '2026-03-15', reactions: { celebrate: 89, love: 12, fire: 45 } },
    { id: '4', title: 'Fixed Multi-page Navigation', category: 'bug_fix', content: 'Resolved an issue where multi-page site navigation links were not correctly pointing to generated pages.', date: '2026-03-12', reactions: { celebrate: 12, love: 5, fire: 8 } },
    { id: '5', title: 'CRM Integration', category: 'new_feature', content: 'Full CRM with pipeline view, contact management, AI follow-ups, and lead scoring.', date: '2026-03-10', reactions: { celebrate: 56, love: 34, fire: 78 } },
  ];
  return NextResponse.json({ entries, subscribers: 2341 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({ id: `cl_${Date.now()}`, ...body, reactions: { celebrate: 0, love: 0, fire: 0 }, createdAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create changelog entry' }, { status: 500 });
  }
}
