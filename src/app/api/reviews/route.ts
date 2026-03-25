import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const reviews = [
    { id: '1', platform: 'google', author: 'John D.', rating: 5, text: 'Amazing AI website builder. Built my restaurant site in 2 minutes.', date: '2026-03-20', replied: true },
    { id: '2', platform: 'g2', author: 'Sarah M.', rating: 4, text: 'Great tool for agencies. Wish it had more template variety.', date: '2026-03-18', replied: false },
    { id: '3', platform: 'trustpilot', author: 'Mike R.', rating: 5, text: 'Replaced our $5K/month agency. ROI is insane.', date: '2026-03-15', replied: true },
    { id: '4', platform: 'google', author: 'Emma L.', rating: 3, text: 'Good but mobile optimization could be better.', date: '2026-03-12', replied: false },
    { id: '5', platform: 'capterra', author: 'James W.', rating: 5, text: 'Best value in AI builders. The full-stack generation sets it apart.', date: '2026-03-10', replied: true },
  ];
  return NextResponse.json({ reviews, stats: { avgRating: 4.4, totalReviews: reviews.length, responseRate: 60 } });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.action === 'generate_reply') {
      const tone = body.tone || 'professional';
      const isPositive = (body.rating || 5) >= 4;
      const reply = isPositive
        ? `Thank you so much for your wonderful review! We're thrilled to hear about your experience. Your feedback motivates our team to keep pushing boundaries. If there's anything else we can help with, please don't hesitate to reach out!`
        : `Thank you for your honest feedback. We take every review seriously and are actively working on improvements. We'd love to learn more about your experience — please reach out to support@zoobicon.com so we can make things right.`;
      return NextResponse.json({ reply, tone });
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process review action' }, { status: 500 });
  }
}
