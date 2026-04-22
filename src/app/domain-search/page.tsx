import type { Metadata } from "next";
import Link from "next/link";
import {
  Search,
  Globe,
  Check,
  X,
  Zap,
  ArrowRight,
  Shield,
  AlertTriangle,
  Eye,
  Layers,
  Sparkles,
  ChevronRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "AI Domain Search — Find Available Domains Instantly | Zoobicon",
  description:
    "The smartest domain search engine. Check availability across .com, .ai, .io, .sh, .co and 8 more extensions instantly. Powered by real registry data, not DNS guessing.",
  openGraph: {
    title: "AI Domain Search — Find Available Domains Instantly",
    description:
      "Check domain availability across 13 extensions in one click. Real registry lookups, not fake results.",
    url: "https://zoobicon.com/domain-search",
  },
  alternates: { canonical: "https://zoobicon.com/domain-search" },
  keywords: [
    "domain search",
    "domain availability",
    "buy domain",
    "domain name search",
    "ai domain finder",
    ".ai domains",
    "domain registration",
  ],
};

/* ---------- Data ---------- */

const EXTENSIONS: {
  tld: string;
  price: string;
  tagline: string;
  accent: string;
}[] = [
  { tld: ".com", price: "$12.99/yr", tagline: "The gold standard", accent: "from-stone-500 to-stone-500" },
  { tld: ".ai", price: "$79.99/yr", tagline: "AI & machine learning", accent: "from-stone-500 to-stone-500" },
  { tld: ".io", price: "$39.99/yr", tagline: "Tech & startups", accent: "from-stone-500 to-stone-500" },
  { tld: ".sh", price: "$24.99/yr", tagline: "CLI & DevOps", accent: "from-stone-500 to-stone-500" },
  { tld: ".co", price: "$29.99/yr", tagline: "Modern companies", accent: "from-stone-500 to-stone-500" },
  { tld: ".dev", price: "$14.99/yr", tagline: "Developer projects", accent: "from-stone-500 to-stone-500" },
  { tld: ".app", price: "$14.99/yr", tagline: "Mobile & web apps", accent: "from-stone-500 to-stone-500" },
  { tld: ".net", price: "$13.99/yr", tagline: "Networks", accent: "from-slate-400 to-slate-500" },
  { tld: ".org", price: "$11.99/yr", tagline: "Organizations", accent: "from-stone-500 to-stone-500" },
  { tld: ".tech", price: "$6.99/yr", tagline: "Technology", accent: "from-stone-500 to-stone-500" },
  { tld: ".xyz", price: "$2.99/yr", tagline: "Next-gen branding", accent: "from-stone-500 to-stone-500" },
  { tld: ".me", price: "$8.99/yr", tagline: "Personal branding", accent: "from-stone-500 to-stone-500" },
  { tld: ".us", price: "$8.99/yr", tagline: "United States", accent: "from-stone-600 to-stone-500" },
];

const PAIN_POINTS: { icon: typeof AlertTriangle; title: string; description: string }[] = [
  {
    icon: AlertTriangle,
    title: "Fake \"Available\" Results",
    description:
      "Most domain checkers rely on DNS lookups, which cannot distinguish between genuinely available domains and parked or reserved ones. You click through to purchase and discover the domain is already taken.",
  },
  {
    icon: Eye,
    title: "Only Check One Extension at a Time",
    description:
      "You search for mybusiness.com and get nothing. What about .ai? .io? .sh? .dev? With most tools you have to run 13 separate searches to cover your options.",
  },
  {
    icon: Sparkles,
    title: "No Intelligence, No Suggestions",
    description:
      "You type a name, get a binary yes/no answer. No creative alternatives, no bulk checking, no AI-powered suggestions when your first choice is taken.",
  },
];

const STEPS: { step: string; title: string; description: string }[] = [
  {
    step: "01",
    title: "Type any name",
    description: "Enter your business name, brand idea, or any keyword. No special formatting needed.",
  },
  {
    step: "02",
    title: "Select your extensions",
    description:
      "Toggle .com, .ai, .io, .sh, .co and 8 more extensions. Search all 13 at once or pick specific ones.",
  },
  {
    step: "03",
    title: "See real results",
    description:
      "Green means available (verified via registry lookup). Red means taken. No guessing, no false positives.",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "How accurate is Zoobicon's domain search?",
    answer:
      "We use real registry data from OpenSRS/Tucows — the same data registrars rely on. Unlike DNS-based checkers that can show parked or reserved domains as available, our results reflect actual registry availability. If we say it is available, it is available.",
  },
  {
    question: "What extensions can I search?",
    answer:
      "We support 13 TLDs: .com, .ai, .io, .sh, .co, .dev, .app, .net, .org, .tech, .xyz, .me, and .us. You can search all 13 simultaneously or toggle specific ones.",
  },
  {
    question: "Can I register domains through Zoobicon?",
    answer:
      "Yes. After searching, add available domains to your cart and complete registration through our Stripe-powered checkout. Domains are registered instantly and you get full DNS management.",
  },
  {
    question: "How is this different from GoDaddy or Namecheap search?",
    answer:
      "Three key differences: First, we check 13 extensions in one search instead of making you search one at a time. Second, we use real registry data rather than DNS guessing. Third, we do not upsell you 47 add-ons or push expensive \"premium\" domains at inflated prices.",
  },
  {
    question: "Do you support .ai domain registration?",
    answer:
      "Yes. The .ai TLD (Anguilla) is one of our most popular extensions. It is perfect for AI startups, machine learning projects, and tech brands. Registration is $79.99 per year with instant activation.",
  },
];

/* ---------- Schema ---------- */

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "Zoobicon AI Domain Search",
      applicationCategory: "WebApplication",
      operatingSystem: "Any",
      url: "https://zoobicon.com/domains",
      description:
        "Search domain availability across 13 extensions instantly using real registry data.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Free domain search. Registration starts at $2.99/year.",
      },
      creator: {
        "@type": "Organization",
        name: "Zoobicon",
        url: "https://zoobicon.com",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQS.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    },
  ],
};

/* ---------- Page ---------- */

export default function DomainSearchPage() {
  return (
    <div className="min-h-screen bg-[#0b1530] text-white">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ===== HERO ===== */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-stone-500/10 rounded-full blur-[120px]" />
          <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-stone-500/8 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-500/10 border border-stone-500/20 text-stone-400 text-sm font-medium mb-8">
            <Shield className="w-4 h-4" />
            Powered by OpenSRS / Tucows registry data
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
            The Domain Search{" "}
            <span className="bg-gradient-to-r from-stone-400 via-stone-400 to-stone-400 bg-clip-text text-transparent">
              That Actually Works
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Every other domain search gives you fake results. Ours checks{" "}
            <span className="text-white font-semibold">real registry availability</span> across{" "}
            <span className="text-white font-semibold">13 extensions</span> in one click.
          </p>

          {/* Mock search bar (visual only, links to real tool) */}
          <Link
            href="/domains"
            className="group relative inline-flex items-center w-full max-w-xl mx-auto bg-white/5 border border-white/10 rounded-2xl px-6 py-4 hover:border-stone-500/40 hover:bg-white/[0.07] transition-all duration-300"
          >
            <Search className="w-5 h-5 text-slate-500 mr-3 flex-shrink-0" />
            <span className="text-slate-500 text-left flex-1">
              Search for your perfect domain...
            </span>
            <span className="flex-shrink-0 px-5 py-2 rounded-xl bg-gradient-to-r from-stone-500 to-stone-500 text-white font-semibold text-sm group-hover:shadow-lg group-hover:shadow-stone-500/25 transition-shadow">
              Search Domains
            </span>
          </Link>

          <p className="text-xs text-slate-600 mt-4">
            Checks .com, .ai, .io, .sh, .co, .dev, .app, .net, .org, .tech, .xyz, .me, .us
          </p>
        </div>
      </section>

      {/* ===== WHY OTHER SEARCHES SUCK ===== */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Why Every Other Domain Search Is{" "}
              <span className="text-stone-400">Broken</span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              We built this because we were tired of the same garbage results everyone else delivers.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {PAIN_POINTS.map((point) => (
              <div
                key={point.title}
                className="relative p-6 rounded-2xl bg-stone-500/[0.04] border border-stone-500/10 hover:border-stone-500/20 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-stone-500/10 flex items-center justify-center mb-5">
                  <point.icon className="w-6 h-6 text-stone-400" />
                </div>
                <h3 className="text-lg font-semibold mb-3">{point.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{point.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== COMPARISON TABLE ===== */}
      <section className="py-20 border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
            Zoobicon vs. The Rest
          </h2>

          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03]">
                  <th className="px-6 py-4 text-sm font-medium text-slate-400">Feature</th>
                  <th className="px-6 py-4 text-sm font-semibold text-stone-400 text-center">
                    Zoobicon
                  </th>
                  <th className="px-6 py-4 text-sm font-medium text-slate-500 text-center">
                    GoDaddy
                  </th>
                  <th className="px-6 py-4 text-sm font-medium text-slate-500 text-center">
                    Namecheap
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  { feature: "Search 13 TLDs at once", zoobicon: true, godaddy: false, namecheap: false },
                  { feature: "Real registry lookups", zoobicon: true, godaddy: true, namecheap: true },
                  { feature: "No upsell spam", zoobicon: true, godaddy: false, namecheap: false },
                  { feature: "AI name suggestions", zoobicon: true, godaddy: false, namecheap: false },
                  { feature: "Free DNS management", zoobicon: true, godaddy: false, namecheap: true },
                  { feature: "One-click hosting", zoobicon: true, godaddy: false, namecheap: false },
                  { feature: "Transparent pricing", zoobicon: true, godaddy: false, namecheap: true },
                  { feature: ".ai domain support", zoobicon: true, godaddy: true, namecheap: true },
                ].map((row) => (
                  <tr key={row.feature} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-6 py-3.5 text-slate-300">{row.feature}</td>
                    <td className="px-6 py-3.5 text-center">
                      {row.zoobicon ? (
                        <Check className="w-5 h-5 text-stone-400 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-stone-400/50 mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      {row.godaddy ? (
                        <Check className="w-5 h-5 text-slate-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-stone-400/50 mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      {row.namecheap ? (
                        <Check className="w-5 h-5 text-slate-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-stone-400/50 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-14">
            Three Steps. Real Answers.
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((s) => (
              <div key={s.step} className="relative">
                <div className="text-6xl font-black text-stone-500/10 mb-2 leading-none">
                  {s.step}
                </div>
                <h3 className="text-xl font-semibold mb-3">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>

          {/* Visual example */}
          <div className="mt-16 rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
            <p className="text-sm text-slate-500 mb-4 font-medium uppercase tracking-wider">
              Example Result
            </p>
            <div className="space-y-3">
              {[
                { domain: "acmeai.com", available: true },
                { domain: "acmeai.ai", available: false },
                { domain: "acmeai.io", available: true },
                { domain: "acmeai.sh", available: true },
                { domain: "acmeai.co", available: false },
              ].map((r) => (
                <div
                  key={r.domain}
                  className={`flex items-center justify-between px-5 py-3 rounded-xl border ${
                    r.available
                      ? "border-stone-500/20 bg-stone-500/[0.05]"
                      : "border-stone-500/10 bg-stone-500/[0.03]"
                  }`}
                >
                  <span className="font-mono text-sm sm:text-base">{r.domain}</span>
                  {r.available ? (
                    <span className="flex items-center gap-1.5 text-stone-400 text-sm font-medium">
                      <Check className="w-4 h-4" /> Available
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-stone-400/70 text-sm">
                      <X className="w-4 h-4" /> Taken
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== EXTENSIONS GRID ===== */}
      <section className="py-20 border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              13 Extensions. One Search.
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              From the classic .com to the trending .ai — search them all simultaneously.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {EXTENSIONS.map((ext) => (
              <div
                key={ext.tld}
                className="group relative p-5 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-all duration-200"
              >
                <div
                  className={`text-2xl font-bold bg-gradient-to-r ${ext.accent} bg-clip-text text-transparent mb-1`}
                >
                  {ext.tld}
                </div>
                <div className="text-white font-semibold text-sm">{ext.price}</div>
                <div className="text-slate-500 text-xs mt-1">{ext.tagline}</div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/domains"
              className="inline-flex items-center gap-2 text-stone-400 hover:text-stone-300 font-medium transition-colors"
            >
              Search all 13 extensions now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-14">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            {FAQS.map((faq) => (
              <div
                key={faq.question}
                className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]"
              >
                <h3 className="text-lg font-semibold mb-3">{faq.question}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-24 border-t border-white/5 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-stone-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
            Stop Wasting Time on{" "}
            <span className="text-stone-400 line-through decoration-stone-400/50">Broken</span>{" "}
            Domain Searches
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
            13 extensions. Real registry data. Zero upsell garbage. Find your perfect domain in seconds.
          </p>
          <Link
            href="/domains"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-stone-500 to-stone-500 text-white font-bold text-lg hover:shadow-xl hover:shadow-stone-500/25 transition-all duration-300 hover:-translate-y-0.5"
          >
            <Globe className="w-5 h-5" />
            Find Your Perfect Domain
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/5 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <Link href="/" className="font-semibold text-white hover:text-stone-400 transition-colors">
            Zoobicon
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/domains" className="hover:text-slate-300 transition-colors">
              Domain Search Tool
            </Link>
            <span className="text-white/10">|</span>
            <Link href="/hosting" className="hover:text-slate-300 transition-colors">
              Hosting
            </Link>
            <span className="text-white/10">|</span>
            <Link href="/pricing" className="hover:text-slate-300 transition-colors">
              Pricing
            </Link>
            <span className="text-white/10">|</span>
            <Link href="/support" className="hover:text-slate-300 transition-colors">
              Support
            </Link>
          </div>
          <div className="text-slate-600">
            zoobicon.com &middot; zoobicon.ai &middot; zoobicon.io &middot; zoobicon.sh
          </div>
        </div>
      </footer>
    </div>
  );
}
