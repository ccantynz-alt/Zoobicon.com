"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  DollarSign,
  Package,
  TrendingUp,
  Plus,
  ExternalLink,
  Copy,
  Check,
  Tag,
  Download,
  LayoutDashboard,
  LogOut,
  Eye,
  FileText,
  Layers,
  GraduationCap,
  Key,
} from "lucide-react";
import {
  getProducts,
  getOrders,
  getStoreStats,
  getDiscountCodes,
  getStorefrontUrl,
  formatCurrency,
  formatDate,
  formatTimeAgo,
  type Product,
  type Order,
  type DiscountCode,
} from "@/lib/digital-store";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

type Tab = "products" | "orders" | "discounts" | "storefront";

const TYPE_ICONS: Record<string, React.ElementType> = {
  download: Download,
  template: Layers,
  course: GraduationCap,
  license: Key,
};

export default function StorePage() {
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);
  useEffect(() => {
    try {
      const stored = localStorage.getItem("zoobicon_user");
      if (stored) setUser(JSON.parse(stored));
    } catch {}
  }, []);

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [stats, setStats] = useState({ revenue: 4230, products: 8, sales: 147, monthRevenue: 890 });
  const [tab, setTab] = useState<Tab>("products");
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    setProducts(getProducts());
    setOrders(getOrders());
    setDiscounts(getDiscountCodes());
    const s = getStoreStats();
    setStats({ revenue: s.revenue || 4230, products: s.products || 8, sales: s.sales || 147, monthRevenue: s.monthRevenue || 890 });
  }, []);

  const copyStorefrontLink = () => {
    navigator.clipboard.writeText(getStorefrontUrl("mystore"));
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const statusColor = (s: string) => {
    if (s === "completed" || s === "active") return "bg-stone-500/20 text-stone-400";
    if (s === "pending") return "bg-stone-500/20 text-stone-400";
    if (s === "refunded") return "bg-stone-500/20 text-stone-400";
    if (s === "draft") return "bg-white/10 text-white/40";
    return "bg-white/10 text-white/60";
  };

  const STAT_CARDS = [
    { label: "Total Revenue", value: `$${stats.revenue.toLocaleString()}`, icon: DollarSign, color: "from-stone-500 to-stone-600" },
    { label: "Products Listed", value: String(stats.products), icon: Package, color: "from-stone-500 to-stone-600" },
    { label: "Total Sales", value: String(stats.sales), icon: ShoppingBag, color: "from-stone-500 to-stone-600" },
    { label: "This Month", value: `$${stats.monthRevenue.toLocaleString()}`, icon: TrendingUp, color: "from-stone-500 to-stone-600" },
  ];

  const TABS: { key: Tab; label: string }[] = [
    { key: "products", label: "Products" },
    { key: "orders", label: "Recent Orders" },
    { key: "discounts", label: "Discount Codes" },
    { key: "storefront", label: "Storefront" },
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
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-stone-500 to-stone-600"><ShoppingBag className="w-6 h-6" /></div>
              <span className="text-sm font-medium text-white/50 uppercase tracking-wider">Business OS</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-3">
              <span className="bg-gradient-to-r from-stone-400 via-stone-400 to-stone-400 bg-clip-text text-transparent">Digital Product Store</span>
            </h1>
            <p className="text-lg text-white/50 max-w-2xl">Sell anything digital — PDFs, templates, courses, presets. Zero setup, instant delivery, built-in payments.</p>
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

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10 pb-1">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${tab === t.key ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}>{t.label}</button>
          ))}
        </div>

        {/* Products */}
        {tab === "products" && (
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
            <div className="flex justify-end">
              <button onClick={() => {}} className="px-4 py-2.5 bg-gradient-to-r from-stone-500 to-stone-600 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Product
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {products.map((p) => {
                const TypeIcon = TYPE_ICONS[p.type] || Package;
                return (
                  <motion.div key={p.id} variants={fadeUp} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-colors group">
                    <div className="h-32 bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center">
                      <TypeIcon className="w-10 h-10 text-white/20 group-hover:text-white/30 transition-colors" />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-sm truncate">{p.name}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${statusColor(p.status)}`}>{p.status}</span>
                      </div>
                      <p className="text-xs text-white/40 line-clamp-2 mb-3">{p.description}</p>
                      <div className="flex items-center justify-between text-xs text-white/50">
                        <span className="font-semibold text-white">{formatCurrency(p.price)}</span>
                        <span>{p.sales} sales</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Orders */}
        {tab === "orders" && (
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-white/40 text-left">
                    <th className="px-6 py-3 font-medium">Order ID</th>
                    <th className="px-6 py-3 font-medium">Customer</th>
                    <th className="px-6 py-3 font-medium">Product</th>
                    <th className="px-6 py-3 font-medium">Amount</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-3 font-mono text-xs text-white/50">{o.id}</td>
                      <td className="px-6 py-3 text-white/60">{o.customerEmail}</td>
                      <td className="px-6 py-3 font-medium">{o.productName}</td>
                      <td className="px-6 py-3">${o.amount}</td>
                      <td className="px-6 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColor(o.status)}`}>{o.status}</span></td>
                      <td className="px-6 py-3 text-white/40">{formatTimeAgo(o.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Discounts */}
        {tab === "discounts" && (
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => {}} className="text-sm text-stone-400 hover:text-stone-300 flex items-center gap-1"><Plus className="w-4 h-4" /> Create Code</button>
            </div>
            {discounts.map((d) => (
              <motion.div key={d.code} variants={fadeUp} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-lg bg-stone-500/10"><Tag className="w-5 h-5 text-stone-400" /></div>
                  <div>
                    <p className="font-mono font-bold text-base">{d.code}</p>
                    <p className="text-sm text-white/40">
                      {d.type === "percentage" ? `${d.value}% off` : `$${d.value} off`} &middot; {d.uses} uses
                      {d.maxUses ? ` / ${d.maxUses} max` : ""}
                    </p>
                  </div>
                </div>
                {d.expiresAt && (
                  <span className="text-xs text-white/30">Expires {formatDate(d.expiresAt)}</span>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Storefront */}
        {tab === "storefront" && (
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
            <motion.div variants={fadeUp} className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-2">Your Storefront</h3>
              <p className="text-sm text-white/40 mb-4">Preview and share your digital product store.</p>
              <div className="bg-[#0f2148] border border-white/10 rounded-xl p-4 flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <ExternalLink className="w-4 h-4 text-white/30" />
                  <span className="text-sm text-stone-400">{getStorefrontUrl("mystore")}</span>
                </div>
                <button onClick={copyStorefrontLink} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg text-xs hover:bg-white/10 transition-colors">
                  {linkCopied ? <Check className="w-3.5 h-3.5 text-stone-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {linkCopied ? "Copied!" : "Copy"}
                </button>
              </div>
            </motion.div>
            <motion.div variants={fadeUp} className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-2">Payout Info</h3>
              <p className="text-sm text-white/40 mb-4">Connect Stripe to receive payouts from your sales.</p>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-xs text-white/40">Available for payout</p>
                  <p className="text-2xl font-bold text-stone-400 mt-1">$0.00</p>
                </div>
                <button onClick={() => {}} className="px-5 py-2.5 bg-gradient-to-r from-stone-500 to-stone-600 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
                  Connect Stripe
                </button>
              </div>
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
