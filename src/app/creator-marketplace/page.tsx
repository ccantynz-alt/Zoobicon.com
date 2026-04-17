"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Store,
  Search,
  Star,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Eye,
  Filter,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Crown,
  Package,
  Wallet,
  ArrowUpRight,
} from "lucide-react";
import {
  getMarketplaceTemplates,
  getCreatorEarnings,
  getFeaturedCreator,
  formatPrice,
  MARKETPLACE_CATEGORIES,
  type MarketplaceTemplate,
  type CreatorEarnings,
  type FeaturedCreator,
} from "@/lib/creator-marketplace";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };

type View = "browse" | "sell";
type Sort = "trending" | "newest" | "best_selling" | "price_low" | "price_high";

export default function CreatorMarketplacePage() {
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);
  useEffect(() => {
    try {
      const stored = localStorage.getItem("zoobicon_user");
      if (stored) setUser(JSON.parse(stored));
    } catch {}
  }, []);

  const [templates, setTemplates] = useState<MarketplaceTemplate[]>([]);
  const [earnings, setEarnings] = useState<CreatorEarnings>({ totalEarnings: 0, monthEarnings: 0, activeListings: 0, avgRating: 0, pendingPayout: 0, stripeConnected: false });
  const [featured, setFeatured] = useState<FeaturedCreator | null>(null);
  const [view, setView] = useState<View>("browse");
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState<Sort>("trending");

  useEffect(() => {
    setTemplates(getMarketplaceTemplates({ category, sort, search: searchQuery }));
    setEarnings(getCreatorEarnings());
    setFeatured(getFeaturedCreator());
  }, [category, sort, searchQuery]);

  const totalTemplates = templates.length;
  const totalSales = templates.reduce((s, t) => s + t.sales, 0);
  const avgRating = templates.length
    ? (templates.reduce((s, t) => s + t.rating, 0) / templates.length).toFixed(1)
    : "0";

  const STAT_CARDS = [
    { label: "Templates", value: String(totalTemplates), icon: Package, color: "from-stone-500 to-stone-600" },
    { label: "Total Sales", value: totalSales.toLocaleString(), icon: ShoppingCart, color: "from-stone-500 to-stone-600" },
    { label: "Avg Rating", value: avgRating, icon: Star, color: "from-stone-500 to-stone-600" },
    { label: "Creators", value: String(new Set(templates.map((t) => t.creatorId)).size), icon: Crown, color: "from-stone-500 to-stone-600" },
  ];

  const SORT_OPTIONS: { value: Sort; label: string }[] = [
    { value: "trending", label: "Trending" },
    { value: "newest", label: "Newest" },
    { value: "best_selling", label: "Best Selling" },
    { value: "price_low", label: "Price: Low to High" },
    { value: "price_high", label: "Price: High to Low" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a12]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
          <Link href="/" className="text-xl font-bold tracking-tight bg-gradient-to-r from-stone-400 to-stone-400 bg-clip-text text-transparent">Zoobicon</Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-1.5"><LayoutDashboard className="w-3.5 h-3.5" /> Dashboard</Link>
            {user ? (
              <button onClick={() => { try { localStorage.removeItem("zoobicon_user"); } catch {} setUser(null); }} className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-1.5"><LogOut className="w-3.5 h-3.5" /> Sign out</button>
            ) : (
              <Link href="/auth/login" className="text-sm text-white/60 hover:text-white transition-colors">Sign in</Link>
            )}
          </div>
        </div>
      </nav>

      <header className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-600/10 via-stone-600/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 py-16 relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-stone-500 to-stone-600"><Store className="w-6 h-6" /></div>
              <span className="text-sm font-medium text-white/50 uppercase tracking-wider">Creator Economy</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-3">
              <span className="bg-gradient-to-r from-stone-400 via-stone-400 to-stone-400 bg-clip-text text-transparent">Creator Marketplace</span>
            </h1>
            <p className="text-lg text-white/50 max-w-2xl">Sell your designs. Earn while you sleep. 70% creator revenue share on every sale.</p>
          </motion.div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* Stats */}
        <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STAT_CARDS.map((s) => (
            <motion.div key={s.label} variants={fadeUp} className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-white/50">{s.label}</span>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${s.color}`}><s.icon className="w-4 h-4" /></div>
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* View Toggle */}
        <div className="flex gap-2">
          <button onClick={() => setView("browse")} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${view === "browse" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}>Browse Templates</button>
          <button onClick={() => setView("sell")} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${view === "sell" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}>Sell Your Designs</button>
        </div>

        {view === "browse" && (
          <>
            {/* Featured Creator */}
            {featured && (
              <motion.div variants={fadeUp} initial="hidden" animate="visible" className="bg-gradient-to-br from-stone-500/10 to-stone-500/5 border border-stone-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-1.5 text-xs text-stone-400 font-semibold mb-3"><Crown className="w-3.5 h-3.5" /> FEATURED CREATOR</div>
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-stone-500 to-stone-600 flex items-center justify-center font-bold text-xl">{featured.avatar}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{featured.name}</h3>
                    <p className="text-sm text-white/50 mt-1">{featured.bio}</p>
                    <p className="text-sm text-stone-400 mt-2">{featured.totalSales.toLocaleString()} total sales</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Search + Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search templates..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-stone-500/50"
                />
              </div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
              >
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value} className="bg-[#1a1a2e]">{o.label}</option>)}
              </select>
            </div>

            {/* Categories */}
            <div className="flex gap-2 flex-wrap">
              {MARKETPLACE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    category === cat ? "bg-stone-500/20 text-stone-400 border border-stone-500/30" : "bg-white/5 text-white/50 border border-white/10 hover:text-white/70"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Template Grid */}
            <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {templates.map((t) => (
                <motion.div key={t.id} variants={fadeUp} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-colors group cursor-pointer">
                  <div className={`h-36 bg-gradient-to-br ${t.previewGradient} relative`}>
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <Eye className="w-8 h-8 text-white/40 group-hover:text-white/60 transition-colors" />
                    </div>
                    {t.price === 0 && (
                      <span className="absolute top-3 left-3 px-2 py-0.5 bg-stone-500 rounded text-[10px] font-bold">FREE</span>
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-sm mb-1 truncate">{t.name}</h4>
                    <p className="text-xs text-white/40 line-clamp-2 mb-3">{t.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[8px] font-bold">{t.creatorName.charAt(0)}</div>
                        <span className="text-xs text-white/40">{t.creatorName}</span>
                      </div>
                      <span className="text-sm font-bold">{formatPrice(t.price)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-white/30">
                      <span className="flex items-center gap-1"><Star className="w-3 h-3 text-stone-400" /> {t.rating}</span>
                      <span>{t.sales} sales</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </>
        )}

        {view === "sell" && (
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
            {/* Earnings Overview */}
            <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <p className="text-sm text-white/50 mb-1">Total Earnings</p>
                <p className="text-3xl font-bold text-stone-400">${(earnings.totalEarnings / 100).toLocaleString()}</p>
                <p className="text-xs text-white/30 mt-1">70% of all sales revenue</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <p className="text-sm text-white/50 mb-1">This Month</p>
                <p className="text-3xl font-bold">${(earnings.monthEarnings / 100).toLocaleString()}</p>
                <p className="text-xs text-white/30 mt-1">{earnings.activeListings} active listings</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <p className="text-sm text-white/50 mb-1">Pending Payout</p>
                <p className="text-3xl font-bold text-stone-400">${(earnings.pendingPayout / 100).toLocaleString()}</p>
                {!earnings.stripeConnected && (
                  <button onClick={() => {}} className="mt-2 px-3 py-1.5 bg-stone-500/20 text-stone-400 border border-stone-500/30 rounded-lg text-xs font-medium">
                    Connect Stripe
                  </button>
                )}
              </div>
            </motion.div>

            {/* How it works */}
            <motion.div variants={fadeUp} className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">How it works</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { step: "1", title: "Create a template", desc: "Build a site using the AI builder, then list it on the marketplace." },
                  { step: "2", title: "Set your price", desc: "Choose free or $5 - $99. You keep 70% of every sale." },
                  { step: "3", title: "Earn passively", desc: "Your templates sell 24/7. Get paid monthly via Stripe." },
                ].map((s) => (
                  <div key={s.step} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-stone-500 to-stone-600 flex items-center justify-center text-sm font-bold shrink-0">{s.step}</div>
                    <div>
                      <p className="font-medium text-sm">{s.title}</p>
                      <p className="text-xs text-white/40 mt-1">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div variants={fadeUp} className="text-center">
              <Link href="/builder" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-stone-500 to-stone-600 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
                Start Building <ArrowUpRight className="w-4 h-4" />
              </Link>
              <p className="text-sm text-white/30 mt-2">Build a site, then list it as a template</p>
            </motion.div>
          </motion.div>
        )}
      </main>

      <footer className="border-t border-white/10 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/30">&copy; {new Date().getFullYear()} Zoobicon. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-sm text-white/30 hover:text-white/60 transition-colors">Privacy</Link>
            <Link href="/terms" className="text-sm text-white/30 hover:text-white/60 transition-colors">Terms</Link>
            <Link href="/support" className="text-sm text-white/30 hover:text-white/60 transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
