"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ExternalLink,
  Heart,
  Eye,
  Globe,
  MessageCircle,
  Share2,
  UserPlus,
  UserCheck,
  Calendar,
  Award,
  Star,
  Trophy,
  Zap,
  Rocket,
  TrendingUp,
  Sparkles,
  GitFork,
  Clock,
  Copy,
  Check,
  LogOut,
  LayoutDashboard,
  User,
} from "lucide-react";

/* ---------- animation helpers ---------- */
const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};
const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

/* ---------- types ---------- */
interface CreatorProfile {
  username: string;
  displayName: string;
  bio: string;
  avatar: string | null;
  tier: "Rising" | "Pro" | "Master" | "Legend";
  joinedAt: string;
  stats: {
    sitesBuilt: number;
    totalViews: number;
    galleryPosts: number;
    followers: number;
    following: number;
  };
  badges: Achievement[];
  sites: PortfolioSite[];
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
}

interface PortfolioSite {
  id: string;
  name: string;
  category: string;
  url: string;
  upvotes: number;
  views: number;
  buildTime: number;
  createdAt: string;
}

/* ---------- tier config ---------- */
const TIER_CONFIG: Record<string, { color: string; gradient: string; bg: string; icon: typeof Star }> = {
  Rising: { color: "text-stone-400", gradient: "from-stone-500 to-stone-400", bg: "bg-stone-500/10 border-stone-500/20", icon: TrendingUp },
  Pro: { color: "text-stone-400", gradient: "from-stone-500 to-stone-400", bg: "bg-stone-500/10 border-stone-500/20", icon: Zap },
  Master: { color: "text-stone-400", gradient: "from-stone-500 to-stone-400", bg: "bg-stone-500/10 border-stone-500/20", icon: Award },
  Legend: { color: "text-stone-400", gradient: "from-stone-500 to-stone-400", bg: "bg-stone-500/10 border-stone-500/20", icon: Trophy },
};

/* ---------- gradient map for site cards ---------- */
const GRADIENT_MAP: Record<string, string> = {
  Business: "from-stone-600 to-stone-500",
  Portfolio: "from-stone-600 to-stone-500",
  "E-Commerce": "from-stone-600 to-stone-400",
  SaaS: "from-stone-600 to-stone-400",
  Restaurant: "from-stone-600 to-stone-400",
  Blog: "from-stone-600 to-stone-400",
  Agency: "from-stone-600 to-stone-400",
  "Landing Page": "from-stone-600 to-stone-400",
};

/* ---------- badge icon map ---------- */
const BADGE_ICONS: Record<string, typeof Star> = {
  rocket: Rocket,
  star: Star,
  trophy: Trophy,
  zap: Zap,
  award: Award,
  heart: Heart,
  globe: Globe,
  eye: Eye,
};

/* ---------- mock data ---------- */
function getMockProfile(username: string): CreatorProfile {
  const displayName = username.charAt(0).toUpperCase() + username.slice(1).replace(/[_-]/g, " ");
  return {
    username,
    displayName,
    bio: "Building beautiful websites with AI. Passionate about clean design, fast performance, and great user experiences.",
    avatar: null,
    tier: "Pro",
    joinedAt: "2025-08-15T00:00:00Z",
    stats: {
      sitesBuilt: 47,
      totalViews: 12_849,
      galleryPosts: 23,
      followers: 184,
      following: 56,
    },
    badges: [
      { id: "1", name: "First Deploy", description: "Deployed your first site", icon: "rocket", unlockedAt: "2025-08-15T12:00:00Z" },
      { id: "2", name: "10 Sites Built", description: "Built 10 websites with AI", icon: "star", unlockedAt: "2025-09-22T08:30:00Z" },
      { id: "3", name: "1K Views", description: "Your sites reached 1,000 total views", icon: "eye", unlockedAt: "2025-10-10T14:20:00Z" },
      { id: "4", name: "Community Star", description: "Received 50 upvotes on gallery posts", icon: "heart", unlockedAt: "2025-11-05T09:15:00Z" },
      { id: "5", name: "7-Day Streak", description: "Built a site every day for a week", icon: "zap", unlockedAt: "2025-12-01T18:00:00Z" },
      { id: "6", name: "Globe Trotter", description: "Sites viewed from 10+ countries", icon: "globe", unlockedAt: "2026-01-14T11:00:00Z" },
    ],
    sites: [
      { id: "s1", name: "Artisan Coffee Co.", category: "Restaurant", url: "https://artisan-coffee.zoobicon.sh", upvotes: 42, views: 1_280, buildTime: 87, createdAt: "2026-03-18T10:00:00Z" },
      { id: "s2", name: "DevForge Studio", category: "Portfolio", url: "https://devforge.zoobicon.sh", upvotes: 38, views: 920, buildTime: 92, createdAt: "2026-03-14T15:30:00Z" },
      { id: "s3", name: "GreenLeaf Analytics", category: "SaaS", url: "https://greenleaf.zoobicon.sh", upvotes: 55, views: 2_340, buildTime: 78, createdAt: "2026-03-10T09:00:00Z" },
      { id: "s4", name: "FitPro Gym", category: "Business", url: "https://fitpro.zoobicon.sh", upvotes: 21, views: 680, buildTime: 95, createdAt: "2026-03-05T14:00:00Z" },
      { id: "s5", name: "Nomad Threads", category: "E-Commerce", url: "https://nomad-threads.zoobicon.sh", upvotes: 67, views: 3_100, buildTime: 88, createdAt: "2026-02-28T11:00:00Z" },
      { id: "s6", name: "CodeBlog Weekly", category: "Blog", url: "https://codeblog.zoobicon.sh", upvotes: 29, views: 1_540, buildTime: 72, createdAt: "2026-02-20T08:00:00Z" },
      { id: "s7", name: "Pixel Agency", category: "Agency", url: "https://pixel-agency.zoobicon.sh", upvotes: 34, views: 890, buildTime: 90, createdAt: "2026-02-12T16:00:00Z" },
      { id: "s8", name: "Launch Fast", category: "Landing Page", url: "https://launch-fast.zoobicon.sh", upvotes: 48, views: 2_099, buildTime: 65, createdAt: "2026-01-30T13:00:00Z" },
    ],
  };
}

/* ---------- time helpers ---------- */
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/* ========== SITE CARD ========== */
function SiteCard({ site }: { site: PortfolioSite }) {
  const gradient = GRADIENT_MAP[site.category] || "from-gray-600 to-gray-500";

  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden hover:border-stone-500/30 hover:shadow-lg hover:shadow-stone-500/10 transition-all duration-300"
    >
      {/* Preview */}
      <div className={`relative h-44 bg-gradient-to-br ${gradient} overflow-hidden`}>
        <div className="absolute inset-0 bg-black/20" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E\")",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-6">
            <p className="text-white font-bold text-lg drop-shadow-lg">{site.name}</p>
            <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-white/20 text-white/80 text-xs backdrop-blur-sm">
              {site.category}
            </span>
          </div>
        </div>
        <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 text-white/80 text-xs backdrop-blur-sm">
          <Clock className="w-3 h-3" />
          {site.buildTime}s
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5" />
              {site.upvotes}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {formatNumber(site.views)}
            </span>
          </div>
          <span className="text-xs text-gray-500">{timeAgo(site.createdAt)}</span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
          <Link
            href={`/builder?remix=${site.id}`}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:text-stone-400 hover:bg-stone-500/10 transition-colors"
          >
            <GitFork className="w-3.5 h-3.5" />
            Remix
          </Link>
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View Live
          </a>
        </div>
      </div>
    </motion.div>
  );
}

/* ========== MAIN PAGE ========== */
export default function CreatorProfilePage() {
  const params = useParams();
  const username = (params.username as string) || "unknown";

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [activeTab, setActiveTab] = useState<"portfolio" | "achievements">("portfolio");

  useEffect(() => {
    try {
      const u = localStorage.getItem("zoobicon_user");
      if (u) setIsLoggedIn(true);
    } catch {
      /* ignore */
    }
    setProfile(getMockProfile(username));
  }, [username]);

  const handleFollow = () => setIsFollowing(!isFollowing);

  const handleShare = async () => {
    const url = `${window.location.origin}/profile/${username}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  if (!profile) return null;

  const tierCfg = TIER_CONFIG[profile.tier] || TIER_CONFIG.Rising;
  const TierIcon = tierCfg.icon;

  const stats = [
    { label: "Sites Built", value: profile.stats.sitesBuilt, icon: Globe },
    { label: "Total Views", value: formatNumber(profile.stats.totalViews), icon: Eye },
    { label: "Gallery Posts", value: profile.stats.galleryPosts, icon: Sparkles },
    { label: "Followers", value: profile.stats.followers, icon: UserPlus },
  ];

  return (
    <div className="min-h-screen bg-[#0b1530] text-white">
      {/* ===== NAV ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0b1530]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-4">
            <Link
              href="/gallery"
              className="flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Gallery
            </Link>
            <div className="w-px h-5 bg-white/10" />
            <Link href="/" className="font-bold text-lg tracking-tight">
              Zoobicon
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    localStorage.removeItem("zoobicon_user");
                    setIsLoggedIn(false);
                  }}
                  className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-sm text-white/50 hover:text-white/80 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/builder"
                  className="px-4 py-2 bg-stone-600 hover:bg-stone-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Start Building
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ===== PROFILE HEADER ===== */}
      <div className="pt-28 pb-8 px-6 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-stone-500/8 via-stone-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center sm:items-start gap-6"
          >
            {/* Avatar */}
            <div className="relative">
              <div className={`w-28 h-28 rounded-2xl bg-gradient-to-br ${tierCfg.gradient} flex items-center justify-center text-4xl font-black text-white shadow-lg shadow-stone-500/10`}>
                {profile.displayName.charAt(0).toUpperCase()}
              </div>
              <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-lg ${tierCfg.bg} border flex items-center justify-center`}>
                <TierIcon className={`w-4 h-4 ${tierCfg.color}`} />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 mb-2">
                <h1 className="text-3xl font-black tracking-tight">{profile.displayName}</h1>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${tierCfg.bg} border ${tierCfg.color}`}>
                  <TierIcon className="w-3 h-3" />
                  {profile.tier} Creator
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-2">@{profile.username}</p>
              <p className="text-sm text-gray-400 max-w-lg mb-4">{profile.bio}</p>
              <div className="flex items-center justify-center sm:justify-start gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Creator since {formatDate(profile.joinedAt)}
                </span>
                <span>
                  <strong className="text-gray-300">{profile.stats.following}</strong> following
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-center sm:justify-start gap-3 mt-5">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleFollow}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isFollowing
                      ? "bg-white/[0.06] border border-white/[0.1] text-gray-300 hover:border-stone-500/30 hover:text-stone-400"
                      : "bg-gradient-to-r from-stone-600 to-stone-600 hover:from-stone-500 hover:to-stone-500 text-white shadow-lg shadow-stone-500/20"
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Follow
                    </>
                  )}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/[0.04] border border-white/[0.08] text-gray-300 hover:text-white hover:bg-white/[0.06] transition-all"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-stone-400" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      Share
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ===== STATS ROW ===== */}
      <div className="max-w-4xl mx-auto px-6 mb-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-stone-500/20 transition-colors"
              >
                <Icon className="w-5 h-5 text-stone-400" />
                <span className="text-2xl font-black">{stat.value}</span>
                <span className="text-xs text-gray-500">{stat.label}</span>
              </div>
            );
          })}
        </motion.div>
      </div>

      {/* ===== TABS ===== */}
      <div className="max-w-4xl mx-auto px-6 mb-8">
        <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 w-fit">
          <button
            onClick={() => setActiveTab("portfolio")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "portfolio"
                ? "bg-stone-500/15 text-stone-400 border border-stone-500/20"
                : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Globe className="w-4 h-4" />
            Portfolio ({profile.sites.length})
          </button>
          <button
            onClick={() => setActiveTab("achievements")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "achievements"
                ? "bg-stone-500/15 text-stone-400 border border-stone-500/20"
                : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Award className="w-4 h-4" />
            Achievements ({profile.badges.length})
          </button>
        </div>
      </div>

      {/* ===== TAB CONTENT ===== */}
      <div className="max-w-4xl mx-auto px-6 pb-20">
        {activeTab === "portfolio" ? (
          <motion.div
            key="portfolio"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {profile.sites.map((site) => (
              <SiteCard key={site.id} site={site} />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="achievements"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {profile.badges.map((badge) => {
              const BadgeIcon = BADGE_ICONS[badge.icon] || Star;
              return (
                <motion.div
                  key={badge.id}
                  variants={fadeInUp}
                  className="flex items-center gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-stone-500/20 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-xl bg-stone-500/10 border border-stone-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <BadgeIcon className="w-6 h-6 text-stone-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white mb-0.5">{badge.name}</h3>
                    <p className="text-xs text-gray-500">{badge.description}</p>
                    <p className="text-[10px] text-gray-600 mt-1">Unlocked {formatDate(badge.unlockedAt)}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* ===== BOTTOM CTA ===== */}
      <div className="border-t border-white/[0.06] py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-4">
              Create your{" "}
              <span className="bg-gradient-to-r from-stone-400 to-stone-400 bg-clip-text text-transparent">
                creator profile
              </span>
            </h2>
            <p className="text-gray-400 mb-8">
              Build websites, share your work, earn achievements, and grow your audience.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="/builder"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-stone-600 to-stone-600 hover:from-stone-500 hover:to-stone-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-stone-500/20"
              >
                <Sparkles className="w-4 h-4" />
                Start Building
              </Link>
              <Link
                href="/gallery"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/[0.04] border border-white/[0.08] text-gray-300 hover:text-white hover:bg-white/[0.06] font-medium rounded-xl transition-all"
              >
                Browse Gallery
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/[0.06] py-12 px-6 text-center">
        <div className="flex items-center justify-center gap-6 text-xs text-gray-600">
          <Link href="/" className="hover:text-gray-400 transition-colors">Home</Link>
          <Link href="/pricing" className="hover:text-gray-400 transition-colors">Pricing</Link>
          <Link href="/gallery" className="hover:text-gray-400 transition-colors">Gallery</Link>
          <Link href="/generators" className="hover:text-gray-400 transition-colors">Generators</Link>
          <Link href="/privacy" className="hover:text-gray-400 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-gray-400 transition-colors">Terms</Link>
        </div>
        <p className="text-xs text-gray-700 mt-4">&copy; {new Date().getFullYear()} Zoobicon. All rights reserved.</p>
      </footer>
    </div>
  );
}
