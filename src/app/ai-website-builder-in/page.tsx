/**
 * /ai-website-builder-in — region index page.
 *
 * Hub for the 20 country pages. Distributes link equity globally.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Globe2 } from "lucide-react";
import { COUNTRIES } from "@/lib/seo/countries";

const SITE_URL = "https://zoobicon.com";

export const metadata: Metadata = {
  title: `AI Website Builder for ${COUNTRIES.length} Markets — Global Pricing, Local TLDs | Zoobicon`,
  description: `Localized AI website builder for ${COUNTRIES.length} countries — local currency, local payment methods, regional hosting, country TLDs. Built for global businesses.`,
  alternates: { canonical: `${SITE_URL}/ai-website-builder-in` },
  openGraph: {
    title: `AI Website Builder for ${COUNTRIES.length} Markets | Zoobicon`,
    description: `Localized AI website builder. ${COUNTRIES.length} country surfaces with regional currency, payments, hosting, and TLDs.`,
    url: `${SITE_URL}/ai-website-builder-in`,
    type: "website",
  },
};

export default function RegionIndexPage() {
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Regions", item: `${SITE_URL}/ai-website-builder-in` },
    ],
  };

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "AI Website Builder by Region",
    url: `${SITE_URL}/ai-website-builder-in`,
    hasPart: COUNTRIES.map((c) => ({
      "@type": "WebPage",
      name: `AI Website Builder in ${c.name}`,
      url: `${SITE_URL}/ai-website-builder-in/${c.slug}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }} />

      <main className="pt-[72px] pb-24" style={{ color: "var(--ink)" }}>
        <div className="max-w-5xl mx-auto px-6">
          <nav className="text-[12px] mb-6" style={{ color: "var(--ink-muted)" }} aria-label="Breadcrumb">
            <Link href="/" className="hover:underline">Home</Link>
            <span className="mx-1.5">/</span>
            <span style={{ color: "var(--ink-secondary)" }}>Regions</span>
          </nav>

          <header className="mb-12">
            <div className="inline-flex items-center gap-1.5 mb-4 text-[10px] uppercase tracking-[0.22em] font-semibold" style={{ color: "var(--gold-deep)" }}>
              <Globe2 className="w-3 h-3" /> {COUNTRIES.length} markets
            </div>
            <h1 className="text-4xl sm:text-5xl font-semibold leading-[1.05] tracking-[-0.025em] mb-4">
              Local pricing.{" "}
              <span className="display-italic font-normal" style={{ color: "var(--gold-deep)" }}>Local payment methods.</span>{" "}
              Local TLDs.
            </h1>
            <p className="text-[16px] leading-relaxed max-w-2xl" style={{ color: "var(--ink-secondary)" }}>
              Pick your country. Zoobicon&apos;s builder ships with regional defaults — currency, payment rails,
              hosting region, country TLD, and consent banner for your jurisdiction.
            </p>
          </header>

          <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {COUNTRIES.map((c) => (
              <Link
                key={c.slug}
                href={`/ai-website-builder-in/${c.slug}`}
                className="group rounded-xl p-5 transition-colors"
                style={{
                  background: "var(--paper-elevated)",
                  border: "1px solid var(--rule)",
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl" aria-hidden>{c.flag}</span>
                    <span className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: "var(--ink)" }}>
                      {c.name}
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-60 group-hover:translate-x-0 transition-all flex-shrink-0 mt-1.5" />
                </div>
                <div className="text-[11px] mb-2 font-mono" style={{ color: "var(--gold-deep)" }}>
                  {c.currencySymbol} {c.currency} · {c.ccTLD}
                </div>
                <p className="text-[12px] leading-snug" style={{ color: "var(--ink-secondary)" }}>
                  {c.tagline}
                </p>
              </Link>
            ))}
          </section>
        </div>
      </main>
    </>
  );
}
