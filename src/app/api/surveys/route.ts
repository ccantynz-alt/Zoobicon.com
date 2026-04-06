import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const surveys = [
    { id: '1', title: 'Customer Satisfaction Q1', type: 'csat', responses: 342, completionRate: 78, npsScore: 72, status: 'active', createdAt: '2026-01-15' },
    { id: '2', title: 'Product Feedback', type: 'feedback', responses: 156, completionRate: 65, npsScore: null, status: 'active', createdAt: '2026-02-01' },
    { id: '3', title: 'Employee Engagement', type: 'engagement', responses: 89, completionRate: 92, npsScore: 68, status: 'closed', createdAt: '2026-02-15' },
    { id: '4', title: 'Feature Prioritization', type: 'ranking', responses: 234, completionRate: 71, npsScore: null, status: 'active', createdAt: '2026-03-01' },
  ];
  return NextResponse.json({ surveys, totalResponses: surveys.reduce((s, sv) => s + sv.responses, 0) });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({ id: `survey_${Date.now()}`, ...body, responses: 0, status: 'draft', createdAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create survey' }, { status: 500 });
  }
}