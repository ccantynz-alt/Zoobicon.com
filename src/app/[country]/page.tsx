import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { VALID_COUNTRY_CODES, COUNTRY_DATA, getCountryData } from '@/lib/country-seo';

// Static routes that exist in the app — the [country] catch must NOT handle these.
// Next.js prioritizes static folders over dynamic, but we double-check here for safety.
const RESERVED_ROUTES = new Set([
  'admin', 'agencies', 'ai', 'analytics', 'api', 'auth', 'blog-engine', 'booking',
  'brand-kit', 'builder', 'challenges', 'cli', 'compare', 'content-calendar',
  'content-writer', 'crawl', 'creator-marketplace', 'dashboard', 'developers',
  'dictation', 'domains', 'dominat8', 'edit', 'email-marketing', 'email-support',
  'for', 'gallery', 'generators', 'hosting', 'invoicing', 'io', 'marketplace',
  'pricing', 'privacy', 'products', 'profile', 'publisher', 'referral', 'seo',
  'sh', 'shared', 'showcase', 'starter-kits', 'store', 'support', 'terms',
  'video-creator', 'wordpress',
]);

function isValidCountry(code: string): boolean {
  return VALID_COUNTRY_CODES.has(code) && !RESERVED_ROUTES.has(code);
}

export function generateStaticParams() {
  return Array.from(VALID_COUNTRY_CODES)
    .filter((code) => !RESERVED_ROUTES.has(code))
    .map((code) => ({ country: code }));
}

export async function generateMetadata({
  params,
}: {
  params: { country: string } | Promise<{ country: string }>;
}): Promise<Metadata> {
  const resolved = params instanceof Promise ? await params : params;
  const { country } = resolved;
  const data = getCountryData(country);
  if (!data || !isValidCountry(country)) {
    return { title: 'Not Found' };
  }

  return {
    title: `${data.headline} | Zoobicon`,
    description: data.metaDescription,
    keywords: data.localKeywords,
    alternates: {
      canonical: `https://zoobicon.com/${data.code}`,
    },
    openGraph: {
      title: data.headline,
      description: data.metaDescription,
      url: `https://zoobicon.com/${data.code}`,
      siteName: 'Zoobicon',
      locale: data.languageCode.replace('-', '_'),
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: data.headline,
      description: data.metaDescription,
    },
  };
}

function PricingCard({
  name,
  price,
  symbol,
  currency,
  period,
  features,
  featured,
}: {
  name: string;
  price: number;
  symbol: string;
  currency: string;
  period: string;
  features: string[];
  featured?: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl p-8 ${
        featured
          ? 'bg-gradient-to-b from-stone-600/20 to-stone-900/10 border-2 border-stone-500/50 scale-105'
          : 'bg-white/5 border border-white/10'
      }`}
    >
      {featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-stone-600 text-white text-xs font-bold px-4 py-1 rounded-full">
          Most Popular
        </div>
      )}
      <h3 className="text-xl font-bold text-white mb-2">{name}</h3>
      <div className="mb-6">
        <span className="text-4xl font-extrabold text-white">
          {symbol}
          {price.toLocaleString()}
        </span>
        <span className="text-white/50 ml-2">/{period}</span>
        <p className="text-white/40 text-sm mt-1">{currency}</p>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-white/70 text-sm">
            <svg
              className="w-5 h-5 text-stone-400 shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {f}
          </li>
        ))}
      </ul>
      <Link
        href="/auth/signup"
        className={`block w-full text-center py-3 rounded-xl font-semibold transition-all ${
          featured
            ? 'bg-stone-600 hover:bg-stone-500 text-white'
            : 'bg-white/10 hover:bg-white/20 text-white'
        }`}
      >
        Start Free Trial
      </Link>
    </div>
  );
}

export default async function CountryPage({
  params,
}: {
  params: { country: string } | Promise<{ country: string }>;
}) {
  const resolved = params instanceof Promise ? await params : params;
  const { country } = resolved;

  if (!isValidCountry(country)) {
    notFound();
  }

  const data = getCountryData(country);
  if (!data) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'Zoobicon',
        url: 'https://zoobicon.com',
        logo: 'https://zoobicon.com/icon.png',
        sameAs: [
          'https://twitter.com/zoobicon',
          'https://github.com/zoobicon',
        ],
      },
      {
        '@type': 'SoftwareApplication',
        name: 'Zoobicon AI Website Builder',
        applicationCategory: 'WebApplication',
        operatingSystem: 'Web',
        url: `https://zoobicon.com/${data.code}`,
        description: data.metaDescription,
        offers: [
          {
            '@type': 'Offer',
            name: 'Creator',
            price: data.pricing.creator,
            priceCurrency: data.currency,
            priceValidUntil: '2027-12-31',
            availability: 'https://schema.org/InStock',
          },
          {
            '@type': 'Offer',
            name: 'Pro',
            price: data.pricing.pro,
            priceCurrency: data.currency,
            priceValidUntil: '2027-12-31',
            availability: 'https://schema.org/InStock',
          },
          {
            '@type': 'Offer',
            name: 'Agency',
            price: data.pricing.agency,
            priceCurrency: data.currency,
            priceValidUntil: '2027-12-31',
            availability: 'https://schema.org/InStock',
          },
        ],
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          reviewCount: '2450',
          bestRating: '5',
          worstRating: '1',
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-[#0a0a0f] text-white">
        {/* Navigation */}
        <nav className="border-b border-white/10 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-stone-400 to-stone-400 bg-clip-text text-transparent">
              Zoobicon
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/pricing" className="text-white/60 hover:text-white text-sm transition-colors">
                Pricing
              </Link>
              <Link href="/generators" className="text-white/60 hover:text-white text-sm transition-colors">
                Generators
              </Link>
              <Link
                href="/builder"
                className="bg-stone-600 hover:bg-stone-500 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                Start Building
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-stone-600/10 via-transparent to-transparent" />
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-stone-600/10 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-72 h-72 bg-stone-600/10 rounded-full blur-3xl" />

          <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-20">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-stone-500/10 border border-stone-500/20 rounded-full px-4 py-1.5 mb-8">
                <span className="text-2xl">{getFlagEmoji(data.code)}</span>
                <span className="text-stone-300 text-sm font-medium">
                  Available in {data.name}
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
                <span className="bg-gradient-to-r from-white via-stone-200 to-stone-400 bg-clip-text text-transparent">
                  {data.headline}
                </span>
              </h1>

              <p className="text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
                {data.subheadline}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/builder"
                  className="group bg-stone-600 hover:bg-stone-500 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all shadow-lg shadow-stone-600/25 hover:shadow-stone-500/40"
                >
                  Build Your Website Free
                  <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">
                    &rarr;
                  </span>
                </Link>
                <Link
                  href="/generators"
                  className="bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-xl text-lg font-semibold border border-white/10 transition-all"
                >
                  Explore 43 Generators
                </Link>
              </div>

              {/* Trust stats */}
              <div className="grid grid-cols-3 gap-8 max-w-xl mx-auto mt-16">
                <div>
                  <div className="text-3xl font-extrabold text-white">90s</div>
                  <div className="text-white/40 text-sm mt-1">Build Time</div>
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-white">43</div>
                  <div className="text-white/40 text-sm mt-1">Generators</div>
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-white">$0</div>
                  <div className="text-white/40 text-sm mt-1">To Start</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              Why {data.name} Businesses Choose Zoobicon
            </h2>
            <p className="text-white/50 text-center max-w-2xl mx-auto mb-16">
              Professional websites, built by AI, deployed in seconds. No developers, no agencies, no waiting.
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: '⚡',
                  title: '90-Second Builds',
                  desc: 'Describe your business and watch a complete, professional website materialize. Seven AI agents work in parallel to deliver agency-quality results.',
                },
                {
                  icon: '🎨',
                  title: '43 Specialized Generators',
                  desc: 'Restaurant, law firm, SaaS, portfolio, e-commerce — each generator understands your industry and produces tailored designs and copy.',
                },
                {
                  icon: '🚀',
                  title: 'One-Click Deploy',
                  desc: 'Your site goes live on a custom .sh domain instantly. Custom domain support, SSL, and CDN included. No FTP, no config files.',
                },
                {
                  icon: '🛒',
                  title: 'Full E-Commerce',
                  desc: 'Shopping cart, checkout, product search, reviews, discount codes — complete storefronts generated with a single prompt.',
                },
                {
                  icon: '🔧',
                  title: 'Full-Stack Apps',
                  desc: 'Database schemas, API endpoints, and CRUD frontends. Build real applications, not just landing pages.',
                },
                {
                  icon: '📱',
                  title: 'Mobile-First Design',
                  desc: 'Every site is responsive from day one. Desktop, tablet, and mobile layouts are generated automatically.',
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 hover:bg-white/[0.06] transition-colors"
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-white/50 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonial */}
        <section className="py-24 bg-gradient-to-b from-stone-900/10 to-transparent border-t border-white/5">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-12">
              Trusted in {data.name}
            </h2>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-10">
              <blockquote className="text-xl md:text-2xl text-white/80 leading-relaxed mb-8 italic">
                &ldquo;{data.testimonial.quote}&rdquo;
              </blockquote>
              <div>
                <div className="text-white font-bold text-lg">
                  {data.testimonial.name}
                </div>
                <div className="text-stone-400">
                  {data.testimonial.company}
                </div>
                <div className="text-white/40 text-sm mt-1">
                  {data.testimonial.city}, {data.name}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-24 border-t border-white/5">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              {data.name} Pricing
            </h2>
            <p className="text-white/50 text-center max-w-xl mx-auto mb-16">
              All prices in {data.currency}. Start free, upgrade when you need more.
            </p>

            <div className="grid md:grid-cols-3 gap-6 items-start">
              <PricingCard
                name="Creator"
                price={data.pricing.creator}
                symbol={data.currencySymbol}
                currency={data.currency}
                period="mo"
                features={[
                  '15 AI website builds per month',
                  'Custom domain support',
                  'All 43 generators',
                  'Visual editing tools',
                  'SEO optimization',
                  'Email support',
                ]}
              />
              <PricingCard
                name="Pro"
                price={data.pricing.pro}
                symbol={data.currencySymbol}
                currency={data.currency}
                period="mo"
                featured
                features={[
                  '50 AI website builds per month',
                  'Multi-page site generation',
                  'Full-stack app generation',
                  'E-commerce generation',
                  'Remove Zoobicon branding',
                  'Priority support',
                  'API access',
                ]}
              />
              <PricingCard
                name="Agency"
                price={data.pricing.agency}
                symbol={data.currencySymbol}
                currency={data.currency}
                period="mo"
                features={[
                  'Unlimited AI builds',
                  'White-label branding',
                  'Client portal',
                  'Bulk generation',
                  'Team collaboration',
                  'Dedicated support',
                  'Custom integrations',
                ]}
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 border-t border-white/5">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
              Ready to Build in{' '}
              <span className="bg-gradient-to-r from-stone-400 to-stone-400 bg-clip-text text-transparent">
                {data.name}
              </span>
              ?
            </h2>
            <p className="text-xl text-white/50 mb-10 max-w-2xl mx-auto">
              Join thousands of {data.name} businesses building professional websites with AI. Free to start, no credit card required.
            </p>
            <Link
              href="/builder"
              className="inline-flex items-center gap-2 bg-stone-600 hover:bg-stone-500 text-white px-10 py-5 rounded-xl text-xl font-bold transition-all shadow-lg shadow-stone-600/25 hover:shadow-stone-500/40"
            >
              Start Building Free &rarr;
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 py-12">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-white/40 text-sm">
              &copy; {new Date().getFullYear()} Zoobicon. All rights reserved.
            </div>
            <div className="flex items-center gap-6 text-sm text-white/40">
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="/support" className="hover:text-white transition-colors">
                Support
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

function getFlagEmoji(countryCode: string): string {
  const flags: Record<string, string> = {
    us: '\u{1F1FA}\u{1F1F8}',
    uk: '\u{1F1EC}\u{1F1E7}',
    ca: '\u{1F1E8}\u{1F1E6}',
    au: '\u{1F1E6}\u{1F1FA}',
    de: '\u{1F1E9}\u{1F1EA}',
    fr: '\u{1F1EB}\u{1F1F7}',
    es: '\u{1F1EA}\u{1F1F8}',
    it: '\u{1F1EE}\u{1F1F9}',
    nl: '\u{1F1F3}\u{1F1F1}',
    se: '\u{1F1F8}\u{1F1EA}',
    br: '\u{1F1E7}\u{1F1F7}',
    mx: '\u{1F1F2}\u{1F1FD}',
    in: '\u{1F1EE}\u{1F1F3}',
    jp: '\u{1F1EF}\u{1F1F5}',
    kr: '\u{1F1F0}\u{1F1F7}',
    sg: '\u{1F1F8}\u{1F1EC}',
    ae: '\u{1F1E6}\u{1F1EA}',
    za: '\u{1F1FF}\u{1F1E6}',
    nz: '\u{1F1F3}\u{1F1FF}',
    ie: '\u{1F1EE}\u{1F1EA}',
  };
  return flags[countryCode] || '';
}
