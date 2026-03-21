import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
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

    // Brand / domain-specific pages
    { path: '/ai', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/io', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/sh', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/dominat8', priority: 0.8, changeFrequency: 'weekly' },

    // Support and legal
    { path: '/support', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/privacy', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/terms', priority: 0.7, changeFrequency: 'monthly' },

    // Dashboard (public-facing entry)
    { path: '/dashboard', priority: 0.7, changeFrequency: 'weekly' },

    // Auth pages
    { path: '/auth/login', priority: 0.5, changeFrequency: 'weekly' },
    { path: '/auth/signup', priority: 0.5, changeFrequency: 'weekly' },
  ]

  return routes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))
}
