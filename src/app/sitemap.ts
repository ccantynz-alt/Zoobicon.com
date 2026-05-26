import { MetadataRoute } from 'next'

// Rule 31 — post-Crontech pivot. Sitemap reflects what Zoobicon still
// owns: AI Builder, Domain Search, Free Tools, and the
// supporting marketing/SEO surfaces. All sunset routes (hosting, email,
// CRM, analytics, booking, eSIM, etc.) and their /api/v1/* docs pages
// removed in the May 2026 cleanup batch.

// Domain TLD landing pages — high-value SEO funnel for "buy .ai domain" etc.
const DOMAIN_TLDS = ['ai', 'io', 'com', 'dev', 'app', 'co', 'net', 'org', 'store', 'online', 'tech', 'site']

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://zoobicon.com'

  const routes: {
    path: string
    priority: number
    changeFrequency: 'daily' | 'weekly' | 'monthly'
  }[] = [
    // Homepage
    { path: '/', priority: 1.0, changeFrequency: 'daily' },

    // Core products
    { path: '/builder', priority: 0.9, changeFrequency: 'daily' },
    { path: '/domains', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/pricing', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/generators', priority: 0.9, changeFrequency: 'weekly' },

    // Product detail pages
    { path: '/products/website-builder', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/products/seo-agent', priority: 0.8, changeFrequency: 'weekly' },

    // SEO marketing — gallery + challenges removed 2026-05-26 (no real
    // customer sites yet; honest "we're new" stance per Founder's note).
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
    { path: '/dominat8', priority: 0.8, changeFrequency: 'weekly' },

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

  const staticEntries: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))

  // Domain TLD pages
  const tldEntries: MetadataRoute.Sitemap = DOMAIN_TLDS.map((tld) => ({
    url: `${baseUrl}/domains/${tld}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticEntries, ...tldEntries]
}
