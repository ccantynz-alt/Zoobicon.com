import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { INDUSTRIES } from "@/lib/industry-seo";

export const metadata: Metadata = {
  title: "AI Website Builder for Every Industry | Zoobicon",
  description: "Specialized AI website generators for restaurants, real estate, SaaS, e-commerce, law firms, healthcare, fitness, nonprofits, agencies, and portfolios. Built for your industry.",
  openGraph: {
    title: "AI Website Builder for Every Industry | Zoobicon",
    description: "Specialized AI website generators for 10+ industries. Each with custom prompts, layouts, and copy optimized for your business type.",
    url: "https://zoobicon.com/for",
  },
  alternates: { canonical: "https://zoobicon.com/for" },
};

export default function IndustriesHubPage() {
  const industries = Object.values(INDUSTRIES);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <section className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Built for <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Your Industry</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-16">
            Every industry has unique needs. Our AI doesn&apos;t just build websites — it builds websites that understand your business, your customers, and your conversion goals.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {industries.map((ind) => (
              <Link
                key={ind.slug}
                href={`/for/${ind.slug}`}
                className="group p-6 bg-white/[0.03] border border-white/10 rounded-2xl hover:border-white/20 hover:bg-white/[0.05] transition-all"
              >
                <div
                  className="w-3 h-3 rounded-full mb-4"
                  style={{ backgroundColor: ind.primaryColor }}
                />
                <h2 className="text-lg font-semibold mb-2 group-hover:text-indigo-300 transition-colors">
                  {ind.name}
                </h2>
                <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                  {ind.subheadline}
                </p>
                <span className="inline-flex items-center gap-1 text-sm text-indigo-400 group-hover:gap-2 transition-all">
                  Learn more <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
