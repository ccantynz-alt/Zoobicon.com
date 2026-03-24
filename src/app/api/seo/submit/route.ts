import { NextRequest } from 'next/server';
import {
  submitToSearchEngines,
  submitDeployedSite,
  submitSitemap,
} from '@/lib/search-engine-submit';

/**
 * POST /api/seo/submit
 * Submit URLs to search engines (IndexNow + Google + Bing)
 *
 * Body options:
 * - { urls: string[] }           — Submit specific URLs
 * - { slug: string }             — Submit a deployed zoobicon.sh site
 * - { action: "sitemap" }        — Ping search engines with sitemap
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { urls, slug, action } = body as {
      urls?: string[];
      slug?: string;
      action?: string;
    };

    if (action === 'sitemap') {
      const result = await submitSitemap();
      return Response.json(result);
    }

    if (slug) {
      const result = await submitDeployedSite(slug);
      return Response.json(result);
    }

    if (urls && Array.isArray(urls) && urls.length > 0) {
      // Validate URLs
      const validUrls = urls.filter((u) => {
        try {
          new URL(u);
          return true;
        } catch {
          return false;
        }
      });

      if (validUrls.length === 0) {
        return Response.json({ error: 'No valid URLs provided' }, { status: 400 });
      }

      const result = await submitToSearchEngines(validUrls);
      return Response.json(result);
    }

    return Response.json(
      { error: 'Provide urls[], slug, or action: "sitemap"' },
      { status: 400 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return Response.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/seo/submit
 * Returns info about the submission system
 */
export async function GET() {
  return Response.json({
    description: 'Search Engine Auto-Submission API',
    endpoints: {
      'POST /api/seo/submit': {
        options: [
          '{ urls: ["https://..."] } — Submit specific URLs to all engines',
          '{ slug: "my-site" } — Submit a zoobicon.sh deployed site',
          '{ action: "sitemap" } — Ping engines with sitemap.xml',
        ],
      },
    },
    engines: [
      'IndexNow (Bing, Yandex, DuckDuckGo, Naver)',
      'Google Sitemap Ping',
      'Bing Sitemap Ping',
      'Google Indexing API (if GOOGLE_INDEXING_SERVICE_ACCOUNT configured)',
    ],
    autoSubmit: 'Every deployment to zoobicon.sh automatically submits to all engines',
  });
}
