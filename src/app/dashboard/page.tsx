"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import BackgroundEffects from "@/components/BackgroundEffects";
import {
  Zap,
  Plus,
  Globe,
  Clock,
  Trash2,
  ExternalLink,
  Search,
  LayoutGrid,
  List,
  LogOut,
  Settings,
  ChevronDown,
  Code2,
  Video,
  BarChart3,
  Sparkles,
  Shield,
  Server,
  Pencil,
  Layers,
  Key,
  Bug,
  Languages,
  ShoppingCart,
  Gauge,
  Accessibility,
  Mail,
  Download,
  Crown,
} from "lucide-react";
import { getProjects as getLocalProjects, deleteProject as deleteLocalProject, type SavedProject } from "@/lib/storage";
import ReferralCard from "@/components/ReferralCard";
import { getUserSegment, getRecommendedGenerators } from "@/lib/user-segment";

const QUICK_ACTIONS = [
  { icon: Globe, label: "New Website", href: "/builder", color: "from-brand-500 to-brand-700" },
  { icon: Globe, label: "My Domains", href: "/my-domains", color: "from-indigo-500 to-purple-600" },
  { icon: Sparkles, label: "SEO Agent", href: "/seo", color: "from-accent-cyan to-emerald-600" },
  { icon: Search, label: "Crawl Competitor", href: "/crawl", color: "from-violet-500 to-purple-600" },
  { icon: BarChart3, label: "Analytics", href: "/analytics", color: "from-blue-500 to-fuchsia-600" },
  { icon: Video, label: "AI Video Creator", href: "/video-creator", color: "from-accent-purple to-blue-700" },
];

const ADMIN_QUICK_ACTIONS = [
  { icon: Globe, label: "AI Builder", desc: "Premium generation", href: "/builder", color: "from-brand-500 to-brand-700" },
  { icon: Globe, label: "My Domains", desc: "View purchased domains", href: "/my-domains", color: "from-indigo-500 to-purple-600" },
  { icon: Search, label: "Register Domain", desc: "Search & buy domains", href: "/domains", color: "from-emerald-500 to-teal-600" },
  { icon: Server, label: "Hosting", desc: "Deploy & manage", href: "/hosting", color: "from-emerald-500 to-teal-600" },
  { icon: Pencil, label: "My Domains", desc: "Manage domains", href: "/my-domains", color: "from-amber-500 to-orange-600" },
  { icon: Shield, label: "Admin Panel", desc: "System controls", href: "/admin", color: "from-red-500 to-rose-600" },
  { icon: Key, label: "API Keys", desc: "Developer access", href: "/auth/settings", color: "from-cyan-500 to-blue-600" },
  { icon: BarChart3, label: "Analytics", desc: "Site performance", href: "/analytics", color: "from-blue-500 to-fuchsia-600" },
  { icon: Settings, label: "Settings", desc: "Account config", href: "/auth/settings", color: "from-gray-500 to-slate-600" },
  { icon: Mail, label: "Email Support", desc: "Tickets & inbox", href: "/email-support", color: "from-cyan-500 to-rose-600" },
];

const ADMIN_TOOLS = [
  { icon: Bug, label: "Auto Debug", desc: "AI-powered bug detection" },
  { icon: Sparkles, label: "SEO Score", desc: "Full SEO analysis" },
  { icon: Gauge, label: "Performance", desc: "Speed optimization" },
  { icon: Accessibility, label: "Accessibility", desc: "WCAG compliance" },
  { icon: Languages, label: "Translate", desc: "Multi-language sites" },
  { icon: ShoppingCart, label: "E-commerce", desc: "Store generator" },
  { icon: Layers, label: "Layers Import", desc: "Design to code" },
  { icon: Mail, label: "Email Templates", desc: "Marketing emails" },
  { icon: Download, label: "Export", desc: "ZIP, WordPress, React" },
  { icon: Layers, label: "A/B Variants", desc: "Design variants" },
];

export default function DashboardPage() {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userName, setUserName] = useState("User");
  const [userRole, setUserRole] = useState<"user" | "admin">("user");
  const [userPlan, setUserPlan] = useState<"free" | "unlimited">("free");
  const [liveSites, setLiveSites] = useState<{ id: string; name: string; slug: string; status: string; updated_at: string }[]>([]);
  const [activeSection, setActiveSection] = useState<"projects" | "deployed">("projects");
  const [recommendedGenerators, setRecommendedGenerators] = useState<{ id: string; label: string; description: string }[]>([]);

  // Load recommended generators based on user segment
  useEffect(() => {
    const segment = getUserSegment();
    setRecommendedGenerators(getRecommendedGenerators(segment));
  }, []);

  useEffect(() => {
    let userEmail = "";
    try {
      const user = localStorage.getItem("zoobicon_user");
      if (user) {
        const parsed = JSON.parse(user);
        setUserName(parsed.name || "User");
        setUserRole(parsed.role === "admin" ? "admin" : "user");
        setUserPlan(parsed.plan === "unlimited" || parsed.plan === "pro" ? "unlimited" : "free");
        userEmail = parsed.email || "";
      }
    } catch { /* ignore */ }

    // Load projects from database API, fall back to localStorage
    if (userEmail) {
      fetch(`/api/projects?email=${encodeURIComponent(userEmail)}`)
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setProjects(
              data.map((p: Record<string, string>) => ({
                id: p.id,
                name: p.name,
                prompt: p.prompt || "",
                code: p.code || "",
                template: p.template,
                createdAt: new Date(p.created_at).getTime(),
                updatedAt: new Date(p.updated_at).getTime(),
              }))
            );
          } else {
            setProjects(getLocalProjects());
          }
        })
        .catch(() => setProjects(getLocalProjects()));

      // Also fetch deployed sites from hosting API
      fetch(`/api/hosting/sites?email=${encodeURIComponent(userEmail)}`)
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data) => {
          if (data.sites?.length) {
            setLiveSites(data.sites.map((s: Record<string, unknown>) => ({
              id: s.id as string,
              name: s.name as string,
              slug: s.slug as string,
              status: (s.status as string) || "active",
              updated_at: s.updated_at as string,
            })));
          }
        })
        .catch(() => { /* hosting API not available */ });
    } else {
      setProjects(getLocalProjects());
    }
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Delete this project? This cannot be undone.")) {
      // Try database delete first, then fall back to localStorage
      try {
        const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
        if (res.ok) {
          setProjects((prev) => prev.filter((p) => p.id !== id));
          return;
        }
      } catch { /* fall through */ }
      deleteLocalProject(id);
      setProjects(getLocalProjects());
    }
  };

  const handleLogout = () => {
    try { localStorage.removeItem("zoobicon_user"); } catch {}
    window.location.href = "/";
  };

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.prompt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="relative min-h-screen bg-[#050508]">
      <BackgroundEffects preset="admin" />
      {/* Top Nav */}
      <nav className="border-b border-white/10 bg-[#050508]/90 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold tracking-tight">Zoobicon</span>
              </Link>
              <div className="hidden md:flex items-center gap-1">
                <Link href="/dashboard" className="px-3 py-1.5 text-sm font-medium text-white/90 bg-white/[0.20] rounded-lg">
                  Dashboard
                </Link>
                <Link href="/builder" className="px-3 py-1.5 text-sm text-white/85 hover:text-white rounded-lg transition-colors">
                  Builder
                </Link>
                <Link href="/analytics" className="px-3 py-1.5 text-sm text-white/85 hover:text-white rounded-lg transition-colors">
                  Analytics
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/builder"
                className="btn-gradient px-4 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Project</span>
              </Link>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-[#111318] hover:bg-[#1a1d24] transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center text-[10px] font-bold text-white">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-white/90 hidden sm:block">{userName}</span>
                  <ChevronDown className="w-3 h-3 text-white/85" />
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-[#111318] border border-white/[0.15] rounded-xl shadow-elevated overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-white/10">
                        <div className="text-sm font-medium">{userName}</div>
                        <div className="text-xs text-white/85">
                          {userRole === "admin" ? (
                            <span className="text-brand-400 font-semibold">Admin · Unlimited</span>
                          ) : "Free Plan"}
                        </div>
                      </div>
                      <div className="py-1">
                        {userRole === "admin" && (
                          <Link
                            href="/admin"
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-brand-400/70 hover:text-brand-400 hover:bg-[#1a1d24] transition-colors"
                          >
                            <Shield className="w-4 h-4" />
                            Admin Panel
                          </Link>
                        )}
                        <Link
                          href="/auth/settings"
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-[#1a1d24] transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400/60 hover:text-red-400 hover:bg-[#1a1d24] transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome back, {userName}
            </h1>
            {userRole === "admin" && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-brand-500/20 to-accent-purple/20 border border-brand-500/20 text-xs font-bold text-brand-400">
                <Crown className="w-3 h-3" /> Admin · Unlimited
              </span>
            )}
          </div>
          <p className="text-white/90 text-sm">
            {userRole === "admin"
              ? "Full access to all tools, agents, and platform controls."
              : "Manage your projects and create new ones."}
          </p>
        </div>

        {/* Admin: Full Quick Actions Grid */}
        {userRole === "admin" ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
            {ADMIN_QUICK_ACTIONS.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="group gradient-border p-4 rounded-xl card-hover flex items-center gap-3"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center flex-shrink-0`}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold group-hover:text-white transition-colors">{action.label}</div>
                  <div className="text-xs text-white/85">{action.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="group gradient-border p-4 rounded-xl card-hover flex items-center gap-3"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center flex-shrink-0`}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold group-hover:text-white transition-colors">{action.label}</div>
                  <div className="text-xs text-white/85">Create new</div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Admin: AI Tools Arsenal */}
        {userRole === "admin" && (
          <div className="mb-10">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white/90 mb-4">AI Tools Arsenal — All Unlocked</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {ADMIN_TOOLS.map((tool) => (
                <Link
                  key={tool.label}
                  href="/builder"
                  className="group p-3 rounded-xl border border-white/10 bg-[#111318] hover:bg-[#1a1d24] hover:border-brand-500/20 transition-all"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <tool.icon className="w-4 h-4 text-brand-400/60 group-hover:text-brand-400 transition-colors" />
                    <span className="text-xs font-semibold text-white/85 group-hover:text-white transition-colors">{tool.label}</span>
                  </div>
                  <div className="text-[10px] text-white/80">{tool.desc}</div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-10">
          <div className="gradient-border p-5 rounded-xl">
            <div className="text-2xl font-black gradient-text-static">{projects.length}</div>
            <div className="text-xs text-white/90 mt-1">Total Projects</div>
          </div>
          <div className="gradient-border p-5 rounded-xl">
            <div className="text-2xl font-black gradient-text-static">{liveSites.length}</div>
            <div className="text-xs text-white/90 mt-1">Deployed Sites</div>
          </div>
          <div className="gradient-border p-5 rounded-xl">
            <div className="text-2xl font-black gradient-text-static">
              {projects.reduce((sum, p) => sum + p.code.length, 0).toLocaleString()}
            </div>
            <div className="text-xs text-white/90 mt-1">Characters Generated</div>
          </div>
          <div className="gradient-border p-5 rounded-xl">
            <div className="text-2xl font-black gradient-text-static">
              {userRole === "admin" ? "∞" : userPlan === "unlimited" ? "∞" : "Free"}
            </div>
            <div className="text-xs text-white/90 mt-1">
              {userRole === "admin" ? "All Agents Active" : "Current Plan"}
            </div>
          </div>
        </div>

        {/* Referral Card */}
        <div className="mb-10">
          <ReferralCard />
        </div>

        {/* Recommended for you */}
        {recommendedGenerators.length > 0 && (
          <div className="mb-10">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white/90 mb-4">Recommended for You</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {recommendedGenerators.map((gen) => (
                <Link
                  key={gen.id}
                  href={`/builder?generator=${gen.id}`}
                  className="group p-4 rounded-xl border border-white/10 bg-[#111318] hover:bg-[#1a1d24] hover:border-brand-500/20 transition-all"
                >
                  <div className="text-sm font-semibold text-white/85 group-hover:text-white transition-colors mb-1">
                    {gen.label}
                  </div>
                  <div className="text-xs text-white/50">{gen.description}</div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Section tabs */}
        <div className="flex items-center gap-1 mb-6 border-b border-white/10 pb-1">
          <button
            onClick={() => setActiveSection("projects")}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeSection === "projects"
                ? "text-white bg-[#111318] border-b-2 border-brand-500"
                : "text-white/85 hover:text-white/85"
            }`}
          >
            Projects ({projects.length})
          </button>
          <button
            onClick={() => setActiveSection("deployed")}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeSection === "deployed"
                ? "text-white bg-[#111318] border-b-2 border-emerald-500"
                : "text-white/85 hover:text-white/85"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              Deployed ({liveSites.length})
            </span>
          </button>
        </div>

        {/* Deployed Sites Section */}
        {activeSection === "deployed" && (
          <div className="mb-10">
            {liveSites.length === 0 ? (
              <div className="gradient-border p-16 rounded-2xl text-center">
                <Globe className="w-10 h-10 text-white/70 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white/90 mb-2">No deployed sites yet</h3>
                <p className="text-sm text-white/85 mb-6 max-w-md mx-auto">
                  Build a website and deploy it to get a live URL on zoobicon.sh
                </p>
                <Link href="/builder" className="inline-flex items-center gap-2 btn-gradient px-6 py-3 rounded-xl text-sm font-bold text-white">
                  <Plus className="w-4 h-4" /> Build & Deploy
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {liveSites.map((site) => (
                  <div key={site.id} className="gradient-border card-hover rounded-xl overflow-hidden group">
                    <div className="h-40 bg-[#0a0c12] border-b border-white/10 relative overflow-hidden">
                      <iframe
                        src={`/api/hosting/serve/${site.slug}`}
                        title={site.name}
                        className="w-[200%] h-[200%] border-0 origin-top-left scale-50 pointer-events-none"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-dark-100/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4 gap-2">
                        <Link
                          href={`/edit/${site.slug}`}
                          className="px-3 py-1.5 bg-brand-500/90 rounded-lg text-xs font-semibold text-white"
                        >
                          Edit
                        </Link>
                        <a
                          href={`https://${site.slug}.zoobicon.sh`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-white/10 rounded-lg text-xs font-semibold text-white flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" /> Live
                        </a>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-semibold truncate flex-1">{site.name}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          site.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white/75"
                        }`}>
                          {site.status === "active" ? "Live" : site.status}
                        </span>
                      </div>
                      <p className="text-xs text-white/75 truncate">{site.slug}.zoobicon.sh</p>
                      {site.updated_at && (
                        <div className="flex items-center gap-1 mt-2 text-[10px] text-white/70">
                          <Clock className="w-3 h-3" />
                          {formatDate(new Date(site.updated_at).getTime())}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Projects Section */}
        {activeSection === "projects" && <>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Your Projects</h2>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-white/75 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="bg-[#111318] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm
                           placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/30 w-48 transition-all"
              />
            </div>
            {/* View toggle */}
            <div className="flex bg-[#111318] border border-white/10 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-[#111318] text-white" : "text-white/85"}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-[#111318] text-white" : "text-white/85"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Projects */}
        {filteredProjects.length === 0 ? (
          <div className="gradient-border p-16 rounded-2xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500/10 to-accent-purple/10 border border-brand-500/10 mb-4">
              <Code2 className="w-8 h-8 text-brand-400/40" />
            </div>
            <h3 className="text-lg font-bold text-white/90 mb-2">
              {searchQuery ? "No matching projects" : "No projects yet"}
            </h3>
            <p className="text-sm text-white/85 mb-6 max-w-md mx-auto">
              {searchQuery
                ? "Try a different search term."
                : "Start building your first website with AI. It only takes seconds."}
            </p>
            {!searchQuery && (
              <Link
                href="/builder"
                className="inline-flex items-center gap-2 btn-gradient px-6 py-3 rounded-xl text-sm font-bold text-white"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First Project</span>
              </Link>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <div key={project.id} className="gradient-border card-hover rounded-xl overflow-hidden group">
                {/* Thumbnail */}
                <div className="h-40 bg-[#0a0c12] border-b border-white/10 relative overflow-hidden">
                  <iframe
                    srcDoc={project.code}
                    title={project.name}
                    className="w-[200%] h-[200%] border-0 origin-top-left scale-50 pointer-events-none"
                    sandbox=""
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-100/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4 gap-2">
                    <Link
                      href={`/builder?project=${project.id}`}
                      className="px-3 py-1.5 bg-brand-500/90 rounded-lg text-xs font-semibold text-white"
                    >
                      Edit
                    </Link>
                    <button onClick={() => {}} className="px-3 py-1.5 bg-white/10 rounded-lg text-xs font-semibold text-white">
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-semibold truncate flex-1">{project.name}</h3>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="text-white/70 hover:text-red-400 transition-colors ml-2 flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-white/85 line-clamp-2 mb-3">{project.prompt}</p>
                  <div className="flex items-center gap-3 text-[10px] text-white/75">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(project.updatedAt)}
                    </span>
                    <span>{project.code.length.toLocaleString()} chars</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProjects.map((project) => (
              <div key={project.id} className="gradient-border card-hover p-4 rounded-xl flex items-center gap-4 group">
                {/* Mini thumbnail */}
                <div className="w-20 h-14 bg-[#0a0c12] rounded-lg overflow-hidden flex-shrink-0 border border-white/[0.15]">
                  <iframe
                    srcDoc={project.code}
                    title={project.name}
                    className="w-[400%] h-[400%] border-0 origin-top-left scale-[0.25] pointer-events-none"
                    sandbox=""
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold truncate">{project.name}</h3>
                  <p className="text-xs text-white/85 truncate">{project.prompt}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/75 flex-shrink-0">
                  <Clock className="w-3 h-3" />
                  {formatDate(project.updatedAt)}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    href={`/builder?project=${project.id}`}
                    className="px-3 py-1.5 bg-brand-500/20 text-brand-400 rounded-lg text-xs font-semibold"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="p-1.5 text-white/75 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        </>}
      </main>
    </div>
  );
}
