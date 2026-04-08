import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { crawlSiteForUrls, generateSitemap, SitemapEntry } from "@/lib/sitemap-generator";

export const runtime = "nodejs";

interface SiteRow {
  id: string;
  slug?: string;
  url?: string;
  domain?: string;
  updated_at?: string;
}

export async function GET(
  _req: NextRequest,
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
      (site.slug ? `https://${site.slug}.zoobicon.sh` : null);

    let entries: SitemapEntry[] = [];
    if (baseUrl) {
      try {
        entries = await crawlSiteForUrls(baseUrl, 100);
      } catch {
        entries = [
          {
            loc: baseUrl,
            lastmod: site.updated_at || new Date().toISOString(),
            changefreq: "weekly",
            priority: 1.0,
          },
        ];
      }
    }

    const xml = generateSitemap(entries);
    return new NextResponse(xml, {
      status: 200,
      headers: { "Content-Type": "application/xml" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new NextResponse(message, { status: 500 });
  }
}
