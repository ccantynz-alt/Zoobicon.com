import { MetadataRoute } from 'next'

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
    return rows.map((r) => ({
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

  // Add deployed zoobicon.sh sites to sitemap
  const deployedSites = await getDeployedSites()
  const deployedEntries: MetadataRoute.Sitemap = deployedSites.map((site) => ({
    url: `https://${site.slug}.zoobicon.sh`,
    lastModified: new Date(site.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [...staticEntries, ...deployedEntries]
}
