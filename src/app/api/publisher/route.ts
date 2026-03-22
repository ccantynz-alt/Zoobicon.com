import { NextRequest, NextResponse } from "next/server";

/* ---------- types ---------- */
interface PublishRecord {
  id: string;
  content: string;
  platforms: string[];
  status: "published" | "scheduled" | "failed";
  scheduledAt: string | null;
  publishedAt: string;
  results: { platform: string; status: "success" | "failed"; url?: string; error?: string }[];
}

/* ---------- demo history ---------- */
const PUBLISH_HISTORY: PublishRecord[] = [
  {
    id: "pub_1",
    content: "Just launched my new portfolio site in 90 seconds with AI. The future of web design is here.",
    platforms: ["twitter", "linkedin"],
    status: "published",
    scheduledAt: null,
    publishedAt: "2026-03-21T14:30:00Z",
    results: [
      { platform: "twitter", status: "success", url: "https://x.com/user/status/123456" },
      { platform: "linkedin", status: "success", url: "https://linkedin.com/feed/update/789" },
    ],
  },
  {
    id: "pub_2",
    content: "5 tips for making your restaurant website stand out. Thread coming soon!",
    platforms: ["twitter", "instagram", "facebook"],
    status: "published",
    scheduledAt: null,
    publishedAt: "2026-03-19T10:00:00Z",
    results: [
      { platform: "twitter", status: "success", url: "https://x.com/user/status/654321" },
      { platform: "instagram", status: "success", url: "https://instagram.com/p/abc123" },
      { platform: "facebook", status: "failed", error: "Auth token expired. Reconnect your account." },
    ],
  },
  {
    id: "pub_3",
    content: "Our client's e-commerce site went live today. 200% faster than traditional development.",
    platforms: ["linkedin"],
    status: "scheduled",
    scheduledAt: "2026-03-25T09:00:00Z",
    publishedAt: "2026-03-20T16:00:00Z",
    results: [],
  },
  {
    id: "pub_4",
    content: "New blog post: How AI is changing the web design industry in 2026.",
    platforms: ["twitter", "linkedin", "reddit"],
    status: "published",
    scheduledAt: null,
    publishedAt: "2026-03-15T12:00:00Z",
    results: [
      { platform: "twitter", status: "success", url: "https://x.com/user/status/111222" },
      { platform: "linkedin", status: "success", url: "https://linkedin.com/feed/update/333" },
      { platform: "reddit", status: "success", url: "https://reddit.com/r/webdev/comments/abc" },
    ],
  },
];

const SUPPORTED_PLATFORMS = ["twitter", "linkedin", "instagram", "facebook", "tiktok", "reddit"];

/* ---------- GET: publishing history ---------- */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "10", 10);

  const total = PUBLISH_HISTORY.length;
  const start = (page - 1) * limit;
  const items = PUBLISH_HISTORY.slice(start, start + limit);

  const stats = {
    totalPublished: PUBLISH_HISTORY.filter((p) => p.status === "published").length,
    totalScheduled: PUBLISH_HISTORY.filter((p) => p.status === "scheduled").length,
    totalFailed: PUBLISH_HISTORY.filter((p) => p.status === "failed").length,
    connectedPlatforms: ["twitter", "linkedin", "instagram"],
  };

  return NextResponse.json({
    history: items,
    stats,
    supportedPlatforms: SUPPORTED_PLATFORMS,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

/* ---------- POST: publish content ---------- */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, platforms, schedule } = body;

    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "Content is required." }, { status: 400 });
    }
    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json({ error: "At least one platform is required." }, { status: 400 });
    }

    const invalid = platforms.filter((p: string) => !SUPPORTED_PLATFORMS.includes(p));
    if (invalid.length > 0) {
      return NextResponse.json({ error: `Unsupported platforms: ${invalid.join(", ")}` }, { status: 400 });
    }

    const record: PublishRecord = {
      id: `pub_${Date.now()}`,
      content,
      platforms,
      status: schedule ? "scheduled" : "published",
      scheduledAt: schedule || null,
      publishedAt: new Date().toISOString(),
      results: schedule
        ? []
        : platforms.map((p: string) => ({
            platform: p,
            status: "success" as const,
            url: `https://${p}.com/post/${Date.now()}`,
          })),
    };

    return NextResponse.json({ success: true, publish: record }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
}
