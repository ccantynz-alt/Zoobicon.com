import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api',
          '/dashboard',
          '/edit',
          '/auth/callback',
          '/auth/reset-password',
          '/auth/forgot-password',
          '/auth/settings',
          '/email-support',
        ],
      },
    ],
    sitemap: 'https://zoobicon.com/sitemap.xml',
  }
}
