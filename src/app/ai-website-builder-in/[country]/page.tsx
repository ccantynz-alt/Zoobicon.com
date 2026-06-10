/**
 * /ai-website-builder-in/[country] — programmatic country pages.
 *
 * Phase 3 of the global SEO campaign. Where comparison pages target
 * "$competitor alternative" queries and niche pages target "AI builder
 * for $industry", these target the international SEO surface:
 * "AI website builder $country" plus regional payment/hosting/TLD
 * queries.
 *
 * Data lives in src/lib/seo/countries.ts.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Globe2 } from "lucide-react";
import { COUNTRIES, getCountry } from "@/lib/seo/countries";
import { getNiche } from "@/lib/seo/niches";

const SITE_URL = "https://zoobicon.com";

export function generateStaticParams() {
  return COUNTRIES.map((c) => ({ country: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string }>;
}): Promise<Metadata> {
  const { country: slug } = await params;
  const c = getCountry(slug);
  if (!c) return { title: "Not found" };

  const title = `AI Website Builder in ${c.name} (2026) — ${c.currency} pricing, ${c.ccTLD} domains | Zoobicon`;
  const description = c.metaPitch;
  const canonical = `${SITE_URL}/ai-website-builder-in/${c.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website", siteName: "Zoobicon" },
    twitter: { card: "summary_large_image", title, description },
    keywords: [
      `AI website builder ${c.name}`,
      `AI website builder ${c.slug.toUpperCase()}`,
      `${c.name} website builder`,
      `AI website builder ${c.currency}`,
      `${c.ccTLD} domain registration`,
      `website builder ${c.language}`,
    ],
  };
}

export default async function Page({ params }: { params: Promise<{ country: string }> }) {
  const { country: slug } = await params;
  const c = getCountry(slug);
  if (!c) notFound();

  const canonical = `${SITE_URL}/ai-website-builder-in/${c.slug}`;

  const softwareApplicationLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Zoobicon",
    applicationCategory: "WebApplication",
    operatingSystem: "Web",
    offers: { "@type": "AggregateOffer", priceCurrency: c.currency, offerCount: 3 },
    description: c.metaPitch,
    url: SITE_URL,
    areaServed: { "@type": "Country", name: c.name },
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Regions", item: `${SITE_URL}/ai-website-builder-in` },
      { "@type": "ListItem", position: 3, name: c.name, item: canonical },
    ],
  };

  const popularNiches = c.popularNiches.map((slug) => getNiche(slug)).filter(Boolean);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <main className="pt-[72px] pb-24" style={{ color: "var(--ink)" }}>
        <article className="max-w-5xl mx-auto px-6">
          {/* Breadcrumb */}
          <nav className="text-[12px] mb-6" style={{ color: "var(--ink-muted)" }} aria-label="Breadcrumb">
            <Link href="/" className="hover:underline">Home</Link>
            <span className="mx-1.5">/</span>
            <Link href="/ai-website-builder-in" className="hover:underline">Regions</Link>
            <span className="mx-1.5">/</span>
            <span style={{ color: "var(--ink-secondary)" }}>{c.name}</span>
          </nav>

          {/* Hero */}
          <header className="mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="text-2xl" aria-hidden>{c.flag}</span>
              <span className="text-[10px] uppercase tracking-[0.22em] font-semibold" style={{ color: "var(--gold-deep)" }}>
                {c.name}
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-semibold leading-[1.05] tracking-[-0.025em] mb-4">
              AI website builder{" "}
              <span className="display-italic font-normal" style={{ color: "var(--gold-deep)" }}>in {c.name}</span>
            </h1>
            <p className="text-[18px] leading-relaxed max-w-2xl mb-3" style={{ color: "var(--ink-secondary)" }}>
              {c.tagline}
            </p>
            <p className="text-[14px] leading-relaxed max-w-2xl mb-6" style={{ color: "var(--ink-muted)" }}>
              {c.pricingNote}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/builder"
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-semibold transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg, #ef5440 0%, #e8402b 100%)",
                  color: "#ffffff",
                  border: "1px solid #a47d2c",
                  boxShadow: "0 6px 18px -8px rgba(194,51,31,0.5), inset 0 1px 0 0 rgba(255,255,255,0.35)",
                }}
              >
                Start building
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-medium transition-all duration-300"
                style={{
                  border: "1px solid var(--rule-strong)",
                  background: "var(--paper)",
                  color: "var(--ink)",
                }}
              >
                See pricing
              </Link>
            </div>
          </header>

          {/* At-a-glance facts */}
          <section className="grid sm:grid-cols-4 gap-4 mb-12">
            {[
              { label: "Currency", value: `${c.currencySymbol} ${c.currency}` },
              { label: "Country TLD", value: c.ccTLD },
              { label: "Hosting region", value: c.hostingRegion },
              { label: "Primary language", value: c.language },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl p-4"
                style={{ background: "var(--paper-elevated)", border: "1px solid var(--rule)" }}
              >
                <div
                  className="text-[10px] uppercase tracking-[0.18em] font-semibold mb-1.5"
                  style={{ color: "var(--gold-deep)" }}
                >
                  {item.label}
                </div>
                <div className="text-[13px] leading-snug" style={{ color: "var(--ink)" }}>
                  {item.value}
                </div>
              </div>
            ))}
          </section>

          {/* Market context */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold tracking-[-0.02em] mb-5">
              Why Zoobicon for {c.name}
            </h2>
            <ul className="space-y-2.5">
              {c.marketContext.map((m) => (
                <li key={m} className="flex gap-3 text-[14px] leading-relaxed" style={{ color: "var(--ink-secondary)" }}>
                  <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--gold-deep)" }} />
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Payment methods */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold tracking-[-0.02em] mb-5">
              Payment methods that work in {c.name}
            </h2>
            <div className="flex flex-wrap gap-2">
              {c.paymentMethods.map((m) => (
                <span
                  key={m}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px]"
                  style={{
                    border: "1px solid var(--rule)",
                    background: "var(--paper-elevated)",
                    color: "var(--ink)",
                  }}
                >
                  {m}
                </span>
              ))}
            </div>
            <p className="text-[12px] mt-3" style={{ color: "var(--ink-muted)" }}>
              All routed through Stripe via Crontech&apos;s billing layer — no separate gateway accounts needed.
            </p>
          </section>

          {/* Popular niches for this region */}
          {popularNiches.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-semibold tracking-[-0.02em] mb-5">
                Popular use cases in {c.name}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {popularNiches.map((n) => n && (
                  <Link
                    key={n.slug}
                    href={`/ai-website-builder-for/${n.slug}`}
                    className="group rounded-xl p-4 transition-colors"
                    style={{
                      background: "var(--paper-elevated)",
                      border: "1px solid var(--rule)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-[14px] font-semibold tracking-[-0.01em]" style={{ color: "var(--ink)" }}>
                        {n.name}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-60 group-hover:translate-x-0 transition-all flex-shrink-0 mt-0.5" />
                    </div>
                    <p className="text-[12px] leading-snug" style={{ color: "var(--ink-secondary)" }}>
                      {n.tagline}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* FAQ (feeds JSON-LD above) */}
          <section className="mb-16">
            <h2 className="text-2xl font-semibold tracking-[-0.02em] mb-5">Common questions</h2>
            <div className="space-y-4">
              {c.faqs.map((f) => (
                <details
                  key={f.q}
                  className="rounded-xl p-5"
                  style={{ border: "1px solid var(--rule)", background: "var(--paper-elevated)" }}
                >
                  <summary className="cursor-pointer text-[15px] font-semibold tracking-[-0.01em]" style={{ color: "var(--ink)" }}>
                    {f.q}
                  </summary>
                  <p className="mt-3 text-[14px] leading-relaxed" style={{ color: "var(--ink-secondary)" }}>
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </section>

          {/* Final CTA */}
          <section
            className="rounded-2xl p-8 text-center mb-12"
            style={{
              background: "var(--paper-elevated)",
              border: "1px solid var(--gold)",
            }}
          >
            <h2 className="text-2xl font-semibold tracking-[-0.02em] mb-2">
              Ship in {c.name} in 60 seconds
            </h2>
            <p className="text-[14px] mb-5" style={{ color: "var(--ink-secondary)" }}>
              {c.flag} {c.currency} billing, {c.ccTLD} domains, hosting in {c.hostingRegion}.
            </p>
            <Link
              href="/builder"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #ef5440 0%, #e8402b 100%)",
                color: "#ffffff",
                border: "1px solid #a47d2c",
                boxShadow: "0 6px 18px -8px rgba(194,51,31,0.5), inset 0 1px 0 0 rgba(255,255,255,0.35)",
              }}
            >
              Open the builder
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>

          {/* Other regions — internal linking */}
          <section>
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.18em] mb-4" style={{ color: "var(--gold-deep)" }}>
              Other regions we serve
            </h3>
            <div className="flex flex-wrap gap-2">
              {COUNTRIES.filter((other) => other.slug !== c.slug).map((other) => (
                <Link
                  key={other.slug}
                  href={`/ai-website-builder-in/${other.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] transition-colors"
                  style={{
                    border: "1px solid var(--rule)",
                    background: "var(--paper)",
                    color: "var(--ink-secondary)",
                  }}
                >
                  <span aria-hidden>{other.flag}</span>
                  {other.name}
                </Link>
              ))}
            </div>
          </section>
        </article>
      </main>
    </>
  );
}
