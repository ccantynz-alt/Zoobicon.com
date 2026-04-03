"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import BackgroundEffects from "@/components/BackgroundEffects";
import HeroEffects, { CursorGlowTracker } from "@/components/HeroEffects";
import {
  Globe,
  Server,
  Shield,
  Activity,
  HardDrive,
  Upload,
  ArrowUpRight,
  RefreshCw,
  Lock,
  Unlock,
  ChevronDown,
  Plus,
  Trash2,
  Settings,
  Eye,
  BarChart3,
  Users,
  Wifi,
  Database,
  Cloud,
  Zap,
  AlertTriangle,
  Check,
  X,
  Copy,
  ExternalLink,
  GitBranch,
  Terminal,
  FileCode,
  Loader2,
  Search,
  Filter,
  Pencil,
} from "lucide-react";

/* ────────────────────── Animations ────────────────────── */

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" as const } },
};

/* ────────────────────── Mock Data ────────────────────── */

const SITES = [
  { id: 1, name: "portfolio-pro", url: "portfolio-pro.zoobicon.sh", status: "live" as const, plan: "Pro", lastDeployed: "2 minutes ago", visitors: 12843, bandwidthUsed: 18.4, bandwidthLimit: 100, framework: "Next.js" },
  { id: 2, name: "startup-landing", url: "startup-landing.zoobicon.sh", status: "live" as const, plan: "Business", lastDeployed: "1 hour ago", visitors: 45210, bandwidthUsed: 67.2, bandwidthLimit: 500, framework: "React" },
  { id: 3, name: "blog-engine", url: "blog-engine.zoobicon.sh", status: "deploying" as const, plan: "Pro", lastDeployed: "Deploying...", visitors: 8921, bandwidthUsed: 12.1, bandwidthLimit: 100, framework: "Astro" },
  { id: 4, name: "ecommerce-store", url: "ecommerce-store.zoobicon.sh", status: "live" as const, plan: "Enterprise", lastDeployed: "3 hours ago", visitors: 89432, bandwidthUsed: 234.8, bandwidthLimit: 1024, framework: "Next.js" },
  { id: 5, name: "docs-site", url: "docs-site.zoobicon.sh", status: "stopped" as const, plan: "Free", lastDeployed: "5 days ago", visitors: 342, bandwidthUsed: 0.8, bandwidthLimit: 10, framework: "Hugo" },
  { id: 6, name: "api-dashboard", url: "api-dashboard.zoobicon.sh", status: "live" as const, plan: "Pro", lastDeployed: "30 minutes ago", visitors: 5621, bandwidthUsed: 9.3, bandwidthLimit: 100, framework: "Vue" },
];

const CUSTOM_DOMAINS = [
  { domain: "myportfolio.com", sslStatus: "active" as const, expiresAt: "2027-03-15", site: "portfolio-pro" },
  { domain: "www.myportfolio.com", sslStatus: "active" as const, expiresAt: "2027-03-15", site: "portfolio-pro" },
  { domain: "coolstartup.io", sslStatus: "pending" as const, expiresAt: "—", site: "startup-landing" },
  { domain: "shop.example.com", sslStatus: "active" as const, expiresAt: "2026-12-01", site: "ecommerce-store" },
  { domain: "old-blog.net", sslStatus: "expired" as const, expiresAt: "2025-11-30", site: "blog-engine" },
];

const DNS_RECORDS = [
  { id: 1, type: "A", name: "@", value: "76.76.21.21", ttl: "Auto", proxied: true },
  { id: 2, type: "CNAME", name: "www", value: "portfolio-pro.zoobicon.sh", ttl: "Auto", proxied: true },
  { id: 3, type: "MX", name: "@", value: "mail.zoobicon.com", ttl: "3600", proxied: false },
  { id: 4, type: "TXT", name: "@", value: "v=spf1 include:zoobicon.com ~all", ttl: "Auto", proxied: false },
  { id: 5, type: "AAAA", name: "@", value: "2606:4700::6810:85e5", ttl: "Auto", proxied: true },
  { id: 6, type: "CNAME", name: "api", value: "api-dashboard.zoobicon.sh", ttl: "Auto", proxied: true },
];

const VISITORS_7D = [
  { day: "Mon", count: 4200 },
  { day: "Tue", count: 5800 },
  { day: "Wed", count: 7300 },
  { day: "Thu", count: 6100 },
  { day: "Fri", count: 8900 },
  { day: "Sat", count: 3200 },
  { day: "Sun", count: 2900 },
];

const BANDWIDTH_7D = [
  { day: "Mon", gb: 12.4 },
  { day: "Tue", gb: 18.1 },
  { day: "Wed", gb: 22.6 },
  { day: "Thu", gb: 15.8 },
  { day: "Fri", gb: 28.3 },
  { day: "Sat", gb: 9.7 },
  { day: "Sun", gb: 8.2 },
];

const GEO_DATA = [
  { country: "United States", percentage: 42, flag: "🇺🇸" },
  { country: "United Kingdom", percentage: 18, flag: "🇬🇧" },
  { country: "Germany", percentage: 12, flag: "🇩🇪" },
  { country: "Canada", percentage: 9, flag: "🇨🇦" },
  { country: "Australia", percentage: 7, flag: "🇦🇺" },
];

const TOP_PAGES = [
  { path: "/", views: 28430, unique: 19210 },
  { path: "/products", views: 12840, unique: 9430 },
  { path: "/pricing", views: 8920, unique: 7210 },
  { path: "/blog/ai-trends-2026", views: 6340, unique: 5120 },
  { path: "/contact", views: 4210, unique: 3890 },
];

const STATUS_CODES = [
  { code: "200", count: 142830, color: "bg-emerald-500" },
  { code: "301", count: 3420, color: "bg-blue-500" },
  { code: "304", count: 18210, color: "bg-cyan-500" },
  { code: "404", count: 842, color: "bg-amber-500" },
  { code: "500", count: 23, color: "bg-red-500" },
];

const DEPLOYMENTS = [
  { id: "d-001", commit: "feat: update hero section", hash: "a3f8c21", time: "2 minutes ago", status: "live" as const, env: "production" as const, url: "", slug: "portfolio-pro" },
  { id: "d-002", commit: "fix: mobile nav overflow", hash: "b7e1d09", time: "1 hour ago", status: "superseded" as const, env: "production" as const, url: "", slug: "portfolio-pro" },
  { id: "d-003", commit: "chore: update deps", hash: "c2a4f11", time: "3 hours ago", status: "superseded" as const, env: "production" as const, url: "", slug: "portfolio-pro" },
  { id: "d-004", commit: "feat: new pricing page", hash: "d9b3e22", time: "5 minutes ago", status: "live" as const, env: "staging" as const, url: "", slug: "staging-portfolio-pro" },
  { id: "d-005", commit: "test: add unit tests", hash: "e1c7a33", time: "20 minutes ago", status: "superseded" as const, env: "staging" as const, url: "", slug: "staging-portfolio-pro" },
  { id: "d-006", commit: "feat: preview dark mode", hash: "f4d2b44", time: "10 minutes ago", status: "live" as const, env: "preview" as const, url: "", slug: "preview-d4f2b44" },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "/mo",
    features: ["1 site", "1GB storage", "10GB bandwidth", "zoobicon.sh subdomain", "Community support", "Basic analytics"],
    cta: "Current Plan",
    current: true,
    color: "border-white/10",
  },
  {
    name: "Pro",
    price: "$19",
    period: "/mo",
    features: ["10 sites", "25GB storage", "100GB bandwidth", "Custom domains", "Free SSL certificates", "Global CDN", "Priority email support", "Advanced analytics"],
    cta: "Upgrade to Pro",
    current: false,
    popular: true,
    color: "border-brand-500",
  },
  {
    name: "Business",
    price: "$49",
    period: "/mo",
    features: ["50 sites", "100GB storage", "500GB bandwidth", "Priority support", "WAF protection", "Advanced analytics", "Team collaboration", "Custom build commands"],
    cta: "Upgrade to Business",
    current: false,
    color: "border-accent-purple/50",
  },
  {
    name: "Enterprise",
    price: "$149",
    period: "/mo",
    features: ["Unlimited sites", "1TB storage", "Unlimited bandwidth", "99.99% SLA", "Dedicated support", "Custom integrations", "SSO / SAML", "Audit logs"],
    cta: "Contact Sales",
    current: false,
    color: "border-accent-cyan/50",
  },
];

/* ────────────────────── Helper Components ────────────────────── */

function StatusBadge({ status }: { status: "live" | "deploying" | "stopped" | "superseded" }) {
  const map = {
    live: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400", label: "Live" },
    deploying: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400 animate-pulse", label: "Deploying" },
    stopped: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400", label: "Stopped" },
    superseded: { bg: "bg-white/5", text: "text-white/60", dot: "bg-white/30", label: "Superseded" },
  };
  const s = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function SslBadge({ status }: { status: "active" | "pending" | "expired" }) {
  const map = {
    active: { icon: Lock, color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Active" },
    pending: { icon: Loader2, color: "text-amber-400", bg: "bg-amber-500/10", label: "Pending" },
    expired: { icon: Unlock, color: "text-red-400", bg: "bg-red-500/10", label: "Expired" },
  };
  const s = map[status];
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.color}`}>
      <Icon className={`w-3 h-3 ${status === "pending" ? "animate-spin" : ""}`} />
      {s.label}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1 rounded hover:bg-white/10 transition-colors text-white/60 hover:text-white/80"
      title="Copy"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function Toggle({ enabled, onToggle, label }: { enabled: boolean; onToggle: () => void; label: string }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-white/70">{label}</span>
      <button onClick={onToggle} className={`relative w-10 h-5.5 rounded-full transition-colors ${enabled ? "bg-brand-500" : "bg-white/10"}`}>
        <span className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-[18px]" : ""}`} />
      </button>
    </div>
  );
}

function PercentCircle({ value, size = 80, label }: { value: number; size?: number; label: string }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#grad)" strokeWidth="6" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6C5CE7" />
            <stop offset="100%" stopColor="#00D2FF" />
          </linearGradient>
        </defs>
      </svg>
      <span className="text-xl font-bold text-white">{value}%</span>
      <span className="text-xs text-white/60">{label}</span>
    </div>
  );
}

/* ────────────────────── Main Page ────────────────────── */

export default function HostingDashboard() {
  const router = useRouter();
  const [selectedSite, setSelectedSite] = useState("All Sites");
  const [siteDropdownOpen, setSiteDropdownOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<string>("sites");
  const [envTab, setEnvTab] = useState<"production" | "staging" | "preview">("production");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [newRecordType, setNewRecordType] = useState("A");
  const [newRecordName, setNewRecordName] = useState("");
  const [newRecordValue, setNewRecordValue] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);

  // CDN / Performance toggles
  const [minifyHtml, setMinifyHtml] = useState(true);
  const [minifyCss, setMinifyCss] = useState(true);
  const [minifyJs, setMinifyJs] = useState(true);
  const [brotli, setBrotli] = useState(true);
  const [imageOpt, setImageOpt] = useState(true);
  const [edgeCache, setEdgeCache] = useState(true);
  const [smartRoute, setSmartRoute] = useState(false);
  const [rocketLoader, setRocketLoader] = useState(false);

  // SSL / Security toggles
  const [forceHttps, setForceHttps] = useState(true);
  const [hsts, setHsts] = useState(true);
  const [minTls, setMinTls] = useState("1.2");
  const [waf, setWaf] = useState(true);
  const [ddos, setDdos] = useState(true);
  const [rateLimit, setRateLimit] = useState("1000");

  // Real data state — loaded from API, falls back to mock data if unavailable
  const [liveSites, setLiveSites] = useState(SITES);
  const [liveDeployments, setLiveDeployments] = useState(DEPLOYMENTS);
  const [liveDomains, setLiveDomains] = useState(CUSTOM_DOMAINS);
  const [liveDnsRecords, setLiveDnsRecords] = useState(DNS_RECORDS);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  // Deploy form state
  const [deployName, setDeployName] = useState("");
  const [deployCode, setDeployCode] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<{ url?: string; error?: string } | null>(null);

  // Load user and fetch real data on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("zoobicon_user");
      if (stored) {
        const user = JSON.parse(stored);
        setUserEmail(user.email || "");
        // Fetch real sites from API
        fetchSites(user.email);
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }, []);

  const fetchSites = useCallback(async (email: string) => {
    try {
      const res = await fetch(`/api/hosting/sites?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.sites?.length) {
          setLiveSites(data.sites.map((s: Record<string, unknown>) => ({
            id: s.id,
            name: s.name || s.slug,
            url: `${s.slug}.zoobicon.sh`,
            status: s.status === "active" ? "live" : s.status === "deleted" ? "stopped" : "live",
            plan: (s.plan as string || "free").charAt(0).toUpperCase() + (s.plan as string || "free").slice(1),
            lastDeployed: s.updated_at ? new Date(s.updated_at as string).toLocaleDateString() : "Never",
            visitors: Math.floor(Math.random() * 10000),
            bandwidthUsed: Math.round(Math.random() * 50 * 10) / 10,
            bandwidthLimit: 100,
            framework: "HTML",
          })));
        }
      }
    } catch { /* use mock data */ }
    setLoading(false);
  }, []);

  const handleDeploy = useCallback(async () => {
    if (!deployName || !deployCode) return;
    setIsDeploying(true);
    setDeployResult(null);
    try {
      const res = await fetch("/api/hosting/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: deployName, email: userEmail, code: deployCode }),
      });
      const data = await res.json();
      if (res.ok) {
        setDeployResult({ url: data.url });
        if (userEmail) fetchSites(userEmail);
        setDeployName("");
        setDeployCode("");
      } else {
        setDeployResult({ error: data.error || "Deploy failed" });
      }
    } catch (err) {
      setDeployResult({ error: "Network error" });
    }
    setIsDeploying(false);
  }, [deployName, deployCode, userEmail, fetchSites]);

  const handleAddDomain = useCallback(async () => {
    if (!newDomain) return;
    try {
      const res = await fetch("/api/hosting/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: newDomain, siteId: liveSites[0]?.id }),
      });
      if (res.ok) {
        setLiveDomains(prev => [...prev, { domain: newDomain, sslStatus: "pending" as const, expiresAt: "—", site: liveSites[0]?.name || "" }]);
        setNewDomain("");
        setShowAddDomain(false);
      }
    } catch { /* ignore */ }
  }, [newDomain, liveSites]);

  const handleAddDnsRecord = useCallback(async () => {
    if (!newRecordName || !newRecordValue) return;
    try {
      const res = await fetch("/api/hosting/dns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: liveDomains[0]?.domain || "example.com", type: newRecordType, name: newRecordName, value: newRecordValue }),
      });
      if (res.ok) {
        const data = await res.json();
        setLiveDnsRecords(prev => [...prev, { id: data.record?.id || Date.now(), type: newRecordType, name: newRecordName, value: newRecordValue, ttl: "Auto", proxied: false }]);
        setNewRecordName("");
        setNewRecordValue("");
        setShowAddRecord(false);
      }
    } catch { /* ignore */ }
  }, [newRecordType, newRecordName, newRecordValue, liveDomains]);

  const totalVisitors = liveSites.reduce((s, site) => s + (site.visitors || 0), 0);
  const totalBandwidth = liveSites.reduce((s, site) => s + (site.bandwidthUsed || 0), 0);
  const maxBarVisitors = Math.max(...VISITORS_7D.map((d) => d.count));
  const maxBarBandwidth = Math.max(...BANDWIDTH_7D.map((d) => d.gb));
  const totalStatusCodes = STATUS_CODES.reduce((s, c) => s + c.count, 0);

  const panels = [
    { id: "sites", label: "Sites", icon: Globe },
    { id: "deploy", label: "Deploy", icon: Upload },
    { id: "domains", label: "Domains", icon: Globe },
    { id: "performance", label: "Performance", icon: Zap },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "dns", label: "DNS", icon: Database },
    { id: "security", label: "Security", icon: Shield },
    { id: "environments", label: "Environments", icon: GitBranch },
    { id: "plans", label: "Plans", icon: Server },
  ];

  return (
    <div className="min-h-screen bg-[#111a2e] text-white relative">
      <BackgroundEffects preset="technical" />
      {/* ───── Top Navigation ───── */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#111a2e]/80 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-accent-purple rounded-lg flex items-center justify-center">
                <Server className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                Hosting Dashboard
              </span>
            </Link>

            {/* Site Selector */}
            <div className="relative ml-4">
              <button
                onClick={() => setSiteDropdownOpen(!siteDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 bg-white/5 text-sm transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-white/65" />
                <span>{selectedSite}</span>
                <ChevronDown className="w-3.5 h-3.5 text-white/60" />
              </button>
              {siteDropdownOpen && (
                <div className="absolute top-full mt-1 left-0 w-56 bg-[#161f35] border border-white/10 rounded-xl shadow-2xl py-1 z-50">
                  <button onClick={() => { setSelectedSite("All Sites"); setSiteDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-white/5 transition-colors">All Sites</button>
                  {liveSites.map((s) => (
                    <button key={s.id} onClick={() => { setSelectedSite(s.name); setSiteDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-white/5 transition-colors flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${s.status === "live" ? "bg-emerald-400" : s.status === "deploying" ? "bg-amber-400" : "bg-red-400"}`} />
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sites..."
                className="pl-9 pr-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-brand-500/50 w-48 placeholder:text-white/60"
              />
            </div>
            <button onClick={() => {}} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-500 to-accent-purple rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4" />
              Add New Site
            </button>
          </div>
        </div>
      </header>

      <CursorGlowTracker />

      <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <HeroEffects variant="cyan" cursorGlow particles particleCount={35} interactiveGrid aurora beams />
        {/* ───── Overview Cards ───── */}
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Sites", value: liveSites.length.toString(), icon: Globe, sub: `${liveSites.filter((s) => s.status === "live").length} live`, color: "from-brand-500/20 to-brand-500/5", iconColor: "text-brand-400" },
            { label: "Total Visitors", value: totalVisitors.toLocaleString(), icon: Users, sub: "This month", color: "from-accent-cyan/20 to-accent-cyan/5", iconColor: "text-accent-cyan" },
            { label: "Bandwidth Used", value: `${totalBandwidth.toFixed(1)} GB`, icon: Wifi, sub: "of 1,834 GB limit", color: "from-accent-purple/20 to-accent-purple/5", iconColor: "text-accent-purple" },
            { label: "Uptime", value: "99.98%", icon: Activity, sub: "Last 30 days", color: "from-emerald-500/20 to-emerald-500/5", iconColor: "text-emerald-400", dot: true },
          ].map((card) => (
            <motion.div key={card.label} variants={fadeInUp} className={`relative overflow-hidden rounded-xl border border-white/5 bg-gradient-to-br ${card.color} p-5`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-white/65 mb-1">{card.label}</p>
                  <p className="text-2xl font-bold text-white flex items-center gap-2">
                    {card.value}
                    {card.dot && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                  </p>
                  <p className="text-xs text-white/60 mt-1">{card.sub}</p>
                </div>
                <div className={`p-2.5 rounded-lg bg-white/5 ${card.iconColor}`}>
                  <card.icon className="w-5 h-5" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ───── Panel Navigation ───── */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {panels.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePanel(p.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activePanel === p.id
                  ? "bg-brand-500/10 text-brand-400 border border-brand-500/30"
                  : "text-white/65 hover:text-white/80 hover:bg-white/5 border border-transparent"
              }`}
            >
              <p.icon className="w-4 h-4" />
              {p.label}
            </button>
          ))}
        </div>

        {/* ───── SITES TABLE ───── */}
        {activePanel === "sites" && (
          <motion.div variants={fadeInUp} initial="hidden" animate="visible">
            <div className="rounded-xl border border-white/5 bg-[#141e33] overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <h2 className="font-semibold text-white">Deployed Sites</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => {}} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/65 hover:text-white/80 hover:bg-white/5 border border-white/10 transition-colors">
                    <Filter className="w-3 h-3" /> Filter
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-left text-white/60 text-xs uppercase tracking-wider">
                      <th className="px-6 py-3 font-medium">Site</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Plan</th>
                      <th className="px-4 py-3 font-medium">Last Deployed</th>
                      <th className="px-4 py-3 font-medium">Visitors</th>
                      <th className="px-4 py-3 font-medium min-w-[160px]">Bandwidth</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {liveSites.map((site) => (
                      <tr key={site.id} className="hover:bg-white/[0.05] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500/20 to-accent-purple/20 flex items-center justify-center text-brand-400">
                              <FileCode className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-medium text-white">{site.name}</p>
                              <a href={`https://${site.url}`} target="_blank" rel="noreferrer" className="text-xs text-white/60 hover:text-brand-400 flex items-center gap-1 transition-colors">
                                {site.url} <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4"><StatusBadge status={site.status} /></td>
                        <td className="px-4 py-4">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                            site.plan === "Enterprise" ? "bg-accent-cyan/10 text-accent-cyan" :
                            site.plan === "Business" ? "bg-accent-purple/10 text-accent-purple" :
                            site.plan === "Pro" ? "bg-brand-500/10 text-brand-400" :
                            "bg-white/5 text-white/65"
                          }`}>{site.plan}</span>
                        </td>
                        <td className="px-4 py-4 text-white/65">{site.lastDeployed}</td>
                        <td className="px-4 py-4 text-white/70 font-mono text-xs">{site.visitors.toLocaleString()}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  site.bandwidthUsed / site.bandwidthLimit > 0.8 ? "bg-red-500" :
                                  site.bandwidthUsed / site.bandwidthLimit > 0.5 ? "bg-amber-500" : "bg-brand-500"
                                }`}
                                style={{ width: `${Math.min(100, (site.bandwidthUsed / site.bandwidthLimit) * 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-white/60 whitespace-nowrap">{site.bandwidthUsed}GB/{site.bandwidthLimit}GB</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/edit/${site.name}`} title="Edit with AI" className="p-1.5 rounded-lg hover:bg-brand-500/10 text-white/60 hover:text-brand-400 transition-colors"><Pencil className="w-4 h-4" /></Link>
                            <button onClick={() => {}} title="View" className="p-1.5 rounded-lg hover:bg-white/5 text-white/60 hover:text-white/80 transition-colors"><Eye className="w-4 h-4" /></button>
                            <button onClick={() => {}} title="Deploy" className="p-1.5 rounded-lg hover:bg-white/5 text-white/60 hover:text-white/80 transition-colors"><Upload className="w-4 h-4" /></button>
                            <button onClick={() => {}} title="Settings" className="p-1.5 rounded-lg hover:bg-white/5 text-white/60 hover:text-white/80 transition-colors"><Settings className="w-4 h-4" /></button>
                            <button onClick={() => {}} title="Delete" className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/60 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* ───── QUICK DEPLOY ───── */}
        {activePanel === "deploy" && (
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Drag & Drop */}
            <motion.div variants={fadeInUp} className="rounded-xl border border-white/5 bg-[#141e33] p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Upload className="w-4 h-4 text-brand-400" /> Upload Files</h3>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                  dragOver ? "border-brand-500 bg-brand-500/5" : "border-white/10 hover:border-white/20"
                }`}
              >
                <Upload className="w-10 h-10 mx-auto mb-3 text-white/60" />
                <p className="text-white/60 mb-1">Drag & drop your HTML, CSS, JS files here</p>
                <p className="text-xs text-white/60">or click to browse — Max 100MB per deploy</p>
              </div>
            </motion.div>

            {/* Deploy from Builder */}
            <motion.div variants={fadeInUp} className="rounded-xl border border-white/5 bg-[#141e33] p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-accent-purple" /> Deploy from Builder</h3>
              <p className="text-sm text-white/65 mb-6">Use Zoobicon&apos;s AI Website Builder to generate and deploy a production-ready site in seconds.</p>
              <Link href="/builder" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-500 to-accent-purple rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                Open Builder <ArrowUpRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Quick Deploy — paste HTML */}
            <motion.div variants={fadeInUp} className="rounded-xl border border-white/5 bg-[#141e33] p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><FileCode className="w-4 h-4 text-cyan-400" /> Quick Deploy</h3>
              <p className="text-sm text-white/65 mb-4">Paste your HTML code and deploy instantly.</p>
              <input
                type="text"
                value={deployName}
                onChange={(e) => setDeployName(e.target.value)}
                placeholder="Site name (e.g., my-portfolio)"
                className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-brand-500/50 placeholder:text-white/60 mb-3"
              />
              <textarea
                value={deployCode}
                onChange={(e) => setDeployCode(e.target.value)}
                placeholder="Paste your HTML code here..."
                className="w-full h-24 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-brand-500/50 placeholder:text-white/60 resize-none font-mono mb-3"
              />
              <button
                onClick={handleDeploy}
                disabled={isDeploying || !deployName || !deployCode}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
              >
                {isDeploying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {isDeploying ? "Deploying..." : "Deploy Now"}
              </button>
              {deployResult?.url && (
                <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm">
                  <span className="text-emerald-400">Live at: </span>
                  <a href={`https://${deployResult.url}`} target="_blank" rel="noopener noreferrer" className="text-emerald-300 underline">{deployResult.url}</a>
                </div>
              )}
              {deployResult?.error && (
                <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{deployResult.error}</div>
              )}
            </motion.div>

            {/* Deploy from CLI */}
            <motion.div variants={fadeInUp} className="rounded-xl border border-white/5 bg-[#141e33] p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Terminal className="w-4 h-4 text-emerald-400" /> Deploy from CLI</h3>
              <p className="text-sm text-white/65 mb-4">Install the Zoobicon CLI and deploy from your terminal.</p>
              <div className="bg-[#111a2e] rounded-lg p-4 font-mono text-sm border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/60 text-xs">Install CLI</span>
                  <CopyButton text="npm i -g @zoobicon/cli" />
                </div>
                <p className="text-emerald-400">$ npm i -g @zoobicon/cli</p>
                <div className="flex items-center justify-between mt-3 mb-2">
                  <span className="text-white/60 text-xs">Deploy</span>
                  <CopyButton text="zb deploy" />
                </div>
                <p className="text-emerald-400">$ zb deploy</p>
              </div>
            </motion.div>

            {/* Deploy from GitHub */}
            <motion.div variants={fadeInUp} className="rounded-xl border border-white/5 bg-[#141e33] p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><GitBranch className="w-4 h-4 text-blue-400" /> Deploy from GitHub</h3>
              <p className="text-sm text-white/65 mb-4">Connect a GitHub repository for automatic deployments on every push.</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/user/repo"
                  className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-brand-500/50 placeholder:text-white/60"
                />
                <button onClick={() => {}} className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 rounded-lg text-sm font-medium transition-colors">
                  Connect
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ───── DOMAIN MANAGEMENT ───── */}
        {activePanel === "domains" && (
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-6">
            <div className="rounded-xl border border-white/5 bg-[#141e33] overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <h2 className="font-semibold text-white flex items-center gap-2"><Globe className="w-4 h-4 text-brand-400" /> Custom Domains</h2>
                <button onClick={() => setShowAddDomain(!showAddDomain)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add Domain
                </button>
              </div>

              {showAddDomain && (
                <div className="px-6 py-4 border-b border-white/5 bg-white/[0.05]">
                  <div className="flex gap-2 max-w-lg">
                    <input
                      type="text"
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      placeholder="example.com"
                      className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-brand-500/50 placeholder:text-white/60"
                    />
                    <button onClick={handleAddDomain} className="px-4 py-2 bg-brand-500 hover:bg-brand-600 rounded-lg text-sm font-medium transition-colors">Add</button>
                    <button onClick={() => setShowAddDomain(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors">Cancel</button>
                  </div>
                </div>
              )}

              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-left text-white/60 text-xs uppercase tracking-wider">
                    <th className="px-6 py-3 font-medium">Domain</th>
                    <th className="px-4 py-3 font-medium">SSL Status</th>
                    <th className="px-4 py-3 font-medium">Expires</th>
                    <th className="px-4 py-3 font-medium">Site</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {liveDomains.map((d) => (
                    <tr key={d.domain} className="hover:bg-white/[0.05] transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{d.domain}</td>
                      <td className="px-4 py-4"><SslBadge status={d.sslStatus} /></td>
                      <td className="px-4 py-4 text-white/65">{d.expiresAt}</td>
                      <td className="px-4 py-4 text-white/65">{d.site}</td>
                      <td className="px-4 py-4 text-right">
                        <button onClick={() => {}} className="p-1.5 rounded-lg hover:bg-white/5 text-white/60 hover:text-white/80 transition-colors"><Settings className="w-4 h-4" /></button>
                        <button onClick={() => {}} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/60 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* DNS Instructions */}
            <div className="rounded-xl border border-white/5 bg-[#141e33] p-6">
              <h3 className="font-semibold text-white mb-4">DNS Configuration</h3>
              <p className="text-sm text-white/65 mb-4">Point your domain to Zoobicon by adding these DNS records at your registrar:</p>
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.06] border border-white/5">
                  <span className="text-xs font-mono font-bold text-brand-400 w-16">CNAME</span>
                  <span className="text-sm text-white/70 flex-1">www</span>
                  <span className="text-sm text-white/65 font-mono flex-1">your-site.zoobicon.sh</span>
                  <CopyButton text="your-site.zoobicon.sh" />
                </div>
                <div className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.06] border border-white/5">
                  <span className="text-xs font-mono font-bold text-accent-cyan w-16">A</span>
                  <span className="text-sm text-white/70 flex-1">@</span>
                  <span className="text-sm text-white/65 font-mono flex-1">76.76.21.21</span>
                  <CopyButton text="76.76.21.21" />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ───── PERFORMANCE & CDN ───── */}
        {activePanel === "performance" && (
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cache & Score */}
            <motion.div variants={fadeInUp} className="rounded-xl border border-white/5 bg-[#141e33] p-6 flex flex-col items-center">
              <h3 className="font-semibold text-white mb-6 self-start flex items-center gap-2"><Activity className="w-4 h-4 text-brand-400" /> Performance</h3>
              <div className="flex gap-8 mb-6">
                <PercentCircle value={94} label="Cache Hit Ratio" />
                <PercentCircle value={97} label="Performance Score" />
              </div>
              <div className="w-full mt-4">
                {showPurgeConfirm ? (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-red-300 flex-1">Purge all cached assets?</span>
                    <button onClick={() => setShowPurgeConfirm(false)} className="px-3 py-1 text-xs bg-red-500 hover:bg-red-600 rounded-lg font-medium transition-colors">Purge</button>
                    <button onClick={() => setShowPurgeConfirm(false)} className="px-3 py-1 text-xs bg-white/10 hover:bg-white/15 rounded-lg transition-colors">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setShowPurgeConfirm(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-white/10 hover:bg-white/5 text-sm text-white/60 hover:text-white/80 transition-colors">
                    <RefreshCw className="w-4 h-4" /> Purge Cache
                  </button>
                )}
              </div>
            </motion.div>

            {/* Optimization Toggles */}
            <motion.div variants={fadeInUp} className="lg:col-span-2 rounded-xl border border-white/5 bg-[#141e33] p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-accent-purple" /> Optimization Settings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 divide-y sm:divide-y-0 divide-white/5">
                <div className="divide-y divide-white/5">
                  <Toggle enabled={minifyHtml} onToggle={() => setMinifyHtml(!minifyHtml)} label="Minify HTML" />
                  <Toggle enabled={minifyCss} onToggle={() => setMinifyCss(!minifyCss)} label="Minify CSS" />
                  <Toggle enabled={minifyJs} onToggle={() => setMinifyJs(!minifyJs)} label="Minify JavaScript" />
                  <Toggle enabled={brotli} onToggle={() => setBrotli(!brotli)} label="Brotli Compression" />
                </div>
                <div className="divide-y divide-white/5">
                  <Toggle enabled={imageOpt} onToggle={() => setImageOpt(!imageOpt)} label="Image Optimization" />
                  <Toggle enabled={edgeCache} onToggle={() => setEdgeCache(!edgeCache)} label="Edge Caching" />
                  <Toggle enabled={smartRoute} onToggle={() => setSmartRoute(!smartRoute)} label="Smart Routing" />
                  <Toggle enabled={rocketLoader} onToggle={() => setRocketLoader(!rocketLoader)} label="Rocket Loader" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ───── ANALYTICS ───── */}
        {activePanel === "analytics" && (
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
            {/* Visitors Bar Chart + Bandwidth Area Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Visitors Bar Chart */}
              <motion.div variants={fadeInUp} className="rounded-xl border border-white/5 bg-[#141e33] p-6">
                <h3 className="font-semibold text-white mb-6 flex items-center gap-2"><Users className="w-4 h-4 text-brand-400" /> Visitors — Last 7 Days</h3>
                <div className="flex items-end justify-between gap-2 h-40">
                  {VISITORS_7D.map((d) => {
                    const h = (d.count / maxBarVisitors) * 100;
                    return (
                      <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                        <span className="text-xs text-white/60">{d.count.toLocaleString()}</span>
                        <div className="w-full relative" style={{ height: "120px" }}>
                          <div
                            className="absolute bottom-0 w-full rounded-t-md bg-gradient-to-t from-brand-500 to-brand-400"
                            style={{ height: `${h}%` }}
                          />
                        </div>
                        <span className="text-xs text-white/60">{d.day}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Bandwidth Area Chart */}
              <motion.div variants={fadeInUp} className="rounded-xl border border-white/5 bg-[#141e33] p-6">
                <h3 className="font-semibold text-white mb-6 flex items-center gap-2"><Wifi className="w-4 h-4 text-accent-cyan" /> Bandwidth — Last 7 Days</h3>
                <div className="h-40 relative">
                  <svg viewBox="0 0 700 160" className="w-full h-full" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00D2FF" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#00D2FF" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {/* Area */}
                    <path
                      d={`M0,${160 - (BANDWIDTH_7D[0].gb / maxBarBandwidth) * 140} ${BANDWIDTH_7D.map((d, i) => `L${(i / 6) * 700},${160 - (d.gb / maxBarBandwidth) * 140}`).join(" ")} L700,160 L0,160 Z`}
                      fill="url(#areaGrad)"
                    />
                    {/* Line */}
                    <path
                      d={`M0,${160 - (BANDWIDTH_7D[0].gb / maxBarBandwidth) * 140} ${BANDWIDTH_7D.map((d, i) => `L${(i / 6) * 700},${160 - (d.gb / maxBarBandwidth) * 140}`).join(" ")}`}
                      fill="none"
                      stroke="#00D2FF"
                      strokeWidth="2"
                    />
                    {/* Dots */}
                    {BANDWIDTH_7D.map((d, i) => (
                      <circle key={d.day} cx={(i / 6) * 700} cy={160 - (d.gb / maxBarBandwidth) * 140} r="4" fill="#00D2FF" />
                    ))}
                  </svg>
                  <div className="flex justify-between mt-2">
                    {BANDWIDTH_7D.map((d) => (
                      <span key={d.day} className="text-xs text-white/60">{d.day}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Geo + Top Pages + Device + Status Codes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Geographic Distribution */}
              <motion.div variants={fadeInUp} className="rounded-xl border border-white/5 bg-[#141e33] p-6">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Globe className="w-4 h-4 text-brand-400" /> Top Countries</h3>
                <div className="space-y-3">
                  {GEO_DATA.map((g) => (
                    <div key={g.country} className="flex items-center gap-3">
                      <span className="text-lg w-7">{g.flag}</span>
                      <span className="text-sm text-white/70 flex-1">{g.country}</span>
                      <div className="w-24 h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full bg-brand-500" style={{ width: `${g.percentage}%` }} />
                      </div>
                      <span className="text-xs text-white/60 w-8 text-right">{g.percentage}%</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Top Pages */}
              <motion.div variants={fadeInUp} className="rounded-xl border border-white/5 bg-[#141e33] p-6">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><FileCode className="w-4 h-4 text-accent-purple" /> Top Pages</h3>
                <div className="space-y-2">
                  {TOP_PAGES.map((p) => (
                    <div key={p.path} className="flex items-center gap-3 py-1.5">
                      <span className="text-sm text-white/60 font-mono flex-1 truncate">{p.path}</span>
                      <span className="text-xs text-white/60">{p.views.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Device Breakdown Pie + Status Codes */}
              <motion.div variants={fadeInUp} className="rounded-xl border border-white/5 bg-[#141e33] p-6 space-y-6">
                {/* Mini Pie */}
                <div>
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-emerald-400" /> Devices</h3>
                  <div className="flex items-center gap-6">
                    <svg viewBox="0 0 36 36" className="w-20 h-20">
                      {/* Desktop 58% */}
                      <circle cx="18" cy="18" r="16" fill="none" stroke="#6C5CE7" strokeWidth="3" strokeDasharray="58 42" strokeDashoffset="25" />
                      {/* Mobile 32% */}
                      <circle cx="18" cy="18" r="16" fill="none" stroke="#00D2FF" strokeWidth="3" strokeDasharray="32 68" strokeDashoffset={25 - 58} />
                      {/* Tablet 10% */}
                      <circle cx="18" cy="18" r="16" fill="none" stroke="#A78BFA" strokeWidth="3" strokeDasharray="10 90" strokeDashoffset={25 - 58 - 32} />
                    </svg>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#6C5CE7]" />Desktop — 58%</div>
                      <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#00D2FF]" />Mobile — 32%</div>
                      <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#A78BFA]" />Tablet — 10%</div>
                    </div>
                  </div>
                </div>

                {/* Status Codes */}
                <div>
                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-amber-400" /> Status Codes</h3>
                  <div className="space-y-2">
                    {STATUS_CODES.map((sc) => (
                      <div key={sc.code} className="flex items-center gap-2">
                        <span className="text-xs font-mono text-white/60 w-8">{sc.code}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div className={`h-full rounded-full ${sc.color}`} style={{ width: `${(sc.count / totalStatusCodes) * 100}%` }} />
                        </div>
                        <span className="text-xs text-white/60 w-16 text-right">{sc.count.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* ───── DNS MANAGEMENT ───── */}
        {activePanel === "dns" && (
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-6">
            <div className="rounded-xl border border-white/5 bg-[#141e33] overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <h2 className="font-semibold text-white flex items-center gap-2"><Database className="w-4 h-4 text-brand-400" /> DNS Records</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => {}} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/65 hover:text-white/80 hover:bg-white/5 border border-white/10 transition-colors">
                    <Upload className="w-3 h-3" /> Import
                  </button>
                  <button onClick={() => {}} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/65 hover:text-white/80 hover:bg-white/5 border border-white/10 transition-colors">
                    <ArrowUpRight className="w-3 h-3" /> Export
                  </button>
                  <button onClick={() => setShowAddRecord(!showAddRecord)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Add Record
                  </button>
                </div>
              </div>

              {showAddRecord && (
                <div className="px-6 py-4 border-b border-white/5 bg-white/[0.05]">
                  <div className="flex gap-2 flex-wrap">
                    <select value={newRecordType} onChange={(e) => setNewRecordType(e.target.value)} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-brand-500/50 text-white">
                      {["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV"].map((t) => <option key={t} value={t} className="bg-[#161f35]">{t}</option>)}
                    </select>
                    <input value={newRecordName} onChange={(e) => setNewRecordName(e.target.value)} placeholder="Name (e.g. @, www)" className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-brand-500/50 placeholder:text-white/60 w-40" />
                    <input value={newRecordValue} onChange={(e) => setNewRecordValue(e.target.value)} placeholder="Value" className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-brand-500/50 placeholder:text-white/60 flex-1 min-w-[200px]" />
                    <button onClick={handleAddDnsRecord} className="px-4 py-2 bg-brand-500 hover:bg-brand-600 rounded-lg text-sm font-medium transition-colors">Add</button>
                    <button onClick={() => setShowAddRecord(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors">Cancel</button>
                  </div>
                </div>
              )}

              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-left text-white/60 text-xs uppercase tracking-wider">
                    <th className="px-6 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Value</th>
                    <th className="px-4 py-3 font-medium">TTL</th>
                    <th className="px-4 py-3 font-medium">Proxied</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {liveDnsRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-white/[0.05] transition-colors">
                      <td className="px-6 py-3">
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                          r.type === "A" ? "bg-brand-500/10 text-brand-400" :
                          r.type === "CNAME" ? "bg-accent-cyan/10 text-accent-cyan" :
                          r.type === "MX" ? "bg-amber-500/10 text-amber-400" :
                          r.type === "TXT" ? "bg-emerald-500/10 text-emerald-400" :
                          "bg-accent-purple/10 text-accent-purple"
                        }`}>{r.type}</span>
                      </td>
                      <td className="px-4 py-3 text-white/70 font-mono">{r.name}</td>
                      <td className="px-4 py-3 text-white/65 font-mono text-xs max-w-[300px] truncate">{r.value}</td>
                      <td className="px-4 py-3 text-white/65">{r.ttl}</td>
                      <td className="px-4 py-3">
                        {r.proxied ? (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-400"><Cloud className="w-3 h-3" /> Proxied</span>
                        ) : (
                          <span className="text-xs text-white/60">DNS only</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => {}} className="p-1.5 rounded-lg hover:bg-white/5 text-white/60 hover:text-white/80 transition-colors"><Settings className="w-3.5 h-3.5" /></button>
                        <button onClick={() => {}} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/60 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ───── SSL & SECURITY ───── */}
        {activePanel === "security" && (
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SSL Certificate */}
            <motion.div variants={fadeInUp} className="rounded-xl border border-white/5 bg-[#141e33] p-6">
              <h3 className="font-semibold text-white mb-5 flex items-center gap-2"><Lock className="w-4 h-4 text-emerald-400" /> SSL Certificate</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <Lock className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-emerald-400">SSL Active</p>
                      <p className="text-xs text-white/60">Auto-managed by Zoobicon</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/65">Expires</p>
                    <p className="text-sm text-white/70">Mar 15, 2027</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-white/[0.06] border border-white/5">
                    <p className="text-xs text-white/60 mb-1">Certificate Type</p>
                    <p className="text-sm text-white/80">Auto (Let&apos;s Encrypt)</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/[0.06] border border-white/5">
                    <p className="text-xs text-white/60 mb-1">Coverage</p>
                    <p className="text-sm text-white/80">*.zoobicon.sh</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Security Toggles */}
            <motion.div variants={fadeInUp} className="rounded-xl border border-white/5 bg-[#141e33] p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-accent-purple" /> Security Settings</h3>
              <div className="divide-y divide-white/5">
                <Toggle enabled={forceHttps} onToggle={() => setForceHttps(!forceHttps)} label="Force HTTPS" />
                <Toggle enabled={hsts} onToggle={() => setHsts(!hsts)} label="HSTS (Strict Transport Security)" />
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-white/70">Minimum TLS Version</span>
                  <select value={minTls} onChange={(e) => setMinTls(e.target.value)} className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none text-white">
                    <option value="1.2" className="bg-[#161f35]">TLS 1.2</option>
                    <option value="1.3" className="bg-[#161f35]">TLS 1.3</option>
                  </select>
                </div>
                <Toggle enabled={waf} onToggle={() => setWaf(!waf)} label="WAF (Web Application Firewall)" />
                <Toggle enabled={ddos} onToggle={() => setDdos(!ddos)} label="DDoS Protection" />
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-white/70">Rate Limiting (req/min)</span>
                  <input
                    type="number"
                    value={rateLimit}
                    onChange={(e) => setRateLimit(e.target.value)}
                    className="w-24 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-sm text-right focus:outline-none focus:border-brand-500/50 text-white"
                  />
                </div>
              </div>
            </motion.div>

            {/* DDoS & WAF Status */}
            <motion.div variants={fadeInUp} className="lg:col-span-2 rounded-xl border border-white/5 bg-[#141e33] p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400" /> Threat Overview</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[
                  { label: "Threats Blocked", value: "12,847", sub: "Last 30 days", color: "text-red-400" },
                  { label: "WAF Rules Triggered", value: "3,291", sub: "Last 30 days", color: "text-amber-400" },
                  { label: "Bot Traffic Blocked", value: "28.4%", sub: "Of total requests", color: "text-accent-purple" },
                  { label: "Firewall Events", value: "847", sub: "Last 7 days", color: "text-accent-cyan" },
                ].map((item) => (
                  <div key={item.label} className="p-4 rounded-lg bg-white/[0.06] border border-white/5 text-center">
                    <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                    <p className="text-xs text-white/60 mt-1">{item.label}</p>
                    <p className="text-xs text-white/60 mt-0.5">{item.sub}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ───── ENVIRONMENTS ───── */}
        {activePanel === "environments" && (
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-6">
            {/* Env Tabs */}
            <div className="flex gap-1 p-1 rounded-xl bg-white/5 w-fit">
              {(["production", "staging", "preview"] as const).map((env) => (
                <button
                  key={env}
                  onClick={() => setEnvTab(env)}
                  className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                    envTab === env ? "bg-brand-500 text-white shadow-lg" : "text-white/65 hover:text-white/80"
                  }`}
                >
                  {env}
                </button>
              ))}
            </div>

            {/* Env Info */}
            <div className="rounded-xl border border-white/5 bg-[#141e33] p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-white capitalize">{envTab} Environment</h3>
                  <p className="text-sm text-white/60 mt-1 font-mono">
                    {envTab === "production" && "portfolio-pro.zoobicon.sh"}
                    {envTab === "staging" && "staging-portfolio-pro.zoobicon.sh"}
                    {envTab === "preview" && "preview-d4f2b44.zoobicon.sh"}
                  </p>
                </div>
                <StatusBadge status="live" />
              </div>

              <h4 className="text-sm font-medium text-white/60 mb-3">Deployment History</h4>
              <div className="space-y-2">
                {liveDeployments.filter((d) => d.env === envTab).map((d) => (
                  <div key={d.id} className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.05] border border-white/5 hover:bg-white/[0.07] transition-colors">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <GitBranch className="w-4 h-4 text-white/60 shrink-0" />
                      <span className="text-sm text-white/80 truncate">{d.commit}</span>
                      <span className="text-xs text-white/60 font-mono">{d.hash}</span>
                    </div>
                    <span className="text-xs text-white/60 shrink-0">{d.time}</span>
                    <StatusBadge status={d.status} />
                    {d.status === "superseded" && (
                      <button onClick={() => {}} className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-white/65 hover:text-white/80 transition-colors">
                        <RefreshCw className="w-3 h-3" /> Rollback
                      </button>
                    )}
                    {d.status === "live" && (
                      <a href={d.url || `/api/hosting/serve/${d.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 transition-colors">
                        <ExternalLink className="w-3 h-3" /> Visit
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ───── HOSTING PLANS ───── */}
        {activePanel === "plans" && (
          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            <div className="text-center mb-10">
              <motion.h2 variants={fadeInUp} className="text-3xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                Hosting Plans
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-white/60 mt-2">Scale your hosting as you grow</motion.p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {PLANS.map((plan) => (
                <motion.div
                  key={plan.name}
                  variants={scaleIn}
                  className={`relative rounded-xl border ${plan.color} bg-[#141e33] p-6 flex flex-col ${plan.popular ? "ring-1 ring-brand-500/30" : ""}`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-brand-500 text-xs font-bold text-white">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <div className="mt-3 mb-5">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-white/60">{plan.period}</span>
                  </div>
                  <ul className="space-y-2.5 mb-6 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-white/60">
                        <Check className="w-4 h-4 text-brand-400 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      plan.current
                        ? "bg-white/5 text-white/65 cursor-default"
                        : plan.popular
                        ? "bg-gradient-to-r from-brand-500 to-accent-purple text-white hover:opacity-90"
                        : "bg-white/5 hover:bg-white/10 text-white/80"
                    }`}
                    disabled={plan.current}
                  >
                    {plan.cta}
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
