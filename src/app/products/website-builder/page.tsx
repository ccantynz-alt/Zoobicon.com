"use client";

import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Code2,
  Smartphone,
  Palette,
  RefreshCw,
  Download,
  MessageSquare,
  Layout,
  Check,
  Search,
  BadgeCheck,
} from "lucide-react";

const FEATURES = [
  { icon: Sparkles, title: "Prompt to Website", desc: "Describe any website in plain English and watch it materialize in seconds. No coding required." },
  { icon: Code2, title: "Multi-Framework Export", desc: "Export as HTML, React, Next.js, Vue, or Svelte. Production-ready code, not templates." },
  { icon: Smartphone, title: "Responsive by Default", desc: "Every site is mobile-first with responsive breakpoints. Preview on desktop, tablet, and mobile." },
  { icon: MessageSquare, title: "AI Chat Editor", desc: "Say 'make the header blue' or 'add a contact form' — AI edits your live site in real-time." },
  { icon: Layout, title: "12+ Templates", desc: "Start from SaaS, portfolio, e-commerce, restaurant, agency, blog, and more. All customizable." },
  { icon: RefreshCw, title: "Streaming Generation", desc: "Watch your code appear in real-time. See the site building itself character by character." },
  { icon: Palette, title: "Style Presets", desc: "Modern dark, clean minimal, bold colorful, corporate — choose a style or let AI decide." },
  { icon: Download, title: "One-Click Export", desc: "Download as HTML, copy to clipboard, or deploy directly to a zoobicon.sh subdomain." },
  { icon: Search, title: "Built-in SEO", desc: "Auto-generated meta tags, semantic HTML5, structured data, and accessibility compliance." },
];

const STEPS = [
  { num: "01", title: "Describe", desc: "Tell AI what you want. 'A photography portfolio with dark theme and gallery grid.'" },
  { num: "02", title: "Generate", desc: "AI streams your website in real-time. Full HTML, CSS, JavaScript — production-ready." },
  { num: "03", title: "Refine", desc: "Use the AI Chat Editor to make changes. 'Add a contact form' — done instantly." },
  { num: "04", title: "Ship", desc: "Export, download, or deploy to a live URL with one click." },
];

const COMPARISON: Array<[string, string | boolean, string | boolean, string | boolean]> = [
  ["AI Generation", true, false, false],
  ["AI Editing (Chat)", true, false, false],
  ["Code Export", true, false, true],
  ["Multi-Framework", true, false, true],
  ["Responsive", true, true, "manual"],
  ["SEO Optimized", true, "partial", "manual"],
  ["Streaming Preview", true, false, false],
  ["Time to Launch", "Seconds", "Hours", "Days/Weeks"],
  ["Price", "Free tier", "$16+/mo", "$0 + time"],
];

export default function WebsiteBuilderPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Zoobicon AI Website Builder",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "0",
      "highPrice": "99",
      "priceCurrency": "USD",
      "offerCount": "4"
    },
    "description": "Build production-ready websites in 60 seconds with 7 AI agents. No coding required.",
    "url": "https://zoobicon.com/products/website-builder",
    "screenshot": "https://zoobicon.com/og-image.png"
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://zoobicon.com" },
      { "@type": "ListItem", "position": 2, "name": "Products", "item": "https://zoobicon.com/products" },
      { "@type": "ListItem", "position": 3, "name": "Website Builder", "item": "https://zoobicon.com/products/website-builder" }
    ]
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How long does it take to build a website with Zoobicon?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Zoobicon generates a complete, production-ready website in 60-95 seconds. The 7-agent AI pipeline handles strategy, design, copywriting, architecture, development, SEO, and animations automatically."
        }
      },
      {
        "@type": "Question",
        "name": "Do I need coding experience to use Zoobicon?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No coding experience is required. You describe your website in plain English, and Zoobicon's AI generates the complete HTML, CSS, and JavaScript. You can also edit using natural language chat commands like 'make the header blue' or 'add a contact form'."
        }
      },
      {
        "@type": "Question",
        "name": "What AI models power Zoobicon's website builder?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Zoobicon uses Claude Opus 4.7 for the core Developer agent (HTML generation), Claude Haiku for fast planning agents (strategy, brand design, copywriting, architecture), and Claude Sonnet for enhancement agents (SEO, animations). Users can also select GPT-4o or Gemini 2.5 Pro as alternatives."
        }
      },
      {
        "@type": "Question",
        "name": "Can I export or self-host the websites Zoobicon generates?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. You can deploy to zoobicon.sh with one click (free hosting included), download as standalone HTML, export as a React/Next.js project, push to GitHub, or export as a WordPress theme. The generated code is yours with no lock-in."
        }
      },
      {
        "@type": "Question",
        "name": "What types of websites can Zoobicon build?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Zoobicon supports 43 specialized generators covering landing pages, SaaS apps, e-commerce stores, portfolios, blogs, restaurant sites, real estate listings, healthcare sites, law firm pages, fitness sites, and more. It also generates multi-page sites (3-6 pages) and full-stack applications with databases and APIs."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#060e1f] text-white fs-grain pt-[72px]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      {/* Hero */}
      <section className="relative pt-20 pb-24 md:pt-28 md:pb-32 overflow-hidden">
        {/* Ambient warm glow orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div
            className="absolute left-1/2 top-0 h-[720px] w-[1200px] -translate-x-1/2 rounded-full blur-[160px]"
            style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.09), transparent 70%)" }}
          />
          <div
            className="absolute right-[-10%] top-[30%] h-[420px] w-[520px] rounded-full blur-[140px]"
            style={{ background: "radial-gradient(closest-side, rgba(224,139,176,0.07), transparent 70%)" }}
          />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-8">
            <BadgeCheck className="w-3 h-3" />
            7 AI agents · Opus 4.7 · Production-ready output
          </div>

          <h1 className="fs-display-xl mb-6">
            Describe it.{" "}
            <span
              style={{
                fontFamily: "Fraunces, ui-serif, Georgia, serif",
                fontStyle: "italic",
                fontWeight: 400,
                color: "#E8D4B0",
              }}
            >
              Build it.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-[17px] md:text-[19px] leading-relaxed text-white/60 mb-10">
            The most advanced AI website builder on the planet. Generate production-ready
            websites from a single sentence. Edit with natural language. Ship in one click.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/builder"
              className="group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[14px] font-semibold transition-all duration-500 hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)",
                color: "#0a1628",
                boxShadow: "0 14px 40px -16px rgba(232,212,176,0.5)",
              }}
            >
              Try the builder free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/developers"
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.03] px-7 py-3.5 text-[14px] font-medium text-white/80 backdrop-blur transition-all duration-500 hover:-translate-y-0.5 hover:border-[#E8D4B0]/35 hover:text-[#E8D4B0]"
            >
              <Code2 className="w-4 h-4" />
              Use the API
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
              The flow
            </div>
            <h2 className="fs-display-lg mb-4">
              Four steps to{" "}
              <span
                style={{
                  fontFamily: "Fraunces, ui-serif, Georgia, serif",
                  fontStyle: "italic",
                  fontWeight: 400,
                  color: "#E8D4B0",
                }}
              >
                launch.
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((step) => (
              <div
                key={step.num}
                className="group relative overflow-hidden rounded-[24px] border border-white/[0.08] p-7 transition-all duration-500 hover:-translate-y-1 hover:border-[#E8D4B0]/25"
                style={{
                  background: "linear-gradient(135deg, rgba(17,17,24,0.85) 0%, rgba(10,10,15,0.7) 100%)",
                }}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.08), transparent 70%)" }}
                />
                <div className="relative">
                  <div
                    className="text-[11px] uppercase tracking-[0.18em] font-semibold mb-4"
                    style={{ color: "rgba(232,212,176,0.75)" }}
                  >
                    Step {step.num}
                  </div>
                  <h3 className="text-[20px] font-semibold tracking-[-0.015em] mb-2">{step.title}</h3>
                  <p className="text-[14px] text-white/55 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
              Everything included
            </div>
            <h2 className="fs-display-lg mb-4">
              Every feature{" "}
              <span
                style={{
                  fontFamily: "Fraunces, ui-serif, Georgia, serif",
                  fontStyle: "italic",
                  fontWeight: 400,
                  color: "#E8D4B0",
                }}
              >
                you need.
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-[24px] border border-white/[0.08] p-7 transition-all duration-500 hover:-translate-y-1 hover:border-[#E8D4B0]/25"
                style={{
                  background: "linear-gradient(135deg, rgba(17,17,24,0.85) 0%, rgba(10,10,15,0.7) 100%)",
                }}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.07), transparent 70%)" }}
                />
                <div className="relative">
                  <div
                    className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.05]"
                  >
                    <f.icon className="h-5 w-5 text-[#E8D4B0]" />
                  </div>
                  <h3 className="text-[18px] font-semibold tracking-[-0.01em] mb-2">{f.title}</h3>
                  <p className="text-[14px] text-white/55 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="relative py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
              Head-to-head
            </div>
            <h2 className="fs-display-lg mb-4">
              Why{" "}
              <span
                style={{
                  fontFamily: "Fraunces, ui-serif, Georgia, serif",
                  fontStyle: "italic",
                  fontWeight: 400,
                  color: "#E8D4B0",
                }}
              >
                Zoobicon.
              </span>
            </h2>
          </div>

          <div
            className="overflow-hidden rounded-[28px] border border-white/[0.08]"
            style={{
              background: "linear-gradient(135deg, rgba(17,17,24,0.85) 0%, rgba(10,10,15,0.7) 100%)",
            }}
          >
            <div className="grid grid-cols-4 px-6 py-4 border-b border-white/[0.08] text-[11px] uppercase tracking-[0.15em] font-semibold text-white/55">
              <div>Feature</div>
              <div className="text-center" style={{ color: "#E8D4B0" }}>Zoobicon</div>
              <div className="text-center">Wix / Squarespace</div>
              <div className="text-center">Manual coding</div>
            </div>
            {COMPARISON.map((row, i) => (
              <div
                key={row[0] as string}
                className={`grid grid-cols-4 px-6 py-4 text-[13px] ${
                  i !== COMPARISON.length - 1 ? "border-b border-white/[0.04]" : ""
                }`}
              >
                <div className="text-white/75 font-medium">{row[0] as string}</div>
                {[1, 2, 3].map((col) => {
                  const v = row[col as 1 | 2 | 3];
                  return (
                    <div key={col} className="text-center">
                      {v === true ? (
                        <Check className="w-4 h-4 mx-auto" style={{ color: "#E8D4B0" }} />
                      ) : v === false ? (
                        <span className="text-white/25">—</span>
                      ) : (
                        <span className={col === 1 ? "font-semibold" : "text-white/50"} style={col === 1 ? { color: "#E8D4B0" } : undefined}>
                          {v}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 md:py-32 border-t border-white/[0.06] overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div
            className="absolute left-1/2 top-1/2 h-[520px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px]"
            style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.1), transparent 70%)" }}
          />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="fs-display-lg mb-5">
            Your next website is{" "}
            <span
              style={{
                fontFamily: "Fraunces, ui-serif, Georgia, serif",
                fontStyle: "italic",
                fontWeight: 400,
                color: "#E8D4B0",
              }}
            >
              one prompt away.
            </span>
          </h2>
          <p className="text-[17px] text-white/60 mb-10">
            Free. No credit card. No sign-up required to try.
          </p>
          <Link
            href="/builder"
            className="group inline-flex items-center gap-2 rounded-full px-8 py-4 text-[15px] font-semibold transition-all duration-500 hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)",
              color: "#0a1628",
              boxShadow: "0 14px 40px -16px rgba(232,212,176,0.55)",
            }}
          >
            Start building now
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
}
