import { MetadataRoute } from 'next'

// All eSIM country slugs — kept in sync with /esim/[country]/page.tsx COUNTRIES constant
const ESIM_COUNTRY_SLUGS = [
  'new-zealand','australia','fiji','samoa','tonga','vanuatu','cook-islands',
  'papua-new-guinea','new-caledonia','french-polynesia',
  'thailand','indonesia','vietnam','philippines','malaysia','singapore',
  'cambodia','myanmar','laos',
  'japan','south-korea','taiwan','hong-kong','china',
  'india','sri-lanka','nepal',
  'uae','turkey','qatar','saudi-arabia','israel',
  'france','germany','spain','italy','portugal','netherlands','greece',
  'croatia','iceland','switzerland',
  'united-states','canada','mexico','brazil','colombia','argentina','peru',
  'chile','costa-rica',
  'south-africa','kenya','morocco','egypt','tanzania',
  'united-kingdom',
]

// Domain TLD pages
const DOMAIN_TLDS = ['ai', 'io', 'com', 'sh', 'dev', 'app', 'co', 'net', 'org', 'store', 'online', 'tech', 'site']

// Try to fetch deployed sites for dynamic sitemap entries
async function getDeployedSites(): Promise<{ slug: string; updatedAt: string }[]> {
  try {
    const { sql } = await import('@/lib/db')
    const rows = await sql`
      SELECT DISTINCT s.slug, COALESCE(s.updated_at, s.created_at, NOW()) as updated_at
      FROM sites s
      JOIN deployments d ON d.site_id = s.id
      WHERE s.status != 'deleted' AND d.status = 'live' AND d.environment = 'production'
      ORDER BY s.updated_at DESC NULLS LAST
      LIMIT 1000
    `
    return rows.map((r: any) => ({
      slug: r.slug as string,
      updatedAt: (r.updated_at as Date)?.toISOString?.() || new Date().toISOString(),
    }))
  } catch {
    // DB not available — return empty (static routes still work)
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://zoobicon.com'

  const routes: {
    path: string
    priority: number
    changeFrequency: 'daily' | 'weekly' | 'monthly'
  }[] = [
    // Homepage
    { path: '/', priority: 1.0, changeFrequency: 'daily' },

    // Core product pages — high priority
    { path: '/builder', priority: 0.9, changeFrequency: 'daily' },
    { path: '/pricing', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/generators', priority: 0.9, changeFrequency: 'weekly' },

    // Product pages
    { path: '/products/website-builder', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/products/seo-agent', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/products/video-creator', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/products/email-support', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/products/hosting', priority: 0.8, changeFrequency: 'weekly' },

    // Feature / marketing pages
    { path: '/domains', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/domain-search', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/domain-finder', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/marketplace', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/hosting', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/agencies', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/wordpress', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/developers', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/cli', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/showcase', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/video-creator', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/seo', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/analytics', priority: 0.8, changeFrequency: 'weekly' },

    // Honest 2026 competitor comparisons — high-intent SEO targets that
    // rank for "X alternative" queries.
    { path: '/vs', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/vs/lovable', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/vs/bolt', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/vs/v0', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/vs/heygen', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/gallery', priority: 0.8, changeFrequency: 'daily' },
    { path: '/starter-kits', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/referral', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/blog-engine', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/booking', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/invoicing', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/email-marketing', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/store', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/content-calendar', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/content-writer', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/publisher', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/dictation', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/brand-kit', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/creator-marketplace', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/challenges', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/crawl', priority: 0.7, changeFrequency: 'weekly' },

    // Domain SEO pages — high-value funnel pages
    { path: '/domain-finder', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/domains/ai', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/domains/io', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/domains/com', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/domains/sh', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/domains/dev', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/domains/app', priority: 0.8, changeFrequency: 'weekly' },

    // Products
    { path: '/products/esim', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/products/vpn', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/products/cloud-storage', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/products/dictation', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/products/booking', priority: 0.8, changeFrequency: 'weekly' },

    // Free tools — SEO magnets
    { path: '/tools/business-name-generator', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/tools/password-generator', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/tools/qr-code-generator', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/tools/meta-tag-generator', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/tools/color-palette-generator', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/tools/invoice-generator', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/tools/json-formatter', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/tools/privacy-policy-generator', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/tools/robots-txt-generator', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/tools/word-counter', priority: 0.8, changeFrequency: 'monthly' },

    // Brand / domain-specific pages
    { path: '/ai', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/io', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/sh', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/dominat8', priority: 0.8, changeFrequency: 'weekly' },

    // Agency sub-pages
    { path: '/agencies/dashboard', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/agencies/portal', priority: 0.7, changeFrequency: 'weekly' },

    // Hosting sub-pages
    { path: '/hosting/dashboard', priority: 0.7, changeFrequency: 'weekly' },

    // Support and legal
    { path: '/support', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/privacy', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/terms', priority: 0.7, changeFrequency: 'monthly' },

    // Dashboard (public-facing entry)
    { path: '/dashboard', priority: 0.7, changeFrequency: 'weekly' },

    // Auth pages
    { path: '/auth/login', priority: 0.5, changeFrequency: 'weekly' },
    { path: '/auth/signup', priority: 0.5, changeFrequency: 'weekly' },

    // Country-specific pages (geo-targeted landing pages)
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

  const staticEntries: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))

  // eSIM country pages — 56 countries, high-value SEO targets
  const esimEntries: MetadataRoute.Sitemap = ESIM_COUNTRY_SLUGS.map((slug) => ({
    url: `${baseUrl}/esim/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Domain TLD pages — capture "buy .ai domain" search intent
  const tldEntries: MetadataRoute.Sitemap = DOMAIN_TLDS.map((tld) => ({
    url: `${baseUrl}/domains/${tld}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Add deployed zoobicon.sh sites to sitemap
  const deployedSites = await getDeployedSites()
  const deployedEntries: MetadataRoute.Sitemap = deployedSites.map((site) => ({
    url: `https://${site.slug}.zoobicon.sh`,
    lastModified: new Date(site.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [...staticEntries, ...esimEntries, ...tldEntries, ...deployedEntries]
}
