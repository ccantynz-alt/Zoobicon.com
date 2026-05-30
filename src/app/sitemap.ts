import { MetadataRoute } from 'next'
import { COMPETITORS } from '@/lib/seo/competitors'

// Rule 32 — scope lock: AI Website Builder only. Sitemap reflects the
// single product + supporting marketing surfaces. /domains standalone,
// /tools/*, /products/* removed. Domain registration lives inside the
// builder checkout flow, not as a standalone page.
//
// Programmatic SEO surfaces enumerated here so every page lands in
// the sitemap.xml and gets submitted to Bing/Yandex via IndexNow
// (see /api/seo/submit-sitemap + src/lib/seo/indexnow.ts).

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://zoobicon.com'

  const routes: {
    path: string
    priority: number
    changeFrequency: 'daily' | 'weekly' | 'monthly'
  }[] = [
    // Homepage
    { path: '/', priority: 1.0, changeFrequency: 'daily' },

    // The one product
    { path: '/builder', priority: 0.9, changeFrequency: 'daily' },
    { path: '/pricing', priority: 0.9, changeFrequency: 'weekly' },

    // SEO marketing surfaces
    { path: '/seo', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/showcase', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/agencies', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/wordpress', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/cli', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/compare', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/changelog', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/crawl', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/agents', priority: 0.7, changeFrequency: 'weekly' },

    // Brand / domain-specific landings
    { path: '/ai', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/io', priority: 0.8, changeFrequency: 'weekly' },

    // Support and legal
    { path: '/support', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/privacy', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/terms', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/disclaimers', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/dmca', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/refund-policy', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/acceptable-use', priority: 0.6, changeFrequency: 'monthly' },

    // Country-targeted landing pages
    { path: '/us', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/uk', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/ca', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/au', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/de', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/fr', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/es', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/it', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/nl', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/se', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/br', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/mx', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/in', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/jp', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/kr', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/sg', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/ae', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/za', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/nz', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/ie', priority: 0.8, changeFrequency: 'monthly' },
  ]

  // Programmatic comparison pages — /compare/[competitor] for each
  // entry in the SEO competitor catalog. Same priority as /compare
  // index so search engines treat them as primary comparison surfaces,
  // not orphan tail pages.
  const comparisonRoutes = COMPETITORS.map((c) => ({
    path: `/compare/${c.slug}`,
    priority: 0.8,
    changeFrequency: 'weekly' as const,
  }))

  return [...routes, ...comparisonRoutes].map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))
}
