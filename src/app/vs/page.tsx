import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Trophy } from "lucide-react";
import { COMPARISONS } from "@/lib/comparison-data";

export const metadata: Metadata = {
  title: "Zoobicon vs the rest — honest 2026 comparisons",
  description:
    "How does Zoobicon stack up against Lovable, Bolt.new, v0, and HeyGen? Honest feature-by-feature breakdowns of every major AI builder and AI video competitor.",
  alternates: { canonical: "/vs" },
};

export default function ComparisonsIndex() {
  const entries = Object.values(COMPARISONS);
  return (
    <div className="relative z-10 min-h-screen bg-[#0b1530] text-white pt-[72px]">
      <section className="relative pt-20 md:pt-28 pb-12 px-4 overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div
            className="absolute left-1/2 top-0 h-[600px] w-[1100px] -translate-x-1/2 rounded-full blur-[160px]"
            style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.10), transparent 70%)" }}
          />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/25 bg-[#E8D4B0]/[0.06] px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.2em] uppercase text-[#E8D4B0] mb-6">
            <Trophy className="w-3 h-3" />
            Honest 2026 comparisons
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
            the rest
          </h1>
          <p className="text-lg md:text-xl text-white/55 max-w-2xl mx-auto leading-relaxed">
            Feature-by-feature breakdowns of every major AI builder and AI video competitor.
            We acknowledge where they lead. We win on ecosystem.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 pb-24">
        <div className="grid sm:grid-cols-2 gap-4">
          {entries.map((c) => (
            <Link
              key={c.slug}
              href={`/vs/${c.slug}`}
              className="group rounded-3xl border border-white/[0.07] bg-white/[0.02] hover:border-[#E8D4B0]/30 hover:bg-white/[0.04] transition-all p-6 md:p-7 backdrop-blur-sm"
            >
              <div className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#E8D4B0]/70 mb-2">
                {c.category}
              </div>
              <h2 className="text-2xl font-bold tracking-tight mb-2 group-hover:text-[#E8D4B0] transition-colors">
                Zoobicon vs {c.name}
              </h2>
              <p className="text-[13px] text-white/55 leading-relaxed mb-5 line-clamp-2">
                {c.tagline}
              </p>
              <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#E8D4B0]/85 group-hover:text-[#E8D4B0]">
                Read the comparison
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
