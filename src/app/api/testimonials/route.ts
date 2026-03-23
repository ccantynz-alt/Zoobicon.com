import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const testimonials = [
    { id: '1', name: 'Sarah Chen', company: 'TechStart Inc', role: 'CEO', rating: 5, text: 'Zoobicon saved us 3 weeks and $15,000 on our website redesign. The AI-generated site converted 40% better than our agency-built one.', avatar: null, featured: true, source: 'direct', approved: true },
    { id: '2', name: 'Mike Wilson', company: 'GrowthLabs', role: 'Marketing Director', rating: 5, text: 'We switched from Webflow and cut our site maintenance time by 80%. The multi-page generation is incredible.', avatar: null, featured: true, source: 'google', approved: true },
    { id: '3', name: 'Emma Rodriguez', company: 'BrandWise Agency', role: 'Founder', rating: 4, text: 'The agency platform lets me deliver client sites in hours instead of weeks. Already onboarded 12 clients.', avatar: null, featured: false, source: 'direct', approved: true },
    { id: '4', name: 'James Park', company: 'CloudNine SaaS', role: 'CTO', rating: 5, text: 'The full-stack generation is mind-blowing. DB schema, API routes, and frontend in 95 seconds. We use it for rapid prototyping.', avatar: null, featured: true, source: 'g2', approved: true },
    { id: '5', name: 'Lisa Thompson', company: 'Freelance Designer', role: 'Designer', rating: 5, text: 'I now offer AI-powered website packages alongside my design services. Revenue up 3x.', avatar: null, featured: false, source: 'direct', approved: true },
  ];
  return NextResponse.json({ testimonials, stats: { total: testimonials.length, avgRating: 4.8, featured: 3 } });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({ id: `test_${Date.now()}`, ...body, approved: false, createdAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit testimonial' }, { status: 500 });
  }
}
