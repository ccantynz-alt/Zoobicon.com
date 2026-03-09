import { NextRequest } from "next/server";
import { sql } from "@/lib/db";

/**
 * GET /api/hosting/serve/[slug]
 * Serves the latest production deployment for a site.
 * This powers the *.zoobicon.sh URLs.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Get the latest production deployment for this site
    const [deployment] = await sql`
      SELECT d.code, d.created_at
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

    if (!deployment || !deployment.code) {
      return new Response(
        `<!DOCTYPE html><html><head><title>Site Not Found</title>
        <style>body{background:#0a0a0f;color:#e0e0e0;font-family:Inter,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
        .c{text-align:center}.h{font-size:2rem;font-weight:800;margin-bottom:1rem}.p{color:rgba(255,255,255,0.4)}</style></head>
        <body><div class="c"><div class="h">Site Not Found</div><p class="p">This site hasn't been deployed yet.<br>Build one at <a href="https://zoobicon.com/builder" style="color:#7c3aed">zoobicon.com/builder</a></p></div></body></html>`,
        {
          status: 404,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      );
    }

    return new Response(deployment.code, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        "X-Powered-By": "Zoobicon",
      },
    });
  } catch (err) {
    console.error("Serve error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
