import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { generateRobotsTxt } from "@/lib/sitemap-generator";

export const runtime = "nodejs";

interface SiteRow {
  id: string;
  slug?: string;
  url?: string;
  domain?: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    const rows = (await sql`SELECT * FROM sites WHERE id = ${params.siteId} LIMIT 1`) as unknown as SiteRow[];
    if (!rows || rows.length === 0) {
      return new NextResponse("Site not found", { status: 404 });
    }
    const site = rows[0];
    const baseUrl =
      site.url ||
      (site.domain ? `https://${site.domain}` : null) ||
      (site.slug ? `https://${site.slug}.zoobicon.sh` : null) ||
      "https://zoobicon.sh";

    const origin = new URL(req.url).origin;
    const sitemapUrl = `${origin}/api/sitemap/${params.siteId}`;

    const txt = generateRobotsTxt(baseUrl, {
      additionalSitemaps: [sitemapUrl],
    });

    return new NextResponse(txt, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new NextResponse(message, { status: 500 });
  }
}
