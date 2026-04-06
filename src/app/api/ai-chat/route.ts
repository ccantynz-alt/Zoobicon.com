import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const botId = searchParams.get('botId');

  const chatbots = [
    { id: '1', name: 'Customer Support Bot', model: 'claude', conversations: 1247, satisfaction: 4.6, status: 'active', leads: 89 },
    { id: '2', name: 'Sales Assistant', model: 'gpt-4o', conversations: 856, satisfaction: 4.3, status: 'active', leads: 234 },
    { id: '3', name: 'FAQ Bot', model: 'haiku', conversations: 3421, satisfaction: 4.8, status: 'active', leads: 12 },
    { id: '4', name: 'Booking Bot', model: 'claude', conversations: 567, satisfaction: 4.5, status: 'paused', leads: 156 },
  ];

  if (botId) {
    const bot = chatbots.find(b => b.id === botId);
    return NextResponse.json(bot || { error: 'Bot not found' });
  }

  return NextResponse.json({ chatbots, totalConversations: 6091, totalLeads: 491 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    if (action === 'create_bot') {
      const embedCode = `<script src="https://zoobicon.com/chat/${data.name?.toLowerCase().replace(/\s+/g, '-') || 'bot'}.js"></script>`;
      return NextResponse.json({
        id: `bot_${Date.now()}`,
        ...data,
        embedCode,
        status: 'active',
        createdAt: new Date().toISOString(),
      });
    }

    if (action === 'send_message') {
      // Simulate AI response
      const responses: Record<string, string> = {
        default: "Thanks for reaching out! I'd be happy to help. Could you tell me more about what you're looking for?",
        pricing: "Our plans start at $19/month for Creator, $49/month for Pro, and $99/month for Agency. Each includes AI website building, hosting, and support.",
        support: "I understand you need help. Let me check our knowledge base for the best solution. In the meantime, could you describe the issue in more detail?",
      };

      const message = data.message?.toLowerCase() || '';
      let response = responses.default;
      if (message.includes('price') || message.includes('cost') || message.includes('plan')) response = responses.pricing;
      if (message.includes('help') || message.includes('issue') || message.includes('problem')) response = responses.support;

      return NextResponse.json({ response, timestamp: new Date().toISOString() });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process chatbot action' }, { status: 500 });
  }
}
