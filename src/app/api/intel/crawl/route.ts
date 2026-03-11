import { NextRequest, NextResponse } from "next/server";
import { crawlAllCompetitors, crawlCompetitor, COMPETITORS } from "@/lib/intel-crawler";

export const maxDuration = 300; // 5 minutes for full crawl

/**
 * POST /api/intel/crawl — Run competitive intelligence crawl
 *
 * Body: { competitor?: string } — crawl specific competitor or all
 *
 * Requires admin auth (checks zoobicon_admin header or API key).
 */
export async function POST(req: NextRequest) {
  // Simple auth check — admin only
  const authHeader = req.headers.get("x-admin-key");
  const adminKey = process.env.ADMIN_API_KEY || "zoobicon-admin-2024";
  if (authHeader !== adminKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { competitor } = body as { competitor?: string };

    if (competitor) {
      const results = await crawlCompetitor(competitor);
      return NextResponse.json({ results, competitor });
    }

    const report = await crawlAllCompetitors();
    return NextResponse.json(report);
  } catch (err) {
    console.error("Intel crawl error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Crawl failed" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/intel/crawl — List tracked competitors
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("x-admin-key");
  const adminKey = process.env.ADMIN_API_KEY || "zoobicon-admin-2024";
  if (authHeader !== adminKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    competitors: COMPETITORS.map((c) => ({
      name: c.name,
      domain: c.domain,
      category: c.category,
      urlCount: c.urls.length,
    })),
  });
}
