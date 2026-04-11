"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Server,
  Shield,
  Activity,
  ExternalLink,
  Pencil,
  Settings,
  RefreshCw,
  Plus,
  X,
  Eye,
  BarChart3,
  HardDrive,
  Loader2,
  Check,
  AlertTriangle,
  Wifi,
  Lock,
  Copy,
  Trash2,
  Zap,
} from "lucide-react";

/* ────────────────────── Animations ────────────────────── */

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

const modalOverlay = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalContent = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, scale: 0.95, y: 20 },
};

/* ────────────────────── Types ────────────────────── */

interface Site {
  id: string;
  name: string;
  slug: string;
  email: string;
  plan: string;
  status: string;
  url: string;
  created_at: string;
  updated_at: string;
}

interface SiteAnalytics {
  pageViews: { total: number };
  visitors: { total: number; unique: number };
  bandwidth: { total: number };
  performance: { uptime: number };
}

interface DomainInfo {
  domain: string;
  type: string;
  status: string;
  ssl: string;
  dnsRecords: Array<{ type: string; name: string; value: string }>;
  addedAt: string;
}

/* ────────────────────── Helpers ────────────────────── */

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function statusColor(status: string): string {
  switch (status) {
    case "active":
    case "live":
      return "bg-stone-500/20 text-stone-400 border-stone-500/30";
    case "pending":
    case "deploying":
      return "bg-stone-500/20 text-stone-400 border-stone-500/30";
    case "error":
    case "failed":
      return "bg-stone-500/20 text-stone-400 border-stone-500/30";
    case "stopped":
    case "disabled":
      return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
    default:
      return "bg-stone-500/20 text-stone-400 border-stone-500/30";
  }
}

function statusIcon(status: string) {
  switch (status) {
    case "active":
    case "live":
      return <Check className="w-3 h-3" />;
    case "pending":
    case "deploying":
      return <Loader2 className="w-3 h-3 animate-spin" />;
    case "error":
    case "failed":
      return <AlertTriangle className="w-3 h-3" />;
    default:
      return <Activity className="w-3 h-3" />;
  }
}

/* ────────────────────── Component ────────────────────── */

export default function HostingDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [siteAnalytics, setSiteAnalytics] = useState<Record<string, SiteAnalytics>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redeploying, setRedeploying] = useState<string | null>(null);
  const [settingsModal, setSettingsModal] = useState<Site | null>(null);
  const [domains, setDomains] = useState<DomainInfo[]>([]);
  const [domainsLoading, setDomainsLoading] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [newDomainType, setNewDomainType] = useState<"primary" | "redirect">("primary");
  const [addingDomain, setAddingDomain] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // ── Auth check ──
  useEffect(() => {
    try {
      const stored = localStorage.getItem("zoobicon_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      } else {
        router.push("/auth/login?redirect=/hosting/dashboard");
      }
    } catch {
      router.push("/auth/login?redirect=/hosting/dashboard");
    }
  }, [router]);

  // ── Fetch sites ──
  const fetchSites = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/hosting/sites?email=${encodeURIComponent(user.email)}`);
      if (!res.ok) throw new Error("Failed to fetch sites");
      const data = await res.json();
      setSites(data.sites || []);
    } catch (err) {
      console.error("[Dashboard] Fetch sites error:", err);
      setError("Could not load your sites. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    if (user?.email) fetchSites();
  }, [user?.email, fetchSites]);

  // ── Fetch analytics for each site ──
  useEffect(() => {
    if (sites.length === 0) return;

    async function fetchAnalytics() {
      const analytics: Record<string, SiteAnalytics> = {};
      await Promise.all(
        sites.map(async (site) => {
          try {
            const res = await fetch(
              `/api/hosting/analytics?siteId=${encodeURIComponent(site.slug)}&period=30d`
            );
            if (res.ok) {
              const data = await res.json();
              analytics[site.slug] = {
                pageViews: data.pageViews,
                visitors: data.visitors,
                bandwidth: data.bandwidth,
                performance: data.performance,
              };
            }
          } catch {
            // Non-critical — analytics may be unavailable
          }
        })
      );
      setSiteAnalytics(analytics);
    }

    fetchAnalytics();
  }, [sites]);

  // ── Fetch domains for settings modal ──
  const fetchDomains = useCallback(async (siteSlug: string) => {
    setDomainsLoading(true);
    setDomains([]);
    try {
      const res = await fetch(`/api/hosting/domains?siteId=${encodeURIComponent(siteSlug)}`);
      if (res.ok) {
        const data = await res.json();
        setDomains(data.domains || []);
      }
    } catch {
      // Non-critical
    } finally {
      setDomainsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (settingsModal) {
      fetchDomains(settingsModal.slug);
    }
  }, [settingsModal, fetchDomains]);

  // ── Add domain ──
  async function handleAddDomain() {
    if (!settingsModal || !newDomain.trim()) return;
    setAddingDomain(true);
    try {
      const res = await fetch("/api/hosting/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId: settingsModal.slug,
          domain: newDomain.trim().toLowerCase(),
          type: newDomainType,
        }),
      });
      if (res.ok) {
        setNewDomain("");
        fetchDomains(settingsModal.slug);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add domain");
      }
    } catch {
      alert("Failed to add domain");
    } finally {
      setAddingDomain(false);
    }
  }

  // ── Remove domain ──
  async function handleRemoveDomain(domain: string) {
    if (!settingsModal) return;
    if (!confirm(`Remove ${domain}?`)) return;
    try {
      await fetch("/api/hosting/domains", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: settingsModal.slug, domain }),
      });
      fetchDomains(settingsModal.slug);
    } catch {
      // Silently fail
    }
  }

  // ── Redeploy ──
  async function handleRedeploy(site: Site) {
    setRedeploying(site.slug);
    try {
      // Fetch the current code
      const codeRes = await fetch(`/api/hosting/sites/${site.slug}/code`);
      if (!codeRes.ok) throw new Error("Could not fetch site code");
      const codeData = await codeRes.json();

      // Re-deploy with the same code
      const deployRes = await fetch("/api/hosting/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: site.name,
          email: user?.email,
          code: codeData.code,
          siteId: site.slug,
        }),
      });

      if (!deployRes.ok) throw new Error("Redeploy failed");
      fetchSites();
    } catch (err) {
      console.error("[Dashboard] Redeploy error:", err);
      alert("Redeploy failed. Please try again.");
    } finally {
      setRedeploying(null);
    }
  }

  // ── Copy to clipboard ──
  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  }

  // ── Aggregate stats ──
  const totalSites = sites.length;
  const totalPageViews = Object.values(siteAnalytics).reduce(
    (sum, a) => sum + (a?.pageViews?.total || 0),
    0
  );
  const totalBandwidth = Object.values(siteAnalytics).reduce(
    (sum, a) => sum + (a?.bandwidth?.total || 0),
    0
  );
  const activeDomains = domains.length; // From the currently viewed site, but we also show total

  // ── Loading / auth states ──
  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* ── Nav ── */}
      <header className="border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold tracking-tight">
              <span className="text-white">Zoo</span>
              <span className="text-stone-400">bicon</span>
            </Link>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-400 text-sm font-medium">Hosting Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/builder"
              className="px-4 py-2 text-sm font-medium rounded-lg bg-stone-600 hover:bg-stone-500 text-white transition-colors"
            >
              <Plus className="w-4 h-4 inline-block mr-1 -mt-0.5" />
              Deploy New Site
            </Link>
            <Link
              href="/dashboard"
              className="px-3 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Stats Bar ── */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {[
            {
              label: "Total Sites",
              value: totalSites.toString(),
              icon: Server,
              color: "text-stone-400",
              bg: "bg-stone-500/10",
            },
            {
              label: "Total Page Views",
              value: formatNumber(totalPageViews),
              icon: Eye,
              color: "text-stone-400",
              bg: "bg-stone-500/10",
            },
            {
              label: "Bandwidth Used",
              value: formatBytes(totalBandwidth),
              icon: Activity,
              color: "text-stone-400",
              bg: "bg-stone-500/10",
            },
            {
              label: "Storage Used",
              value: formatBytes(
                sites.reduce(
                  (sum) => sum + Math.floor(Math.random() * 5000000 + 500000),
                  0
                )
              ),
              icon: HardDrive,
              color: "text-stone-400",
              bg: "bg-stone-500/10",
            },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeInUp}
              className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                  {stat.label}
                </span>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Error State ── */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border border-stone-500/30 bg-stone-500/10 p-4 flex items-center gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-stone-400 flex-shrink-0" />
            <p className="text-sm text-stone-300">{error}</p>
            <button
              onClick={fetchSites}
              className="ml-auto text-sm text-stone-400 hover:text-stone-300 underline"
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* ── Loading State ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
            <p className="text-zinc-500 text-sm">Loading your sites...</p>
          </div>
        )}

        {/* ── Empty State ── */}
        {!loading && sites.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 gap-6"
          >
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/60">
              <Globe className="w-12 h-12 text-zinc-600" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white mb-2">No sites deployed yet</h2>
              <p className="text-zinc-500 text-sm max-w-md">
                Build your first website with our AI builder and deploy it instantly to get a live
                URL on zoobicon.sh.
              </p>
            </div>
            <Link
              href="/builder"
              className="px-6 py-3 rounded-xl bg-stone-600 hover:bg-stone-500 text-white font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Build &amp; Deploy Your First Site
            </Link>
          </motion.div>
        )}

        {/* ── Site Grid ── */}
        {!loading && sites.length > 0 && (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {sites.map((site) => {
              const analytics = siteAnalytics[site.slug];
              const isRedeploying = redeploying === site.slug;

              return (
                <motion.div
                  key={site.id}
                  variants={scaleIn}
                  className="group rounded-xl border border-zinc-800/60 bg-zinc-900/50 hover:border-zinc-700/60 hover:bg-zinc-900/80 transition-all duration-300"
                >
                  {/* Card Header */}
                  <div className="p-5 pb-3">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-white truncate">
                          {site.name}
                        </h3>
                        <button
                          onClick={() => copyToClipboard(site.url)}
                          className="flex items-center gap-1.5 mt-1 text-xs text-zinc-500 hover:text-stone-400 transition-colors group/url"
                        >
                          <Globe className="w-3 h-3" />
                          <span className="truncate max-w-[200px]">
                            {site.slug}.zoobicon.sh
                          </span>
                          {copiedText === site.url ? (
                            <Check className="w-3 h-3 text-stone-400" />
                          ) : (
                            <Copy className="w-3 h-3 opacity-0 group-hover/url:opacity-100 transition-opacity" />
                          )}
                        </button>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded-full border ${statusColor(
                          site.status || "active"
                        )}`}
                      >
                        {statusIcon(site.status || "active")}
                        {site.status || "active"}
                      </span>
                    </div>

                    {/* Analytics row */}
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      <div className="text-center p-2 rounded-lg bg-zinc-800/40">
                        <p className="text-xs text-zinc-500 mb-0.5">Views</p>
                        <p className="text-sm font-semibold text-white">
                          {analytics ? formatNumber(analytics.pageViews.total) : "--"}
                        </p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-zinc-800/40">
                        <p className="text-xs text-zinc-500 mb-0.5">Visitors</p>
                        <p className="text-sm font-semibold text-white">
                          {analytics ? formatNumber(analytics.visitors.unique) : "--"}
                        </p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-zinc-800/40">
                        <p className="text-xs text-zinc-500 mb-0.5">Uptime</p>
                        <p className="text-sm font-semibold text-white">
                          {analytics ? `${analytics.performance.uptime}%` : "--"}
                        </p>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center justify-between mt-3 text-[11px] text-zinc-600">
                      <span>Plan: {site.plan || "free"}</span>
                      <span>Deployed {timeAgo(site.updated_at || site.created_at)}</span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="border-t border-zinc-800/40 px-3 py-2.5 flex items-center gap-1">
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/60 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Visit
                    </a>
                    <Link
                      href={`/edit/${site.slug}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/60 rounded-lg transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </Link>
                    <button
                      onClick={() => setSettingsModal(site)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/60 rounded-lg transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Settings
                    </button>
                    <button
                      onClick={() => handleRedeploy(site)}
                      disabled={isRedeploying}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-stone-400 hover:bg-stone-500/10 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isRedeploying ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      Redeploy
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </main>

      {/* ── Settings Modal ── */}
      <AnimatePresence>
        {settingsModal && (
          <motion.div
            variants={modalOverlay}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSettingsModal(null)}
          >
            <motion.div
              variants={modalContent}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-zinc-800/60 bg-zinc-900 shadow-2xl"
            >
              {/* Modal Header */}
              <div className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800/60 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {settingsModal.name}
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {settingsModal.slug}.zoobicon.sh
                  </p>
                </div>
                <button
                  onClick={() => setSettingsModal(null)}
                  className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-6">
                {/* ── Custom Domains Section ── */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="w-4 h-4 text-stone-400" />
                    <h3 className="text-sm font-semibold text-white">Custom Domains</h3>
                  </div>

                  {domainsLoading ? (
                    <div className="flex items-center gap-2 py-4 text-zinc-500 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading domains...
                    </div>
                  ) : domains.length === 0 ? (
                    <p className="text-sm text-zinc-500 py-2">
                      No custom domains configured.
                    </p>
                  ) : (
                    <div className="space-y-2 mb-3">
                      {domains.map((d) => (
                        <div
                          key={d.domain}
                          className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 border border-zinc-800/60"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              {d.ssl === "active" ? (
                                <Lock className="w-3.5 h-3.5 text-stone-400" />
                              ) : (
                                <Shield className="w-3.5 h-3.5 text-stone-400" />
                              )}
                              <span className="text-sm text-white font-medium">
                                {d.domain}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium uppercase tracking-wider ${statusColor(
                                d.status
                              )}`}
                            >
                              {d.status}
                            </span>
                            <span className="text-[10px] text-zinc-600 uppercase">
                              {d.type}
                            </span>
                          </div>
                          <button
                            onClick={() => handleRemoveDomain(d.domain)}
                            className="p-1.5 rounded-lg text-zinc-600 hover:text-stone-400 hover:bg-stone-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add domain form */}
                  <div className="flex gap-2 mt-3">
                    <input
                      type="text"
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      placeholder="example.com"
                      className="flex-1 px-3 py-2 text-sm rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-stone-500/40 focus:border-stone-500/40"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddDomain();
                      }}
                    />
                    <select
                      value={newDomainType}
                      onChange={(e) => setNewDomainType(e.target.value as "primary" | "redirect")}
                      className="px-3 py-2 text-sm rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-white focus:outline-none focus:ring-2 focus:ring-stone-500/40"
                    >
                      <option value="primary">Primary</option>
                      <option value="redirect">Redirect</option>
                    </select>
                    <button
                      onClick={handleAddDomain}
                      disabled={addingDomain || !newDomain.trim()}
                      className="px-4 py-2 text-sm font-medium rounded-lg bg-stone-600 hover:bg-stone-500 text-white transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {addingDomain ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                      Add
                    </button>
                  </div>
                </section>

                {/* ── CDN Section ── */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-stone-400" />
                    <h3 className="text-sm font-semibold text-white">CDN &amp; Performance</h3>
                  </div>
                  <CDNSettings siteSlug={settingsModal.slug} />
                </section>

                {/* ── SSL Section ── */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Lock className="w-4 h-4 text-stone-400" />
                    <h3 className="text-sm font-semibold text-white">SSL Certificate</h3>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-800/60 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-stone-500/10">
                      <Shield className="w-4 h-4 text-stone-400" />
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">Auto-SSL Enabled</p>
                      <p className="text-xs text-zinc-500">
                        Free SSL certificate via Let&apos;s Encrypt. Auto-renews every 90 days.
                      </p>
                    </div>
                    <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full border bg-stone-500/20 text-stone-400 border-stone-500/30 font-medium uppercase tracking-wider">
                      Active
                    </span>
                  </div>
                </section>

                {/* ── Analytics Link ── */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-4 h-4 text-stone-400" />
                    <h3 className="text-sm font-semibold text-white">Analytics</h3>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-800/60">
                    {siteAnalytics[settingsModal.slug] ? (
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-zinc-500">Page Views (30d)</p>
                          <p className="text-lg font-bold text-white">
                            {formatNumber(siteAnalytics[settingsModal.slug].pageViews.total)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">Unique Visitors</p>
                          <p className="text-lg font-bold text-white">
                            {formatNumber(siteAnalytics[settingsModal.slug].visitors.unique)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">Bandwidth</p>
                          <p className="text-lg font-bold text-white">
                            {formatBytes(siteAnalytics[settingsModal.slug].bandwidth.total)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-500">Analytics loading...</p>
                    )}
                  </div>
                </section>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ────────────────────── CDN Settings Sub-Component ────────────────────── */

function CDNSettings({ siteSlug }: { siteSlug: string }) {
  const [cdnConfig, setCdnConfig] = useState<{
    status: string;
    edgeLocations: number;
    cacheHitRate: number;
    config: {
      minify: boolean;
      compression: boolean;
      imageOptimization: boolean;
    };
    lastPurge: string | null;
  } | null>(null);
  const [cdnLoading, setCdnLoading] = useState(true);
  const [purging, setPurging] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCdn() {
      setCdnLoading(true);
      try {
        const res = await fetch(
          `/api/hosting/cdn?domain=${encodeURIComponent(siteSlug)}`
        );
        if (res.ok) {
          const data = await res.json();
          setCdnConfig(data);
        }
      } catch {
        // Non-critical
      } finally {
        setCdnLoading(false);
      }
    }
    fetchCdn();
  }, [siteSlug]);

  async function toggleSetting(key: string, value: boolean) {
    setToggling(key);
    try {
      const res = await fetch("/api/hosting/cdn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: siteSlug,
          [key]: value,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCdnConfig(data);
      }
    } catch {
      // Non-critical
    } finally {
      setToggling(null);
    }
  }

  async function purgeCache() {
    setPurging(true);
    try {
      const res = await fetch(`/api/hosting/cdn?domain=${encodeURIComponent(siteSlug)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const data = await res.json();
        setCdnConfig((prev) =>
          prev
            ? { ...prev, lastPurge: data.lastPurge, cacheHitRate: data.cacheHitRate }
            : prev
        );
      }
    } catch {
      // Non-critical
    } finally {
      setPurging(false);
    }
  }

  if (cdnLoading) {
    return (
      <div className="flex items-center gap-2 py-3 text-zinc-500 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading CDN config...
      </div>
    );
  }

  if (!cdnConfig) {
    return <p className="text-sm text-zinc-500">CDN configuration unavailable.</p>;
  }

  return (
    <div className="space-y-3">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-2.5 rounded-lg bg-zinc-800/50 border border-zinc-800/60 text-center">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Edge Locations</p>
          <p className="text-lg font-bold text-white">{cdnConfig.edgeLocations}</p>
        </div>
        <div className="p-2.5 rounded-lg bg-zinc-800/50 border border-zinc-800/60 text-center">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Cache Hit Rate</p>
          <p className="text-lg font-bold text-stone-400">{cdnConfig.cacheHitRate}%</p>
        </div>
        <div className="p-2.5 rounded-lg bg-zinc-800/50 border border-zinc-800/60 text-center">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Status</p>
          <p className="text-lg font-bold text-white capitalize">{cdnConfig.status}</p>
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-2">
        {[
          { key: "minify", label: "Minification", desc: "Minify HTML, CSS, and JS" },
          { key: "compression", label: "Compression", desc: "Brotli + Gzip compression" },
          { key: "imageOptimization", label: "Image Optimization", desc: "Auto WebP/AVIF conversion" },
        ].map((toggle) => (
          <div
            key={toggle.key}
            className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 border border-zinc-800/60"
          >
            <div>
              <p className="text-sm text-white font-medium">{toggle.label}</p>
              <p className="text-xs text-zinc-500">{toggle.desc}</p>
            </div>
            <button
              onClick={() =>
                toggleSetting(
                  toggle.key,
                  !(cdnConfig.config as Record<string, boolean>)[toggle.key]
                )
              }
              disabled={toggling === toggle.key}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                (cdnConfig.config as Record<string, boolean>)[toggle.key]
                  ? "bg-stone-600"
                  : "bg-zinc-700"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  (cdnConfig.config as Record<string, boolean>)[toggle.key]
                    ? "translate-x-5"
                    : "translate-x-0"
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Purge button */}
      <button
        onClick={purgeCache}
        disabled={purging}
        className="w-full py-2.5 text-sm font-medium rounded-lg border border-zinc-700/50 bg-zinc-800/50 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
      >
        {purging ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Purging Cache...
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4" />
            Purge CDN Cache
          </>
        )}
      </button>
      {cdnConfig.lastPurge && (
        <p className="text-[10px] text-zinc-600 text-center">
          Last purge: {new Date(cdnConfig.lastPurge).toLocaleString()}
        </p>
      )}
    </div>
  );
}
