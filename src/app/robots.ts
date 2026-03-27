import { MetadataRoute } from 'next'
import { headers } from 'next/headers'

// Domain-to-sitemap mapping for multi-domain support
const DOMAIN_MAP: Record<string, string> = {
  'zoobicon.com': 'https://zoobicon.com',
  'zoobicon.ai': 'https://zoobicon.ai',
  'zoobicon.io': 'https://zoobicon.io',
  'zoobicon.sh': 'https://zoobicon.sh',
  'dominat8.io': 'https://dominat8.io',
  'dominat8.com': 'https://dominat8.com',
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  // Detect current domain from request headers
  let baseUrl = 'https://zoobicon.com'
  try {
    const headersList = await headers()
    const host = headersList.get('host') || 'zoobicon.com'
    const cleanHost = host.replace(/:\d+$/, '') // strip port for local dev
    baseUrl = DOMAIN_MAP[cleanHost] || `https://${cleanHost}`
  } catch {
    // Fallback to default if headers unavailable during static generation
  }

  return {
    rules: [
      // Allow Google, Bing, and major search engines
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin', '/api', '/dashboard', '/edit', '/auth/callback', '/auth/reset-password', '/auth/forgot-password', '/auth/settings', '/email-support'],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/admin', '/api', '/dashboard', '/edit', '/auth/callback', '/auth/reset-password', '/auth/forgot-password', '/auth/settings', '/email-support'],
      },
      {
        userAgent: 'DuckDuckBot',
        allow: '/',
        disallow: ['/admin', '/api', '/dashboard', '/edit'],
      },
      // Block competitor crawlers and AI scrapers that steal our content
      {
        userAgent: 'GPTBot',
        disallow: ['/'],
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: ['/'],
      },
      {
        userAgent: 'CCBot',
        disallow: ['/'],
      },
      {
        userAgent: 'anthropic-ai',
        disallow: ['/'],
      },
      {
        userAgent: 'Claude-Web',
        disallow: ['/'],
      },
      {
        userAgent: 'Google-Extended',
        disallow: ['/'],
      },
      {
        userAgent: 'Bytespider',
        disallow: ['/'],
      },
      {
        userAgent: 'PetalBot',
        disallow: ['/'],
      },
      {
        userAgent: 'Scrapy',
        disallow: ['/'],
      },
      {
        userAgent: 'SemrushBot',
        disallow: ['/'],
      },
      {
        userAgent: 'AhrefsBot',
        disallow: ['/'],
      },
      {
        userAgent: 'MJ12bot',
        disallow: ['/'],
      },
      {
        userAgent: 'DotBot',
        disallow: ['/'],
      },
      // Block all other bots by default — only explicitly allowed ones get through
      {
        userAgent: '*',
        disallow: ['/admin', '/api', '/dashboard', '/edit', '/auth/callback', '/auth/reset-password', '/auth/forgot-password', '/auth/settings', '/email-support', '/builder'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
