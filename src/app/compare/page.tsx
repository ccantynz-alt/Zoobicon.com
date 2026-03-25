import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, X, Minus, Star, Zap, Shield, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "Zoobicon vs v0 vs Bolt vs Lovable — AI Website Builder Comparison 2026",
  description: "Honest comparison of the top AI website builders. See how Zoobicon stacks up against v0, Bolt.new, Lovable, and Emergent on speed, quality, features, and pricing.",
  openGraph: {
    title: "Zoobicon vs v0 vs Bolt vs Lovable — AI Website Builder Comparison",
    description: "Honest comparison of the top AI website builders. See how Zoobicon stacks up on speed, quality, features, and pricing.",
    url: "https://zoobicon.com/compare",
  },
  alternates: { canonical: "https://zoobicon.com/compare" },
};

interface ComparisonRow {
  feature: string;
  zoobicon: string | boolean;
  v0: string | boolean;
  bolt: string | boolean;
  lovable: string | boolean;
}

const comparisons: ComparisonRow[] = [
  { feature: "Single-page generation", zoobicon: true, v0: true, bolt: true, lovable: true },
  { feature: "Multi-page sites (3-6 pages)", zoobicon: true, v0: false, bolt: false, lovable: true },
  { feature: "Full-stack apps (DB + API + UI)", zoobicon: true, v0: false, bolt: false, lovable: true },
  { feature: "E-commerce storefronts", zoobicon: true, v0: false, bolt: false, lovable: false },
  { feature: "43 specialized generators", zoobicon: true, v0: false, bolt: false, lovable: false },
  { feature: "Visual editor (click-to-edit)", zoobicon: true, v0: true, bolt: true, lovable: true },
  { feature: "Multi-LLM (Claude + GPT + Gemini)", zoobicon: true, v0: false, bolt: true, lovable: false },
  { feature: "Agency white-label platform", zoobicon: true, v0: false, bolt: false, lovable: false },
  { feature: "AI video creator", zoobicon: true, v0: false, bolt: false, lovable: false },
  { feature: "AI SEO agent", zoobicon: true, v0: false, bolt: false, lovable: false },
  { feature: "Email support ticketing", zoobicon: true, v0: false, bolt: false, lovable: false },
  { feature: "100+ templates", zoobicon: true, v0: true, bolt: false, lovable: true },
  { feature: "One-click hosting", zoobicon: true, v0: true, bolt: true, lovable: true },
  { feature: "Custom domains", zoobicon: true, v0: true, bolt: true, lovable: true },
  { feature: "Component library (auto-injected)", zoobicon: true, v0: true, bolt: false, lovable: false },
  { feature: "In-browser runtime", zoobicon: false, v0: true, bolt: true, lovable: false },
  { feature: "Real-time collaboration", zoobicon: "Polling", v0: false, bolt: false, lovable: "WebSocket" },
  { feature: "WordPress export", zoobicon: true, v0: false, bolt: false, lovable: false },
  { feature: "Public REST API", zoobicon: true, v0: false, bolt: false, lovable: false },
  { feature: "Free tier", zoobicon: "1 build/mo", v0: "Limited", bolt: "Limited", lovable: "5 msg/day" },
  { feature: "Starting price", zoobicon: "$19/mo", v0: "$20/mo", bolt: "$20/mo", lovable: "$20/mo" },
];

function CellValue({ value }: { value: string | boolean }) {
  if (value === true) return <Check className="w-5 h-5 text-emerald-400 mx-auto" />;
  if (value === false) return <X className="w-5 h-5 text-red-400/50 mx-auto" />;
  return <span className="text-sm text-slate-300">{value}</span>;
}

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: "Zoobicon vs v0 vs Bolt vs Lovable — AI Website Builder Comparison 2026",
            description: "Comprehensive comparison of the top AI website builders.",
            author: { "@type": "Organization", name: "Zoobicon" },
            publisher: { "@type": "Organization", name: "Zoobicon", url: "https://zoobicon.com" },
            datePublished: "2026-03-25",
            dateModified: "2026-03-25",
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "How does Zoobicon compare to v0 by Vercel?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Zoobicon generates complete deployed websites (single-page, multi-page, and full-stack apps) from a single prompt, while v0 focuses on frontend React component generation within the Vercel ecosystem. Zoobicon offers 43 specialized generators, agency white-label features, and multi-LLM support (Claude, GPT, Gemini). v0 has an in-browser runtime advantage."
                }
              },
              {
                "@type": "Question",
                "name": "Is Zoobicon better than Bolt.new?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Zoobicon and Bolt.new have different strengths. Zoobicon offers higher output quality (powered by Claude Opus 4.6), 43 specialized generators, full-stack app generation with database and API, e-commerce storefronts, and agency white-label tools. Bolt.new offers faster preview via WebContainers (in-browser Node.js) and broader framework support. Zoobicon generates complete sites in 60-95 seconds; Bolt shows previews in 3-5 seconds but requires more manual assembly."
                }
              },
              {
                "@type": "Question",
                "name": "How does Zoobicon compare to Lovable?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Both Zoobicon and Lovable generate full-stack applications. Zoobicon differentiates with 43 specialized generators (vs generic prompting), a 7-agent pipeline for higher quality output, agency white-label platform, e-commerce storefront generation, AI video creator, and multi-LLM model selection. Lovable offers Supabase integration and WebSocket-based real-time collaboration. Zoobicon starts at $19/month vs Lovable's $20/month."
                }
              },
              {
                "@type": "Question",
                "name": "Which AI website builder has the best free tier?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Zoobicon's free tier includes 3 AI-generated websites per month using the same Opus-quality AI as paid plans, plus 10 edits and 7-day hosting preview. v0 and Bolt offer limited free usage with lower model quality. Lovable offers 5 messages per day. Zoobicon is the only builder offering full pipeline quality on the free tier."
                }
              },
              {
                "@type": "Question",
                "name": "Can Zoobicon generate e-commerce stores?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. Zoobicon is the only AI builder with a dedicated e-commerce generator that creates complete storefronts with shopping cart, checkout, product grid, search/filters, wishlist, reviews, stock badges, discount codes, and shipping calculator. Competitors require manual Shopify or Stripe integration."
                }
              }
            ]
          }),
        }}
      />

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 text-sm text-indigo-300 mb-6">
            <Star className="w-4 h-4" /> Updated March 2026
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-indigo-200 to-cyan-200 bg-clip-text text-transparent">
            Zoobicon vs The Competition
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-8">
            An honest, feature-by-feature comparison of the top AI website builders.
            We show where we lead and where competitors do too.
          </p>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="px-4 pb-20">
        <div className="max-w-6xl mx-auto overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-4 px-4 text-sm font-medium text-slate-400 w-1/3">Feature</th>
                <th className="text-center py-4 px-4 text-sm font-bold text-indigo-400 w-1/6">
                  <div className="flex flex-col items-center gap-1">
                    <Zap className="w-5 h-5" />
                    Zoobicon
                  </div>
                </th>
                <th className="text-center py-4 px-4 text-sm font-medium text-slate-400 w-1/6">v0 (Vercel)</th>
                <th className="text-center py-4 px-4 text-sm font-medium text-slate-400 w-1/6">Bolt.new</th>
                <th className="text-center py-4 px-4 text-sm font-medium text-slate-400 w-1/6">Lovable</th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((row, i) => (
                <tr key={i} className={`border-b border-white/5 ${i % 2 === 0 ? "bg-white/[0.02]" : ""}`}>
                  <td className="py-3 px-4 text-sm text-slate-300">{row.feature}</td>
                  <td className="py-3 px-4 text-center bg-indigo-500/5"><CellValue value={row.zoobicon} /></td>
                  <td className="py-3 px-4 text-center"><CellValue value={row.v0} /></td>
                  <td className="py-3 px-4 text-center"><CellValue value={row.bolt} /></td>
                  <td className="py-3 px-4 text-center"><CellValue value={row.lovable} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Why Choose Zoobicon */}
      <section className="py-20 px-4 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why 10,000+ Builders Choose Zoobicon</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 rounded-xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-7 h-7 text-indigo-400" />
              </div>
              <h3 className="font-semibold mb-2">43 Specialized Generators</h3>
              <p className="text-sm text-slate-400">Not just "build a website." Build a restaurant site, SaaS dashboard, e-commerce store, portfolio — each with custom AI prompts.</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="font-semibold mb-2">Agency White-Label</h3>
              <p className="text-sm text-slate-400">No competitor offers this. Build websites under YOUR brand with client portals, approval workflows, and bulk generation.</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-xl bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
                <Globe className="w-7 h-7 text-cyan-400" />
              </div>
              <h3 className="font-semibold mb-2">Full Business OS</h3>
              <p className="text-sm text-slate-400">Website builder + video creator + SEO agent + email support + marketplace + hosting. Replace 6 subscriptions with one.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Build Something Amazing?</h2>
          <p className="text-slate-400 mb-8">Start free. No credit card required. Build your first website in 60 seconds.</p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-lg transition-colors"
          >
            Start Building Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
