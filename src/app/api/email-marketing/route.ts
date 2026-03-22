import { NextRequest, NextResponse } from "next/server";

/* ---------- types ---------- */
interface Campaign {
  id: string;
  subject: string;
  status: "draft" | "sent" | "scheduled";
  segment: string;
  sentAt: string | null;
  scheduledAt: string | null;
  recipientCount: number;
  openRate: number;
  clickRate: number;
  createdAt: string;
}

interface SubscriberStats {
  total: number;
  active: number;
  unsubscribed: number;
  growthThisMonth: number;
  topSources: { source: string; count: number }[];
}

/* ---------- demo data ---------- */
const CAMPAIGNS: Campaign[] = [
  { id: "c1", subject: "Welcome to our community!", status: "sent", segment: "all", sentAt: "2026-03-20T09:00:00Z", scheduledAt: null, recipientCount: 1842, openRate: 68.5, clickRate: 12.3, createdAt: "2026-03-19T15:00:00Z" },
  { id: "c2", subject: "New features: AI image generation is here", status: "sent", segment: "active", sentAt: "2026-03-15T10:00:00Z", scheduledAt: null, recipientCount: 1520, openRate: 52.1, clickRate: 8.7, createdAt: "2026-03-14T16:00:00Z" },
  { id: "c3", subject: "Weekly roundup: Top 5 community builds", status: "sent", segment: "all", sentAt: "2026-03-10T08:00:00Z", scheduledAt: null, recipientCount: 1780, openRate: 45.3, clickRate: 15.2, createdAt: "2026-03-09T14:00:00Z" },
  { id: "c4", subject: "Spring sale: 30% off Pro plans", status: "scheduled", segment: "free_tier", sentAt: null, scheduledAt: "2026-03-25T09:00:00Z", recipientCount: 890, openRate: 0, clickRate: 0, createdAt: "2026-03-21T11:00:00Z" },
  { id: "c5", subject: "Tips for better AI prompts", status: "draft", segment: "active", sentAt: null, scheduledAt: null, recipientCount: 0, openRate: 0, clickRate: 0, createdAt: "2026-03-22T08:00:00Z" },
];

const SUBSCRIBER_STATS: SubscriberStats = {
  total: 2347,
  active: 1892,
  unsubscribed: 455,
  growthThisMonth: 186,
  topSources: [
    { source: "Website signup form", count: 1120 },
    { source: "Builder deploy flow", count: 643 },
    { source: "Gallery page", count: 312 },
    { source: "API integration", count: 148 },
    { source: "Import", count: 124 },
  ],
};

/* ---------- GET: stats + campaigns ---------- */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const view = url.searchParams.get("view") || "overview";

  if (view === "campaigns") {
    return NextResponse.json({ campaigns: CAMPAIGNS, total: CAMPAIGNS.length });
  }

  return NextResponse.json({
    subscribers: SUBSCRIBER_STATS,
    recentCampaigns: CAMPAIGNS.slice(0, 3),
    totalCampaigns: CAMPAIGNS.length,
    avgOpenRate: 55.3,
    avgClickRate: 12.1,
  });
}

/* ---------- POST: create campaign ---------- */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subject, segment, scheduledAt } = body;

    if (!subject || typeof subject !== "string") {
      return NextResponse.json({ error: "Subject is required." }, { status: 400 });
    }
    if (!segment) {
      return NextResponse.json({ error: "Segment is required (e.g., 'all', 'active', 'free_tier')." }, { status: 400 });
    }

    const campaign: Campaign = {
      id: `c_${Date.now()}`,
      subject,
      status: scheduledAt ? "scheduled" : "draft",
      segment,
      sentAt: null,
      scheduledAt: scheduledAt || null,
      recipientCount: segment === "all" ? SUBSCRIBER_STATS.active : Math.floor(SUBSCRIBER_STATS.active * 0.5),
      openRate: 0,
      clickRate: 0,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, campaign }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
}
