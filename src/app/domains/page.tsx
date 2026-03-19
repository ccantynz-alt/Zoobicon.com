"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import BackgroundEffects from "@/components/BackgroundEffects";
import HeroEffects, { CursorGlowTracker } from "@/components/HeroEffects";
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
  Loader2,
  User,
  X,
} from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};
const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

const POPULAR_TLDS = [
  { tld: ".com", price: 12.99, renewal: 14.99, desc: "The gold standard", popular: true },
  { tld: ".io", price: 39.99, renewal: 44.99, desc: "Tech & startups", popular: true },
  { tld: ".ai", price: 79.99, renewal: 89.99, desc: "AI & machine learning", popular: true },
  { tld: ".dev", price: 14.99, renewal: 16.99, desc: "Developer projects" },
  { tld: ".app", price: 14.99, renewal: 16.99, desc: "Mobile & web apps" },
  { tld: ".co", price: 29.99, renewal: 34.99, desc: "Modern companies" },
  { tld: ".sh", price: 24.99, renewal: 29.99, desc: "CLI & DevOps tools" },
  { tld: ".xyz", price: 9.99, renewal: 12.99, desc: "Next-gen branding" },
  { tld: ".net", price: 13.99, renewal: 15.99, desc: "Network & infrastructure" },
  { tld: ".org", price: 11.99, renewal: 13.99, desc: "Organizations & nonprofits" },
  { tld: ".me", price: 8.99, renewal: 19.99, desc: "Personal branding" },
  { tld: ".us", price: 8.99, renewal: 10.99, desc: "United States" },
];

const UPSELLS = [
  { icon: Shield, name: "WHOIS Privacy", price: "Free", desc: "Hide your personal info from public WHOIS lookups. Included free with every domain.", included: true },
  { icon: Lock, name: "SSL Certificate", price: "$9.99/yr", desc: "Wildcard SSL for your domain. Auto-renewed, auto-configured on Zoobicon hosting." },
  { icon: Mail, name: "Email Hosting", price: "$4.99/mo", desc: "Professional email @yourdomain.com. 10GB per mailbox, unlimited aliases, spam filtering." },
  { icon: Server, name: "Premium Hosting", price: "$12.99/mo", desc: "Ultra-fast hosting with global CDN, 99.99% uptime SLA, and automatic backups." },
  { icon: Globe, name: "AI Website Builder", price: "From $0/mo", desc: "Build your website instantly with AI. Just describe what you want, we build it." },
  { icon: Search, name: "SEO Agent", price: "$29/mo", desc: "Autonomous SEO agent that ranks your new domain on Google. Set it and forget it." },
];

interface SearchResult {
  domain: string;
  available: boolean;
  price?: number;
  currency?: string;
  premium?: boolean;
  period?: number;
}

interface CartItem {
  domain: string;
  price: number;
  period: number;
}

interface RegistrantInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export default function DomainsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("zoobicon_domain_cart");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Checkout state
  const [showCheckout, setShowCheckout] = useState(false);
  const [registrant, setRegistrant] = useState<RegistrantInfo>({
    firstName: "", lastName: "", email: "", phone: "",
    address1: "", city: "", state: "", postalCode: "", country: "US",
  });
  const [registering, setRegistering] = useState(false);
  const [registerResult, setRegisterResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!q || q.length < 2) return;

    setSearching(true);
    setSearchError("");
    setSearchResults([]);

    try {
      const res = await fetch(`/api/domains/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setSearchResults(data.results || []);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  const toggleCart = (domain: string, price: number) => {
    setCart((prev) => {
      const exists = prev.find((c) => c.domain === domain);
      const next = exists
        ? prev.filter((c) => c.domain !== domain)
        : [...prev, { domain, price, period: 1 }];
      try { localStorage.setItem("zoobicon_domain_cart", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const removeFromCart = (domain: string) => {
    setCart((prev) => {
      const next = prev.filter((c) => c.domain !== domain);
      try { localStorage.setItem("zoobicon_domain_cart", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.price, 0);
  const cartDomains = cart.map((c) => c.domain);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registering || cart.length === 0) return;
    setRegistering(true);
    setRegisterResult(null);

    try {
      const results: string[] = [];
      for (const item of cart) {
        const res = await fetch("/api/domains/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            domain: item.domain,
            period: item.period,
            email: registrant.email,
            autoRenew: true,
            privacyProtection: true,
            registrant,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          results.push(`${item.domain}: ${data.error || "Failed"}`);
        } else {
          results.push(`${item.domain}: Registered!`);
        }
      }
      const allSuccess = results.every((r) => r.includes("Registered"));
      setRegisterResult({
        success: allSuccess,
        message: allSuccess
          ? `Successfully registered ${cart.length} domain${cart.length > 1 ? "s" : ""}!`
          : results.join("\n"),
      });
      if (allSuccess) {
        setCart([]);
        try { localStorage.removeItem("zoobicon_domain_cart"); } catch {}
      }
    } catch (err) {
      setRegisterResult({
        success: false,
        message: err instanceof Error ? err.message : "Registration failed",
      });
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      <BackgroundEffects preset="technical" />

      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#0a0a12]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-cyan flex items-center justify-center">
                <Globe className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">Zoobicon</span>
            </Link>
            <span className="text-xs text-white/60">/</span>
            <span className="text-sm text-white/65">Domains</span>
          </div>
          <div className="flex items-center gap-4">
            {cart.length > 0 && (
              <button
                onClick={() => setShowCheckout(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan text-xs font-bold hover:bg-accent-cyan/20 transition-colors"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                {cart.length} domain{cart.length > 1 ? "s" : ""} — ${cartTotal.toFixed(2)}
              </button>
            )}
            <Link href="/auth/signup" className="btn-gradient px-5 py-2 rounded-xl text-sm font-semibold text-white">
              <span>Get Started</span>
            </Link>
          </div>
        </div>
      </nav>
      <CursorGlowTracker />

      {/* Hero */}
      <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28">
        <HeroEffects variant="cyan" cursorGlow particles particleCount={35} interactiveGrid aurora beams />
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-3 mb-6">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent-cyan/20 bg-accent-cyan/5">
                <Globe className="w-3 h-3 text-accent-cyan" />
                <span className="text-xs font-medium text-accent-cyan">Domain Registration</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <Zap size={12} /> Powered by Tucows/OpenSRS
              </span>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-5xl md:text-6xl lg:text-8xl font-black tracking-tight leading-[0.9] mb-6">
              Claim Your<br />
              <span className="gradient-text-hero">Digital Territory.</span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="max-w-2xl text-lg md:text-xl text-white/60 leading-relaxed mb-10">
              Register premium domains at unbeatable prices. Every domain comes with free WHOIS privacy,
              DNS management, and seamless integration with the Zoobicon AI platform.
            </motion.p>

            {/* Search Bar */}
            <motion.div variants={fadeInUp} className="max-w-3xl">
              <form onSubmit={handleSearch} className="relative">
                <div className="flex items-center bg-white/[0.07] border border-white/[0.12] rounded-2xl overflow-hidden focus-within:border-accent-cyan/30 transition-colors">
                  <Search className="w-5 h-5 text-white/60 ml-5 flex-shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for your perfect domain name..."
                    className="flex-1 bg-transparent px-4 py-5 text-white placeholder:text-white/60 outline-none text-lg"
                  />
                  <button
                    type="submit"
                    disabled={searching}
                    className="btn-gradient px-8 py-3 mr-2 rounded-xl text-sm font-bold text-white flex items-center gap-2 disabled:opacity-50"
                  >
                    {searching ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    {searching ? "Searching..." : "Search"}
                  </button>
                </div>
              </form>

              {/* Search Error */}
              {searchError && (
                <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {searchError}
                </div>
              )}

              {/* Search Results */}
              {searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 border border-white/[0.10] rounded-2xl overflow-hidden bg-dark-300/80 backdrop-blur-xl"
                >
                  <div className="p-4 border-b border-white/[0.10]">
                    <div className="text-xs text-white/60 font-medium uppercase tracking-wider">
                      {searchResults.filter((r) => r.available).length} of {searchResults.length} domains available
                    </div>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {searchResults.map((result) => (
                      <div
                        key={result.domain}
                        className={`flex items-center justify-between px-5 py-4 transition-colors ${
                          result.available ? "hover:bg-white/[0.05]" : "opacity-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {result.available ? (
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                          )}
                          <span className="text-base font-semibold">{result.domain}</span>
                          {result.premium && (
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                              PREMIUM
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-black">
                            ${result.price?.toFixed(2) || "14.99"}
                            <span className="text-xs text-white/60 font-normal">/yr</span>
                          </span>
                          {result.available ? (
                            <button
                              onClick={() => toggleCart(result.domain, result.price || 14.99)}
                              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                cartDomains.includes(result.domain)
                                  ? "bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30"
                                  : "btn-gradient text-white"
                              }`}
                            >
                              {cartDomains.includes(result.domain) ? (
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
                    <div className="p-4 border-t border-white/[0.10] bg-accent-cyan/[0.03]">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-bold">{cart.length} domain{cart.length > 1 ? "s" : ""} selected</span>
                          <span className="text-xs text-white/60 ml-2">Total: ${cartTotal.toFixed(2)}/yr</span>
                        </div>
                        <button
                          onClick={() => setShowCheckout(true)}
                          className="group btn-gradient px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2"
                        >
                          <span>Proceed to Checkout</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>

            {/* Stats */}
            <motion.div variants={fadeInUp} className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
              {[
                { value: "16+", label: "TLDs available" },
                { value: "$8.99", label: "Domains from" },
                { value: "Free", label: "WHOIS privacy" },
                { value: "24/7", label: "DNS management" },
              ].map((stat) => (
                <div key={stat.label} className="gradient-border p-4 rounded-xl text-center">
                  <div className="text-2xl font-black gradient-text-static">{stat.value}</div>
                  <div className="text-xs text-white/60 mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Popular TLDs */}
      <section className="py-20 border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Popular <span className="gradient-text">Extensions</span>
              </h2>
              <p className="text-lg text-white/60">Premium domains at competitive prices. Register for years and save more.</p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {POPULAR_TLDS.map((tld) => (
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
                        <span className="text-xs text-white/60 font-normal">/yr</span>
                      </div>
                      <div className="text-[10px] text-white/60">
                        Renews at ${tld.renewal}/yr
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-white/60 mb-4">{tld.desc}</p>
                  <div className="flex items-center gap-2 text-[10px] text-white/60">
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
      <section className="py-20 border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Power Up Your<br /><span className="gradient-text">Domain</span>
              </h2>
              <p className="text-lg text-white/60">Every domain connects to the full Zoobicon ecosystem. Add what you need.</p>
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
                  <p className="text-xs text-white/60 leading-relaxed">{upsell.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Zoobicon Domains */}
      <section className="py-20 border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Why Buy<br /><span className="gradient-text">From Us?</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: BadgeCheck, title: "Tucows Reseller", desc: "Domains registered through Tucows/OpenSRS, one of the world's largest registrars. Your domains are safe." },
                { icon: Zap, title: "Instant Activation", desc: "Domains go live in seconds. Connect to Zoobicon AI builder instantly and start building." },
                { icon: Tag, title: "Transparent Pricing", desc: "No hidden fees, no domain upselling tricks. What you see is exactly what you pay." },
                { icon: Clock, title: "Easy Management", desc: "Full DNS editor, auto-renewal, nameserver management, and transfer support. All in one dashboard." },
              ].map((item, i) => (
                <motion.div key={i} variants={fadeInUp} className="gradient-border p-6 rounded-xl group card-hover">
                  <item.icon className="w-8 h-8 text-brand-400/50 mb-4 group-hover:text-brand-400 transition-colors" />
                  <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Domain + AI Bundle */}
      <section className="py-20 border-t border-white/[0.08]">
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
                    Domain + AI Website<br /><span className="gradient-text">From $8.99</span>
                  </h3>
                  <p className="text-base text-white/60 leading-relaxed mb-6">
                    Register a domain and build your entire website with AI in minutes. The fastest way to go from
                    idea to live website. Includes free hosting, SSL, and WHOIS privacy.
                  </p>
                  <ul className="space-y-2 mb-8">
                    {[
                      "Domain registration from $8.99/yr",
                      "AI website builder included free",
                      "Free SSL certificate & WHOIS privacy",
                      "Global CDN hosting included",
                      "SEO Agent add-on available",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-white/65">
                        <Check className="w-4 h-4 text-accent-cyan flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/builder"
                    className="group btn-gradient px-6 py-3 rounded-xl text-sm font-bold text-white inline-flex items-center gap-2 shadow-glow-cyan"
                  >
                    <span>Search Domains Above</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
                <div className="flex-shrink-0 hidden md:block">
                  <div className="w-64 h-64 rounded-2xl bg-gradient-to-br from-accent-cyan/20 to-brand-500/20 border border-accent-cyan/10 flex items-center justify-center">
                    <div className="text-center">
                      <Globe className="w-16 h-16 text-accent-cyan/40 mx-auto mb-4" />
                      <div className="text-3xl font-black gradient-text-static">$8.99</div>
                      <div className="text-xs text-white/60 mt-1">Domain + AI Site</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-white/[0.08]">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <Globe className="w-12 h-12 text-accent-cyan/30 mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Your Perfect Domain<br /><span className="gradient-text">Is Waiting</span>
          </h2>
          <p className="text-lg text-white/60 mb-8">16+ extensions. Unbeatable prices. Free privacy protection. Instant AI website builder.</p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="group btn-gradient px-8 py-4 rounded-xl text-base font-bold text-white inline-flex items-center gap-2 shadow-glow-cyan"
          >
            <Search className="w-5 h-5" />
            <span>Search Domains Now</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      <footer className="border-t border-white/[0.08] py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
          <div className="text-xs text-white/60">&copy; 2026 Zoobicon</div>
          <div className="flex gap-4">
            <Link href="/" className="text-xs text-white/60 hover:text-white/60">Home</Link>
            <Link href="/products/website-builder" className="text-xs text-white/60 hover:text-white/60">Builder</Link>
            <Link href="/marketplace" className="text-xs text-white/60 hover:text-white/60">Marketplace</Link>
          </div>
        </div>
      </footer>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCheckout(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0a0a12] border border-white/[0.12] rounded-2xl shadow-2xl"
          >
            <div className="sticky top-0 bg-[#0a0a12] border-b border-white/[0.10] p-6 flex items-center justify-between z-10">
              <h3 className="text-xl font-black">Register Domains</h3>
              <button onClick={() => setShowCheckout(false)} className="text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Cart items */}
              <div>
                <h4 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-3">Your Domains</h4>
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.domain} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.05] border border-white/[0.08]">
                      <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-accent-cyan/50" />
                        <span className="font-semibold">{item.domain}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold">${item.price.toFixed(2)}<span className="text-xs text-white/60 font-normal">/yr</span></span>
                        <button onClick={() => removeFromCart(item.domain)} className="text-white/30 hover:text-red-400 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-3 pt-3 border-t border-white/[0.08]">
                  <span className="text-sm text-white/60">Total (first year)</span>
                  <span className="text-lg font-black">${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-emerald-400/80">
                  <Shield className="w-3 h-3" />
                  <span>Free WHOIS privacy included with all domains</span>
                </div>
              </div>

              {/* Registration success */}
              {registerResult?.success ? (
                <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <Check className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                  <h4 className="text-lg font-bold text-emerald-400 mb-2">Registration Complete!</h4>
                  <p className="text-sm text-white/60 mb-4">{registerResult.message}</p>
                  <div className="flex gap-3 justify-center">
                    <Link href="/builder" className="btn-gradient px-5 py-2 rounded-xl text-sm font-bold text-white">
                      Build Your Site
                    </Link>
                    <button onClick={() => { setShowCheckout(false); setRegisterResult(null); }} className="px-5 py-2 rounded-xl text-sm font-bold text-white/60 border border-white/[0.12] hover:bg-white/[0.05]">
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                /* Registrant Form */
                <form onSubmit={handleRegister}>
                  <h4 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <User className="w-3.5 h-3.5" /> Registrant Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: "firstName", label: "First Name", type: "text", placeholder: "John" },
                      { key: "lastName", label: "Last Name", type: "text", placeholder: "Doe" },
                      { key: "email", label: "Email", type: "email", placeholder: "john@example.com" },
                      { key: "phone", label: "Phone", type: "tel", placeholder: "+1.5551234567" },
                    ].map((field) => (
                      <div key={field.key}>
                        <label className="text-xs text-white/60 mb-1 block">{field.label}</label>
                        <input
                          type={field.type}
                          required
                          value={registrant[field.key as keyof RegistrantInfo]}
                          onChange={(e) => setRegistrant((p) => ({ ...p, [field.key]: e.target.value }))}
                          placeholder={field.placeholder}
                          className="w-full bg-white/[0.07] border border-white/[0.1] rounded-lg px-3 py-2 text-white placeholder:text-white/30 outline-none text-sm focus:border-accent-cyan/30 transition-colors"
                        />
                      </div>
                    ))}
                    <div className="col-span-2">
                      <label className="text-xs text-white/60 mb-1 block">Street Address</label>
                      <input
                        type="text"
                        required
                        value={registrant.address1}
                        onChange={(e) => setRegistrant((p) => ({ ...p, address1: e.target.value }))}
                        placeholder="123 Main St"
                        className="w-full bg-white/[0.07] border border-white/[0.1] rounded-lg px-3 py-2 text-white placeholder:text-white/30 outline-none text-sm focus:border-accent-cyan/30 transition-colors"
                      />
                    </div>
                    {[
                      { key: "city", label: "City", placeholder: "San Francisco" },
                      { key: "state", label: "State/Province", placeholder: "CA" },
                      { key: "postalCode", label: "Postal Code", placeholder: "94102" },
                      { key: "country", label: "Country Code", placeholder: "US" },
                    ].map((field) => (
                      <div key={field.key}>
                        <label className="text-xs text-white/60 mb-1 block">{field.label}</label>
                        <input
                          type="text"
                          required
                          value={registrant[field.key as keyof RegistrantInfo]}
                          onChange={(e) => setRegistrant((p) => ({ ...p, [field.key]: e.target.value }))}
                          placeholder={field.placeholder}
                          className="w-full bg-white/[0.07] border border-white/[0.1] rounded-lg px-3 py-2 text-white placeholder:text-white/30 outline-none text-sm focus:border-accent-cyan/30 transition-colors"
                        />
                      </div>
                    ))}
                  </div>

                  {registerResult && !registerResult.success && (
                    <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                      {registerResult.message}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={registering || cart.length === 0}
                    className="w-full mt-6 btn-gradient px-6 py-4 rounded-xl text-base font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {registering ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Register {cart.length} Domain{cart.length > 1 ? "s" : ""} — ${cartTotal.toFixed(2)}
                      </>
                    )}
                  </button>
                  <p className="text-center text-[10px] text-white/30 mt-3">
                    By registering, you agree to our Terms of Service and the Tucows/OpenSRS registration agreement.
                  </p>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
