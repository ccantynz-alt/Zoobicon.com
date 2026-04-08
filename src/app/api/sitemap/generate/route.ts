import { NextRequest, NextResponse } from "next/server";
import { crawlSiteForUrls, generateSitemap } from "@/lib/sitemap-generator";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { baseUrl?: string; maxPages?: number };
    const baseUrl = body.baseUrl;
    if (!baseUrl || typeof baseUrl !== "string") {
      return NextResponse.json({ error: "baseUrl required" }, { status: 400 });
    }
    const maxPages = typeof body.maxPages === "number" ? body.maxPages : 100;
    const entries = await crawlSiteForUrls(baseUrl, maxPages);
    const sitemap = generateSitemap(entries);
    return NextResponse.json({ sitemap, entryCount: entries.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
