"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Receipt,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  Sparkles,
  Plus,
  Send,
  FileText,
  ArrowUpRight,
  LayoutDashboard,
  LogOut,
  CreditCard,
  Calendar,
  RotateCcw,
  Eye,
} from "lucide-react";
import {
  getInvoices,
  getClients,
  getInvoiceStats,
  getProposals,
  getRecurringInvoices,
  getPaymentEvents,
  formatCurrency,
  formatDate,
  type Invoice,
  type Client,
  type Proposal,
  type RecurringInvoice,
  type PaymentEvent,
} from "@/lib/invoicing";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

type Tab = "invoices" | "clients" | "proposals" | "recurring";

export default function InvoicingPage() {
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);
  useEffect(() => {
    try {
      const stored = localStorage.getItem("zoobicon_user");
      if (stored) setUser(JSON.parse(stored));
    } catch {}
  }, []);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [recurring, setRecurring] = useState<RecurringInvoice[]>([]);
  const [payments, setPayments] = useState<PaymentEvent[]>([]);
  const [stats, setStats] = useState({ outstanding: 3200, paidThisMonth: 8750, overdue: 1100, overdueCount: 0, totalRevenue: 45200 });
  const [tab, setTab] = useState<Tab>("invoices");
  const [aiDescription, setAiDescription] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    setInvoices(getInvoices());
    setClients(getClients());
    setProposals(getProposals());
    setRecurring(getRecurringInvoices());
    setPayments(getPaymentEvents());
    const s = getInvoiceStats();
    setStats({
      outstanding: s.outstanding || 3200,
      paidThisMonth: s.paidThisMonth || 8750,
      overdue: s.overdue || 1100,
      overdueCount: s.overdueCount || 2,
      totalRevenue: s.totalRevenue || 45200,
    });
  }, []);

  const handleGenerate = () => {
    if (!aiDescription.trim()) return;
    setGenerating(true);
    setTimeout(() => setGenerating(false), 2000);
  };

  const invoiceStatusColor = (s: string) => {
    if (s === "paid" || s === "accepted") return "bg-emerald-500/20 text-emerald-400";
    if (s === "sent") return "bg-blue-500/20 text-blue-400";
    if (s === "overdue" || s === "declined") return "bg-red-500/20 text-red-400";
    return "bg-white/10 text-white/40";
  };

  const STAT_CARDS = [
    { label: "Outstanding", value: formatCurrency(stats.outstanding), icon: Clock, color: "from-amber-500 to-yellow-600", valueColor: "text-amber-400" },
    { label: "Paid This Month", value: formatCurrency(stats.paidThisMonth), icon: CheckCircle2, color: "from-emerald-500 to-teal-600", valueColor: "text-emerald-400" },
    { label: "Overdue", value: formatCurrency(stats.overdue), icon: AlertTriangle, color: "from-red-500 to-rose-600", valueColor: "text-red-400" },
    { label: "Total Revenue", value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: "from-indigo-500 to-purple-600", valueColor: "text-white" },
  ];

  const TABS: { key: Tab; label: string }[] = [
    { key: "invoices", label: "Invoices" },
    { key: "clients", label: "Clients" },
    { key: "proposals", label: "Proposals" },
    { key: "recurring", label: "Recurring" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a12]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
          <Link href="/" className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Zoobicon</Link>
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
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 via-blue-600/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 py-16 relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600"><Receipt className="w-6 h-6" /></div>
              <span className="text-sm font-medium text-white/50 uppercase tracking-wider">Business OS</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-3">
              <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">AI Invoicing & Proposals</span>
            </h1>
            <p className="text-lg text-white/50 max-w-2xl">Get paid faster with AI-generated invoices. Create professional invoices and proposals in seconds.</p>
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
              <p className={`text-2xl font-bold ${s.valueColor}`}>{s.value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* AI Invoice Creator */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" /> AI Invoice Creator
          </h3>
          <p className="text-sm text-white/40 mb-3">Describe the work and we will generate a professional invoice with line items, tax, and totals.</p>
          <textarea
            value={aiDescription}
            onChange={(e) => setAiDescription(e.target.value)}
            placeholder="e.g. 'Built a 5-page website with SEO optimization for a bakery. $1800 for design, $400 for SEO setup.'"
            className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-white/30 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
          <div className="flex justify-end mt-3">
            <button
              onClick={handleGenerate}
              disabled={generating || !aiDescription.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-2"
            >
              {generating ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generate Invoice</>
              )}
            </button>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10 pb-1">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${tab === t.key ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}>{t.label}</button>
          ))}
        </div>

        {/* Invoices */}
        {tab === "invoices" && (
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
            <motion.div variants={fadeUp} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-lg font-semibold">All Invoices</h3>
                <button onClick={() => {}} className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"><Plus className="w-4 h-4" /> New Invoice</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-white/40 text-left">
                      <th className="px-6 py-3 font-medium">Invoice</th>
                      <th className="px-6 py-3 font-medium">Client</th>
                      <th className="px-6 py-3 font-medium">Amount</th>
                      <th className="px-6 py-3 font-medium">Issued</th>
                      <th className="px-6 py-3 font-medium">Due</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-3 font-mono text-sm font-medium">{inv.number}</td>
                        <td className="px-6 py-3">
                          <p className="font-medium">{inv.clientName}</p>
                          <p className="text-xs text-white/30">{inv.clientEmail}</p>
                        </td>
                        <td className="px-6 py-3 font-semibold">{formatCurrency(inv.total)}</td>
                        <td className="px-6 py-3 text-white/50">{formatDate(inv.issuedAt)}</td>
                        <td className="px-6 py-3 text-white/50">{formatDate(inv.dueAt)}</td>
                        <td className="px-6 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${invoiceStatusColor(inv.status)}`}>{inv.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Payment Timeline */}
            <motion.div variants={fadeUp} className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Payments</h3>
              <div className="space-y-3">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center gap-4 py-3 border-b border-white/5 last:border-b-0">
                    <div className="p-2 rounded-lg bg-emerald-500/10"><CreditCard className="w-4 h-4 text-emerald-400" /></div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{p.clientName}</p>
                      <p className="text-xs text-white/30">{p.invoiceNumber} &middot; {p.method}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-400">{formatCurrency(p.amount)}</p>
                      <p className="text-xs text-white/30">{formatDate(p.paidAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Clients */}
        {tab === "clients" && (
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => {}} className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"><Plus className="w-4 h-4" /> Add Client</button>
            </div>
            {clients.map((c) => (
              <motion.div key={c.id} variants={fadeUp} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-sm">
                    {c.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-white/40">{c.company || c.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8 text-sm">
                  <div className="text-right">
                    <p className="text-white/40">Total Billed</p>
                    <p className="font-semibold">{formatCurrency(c.totalBilled)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/40">Invoices</p>
                    <p className="font-semibold">{c.invoiceCount}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Proposals */}
        {tab === "proposals" && (
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-4">
            {proposals.map((p) => (
              <motion.div key={p.id} variants={fadeUp} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold">{p.title}</h4>
                    <p className="text-sm text-white/40 mt-1">For {p.clientName} &middot; {formatDate(p.createdAt)}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${invoiceStatusColor(p.status)}`}>{p.status}</span>
                </div>
                <p className="text-sm text-white/50 mb-3">{p.summary}</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {p.deliverables.slice(0, 3).map((d, i) => (
                      <span key={i} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-[11px] text-white/50">{d}</span>
                    ))}
                  </div>
                  <p className="font-bold text-lg">{formatCurrency(p.total)}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Recurring */}
        {tab === "recurring" && (
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-4">
            {recurring.map((r) => (
              <motion.div key={r.id} variants={fadeUp} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-lg bg-indigo-500/10"><RotateCcw className="w-5 h-5 text-indigo-400" /></div>
                  <div>
                    <p className="font-medium">{r.clientName}</p>
                    <p className="text-sm text-white/40">{r.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(r.amount)}</p>
                    <p className="text-xs text-white/30 capitalize">{r.frequency}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/40">Next</p>
                    <p className="text-xs">{formatDate(r.nextDate)}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${r.active ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white/40"}`}>
                    {r.active ? "Active" : "Paused"}
                  </span>
                </div>
              </motion.div>
            ))}
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
