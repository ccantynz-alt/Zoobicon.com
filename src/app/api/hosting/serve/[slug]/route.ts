import { NextRequest } from "next/server";
import { sql } from "@/lib/db";

/** Escape HTML entities to prevent XSS */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * GET /api/hosting/serve/[slug]
 * Serves the latest production deployment for a site.
 * This powers the *.zoobicon.sh URLs.
 *
 * Features:
 * - Fetches latest live deployment from database
 * - Injects OG meta tags for social sharing
 * - Ensures mobile-responsive viewport
 * - Adds performance hints (preconnect, dns-prefetch)
 * - Proper caching headers for fast repeat loads
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Validate slug format
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(slug)) {
      return new Response("Invalid site slug", { status: 400 });
    }

    // Single query: get latest deployment + site info in one go
    const [result] = await sql`
      SELECT d.code, d.created_at, s.name, s.plan
      FROM deployments d
      JOIN sites s ON s.id = d.site_id
      WHERE s.slug = ${slug}
        AND s.status = 'active'
        AND d.environment = 'production'
        AND d.status = 'live'
        AND d.code IS NOT NULL
      ORDER BY d.created_at DESC
      LIMIT 1
    `;

    if (!result || !result.code) {
      const notFoundHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Site Not Found - Zoobicon</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#0a0a0f;color:#e0e0e0;font-family:Inter,-apple-system,BlinkMacSystemFont,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh}
    .c{text-align:center;padding:2rem}
    .icon{width:64px;height:64px;margin:0 auto 1.5rem;border-radius:16px;background:linear-gradient(135deg,rgba(99,102,241,0.15),rgba(14,165,233,0.15));display:flex;align-items:center;justify-content:center}
    .icon svg{width:28px;height:28px;color:#6366f1}
    h1{font-size:1.75rem;font-weight:800;margin-bottom:0.75rem;background:linear-gradient(135deg,#fff,#94a3b8);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    p{color:rgba(255,255,255,0.45);line-height:1.6;max-width:360px;margin:0 auto}
    a{color:#6366f1;text-decoration:none;font-weight:600;transition:color 0.2s}
    a:hover{color:#818cf8}
    .btn{display:inline-flex;align-items:center;gap:0.5rem;margin-top:1.5rem;padding:0.75rem 1.5rem;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;border-radius:12px;font-size:0.875rem;font-weight:600;transition:transform 0.2s,box-shadow 0.2s}
    .btn:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(99,102,241,0.3)}
    .btn{-webkit-text-fill-color:#fff}
  </style>
</head>
<body>
  <div class="c">
    <div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg></div>
    <h1>Site Not Found</h1>
    <p>This site hasn't been deployed yet or may have been removed.</p>
    <a href="https://zoobicon.com/builder" class="btn">Build Your Own Site</a>
  </div>
</body>
</html>`;
      return new Response(notFoundHtml, {
        status: 404,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache",
        },
      });
    }

    const rawSiteName = (result.name || slug) as string;
    const siteName = escapeHtml(rawSiteName);
    const siteUrl = `https://${slug}.zoobicon.sh`;
    const ogImageUrl = `https://zoobicon.sh/api/og/${encodeURIComponent(slug)}`;

    let html = result.code as string;

    // ---- Ensure viewport meta tag exists (mobile responsive) ----
    if (!html.includes("name=\"viewport\"") && !html.includes("name='viewport'")) {
      const headIdx = html.indexOf("<head>");
      if (headIdx !== -1) {
        html = html.slice(0, headIdx + 6) +
          '\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
          html.slice(headIdx + 6);
      }
    }

    // ---- Inject OG + social meta tags ----
    const headCloseIdx = html.indexOf("</head>");
    if (headCloseIdx !== -1) {
      const metaTags: string[] = [];

      if (!html.includes('property="og:title"') && !html.includes("property='og:title'")) {
        metaTags.push(`<meta property="og:title" content="${siteName}" />`);
      }
      if (!html.includes('property="og:image"') && !html.includes("property='og:image'")) {
        metaTags.push(`<meta property="og:image" content="${ogImageUrl}" />`);
      }
      if (!html.includes('property="og:url"') && !html.includes("property='og:url'")) {
        metaTags.push(`<meta property="og:url" content="${siteUrl}" />`);
      }
      if (!html.includes('property="og:type"') && !html.includes("property='og:type'")) {
        metaTags.push(`<meta property="og:type" content="website" />`);
      }
      if (!html.includes('name="twitter:card"') && !html.includes("name='twitter:card'")) {
        metaTags.push(`<meta name="twitter:card" content="summary_large_image" />`);
      }
      // Canonical URL
      if (!html.includes('rel="canonical"') && !html.includes("rel='canonical'")) {
        metaTags.push(`<link rel="canonical" href="${siteUrl}" />`);
      }
      // Performance hints for common CDNs used in generated sites
      metaTags.push(`<link rel="dns-prefetch" href="https://cdn.tailwindcss.com" />`);
      metaTags.push(`<link rel="dns-prefetch" href="https://fonts.googleapis.com" />`);

      if (metaTags.length > 0) {
        html = html.slice(0, headCloseIdx) + "\n" + metaTags.join("\n") + "\n" + html.slice(headCloseIdx);
      }
    }

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=60, s-maxage=120, stale-while-revalidate=300",
        "X-Powered-By": "Zoobicon",
        "X-Frame-Options": "SAMEORIGIN",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
    });
  } catch (err) {
    console.error("Serve error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
