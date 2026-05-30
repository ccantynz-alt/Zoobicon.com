import { MetadataRoute } from 'next'
import { COMPETITORS } from '@/lib/seo/competitors'
import { NICHES } from '@/lib/seo/niches'
import { COUNTRIES } from '@/lib/seo/countries'

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

    // The one product + its highest-intent onboarding funnel
    { path: '/builder', priority: 0.9, changeFrequency: 'daily' },
    { path: '/upgrade', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/audit', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/marketplace', priority: 0.85, changeFrequency: 'weekly' },
    { path: '/brand-kit', priority: 0.85, changeFrequency: 'weekly' },
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

    // Country-targeted landing pages were previously root URLs (/us,
    // /uk, etc.) but those page files never existed — the sitemap
    // pointed at 404s. Phase 3 (Rule 33 era) moves them under
    // /ai-website-builder-in/[country], rendered from a real dynamic
    // route. Enumerated below in countryRoutes.
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

  // Programmatic niche pages — /ai-website-builder-for/[niche] for
  // every entry in the niche catalog. Plus the parent index. These
  // target the long-tail "AI website builder for {industry}" query
  // family — much higher search volume than the comparison set, even
  // if per-query intent is slightly lower.
  const nicheRoutes = [
    { path: '/ai-website-builder-for', priority: 0.8, changeFrequency: 'weekly' as const },
    ...NICHES.map((n) => ({
      path: `/ai-website-builder-for/${n.slug}`,
      priority: 0.75,
      changeFrequency: 'weekly' as const,
    })),
  ]

  // Programmatic country pages — /ai-website-builder-in/[country] for
  // every entry in the country catalog. Plus the parent regions index.
  // Targets the international SEO surface (regional currency, payment
  // methods, TLD, hosting region).
  const countryRoutes = [
    { path: '/ai-website-builder-in', priority: 0.8, changeFrequency: 'monthly' as const },
    ...COUNTRIES.map((c) => ({
      path: `/ai-website-builder-in/${c.slug}`,
      priority: 0.75,
      changeFrequency: 'monthly' as const,
    })),
  ]

  return [...routes, ...comparisonRoutes, ...nicheRoutes, ...countryRoutes].map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))
}
