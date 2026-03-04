"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Globe,
  Search,
  ArrowRight,
  Check,
  Shield,
  Mail,
  Lock,
  Server,
  Zap,
  Star,
  ShoppingCart,
  Tag,
  RefreshCw,
  Clock,
  BadgeCheck,
} from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};
const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

const POPULAR_TLDS = [
  { tld: ".com", price: 12.99, renewal: 14.99, desc: "The gold standard", popular: true },
  { tld: ".io", price: 39.99, renewal: 44.99, desc: "Tech & startups", popular: true },
  { tld: ".ai", price: 69.99, renewal: 79.99, desc: "AI & machine learning", popular: true },
  { tld: ".dev", price: 14.99, renewal: 16.99, desc: "Developer projects" },
  { tld: ".app", price: 16.99, renewal: 18.99, desc: "Mobile & web apps" },
  { tld: ".co", price: 11.99, renewal: 29.99, desc: "Modern companies" },
  { tld: ".sh", price: 24.99, renewal: 29.99, desc: "CLI & DevOps tools" },
  { tld: ".xyz", price: 2.99, renewal: 12.99, desc: "Next-gen branding" },
  { tld: ".store", price: 4.99, renewal: 39.99, desc: "E-commerce" },
  { tld: ".agency", price: 9.99, renewal: 24.99, desc: "Creative agencies" },
  { tld: ".design", price: 11.99, renewal: 34.99, desc: "Design studios" },
  { tld: ".tech", price: 9.99, renewal: 49.99, desc: "Technology brands" },
];

const UPSELLS = [
  { icon: Shield, name: "WHOIS Privacy", price: "Free", desc: "Hide your personal info from public WHOIS lookups. Included free with every domain.", included: true },
  { icon: Lock, name: "SSL Certificate", price: "$9.99/yr", desc: "Wildcard SSL for your domain. Auto-renewed, auto-configured on Zoobicon hosting." },
  { icon: Mail, name: "Email Hosting", price: "$4.99/mo", desc: "Professional email @yourdomain.com. 10GB per mailbox, unlimited aliases, spam filtering." },
  { icon: Server, name: "Premium Hosting", price: "$12.99/mo", desc: "Ultra-fast hosting with global CDN, 99.99% uptime SLA, and automatic backups." },
  { icon: Globe, name: "AI Website Builder", price: "From $0/mo", desc: "Build your website instantly with AI. Just describe what you want, we build it." },
  { icon: Search, name: "SEO Agent", price: "$29/mo", desc: "Autonomous SEO agent that ranks your new domain on Google. Set it and forget it." },
];

const MOCK_RESULTS = [
  { domain: "myawesomebrand.com", available: true, price: 12.99 },
  { domain: "myawesomebrand.io", available: true, price: 39.99 },
  { domain: "myawesomebrand.ai", available: false, price: 69.99 },
  { domain: "myawesomebrand.dev", available: true, price: 14.99 },
  { domain: "myawesomebrand.co", available: true, price: 11.99 },
  { domain: "myawesomebrand.sh", available: true, price: 24.99 },
  { domain: "myawesomebrand.xyz", available: true, price: 2.99 },
  { domain: "myawesomebrand.app", available: true, price: 16.99 },
];

export default function DomainsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [cart, setCart] = useState<string[]>([]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowResults(true);
    }
  };

  const toggleCart = (domain: string) => {
    setCart((prev) =>
      prev.includes(domain) ? prev.filter((d) => d !== domain) : [...prev, domain]
    );
  };

  const displayResults = showResults
    ? MOCK_RESULTS.map((r) => ({
        ...r,
        domain: r.domain.replace("myawesomebrand", searchQuery.trim().toLowerCase().replace(/[^a-z0-9-]/g, "")),
      }))
    : [];

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="glow-orb glow-orb-blue w-[500px] h-[500px] -top-[150px] left-[20%] opacity-10" />
        <div className="glow-orb glow-orb-cyan w-[400px] h-[400px] bottom-[20%] right-[5%] opacity-10" />
        <div className="grid-pattern fixed inset-0" />
      </div>

      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.04] bg-[#050507]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-cyan flex items-center justify-center">
                <Globe className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">Zoobicon</span>
            </Link>
            <span className="text-xs text-white/20">/</span>
            <span className="text-sm text-white/50">Domains</span>
          </div>
          <div className="flex items-center gap-4">
            {cart.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan text-xs font-bold">
                <ShoppingCart className="w-3.5 h-3.5" />
                {cart.length} domain{cart.length > 1 ? "s" : ""}
              </div>
            )}
            <Link href="/auth/signup" className="btn-gradient px-5 py-2 rounded-xl text-sm font-semibold text-white">
              <span>Get Started</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 lg:pt-44 lg:pb-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent-cyan/20 bg-accent-cyan/5 mb-6">
              <Globe className="w-3 h-3 text-accent-cyan" />
              <span className="text-xs font-medium text-accent-cyan">Domain Registration</span>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-5xl md:text-6xl lg:text-8xl font-black tracking-tight leading-[0.9] mb-6">
              Claim Your<br />
              <span className="gradient-text-hero">Digital Territory.</span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="max-w-2xl text-lg md:text-xl text-white/40 leading-relaxed mb-10">
              Register premium domains at unbeatable prices. Every domain comes with free WHOIS privacy,
              DNS management, and seamless integration with the Zoobicon AI platform.
            </motion.p>

            {/* Search Bar */}
            <motion.div variants={fadeInUp} className="max-w-3xl">
              <form onSubmit={handleSearch} className="relative">
                <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden focus-within:border-accent-cyan/30 transition-colors">
                  <Search className="w-5 h-5 text-white/30 ml-5 flex-shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (!e.target.value.trim()) setShowResults(false);
                    }}
                    placeholder="Search for your perfect domain name..."
                    className="flex-1 bg-transparent px-4 py-5 text-white placeholder:text-white/25 outline-none text-lg"
                  />
                  <button
                    type="submit"
                    className="btn-gradient px-8 py-3 mr-2 rounded-xl text-sm font-bold text-white flex items-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    Search
                  </button>
                </div>
              </form>

              {/* Search Results */}
              {showResults && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 border border-white/[0.06] rounded-2xl overflow-hidden bg-dark-300/80 backdrop-blur-xl"
                >
                  <div className="p-4 border-b border-white/[0.06]">
                    <div className="text-xs text-white/30 font-medium uppercase tracking-wider">
                      {displayResults.filter((r) => r.available).length} domains available
                    </div>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {displayResults.map((result) => (
                      <div
                        key={result.domain}
                        className={`flex items-center justify-between px-5 py-4 transition-colors ${
                          result.available ? "hover:bg-white/[0.02]" : "opacity-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {result.available ? (
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                          )}
                          <span className="text-base font-semibold">{result.domain}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-black">
                            ${result.price}
                            <span className="text-xs text-white/30 font-normal">/yr</span>
                          </span>
                          {result.available ? (
                            <button
                              onClick={() => toggleCart(result.domain)}
                              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                cart.includes(result.domain)
                                  ? "bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30"
                                  : "btn-gradient text-white"
                              }`}
                            >
                              {cart.includes(result.domain) ? (
                                <span className="flex items-center gap-1.5">
                                  <Check className="w-3.5 h-3.5" /> Added
                                </span>
                              ) : (
                                "Add to Cart"
                              )}
                            </button>
                          ) : (
                            <span className="text-xs text-red-400/60 font-medium">Taken</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {cart.length > 0 && (
                    <div className="p-4 border-t border-white/[0.06] bg-accent-cyan/[0.03]">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-bold">{cart.length} domain{cart.length > 1 ? "s" : ""} selected</span>
                          <span className="text-xs text-white/30 ml-2">Free WHOIS privacy included</span>
                        </div>
                        <Link
                          href="/auth/signup"
                          className="btn-gradient px-6 py-2.5 rounded-xl text-sm font-bold text-white flex items-center gap-2"
                        >
                          Checkout <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>

            {/* Stats */}
            <motion.div variants={fadeInUp} className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
              {[
                { value: "500+", label: "TLDs available" },
                { value: "$2.99", label: "Domains from" },
                { value: "Free", label: "WHOIS privacy" },
                { value: "24/7", label: "DNS management" },
              ].map((stat) => (
                <div key={stat.label} className="gradient-border p-4 rounded-xl text-center">
                  <div className="text-2xl font-black gradient-text-static">{stat.value}</div>
                  <div className="text-xs text-white/30 mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Popular TLDs */}
      <section className="py-20 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Popular <span className="gradient-text">Extensions</span>
              </h2>
              <p className="text-lg text-white/40">Premium domains at competitive prices. Register for years and save more.</p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {POPULAR_TLDS.map((tld, i) => (
                <motion.div
                  key={tld.tld}
                  variants={fadeInUp}
                  className={`relative gradient-border card-hover p-6 rounded-xl group ${
                    tld.popular ? "border-accent-cyan/20" : ""
                  }`}
                >
                  {tld.popular && (
                    <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-accent-cyan/20 text-accent-cyan text-[10px] font-bold border border-accent-cyan/30">
                      Popular
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl font-black">{tld.tld}</span>
                    <div className="text-right">
                      <div className="text-2xl font-black">
                        ${tld.price}
                        <span className="text-xs text-white/30 font-normal">/yr</span>
                      </div>
                      <div className="text-[10px] text-white/20">
                        Renews at ${tld.renewal}/yr
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-white/40 mb-4">{tld.desc}</p>
                  <div className="flex items-center gap-2 text-[10px] text-white/20">
                    <Shield className="w-3 h-3" />
                    <span>Free WHOIS Privacy</span>
                    <span className="mx-1">•</span>
                    <Lock className="w-3 h-3" />
                    <span>DNSSEC</span>
                    <span className="mx-1">•</span>
                    <RefreshCw className="w-3 h-3" />
                    <span>Auto-Renew</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Bundle & Upsells */}
      <section className="py-20 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Power Up Your<br /><span className="gradient-text">Domain</span>
              </h2>
              <p className="text-lg text-white/40">Every domain connects to the full Zoobicon ecosystem. Add what you need.</p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {UPSELLS.map((upsell, i) => (
                <motion.div key={i} variants={fadeInUp} className="gradient-border card-hover p-6 rounded-xl group">
                  <div className="flex items-start justify-between mb-3">
                    <upsell.icon className="w-7 h-7 text-accent-cyan/50 group-hover:text-accent-cyan transition-colors" />
                    <span className={`text-sm font-bold ${upsell.included ? "text-emerald-400" : "text-white/70"}`}>
                      {upsell.price}
                    </span>
                  </div>
                  <h3 className="text-base font-bold mb-1.5">
                    {upsell.name}
                    {upsell.included && (
                      <span className="ml-2 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                        INCLUDED
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-white/40 leading-relaxed">{upsell.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Zoobicon Domains */}
      <section className="py-20 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Why Buy<br /><span className="gradient-text">From Us?</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: BadgeCheck, title: "ICANN Accredited", desc: "Official registrar with full ICANN accreditation. Your domains are safe and legitimate." },
                { icon: Zap, title: "Instant Activation", desc: "Domains go live in seconds. Connect to Zoobicon AI builder instantly and start building." },
                { icon: Tag, title: "Transparent Pricing", desc: "No hidden fees, no domain upselling tricks. What you see is exactly what you pay." },
                { icon: Clock, title: "Easy Management", desc: "Full DNS editor, auto-renewal, bulk management, and transfer-in support. All in one dashboard." },
              ].map((item, i) => (
                <motion.div key={i} variants={fadeInUp} className="gradient-border p-6 rounded-xl group card-hover">
                  <item.icon className="w-8 h-8 text-brand-400/50 mb-4 group-hover:text-brand-400 transition-colors" />
                  <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Domain + AI Bundle */}
      <section className="py-20 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="relative gradient-border p-10 md:p-16 rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-accent-cyan/5 to-brand-500/5" />
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent-cyan/20 bg-accent-cyan/5 mb-4">
                    <Star className="w-3 h-3 text-accent-cyan" />
                    <span className="text-xs font-medium text-accent-cyan">Best Value Bundle</span>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-black mb-4">
                    Domain + AI Website<br /><span className="gradient-text">From $2.99</span>
                  </h3>
                  <p className="text-base text-white/40 leading-relaxed mb-6">
                    Register a domain and build your entire website with AI in minutes. The fastest way to go from
                    idea to live website. Includes free hosting, SSL, and WHOIS privacy.
                  </p>
                  <ul className="space-y-2 mb-8">
                    {[
                      "Domain registration from $2.99/yr",
                      "AI website builder included free",
                      "Free SSL certificate & WHOIS privacy",
                      "Global CDN hosting included",
                      "SEO Agent add-on available",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-white/50">
                        <Check className="w-4 h-4 text-accent-cyan flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/auth/signup"
                    className="inline-flex group btn-gradient px-8 py-4 rounded-2xl text-base font-bold text-white items-center gap-3 shadow-glow-cyan"
                  >
                    <span>Get Your Domain + Site</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
                <div className="flex-shrink-0 hidden md:block">
                  <div className="w-64 h-64 rounded-2xl bg-gradient-to-br from-accent-cyan/20 to-brand-500/20 border border-accent-cyan/10 flex items-center justify-center">
                    <div className="text-center">
                      <Globe className="w-16 h-16 text-accent-cyan/40 mx-auto mb-4" />
                      <div className="text-3xl font-black gradient-text-static">$2.99</div>
                      <div className="text-xs text-white/30 mt-1">Domain + AI Site</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-white/[0.04]">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <Globe className="w-12 h-12 text-accent-cyan/30 mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Your Perfect Domain<br /><span className="gradient-text">Is Waiting</span>
          </h2>
          <p className="text-lg text-white/40 mb-8">500+ extensions. Unbeatable prices. Free privacy protection. Instant AI website builder.</p>
          <Link href="/auth/signup" className="inline-flex group btn-gradient px-10 py-4 rounded-2xl text-lg font-bold text-white items-center gap-3 shadow-glow-lg">
            <span>Search Domains</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/[0.04] py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
          <div className="text-xs text-white/20">&copy; 2026 Zoobicon</div>
          <div className="flex gap-4">
            <Link href="/" className="text-xs text-white/20 hover:text-white/40">Home</Link>
            <Link href="/products/website-builder" className="text-xs text-white/20 hover:text-white/40">Builder</Link>
            <Link href="/marketplace" className="text-xs text-white/20 hover:text-white/40">Marketplace</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
