/**
 * /ai-website-builder-for — index page for the niche programmatic
 * SEO surface. Hub that distributes link equity to all 28 niche pages.
 *
 * Itself a strong SEO target for the broad "AI website builder for"
 * query plus serves as the parent breadcrumb for every niche page.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { NICHES, NICHE_CATEGORIES, type Niche } from "@/lib/seo/niches";

const SITE_URL = "https://zoobicon.com";

export const metadata: Metadata = {
  title: `AI Website Builder for Every Industry (${NICHES.length}+ Niches) | Zoobicon`,
  description: `AI website builder tuned for ${NICHES.length} industries — restaurants, photographers, SaaS startups, lawyers, coaches, and more. Describe your business, get a polished site in 60 seconds.`,
  alternates: { canonical: `${SITE_URL}/ai-website-builder-for` },
  openGraph: {
    title: `AI Website Builder for Every Industry — ${NICHES.length} Niches | Zoobicon`,
    description: `Industry-tuned AI website builder. ${NICHES.length} niche templates ready to generate in 60 seconds.`,
    url: `${SITE_URL}/ai-website-builder-for`,
    type: "website",
  },
  keywords: [
    "AI website builder",
    "AI website builder by industry",
    "AI website builder for restaurants",
    "AI website builder for photographers",
    "AI website builder for SaaS",
    "AI website builder by niche",
    "industry-specific AI builder",
  ],
};

export default function NicheIndexPage() {
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "AI Website Builder For", item: `${SITE_URL}/ai-website-builder-for` },
    ],
  };

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "AI Website Builder for Every Industry",
    url: `${SITE_URL}/ai-website-builder-for`,
    hasPart: NICHES.map((n) => ({
      "@type": "WebPage",
      name: `AI Website Builder for ${n.name}`,
      url: `${SITE_URL}/ai-website-builder-for/${n.slug}`,
    })),
  };

  const grouped = NICHE_CATEGORIES.map((cat) => ({
    ...cat,
    niches: NICHES.filter((n) => n.category === cat.id),
  })).filter((g) => g.niches.length > 0);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }} />

      <main className="pt-[72px] pb-24" style={{ color: "var(--ink)" }}>
        <div className="max-w-5xl mx-auto px-6">
          {/* Breadcrumb */}
          <nav className="text-[12px] mb-6" style={{ color: "var(--ink-muted)" }} aria-label="Breadcrumb">
            <Link href="/" className="hover:underline">Home</Link>
            <span className="mx-1.5">/</span>
            <span style={{ color: "var(--ink-secondary)" }}>AI Website Builder For</span>
          </nav>

          {/* Hero */}
          <header className="mb-12">
            <div className="inline-flex items-center gap-1.5 mb-4 text-[10px] uppercase tracking-[0.22em] font-semibold" style={{ color: "var(--gold-deep)" }}>
              <Sparkles className="w-3 h-3" /> {NICHES.length} industries
            </div>
            <h1 className="text-4xl sm:text-5xl font-semibold leading-[1.05] tracking-[-0.025em] mb-4">
              An AI website builder{" "}
              <span className="display-italic font-normal" style={{ color: "var(--gold-deep)" }}>tuned to your industry</span>
            </h1>
            <p className="text-[16px] leading-relaxed max-w-2xl" style={{ color: "var(--ink-secondary)" }}>
              Pick the niche closest to what you do. The builder ships with the right sections,
              the right JSON-LD, and a pre-loaded prompt so you skip the blank page.
            </p>
          </header>

          {/* By category */}
          {grouped.map((group) => (
            <section key={group.id} className="mb-12">
              <h2 className="text-[11px] uppercase tracking-[0.22em] font-semibold mb-5" style={{ color: "var(--gold-deep)" }}>
                {group.label}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.niches.map((n: Niche) => (
                  <Link
                    key={n.slug}
                    href={`/ai-website-builder-for/${n.slug}`}
                    className="group rounded-xl p-4 transition-colors"
                    style={{
                      background: "var(--paper-elevated)",
                      border: "1px solid var(--rule)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
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
          ))}

          {/* CTA */}
          <section
            className="rounded-2xl p-8 text-center mt-16"
            style={{
              background: "var(--paper-elevated)",
              border: "1px solid var(--gold)",
            }}
          >
            <h2 className="text-2xl font-semibold tracking-[-0.02em] mb-2">
              Don&apos;t see your industry?
            </h2>
            <p className="text-[14px] mb-5" style={{ color: "var(--ink-secondary)" }}>
              The builder works for any business. Open it, describe what you do, ship in 60 seconds.
            </p>
            <Link
              href="/builder"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #d4af5e 0%, #b8923f 100%)",
                color: "#ffffff",
                border: "1px solid #a47d2c",
                boxShadow: "0 6px 18px -8px rgba(140,107,37,0.5), inset 0 1px 0 0 rgba(255,255,255,0.35)",
              }}
            >
              Open the builder
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        </div>
      </main>
    </>
  );
}
