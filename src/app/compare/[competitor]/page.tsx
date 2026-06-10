/**
 * /compare/[competitor] — programmatic comparison pages.
 *
 * One route, twelve indexable pages. Pulls structured competitor data
 * from src/lib/seo/competitors.ts and renders an honest comparison
 * page tuned for "[Competitor] alternative" and "[Competitor] vs
 * Zoobicon" search queries.
 *
 * SEO scaffolding:
 *   - generateStaticParams() pre-renders every competitor at build time
 *     so each page lands as static HTML in the sitemap, no dynamic
 *     rendering required for crawlers.
 *   - generateMetadata() produces a per-competitor <title>,
 *     <meta description>, canonical URL, and Open Graph block.
 *   - JSON-LD blocks emit SoftwareApplication schema for both products
 *     + a FAQPage schema for each competitor's FAQ section. This is the
 *     single biggest SEO win — rich results in Google SERP for free.
 *   - Internal links back to /compare (index) + /builder (the CTA).
 *
 * Honesty rule (from competitors.ts): every "ours" claim must hold up.
 * Search engines reward honest comparisons; users punish marketing
 * fluff.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, X, Minus } from "lucide-react";
import {
  COMPETITORS,
  getCompetitor,
  ZOOBICON_PRICING,
  type FeatureValue,
} from "@/lib/seo/competitors";

const SITE_URL = "https://zoobicon.com";

export function generateStaticParams() {
  return COMPETITORS.map((c) => ({ competitor: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ competitor: string }>;
}): Promise<Metadata> {
  const { competitor: slug } = await params;
  const c = getCompetitor(slug);
  if (!c) return { title: "Not found" };

  const title = `Zoobicon vs ${c.name} (2026) — Honest AI Website Builder Comparison`;
  const description = c.metaPitch;
  const canonical = `${SITE_URL}/compare/${c.slug}`;

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
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    // High-intent keywords drive AltLinks and search snippets
    keywords: [
      `${c.name} alternative`,
      `${c.name} vs Zoobicon`,
      `${c.name} comparison`,
      "AI website builder",
      "AI website builder alternative",
      `${c.name} pricing`,
    ],
  };
}

function ValueCell({ value, brand = "neutral" }: { value: FeatureValue; brand?: "ours" | "theirs" | "neutral" }) {
  const accent =
    brand === "ours"
      ? "var(--gold-deep)"
      : brand === "theirs"
      ? "var(--ink-muted)"
      : "var(--ink)";
  if (value === true) return <Check className="w-4 h-4 mx-auto" style={{ color: accent }} />;
  if (value === false) return <X className="w-4 h-4 mx-auto" style={{ color: "var(--ink-muted)", opacity: 0.5 }} />;
  return (
    <span className="text-[12px] font-medium" style={{ color: accent }}>
      {value}
    </span>
  );
}

export default async function Page({
  params,
}: {
  params: Promise<{ competitor: string }>;
}) {
  const { competitor: slug } = await params;
  const c = getCompetitor(slug);
  if (!c) notFound();

  const canonical = `${SITE_URL}/compare/${c.slug}`;

  // JSON-LD — the highest-leverage SEO addition. Google renders
  // SoftwareApplication + FAQPage as rich results in SERP.
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
      offerCount: ZOOBICON_PRICING.length,
    },
    description:
      "AI website builder that ships a polished React site from a sentence and registers the matching domain in the same checkout.",
    url: SITE_URL,
    sameAs: ["https://zoobicon.ai", "https://zoobicon.io"],
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
      { "@type": "ListItem", position: 2, name: "Compare", item: `${SITE_URL}/compare` },
      { "@type": "ListItem", position: 3, name: `vs ${c.name}`, item: canonical },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <main className="pt-[72px] pb-24" style={{ color: "var(--ink)" }}>
        <article className="max-w-5xl mx-auto px-6">
          {/* Breadcrumb */}
          <nav className="text-[12px] mb-6" style={{ color: "var(--ink-muted)" }} aria-label="Breadcrumb">
            <Link href="/" className="hover:underline">Home</Link>
            <span className="mx-1.5">/</span>
            <Link href="/compare" className="hover:underline">Compare</Link>
            <span className="mx-1.5">/</span>
            <span style={{ color: "var(--ink-secondary)" }}>vs {c.name}</span>
          </nav>

          {/* Hero */}
          <header className="mb-12">
            <div
              className="inline-flex items-center gap-1.5 mb-4 text-[10px] uppercase tracking-[0.22em] font-semibold"
              style={{ color: "var(--gold-deep)" }}
            >
              Honest comparison
            </div>
            <h1 className="text-4xl sm:text-5xl font-semibold leading-[1.05] tracking-[-0.025em] mb-4">
              Zoobicon vs{" "}
              <span className="display-italic font-normal" style={{ color: "var(--gold-deep)" }}>
                {c.name}
              </span>
            </h1>
            <p className="text-[16px] leading-relaxed max-w-2xl" style={{ color: "var(--ink-secondary)" }}>
              {c.positioning}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
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
                Try Zoobicon free
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
          <section className="grid sm:grid-cols-3 gap-4 mb-12">
            {[
              { label: "Founded", value: c.founded.toString() },
              { label: "Trajectory", value: c.trajectory },
              { label: "Starting price", value: c.pricing[0]?.price ?? "—" },
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

          {/* Where they lead */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold tracking-[-0.02em] mb-4">
              Where {c.name} leads
            </h2>
            <ul className="space-y-2.5">
              {c.strengths.map((s) => (
                <li key={s} className="flex gap-3 text-[14px] leading-relaxed" style={{ color: "var(--ink-secondary)" }}>
                  <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--gold-deep)" }} />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Where we lead */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold tracking-[-0.02em] mb-4">
              Where Zoobicon leads
            </h2>
            <ul className="space-y-2.5">
              {c.ourEdge.map((s) => (
                <li key={s} className="flex gap-3 text-[14px] leading-relaxed" style={{ color: "var(--ink-secondary)" }}>
                  <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--gold-deep)" }} />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Feature matrix */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold tracking-[-0.02em] mb-5">
              Feature-by-feature
            </h2>
            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: "1px solid var(--rule)", background: "var(--paper-elevated)" }}
            >
              <table className="w-full text-[13px]">
                <thead>
                  <tr style={{ background: "var(--paper)", borderBottom: "1px solid var(--rule)" }}>
                    <th className="text-left px-4 py-3 font-semibold">Feature</th>
                    <th className="text-center px-4 py-3 font-semibold" style={{ color: "var(--gold-deep)" }}>Zoobicon</th>
                    <th className="text-center px-4 py-3 font-semibold" style={{ color: "var(--ink-secondary)" }}>{c.name}</th>
                  </tr>
                </thead>
                <tbody>
                  {c.features.map((row, i) => (
                    <tr
                      key={row.label}
                      style={{
                        borderTop: i === 0 ? "none" : "1px solid var(--rule)",
                      }}
                    >
                      <td className="px-4 py-3" style={{ color: "var(--ink)" }}>{row.label}</td>
                      <td className="px-4 py-3 text-center">
                        <ValueCell value={row.ours} brand="ours" />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <ValueCell value={row.theirs} brand="theirs" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] mt-3" style={{ color: "var(--ink-muted)" }}>
              <Minus className="inline w-3 h-3 -mt-0.5 mr-1" />
              We update this matrix every time a competitor ships a new feature or a price changes.
              Last refresh: {new Date().toISOString().slice(0, 10)}.
            </p>
          </section>

          {/* Pricing side-by-side */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold tracking-[-0.02em] mb-5">Pricing side-by-side</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              <div
                className="rounded-2xl p-5"
                style={{ border: "1px solid var(--gold)", background: "var(--paper-elevated)" }}
              >
                <div
                  className="text-[10px] uppercase tracking-[0.22em] font-semibold mb-3"
                  style={{ color: "var(--gold-deep)" }}
                >
                  Zoobicon
                </div>
                <ul className="space-y-2">
                  {ZOOBICON_PRICING.map((t) => (
                    <li key={t.name} className="text-[13px] flex items-baseline justify-between gap-3">
                      <span style={{ color: "var(--ink)" }}><strong>{t.name}</strong> · {t.limits}</span>
                      <span className="font-mono" style={{ color: "var(--gold-deep)" }}>{t.price}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div
                className="rounded-2xl p-5"
                style={{ border: "1px solid var(--rule)", background: "var(--paper-elevated)" }}
              >
                <div
                  className="text-[10px] uppercase tracking-[0.22em] font-semibold mb-3"
                  style={{ color: "var(--ink-secondary)" }}
                >
                  {c.name}
                </div>
                <ul className="space-y-2">
                  {c.pricing.map((t) => (
                    <li key={t.name} className="text-[13px] flex items-baseline justify-between gap-3">
                      <span style={{ color: "var(--ink)" }}><strong>{t.name}</strong> · {t.limits}</span>
                      <span className="font-mono" style={{ color: "var(--ink-secondary)" }}>{t.price}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* FAQ — feeds the FAQPage JSON-LD above */}
          <section className="mb-16">
            <h2 className="text-2xl font-semibold tracking-[-0.02em] mb-5">
              Common questions
            </h2>
            <div className="space-y-4">
              {c.faqs.map((f) => (
                <details
                  key={f.q}
                  className="rounded-xl p-5"
                  style={{ border: "1px solid var(--rule)", background: "var(--paper-elevated)" }}
                >
                  <summary
                    className="cursor-pointer text-[15px] font-semibold tracking-[-0.01em]"
                    style={{ color: "var(--ink)" }}
                  >
                    {f.q}
                  </summary>
                  <p
                    className="mt-3 text-[14px] leading-relaxed"
                    style={{ color: "var(--ink-secondary)" }}
                  >
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </section>

          {/* Final CTA */}
          <section
            className="rounded-2xl p-8 text-center"
            style={{
              background: "var(--paper-elevated)",
              border: "1px solid var(--gold)",
            }}
          >
            <h2 className="text-2xl font-semibold tracking-[-0.02em] mb-2">
              See it for yourself
            </h2>
            <p className="text-[14px] mb-5" style={{ color: "var(--ink-secondary)" }}>
              Describe your site in one sentence. Watch six agents build it in 60 seconds.
              Buy the matching domain in the same checkout.
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

          {/* Cross-link to other comparisons — internal linking is SEO gold */}
          <section className="mt-16">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.18em] mb-4" style={{ color: "var(--gold-deep)" }}>
              Compare Zoobicon to other builders
            </h3>
            <div className="flex flex-wrap gap-2">
              {COMPETITORS.filter((other) => other.slug !== c.slug).map((other) => (
                <Link
                  key={other.slug}
                  href={`/compare/${other.slug}`}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] transition-colors"
                  style={{
                    border: "1px solid var(--rule)",
                    background: "var(--paper)",
                    color: "var(--ink-secondary)",
                  }}
                >
                  vs {other.name}
                </Link>
              ))}
            </div>
          </section>
        </article>
      </main>
    </>
  );
}
