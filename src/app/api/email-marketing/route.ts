import { NextResponse } from "next/server";

const DEMO_STATS = {
  totalSubscribers: 1247,
  newThisMonth: 89,
  averageOpenRate: 42.3,
  averageClickRate: 8.7,
  campaigns: [
    { id: "c1", subject: "Welcome to our newsletter!", segment: "all", status: "sent", sentAt: "2026-03-10T10:00:00Z", opens: 523, clicks: 89, recipients: 1100 },
    { id: "c2", subject: "New features this month", segment: "active", status: "sent", sentAt: "2026-03-15T14:00:00Z", opens: 412, clicks: 67, recipients: 890 },
    { id: "c3", subject: "Spring sale — 20% off everything", segment: "customers", status: "draft", recipients: 450 },
  ],
  lists: [
    { name: "All Subscribers", count: 1247 },
    { name: "Active Users", count: 890 },
    { name: "Customers", count: 450 },
    { name: "Free Trial", count: 357 },
  ],
};

export async function GET() {
  return NextResponse.json(DEMO_STATS);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subject, body: emailBody, segment } = body;
    if (!subject || !emailBody) {
      return NextResponse.json({ error: "Missing required fields: subject, body" }, { status: 400 });
    }
    return NextResponse.json({
      success: true,
      campaign: {
        id: `c${Date.now()}`,
        subject,
        segment: segment || "all",
        status: "draft",
        recipients: segment === "customers" ? 450 : segment === "active" ? 890 : 1247,
        createdAt: new Date().toISOString(),
      },
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
