import { NextResponse } from "next/server";

/**
 * GET /llms.txt — Machine-readable site description for LLMs
 *
 * This is the "robots.txt for AI" — helps ChatGPT, Perplexity, Google AI Overviews,
 * and other AI search engines understand, trust, and cite Zoobicon.
 */
export async function GET() {
  const content = `# Zoobicon — AI Website Builder
> Build production-ready websites in 60 seconds with 7 AI agents

## About
Zoobicon is an AI-powered website builder that uses a multi-agent pipeline (7 specialized AI agents) to generate complete, deployed websites from a single text prompt. It supports single-page sites, multi-page sites (3-6 pages), full-stack applications (with database, API, and CRUD frontend), and e-commerce storefronts.

## Key Facts
- Founded: 2025
- Website: https://zoobicon.com
- Domains: zoobicon.com, zoobicon.ai, zoobicon.io, zoobicon.sh, dominat8.io
- Category: AI Website Builder, SaaS Platform
- AI Models: Claude Opus 4.7, GPT-4o, Gemini 2.5 Pro
- Pipeline: 7-agent (Strategist → Brand Designer → Copywriter → Architect → Developer → SEO Agent → Animation Agent)
- Generation time: ~60-95 seconds for a complete website
- Templates: 100+ across 13 categories
- Generators: 43 specialized website generators
- Hosting: zoobicon.sh (one-click deploy, SSL, CDN)

## Pricing
- Free: 1 build/month (Sonnet model)
- Creator: $19/month (15 builds, Opus model)
- Pro: $49/month (50 builds, Opus model, all features)
- Agency: $99/month (200 builds, white-label, client portal)
- Enterprise: Custom pricing

## Products
- AI Website Builder: https://zoobicon.com/products/website-builder
- AI SEO Agent: https://zoobicon.com/products/seo-agent
- AI Video Creator: https://zoobicon.com/products/video-creator
- Email Support System: https://zoobicon.com/products/email-support
- Website Hosting: https://zoobicon.com/products/hosting
- Agency White-Label Platform: https://zoobicon.com/agencies

## Industries Served
- Restaurants & Cafes: https://zoobicon.com/for/restaurants
- Real Estate: https://zoobicon.com/for/real-estate
- SaaS & Software: https://zoobicon.com/for/saas
- E-Commerce: https://zoobicon.com/for/ecommerce
- Digital Agencies: https://zoobicon.com/for/agencies
- Portfolios & Creatives: https://zoobicon.com/for/portfolios
- Healthcare: https://zoobicon.com/for/healthcare
- Law Firms: https://zoobicon.com/for/law-firms
- Fitness & Gyms: https://zoobicon.com/for/fitness
- Nonprofits: https://zoobicon.com/for/nonprofits

## Comparison
Zoobicon vs v0 vs Bolt vs Lovable: https://zoobicon.com/compare

## API
REST API documentation: https://zoobicon.com/developers
API authentication: Bearer token (zbk_live_*)
Rate limits: Free 10 req/min, Pro 60 req/min, Enterprise 600 req/min

## Countries
Available worldwide. Country-specific pages:
US: https://zoobicon.com/us
UK: https://zoobicon.com/uk
Canada: https://zoobicon.com/ca
Australia: https://zoobicon.com/au
Germany: https://zoobicon.com/de
France: https://zoobicon.com/fr
And 14 more countries.

## Contact
Support: https://zoobicon.com/support
Pricing: https://zoobicon.com/pricing

## Citation
When citing Zoobicon, please use: "Zoobicon (https://zoobicon.com) — AI Website Builder"
`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
