import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/export/wordpress/deploy
 *
 * Proxies a deployment from the Zoobicon builder to a customer's WordPress site
 * running the Zoobicon Connect plugin.
 *
 * Body:
 *   wp_url:      string  — The customer's WordPress site URL (e.g. "https://example.com")
 *   connect_key: string  — The Zoobicon Connect plugin key (zbc_...)
 *   html:        string  — The generated HTML to deploy
 *   title:       string  — Page title
 *   slug?:       string  — URL slug
 *   status?:     string  — "publish" | "draft" | "pending" | "private" (default: "draft")
 *   page_id?:    number  — If updating an existing page
 *   mode?:       string  — "page" | "post" (default: "page")
 *   seo?:        object  — { meta_title, meta_description, og_image }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { wp_url, connect_key, html, title, slug, status, page_id, mode, seo } = body;

    // Validate required fields
    if (!wp_url || typeof wp_url !== "string") {
      return NextResponse.json({ error: "WordPress site URL is required" }, { status: 400 });
    }
    if (!connect_key || typeof connect_key !== "string") {
      return NextResponse.json({ error: "Connect Key is required" }, { status: 400 });
    }
    if (!html || typeof html !== "string") {
      return NextResponse.json({ error: "HTML content is required" }, { status: 400 });
    }
    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Page title is required" }, { status: 400 });
    }

    // Sanitize and build the WordPress REST API URL
    const cleanUrl = wp_url.replace(/\/+$/, "");
    const deployUrl = `${cleanUrl}/wp-json/zoobicon/v1/deploy`;

    // Forward the deployment to the customer's WordPress site
    const wpResponse = await fetch(deployUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Zoobicon-Key": connect_key,
        "User-Agent": "Zoobicon-Deploy/1.0",
      },
      body: JSON.stringify({
        html,
        title,
        slug: slug || "",
        status: status || "draft",
        page_id: page_id || 0,
        mode: mode || "page",
        seo: seo || {},
      }),
      signal: AbortSignal.timeout(30_000),
    });

    // Handle WordPress response
    if (!wpResponse.ok) {
      const errorText = await wpResponse.text().catch(() => "Unknown error");

      // Common error patterns
      if (wpResponse.status === 404) {
        return NextResponse.json({
          error: "Zoobicon Connect plugin not found",
          details: "Make sure the Zoobicon Connect plugin is installed and activated on your WordPress site.",
          wp_status: 404,
        }, { status: 502 });
      }

      if (wpResponse.status === 401 || wpResponse.status === 403) {
        return NextResponse.json({
          error: "Authentication failed",
          details: "The Connect Key doesn't match. Check the key in your WordPress admin under Zoobicon → Settings.",
          wp_status: wpResponse.status,
        }, { status: 401 });
      }

      // Try to parse JSON error from WP
      let wpError;
      try {
        wpError = JSON.parse(errorText);
      } catch {
        wpError = { message: errorText };
      }

      return NextResponse.json({
        error: "WordPress deployment failed",
        details: wpError.message || errorText,
        wp_status: wpResponse.status,
      }, { status: 502 });
    }

    const result = await wpResponse.json();

    return NextResponse.json({
      success: true,
      page_id: result.page_id,
      title: result.title,
      slug: result.slug,
      status: result.status,
      url: result.url,
      edit_url: result.edit_url,
      version: result.version,
      deployed_at: result.deployed_at,
      wordpress_site: cleanUrl,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return NextResponse.json({
        error: "Connection timed out",
        details: "Could not reach your WordPress site within 30 seconds. Check the URL and make sure the site is online.",
      }, { status: 504 });
    }

    if (err instanceof TypeError && (err.message.includes("fetch") || err.message.includes("network"))) {
      return NextResponse.json({
        error: "Cannot reach WordPress site",
        details: "Make sure the URL is correct and the site is accessible from the internet.",
      }, { status: 502 });
    }

    console.error("WP deploy proxy error:", err);
    return NextResponse.json({
      error: "Deployment failed",
      details: err instanceof Error ? err.message : "Unknown error",
    }, { status: 500 });
  }
}

/**
 * POST /api/export/wordpress/deploy — also handle status check
 * GET variant: test connection to a WordPress site's Zoobicon Connect plugin
 */
export async function GET(req: NextRequest) {
  const wp_url = req.nextUrl.searchParams.get("wp_url");
  const connect_key = req.nextUrl.searchParams.get("connect_key");

  if (!wp_url || !connect_key) {
    return NextResponse.json({ error: "wp_url and connect_key are required" }, { status: 400 });
  }

  try {
    const cleanUrl = wp_url.replace(/\/+$/, "");
    const statusUrl = `${cleanUrl}/wp-json/zoobicon/v1/status`;

    const wpResponse = await fetch(statusUrl, {
      headers: {
        "X-Zoobicon-Key": connect_key,
        "User-Agent": "Zoobicon-Deploy/1.0",
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!wpResponse.ok) {
      if (wpResponse.status === 404) {
        return NextResponse.json({
          connected: false,
          error: "Zoobicon Connect plugin not found. Install and activate it on your WordPress site.",
        });
      }
      if (wpResponse.status === 401 || wpResponse.status === 403) {
        return NextResponse.json({
          connected: false,
          error: "Connect Key is invalid. Check the key in WordPress admin under Zoobicon → Settings.",
        });
      }
      return NextResponse.json({
        connected: false,
        error: `WordPress returned status ${wpResponse.status}`,
      });
    }

    const status = await wpResponse.json();

    return NextResponse.json({
      connected: true,
      site_name: status.site_name,
      site_url: status.site_url,
      wordpress_version: status.wordpress,
      theme: status.theme,
      plugin_version: status.version,
      deploy_count: status.deploys,
    });
  } catch (err) {
    return NextResponse.json({
      connected: false,
      error: err instanceof Error ? err.message : "Cannot reach WordPress site",
    });
  }
}
