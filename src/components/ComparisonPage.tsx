import Link from "next/link";
import { Check, X, Minus, ArrowRight, Sparkles, Trophy } from "lucide-react";
import type { CompetitorComparison, FeatureSide } from "@/lib/comparison-data";

// Render a single feature-matrix cell. The data layer accepts either a
// FeatureSide enum or a free-form string (e.g. "Anthropic only") so we can
// be specific where a binary check would oversimplify.
function FeatureCell({ value, side }: { value: FeatureSide | string; side: "us" | "them" }) {
  const has = value === side || value === "both";
  const opposite = value === (side === "us" ? "them" : "us");
  if (typeof value === "string" && !["us", "them", "both", "neither"].includes(value)) {
    return <span className="text-[12px] text-white/65">{value}</span>;
  }
  if (has) {
    return (
      <div className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-400/30">
        <Check className="w-4 h-4 text-emerald-300" />
      </div>
    );
  }
  if (opposite || value === "neither") {
    return <Minus className="w-4 h-4 mx-auto text-white/25" />;
  }
  return <X className="w-4 h-4 mx-auto text-white/25" />;
}

export default function ComparisonPage({ data }: { data: CompetitorComparison }) {
  const stats = [
    data.stats.arr ? { label: "ARR", value: data.stats.arr } : null,
    data.stats.users ? { label: "Users", value: data.stats.users } : null,
    data.stats.valuation ? { label: "Valuation", value: data.stats.valuation } : null,
    data.stats.employees ? { label: "Employees", value: data.stats.employees } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="relative z-10 min-h-screen bg-[#0b1530] text-white pt-[72px]">
      {/* JSON-LD for rich Google snippets on comparison pages */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: data.metaTitle,
            description: data.metaDescription,
            author: { "@type": "Organization", name: "Zoobicon" },
            publisher: { "@type": "Organization", name: "Zoobicon", url: "https://zoobicon.com" },
            datePublished: "2026-05-02",
            mainEntityOfPage: `https://zoobicon.com/vs/${data.slug}`,
          }),
        }}
      />

      {/* Hero */}
      <section className="relative pt-20 md:pt-28 pb-16 px-4 overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div
            className="absolute left-1/2 top-0 h-[600px] w-[1100px] -translate-x-1/2 rounded-full blur-[160px]"
            style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.10), transparent 70%)" }}
          />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/25 bg-[#E8D4B0]/[0.06] px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.2em] uppercase text-[#E8D4B0] mb-6">
            <Trophy className="w-3 h-3" />
            {data.category} · 2026 honest comparison
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-[-0.03em] leading-[1.05] mb-6">
            Zoobicon{" "}
            <span
              style={{
                fontFamily: "Fraunces, ui-serif, Georgia, serif",
                fontStyle: "italic",
                fontWeight: 400,
                color: "#E8D4B0",
              }}
            >
              vs
            </span>{" "}
            {data.name}
          </h1>
          <p className="text-lg md:text-xl text-white/55 max-w-3xl mx-auto leading-relaxed">
            {data.ourPitch}
          </p>

          {/* Stats strip */}
          {stats.length > 0 && (
            <div className="mt-10 inline-flex flex-wrap items-center justify-center gap-x-8 gap-y-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] backdrop-blur-sm px-6 py-4">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-[10px] uppercase tracking-widest font-semibold text-white/40 mb-0.5">
                    {data.name} · {s.label}
                  </div>
                  <div className="text-sm font-semibold text-white/85">{s.value}</div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/builder"
              className="px-6 py-3.5 rounded-xl font-semibold text-[15px] text-[#0a1628] inline-flex items-center gap-2 hover:brightness-110 transition-all"
              style={{
                background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)",
                boxShadow: "0 8px 24px -8px rgba(232,212,176,0.4)",
              }}
            >
              <Sparkles className="w-4 h-4" />
              Try Zoobicon free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/pricing"
              className="px-6 py-3.5 rounded-xl font-semibold text-[15px] text-white/85 border border-white/[0.12] hover:bg-white/[0.05] transition-colors"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>

      {/* What they do — honest paragraph */}
      <section className="max-w-3xl mx-auto px-4 py-10">
        <div className="rounded-3xl border border-white/[0.07] bg-white/[0.02] p-7 md:p-9">
          <h2 className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#E8D4B0]/85 mb-3">
            What {data.name} does well
          </h2>
          <p className="text-[15px] text-white/70 leading-relaxed mb-6">{data.whatTheyDo}</p>
          <ul className="space-y-2.5">
            {data.theirStrengths.map((s, i) => (
              <li key={i} className="flex items-start gap-3 text-[14px] text-white/75">
                <Check className="w-4 h-4 text-emerald-300 mt-0.5 flex-shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Where Zoobicon wins */}
      <section className="max-w-3xl mx-auto px-4 py-6">
        <div
          className="rounded-3xl border p-7 md:p-9"
          style={{
            background:
              "linear-gradient(135deg, rgba(232,212,176,0.06) 0%, rgba(99,102,241,0.06) 50%, rgba(16,24,40,0.7) 100%)",
            borderColor: "rgba(232,212,176,0.20)",
          }}
        >
          <h2 className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#E8D4B0] mb-3">
            Where Zoobicon wins
          </h2>
          <p className="text-[15px] text-white/70 leading-relaxed mb-6">
            {data.name} ships one polished product. Zoobicon ships an entire ecosystem — every layer a
            modern business actually runs on, in one platform, at one price.
          </p>
          <ul className="space-y-2.5">
            {data.ourStrengths.map((s, i) => (
              <li key={i} className="flex items-start gap-3 text-[14px] text-white/85">
                <Trophy className="w-4 h-4 text-[#E8D4B0] mt-0.5 flex-shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Feature matrix */}
      <section className="max-w-4xl mx-auto px-4 py-14">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-3 tracking-tight">
          Feature-by-feature
        </h2>
        <p className="text-center text-white/45 mb-10 max-w-2xl mx-auto">
          A green check means the platform genuinely ships that capability today. Honest, not
          marketing copy.
        </p>
        <div className="rounded-3xl border border-white/[0.07] bg-white/[0.015] backdrop-blur-sm overflow-hidden">
          <div className="grid grid-cols-[1fr_120px_120px] md:grid-cols-[1fr_180px_180px]">
            <div className="px-5 py-4 text-[11px] uppercase tracking-widest font-semibold text-white/45 bg-white/[0.02]">
              Capability
            </div>
            <div className="px-5 py-4 text-[11px] uppercase tracking-widest font-semibold text-center bg-[#E8D4B0]/[0.05] text-[#E8D4B0]">
              Zoobicon
            </div>
            <div className="px-5 py-4 text-[11px] uppercase tracking-widest font-semibold text-center text-white/45 bg-white/[0.02]">
              {data.name}
            </div>
            {data.features.map((row, i) => (
              <div key={i} className="contents">
                <div className="px-5 py-3.5 text-[14px] text-white/75 border-t border-white/[0.05]">
                  {row.feature}
                </div>
                <div className="px-5 py-3.5 text-center border-t border-white/[0.05] bg-[#E8D4B0]/[0.02]">
                  <FeatureCell value={row.us} side="us" />
                </div>
                <div className="px-5 py-3.5 text-center border-t border-white/[0.05]">
                  <FeatureCell value={row.them} side="them" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing comparison */}
      <section className="max-w-5xl mx-auto px-4 py-14">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-3 tracking-tight">Pricing</h2>
        <p className="text-center text-white/45 mb-10 max-w-2xl mx-auto">
          List prices as published April 2026. The bundle math matters — adding domains, hosting,
          email, and video to a single-product builder typically lands somewhere north of $200/mo.
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          <div
            className="rounded-3xl border p-6 md:p-7"
            style={{
              background:
                "linear-gradient(135deg, rgba(232,212,176,0.06) 0%, rgba(16,24,40,0.7) 100%)",
              borderColor: "rgba(232,212,176,0.22)",
            }}
          >
            <h3 className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#E8D4B0] mb-4">
              Zoobicon
            </h3>
            <div className="space-y-4">
              {data.ourTiers.map((t) => (
                <div key={t.name} className="border-t border-white/[0.07] pt-3 first:border-t-0 first:pt-0">
                  <div className="flex items-baseline justify-between gap-3 mb-1.5">
                    <span className="font-semibold text-[15px] text-white">{t.name}</span>
                    <span className="font-semibold text-[15px] text-[#E8D4B0]">{t.price}</span>
                  </div>
                  <ul className="text-[12px] text-white/55 space-y-1">
                    {t.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 md:p-7">
            <h3 className="text-[11px] uppercase tracking-[0.2em] font-semibold text-white/50 mb-4">
              {data.name}
            </h3>
            <div className="space-y-4">
              {data.theirTiers.map((t) => (
                <div key={t.name} className="border-t border-white/[0.05] pt-3 first:border-t-0 first:pt-0">
                  <div className="flex items-baseline justify-between gap-3 mb-1.5">
                    <span className="font-semibold text-[15px] text-white/85">{t.name}</span>
                    <span className="font-semibold text-[15px] text-white/65">{t.price}</span>
                  </div>
                  <ul className="text-[12px] text-white/45 space-y-1">
                    {t.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-3 h-3 text-white/30 mt-0.5 flex-shrink-0" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Best-fit recommendation */}
      <section className="max-w-4xl mx-auto px-4 py-14">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-3 tracking-tight">
          Which one is right for you?
        </h2>
        <p className="text-center text-white/45 mb-10 max-w-2xl mx-auto">
          Both products solve real problems. The right choice depends on whether you want one tool
          or one platform.
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 md:p-7">
            <h3 className="text-[11px] uppercase tracking-[0.2em] font-semibold text-white/50 mb-3">
              Pick {data.name} if
            </h3>
            <p className="text-[15px] text-white/75 leading-relaxed">{data.whenToPickThem}</p>
          </div>
          <div
            className="rounded-3xl border p-6 md:p-7"
            style={{
              background:
                "linear-gradient(135deg, rgba(232,212,176,0.07) 0%, rgba(16,24,40,0.7) 100%)",
              borderColor: "rgba(232,212,176,0.22)",
            }}
          >
            <h3 className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#E8D4B0] mb-3">
              Pick Zoobicon if
            </h3>
            <p className="text-[15px] text-white/85 leading-relaxed">{data.whenToPickUs}</p>
          </div>
        </div>
      </section>

      {/* Verdict + CTA */}
      <section className="max-w-3xl mx-auto px-4 pt-10 pb-24">
        <div
          className="rounded-3xl border p-8 md:p-10 text-center"
          style={{
            background:
              "linear-gradient(135deg, rgba(20,40,95,0.7) 0%, rgba(10,10,15,0.85) 100%)",
            borderColor: "rgba(255,255,255,0.08)",
            boxShadow: "0 40px 100px -40px rgba(0,0,0,0.7)",
          }}
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight">The verdict</h2>
          <p className="text-[15px] md:text-[16px] text-white/70 leading-relaxed mb-8 max-w-2xl mx-auto">
            {data.verdict}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/builder"
              className="px-6 py-3.5 rounded-xl font-semibold text-[15px] text-[#0a1628] inline-flex items-center gap-2 hover:brightness-110 transition-all"
              style={{
                background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)",
                boxShadow: "0 8px 24px -8px rgba(232,212,176,0.4)",
              }}
            >
              <Sparkles className="w-4 h-4" />
              Start building free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 rounded-xl font-semibold text-[15px] text-white/70 border border-white/[0.12] hover:bg-white/[0.05] transition-colors"
            >
              Visit {data.name} →
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
