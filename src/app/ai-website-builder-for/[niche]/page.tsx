/**
 * /ai-website-builder-for/[niche] — programmatic niche pages.
 *
 * Phase 2 of the global SEO campaign. Companion route to
 * /compare/[competitor]. Where the comparison pages target high-intent
 * "{Competitor} alternative" queries, these pages target the much
 * larger long-tail of "AI website builder for {job}" queries.
 *
 * Each niche has a prefilled prompt that drops into the builder on
 * click — so the page is both an SEO landing and a working CTA.
 *
 * Data lives in src/lib/seo/niches.ts. Add a niche there and a new
 * page generates on the next build.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Sparkles, Layers } from "lucide-react";
import { NICHES, getNiche } from "@/lib/seo/niches";
import { getCompetitor } from "@/lib/seo/competitors";

const SITE_URL = "https://zoobicon.com";

export function generateStaticParams() {
  return NICHES.map((n) => ({ niche: n.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ niche: string }>;
}): Promise<Metadata> {
  const { niche: slug } = await params;
  const n = getNiche(slug);
  if (!n) return { title: "Not found" };

  const title = `AI Website Builder for ${n.name} (2026) — Ship in 60 Seconds | Zoobicon`;
  const description = n.metaPitch;
  const canonical = `${SITE_URL}/ai-website-builder-for/${n.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      siteName: "Zoobicon",
    },
    twitter: { card: "summary_large_image", title, description },
    keywords: [
      `AI website builder for ${n.name.toLowerCase()}`,
      `${n.name} website builder`,
      `best AI builder for ${n.name.toLowerCase()}`,
      `${n.name.toLowerCase()} website template`,
      `AI ${n.name.toLowerCase()} website`,
    ],
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ niche: string }>;
}) {
  const { niche: slug } = await params;
  const n = getNiche(slug);
  if (!n) notFound();

  const canonical = `${SITE_URL}/ai-website-builder-for/${n.slug}`;
  const builderHref = `/builder?prompt=${encodeURIComponent(n.prefilledPrompt)}`;

  // JSON-LD — high-leverage SEO payload
  const softwareApplicationLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Zoobicon",
    applicationCategory: "WebApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: "49",
      highPrice: "299",
      offerCount: 3,
    },
    description: n.metaPitch,
    url: SITE_URL,
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: n.faqs.map((f) => ({
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
      { "@type": "ListItem", position: 2, name: "AI Website Builder For", item: `${SITE_URL}/ai-website-builder-for` },
      { "@type": "ListItem", position: 3, name: n.name, item: canonical },
    ],
  };

  // Related comparison pages — internal linking equity
  const relatedComps = (n.relatedCompetitors || [])
    .map((slug) => getCompetitor(slug))
    .filter(Boolean) as ReturnType<typeof getCompetitor>[];

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
            <Link href="/ai-website-builder-for" className="hover:underline">AI Website Builder For</Link>
            <span className="mx-1.5">/</span>
            <span style={{ color: "var(--ink-secondary)" }}>{n.name}</span>
          </nav>

          {/* Hero */}
          <header className="mb-12">
            <div className="inline-flex items-center gap-1.5 mb-4 text-[10px] uppercase tracking-[0.22em] font-semibold" style={{ color: "var(--gold-deep)" }}>
              <Sparkles className="w-3 h-3" /> For {n.name}
            </div>
            <h1 className="text-4xl sm:text-5xl font-semibold leading-[1.05] tracking-[-0.025em] mb-4">
              The AI website builder{" "}
              <span className="display-italic font-normal" style={{ color: "var(--gold-deep)" }}>for {n.name}</span>
            </h1>
            <p className="text-[18px] leading-relaxed max-w-2xl mb-3" style={{ color: "var(--ink-secondary)" }}>
              {n.tagline}
            </p>
            <p className="text-[14px] leading-relaxed max-w-2xl" style={{ color: "var(--ink-muted)" }}>
              For {n.audience.toLowerCase()}.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href={builderHref}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-semibold transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg, #ef5440 0%, #e8402b 100%)",
                  color: "#ffffff",
                  border: "1px solid #a47d2c",
                  boxShadow: "0 6px 18px -8px rgba(194,51,31,0.5), inset 0 1px 0 0 rgba(255,255,255,0.35)",
                }}
              >
                Start your {n.name.toLowerCase()} site
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

          {/* What gets built */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold tracking-[-0.02em] mb-5 flex items-center gap-2">
              <Layers className="w-5 h-5" style={{ color: "var(--gold-deep)" }} />
              What the builder ships for {n.name.toLowerCase()}
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {n.sections.map((section) => (
                <div
                  key={section}
                  className="flex gap-3 px-4 py-3 rounded-xl"
                  style={{
                    background: "var(--paper-elevated)",
                    border: "1px solid var(--rule)",
                  }}
                >
                  <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--gold-deep)" }} />
                  <span className="text-[14px] leading-snug" style={{ color: "var(--ink-secondary)" }}>{section}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Must-haves for this niche */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold tracking-[-0.02em] mb-5">
              What we get right for {n.name.toLowerCase()}
            </h2>
            <ul className="space-y-3">
              {n.mustHaves.map((m) => (
                <li key={m} className="flex gap-3 text-[14px] leading-relaxed" style={{ color: "var(--ink-secondary)" }}>
                  <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--gold-deep)" }} />
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Prefilled prompt preview */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold tracking-[-0.02em] mb-5">
              Skip the blank page — click and ship
            </h2>
            <div
              className="rounded-2xl p-6"
              style={{
                background: "var(--paper-elevated)",
                border: "1px solid var(--gold)",
              }}
            >
              <div className="text-[10px] uppercase tracking-[0.22em] font-semibold mb-3" style={{ color: "var(--gold-deep)" }}>
                Pre-loaded prompt
              </div>
              <p className="font-mono text-[13px] leading-relaxed mb-5" style={{ color: "var(--ink)" }}>
                &ldquo;{n.prefilledPrompt}&rdquo;
              </p>
              <Link
                href={builderHref}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-semibold transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  background: "var(--ink)",
                  color: "var(--paper)",
                }}
              >
                Open builder with this prompt
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>

          {/* FAQ (feeds JSON-LD above) */}
          <section className="mb-16">
            <h2 className="text-2xl font-semibold tracking-[-0.02em] mb-5">Common questions</h2>
            <div className="space-y-4">
              {n.faqs.map((f) => (
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
              Your {n.name.toLowerCase()} site in 60 seconds
            </h2>
            <p className="text-[14px] mb-5" style={{ color: "var(--ink-secondary)" }}>
              Six visible agents collaborate live. Hosting + custom domain provisioned via Vapron at deploy.
            </p>
            <Link
              href={builderHref}
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

          {/* Related comparisons — internal linking */}
          {relatedComps.length > 0 && (
            <section className="mb-12">
              <h3 className="text-[13px] font-semibold uppercase tracking-[0.18em] mb-4" style={{ color: "var(--gold-deep)" }}>
                Zoobicon vs the alternatives for {n.name.toLowerCase()}
              </h3>
              <div className="flex flex-wrap gap-2">
                {relatedComps.map((c) => c && (
                  <Link
                    key={c.slug}
                    href={`/compare/${c.slug}`}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] transition-colors"
                    style={{
                      border: "1px solid var(--rule)",
                      background: "var(--paper)",
                      color: "var(--ink-secondary)",
                    }}
                  >
                    vs {c.name}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Other niches — internal linking */}
          <section>
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.18em] mb-4" style={{ color: "var(--gold-deep)" }}>
              Other industries we ship for
            </h3>
            <div className="flex flex-wrap gap-2">
              {NICHES.filter((other) => other.slug !== n.slug).slice(0, 16).map((other) => (
                <Link
                  key={other.slug}
                  href={`/ai-website-builder-for/${other.slug}`}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] transition-colors"
                  style={{
                    border: "1px solid var(--rule)",
                    background: "var(--paper)",
                    color: "var(--ink-secondary)",
                  }}
                >
                  {other.name}
                </Link>
              ))}
              <Link
                href="/ai-website-builder-for"
                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors"
                style={{
                  border: "1px solid var(--gold)",
                  background: "var(--gold-soft)",
                  color: "var(--gold-deep)",
                }}
              >
                See all {NICHES.length} →
              </Link>
            </div>
          </section>
        </article>
      </main>
    </>
  );
}
