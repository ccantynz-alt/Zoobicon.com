"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import BackgroundEffects from "@/components/BackgroundEffects";
import HeroEffects, { CursorGlowTracker } from "@/components/HeroEffects";
import {
  Zap,
  Copy,
  Check,
  Share2,
  Users,
  Gift,
  Trophy,
  ArrowRight,
  Star,
  Crown,
  Target,
  TrendingUp,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageSquare,
  QrCode,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  getReferralStats,
  getReferralLink,
  getReferralTier,
  trackReferralClick,
  calculateSavings,
  getTopReferrers,
  generateReferralCode,
  type ReferralStats,
  type ReferralTier,
  type LeaderboardEntry,
} from "@/lib/referral";

/* ---------- animation helpers ---------- */
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};
const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" as const } },
};

/* ---------- Animated Counter ---------- */
function AnimatedCounter({ value, duration = 1.5, prefix = "", suffix = "" }: {
  value: number; duration?: number; prefix?: string; suffix?: string;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const end = value;
    if (end === 0) { setDisplay(0); return; }
    const step = Math.max(1, Math.floor(end / (duration * 60)));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setDisplay(end); clearInterval(timer); }
      else setDisplay(start);
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [value, duration, isInView]);

  return <span ref={ref}>{prefix}{display.toLocaleString()}{suffix}</span>;
}

/* ---------- Simple SVG QR Code ---------- */
function QRCode({ data, size = 140 }: { data: string; size?: number }) {
  // Generate a deterministic pattern from the URL for a decorative QR-style display
  const cells = 21;
  const cellSize = size / cells;
  const rects: { x: number; y: number }[] = [];

  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash + data.charCodeAt(i)) | 0;
  }

  // Finder patterns (3 corners)
  const finderPositions = [
    [0, 0], [0, cells - 7], [cells - 7, 0],
  ];

  for (const [fy, fx] of finderPositions) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (r === 0 || r === 6 || c === 0 || c === 6 ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
          rects.push({ x: fx + c, y: fy + r });
        }
      }
    }
  }

  // Fill data area with pseudo-random pattern
  let seed = Math.abs(hash);
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      // Skip finder pattern areas
      const inFinder = finderPositions.some(([fy, fx]) =>
        r >= fy && r < fy + 7 && c >= fx && c < fx + 7
      );
      if (inFinder) continue;

      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      if (seed % 3 === 0) {
        rects.push({ x: c, y: r });
      }
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-lg">
      <rect width={size} height={size} fill="white" rx="8" />
      {rects.map((rect, i) => (
        <rect
          key={i}
          x={rect.x * cellSize + 0.5}
          y={rect.y * cellSize + 0.5}
          width={cellSize - 1}
          height={cellSize - 1}
          fill="#0a0a12"
          rx={1}
        />
      ))}
    </svg>
  );
}

/* ---------- Share Button Component ---------- */
function ShareButton({ icon: Icon, label, color, onClick }: {
  icon: React.ElementType; label: string; color: string; onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${color}`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </motion.button>
  );
}

/* ---------- Tier Progress Bar ---------- */
function TierProgress({ tier, signups }: { tier: ReferralTier; signups: number }) {
  const progress = tier.nextTierAt
    ? Math.min(100, ((signups - tier.minReferrals) / (tier.nextTierAt - tier.minReferrals)) * 100)
    : 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{tier.badge}</span>
          <span className={`font-bold ${tier.color}`}>{tier.name}</span>
        </div>
        {tier.nextTier && (
          <span className="text-sm text-white/50">
            {tier.nextTierAt! - signups} more to {tier.nextTier}
          </span>
        )}
      </div>
      <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          className="h-full rounded-full bg-gradient-to-r from-stone-500 to-stone-500"
        />
      </div>
      {tier.nextTier && (
        <div className="flex justify-between text-xs text-white/40">
          <span>{tier.name} ({tier.minReferrals}+)</span>
          <span>{tier.nextTier} ({tier.nextTierAt}+)</span>
        </div>
      )}
    </div>
  );
}

/* =================================================================== */
/*  MAIN PAGE                                                          */
/* =================================================================== */

export default function ReferralPage() {
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [tier, setTier] = useState<ReferralTier | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  /* --- Auth + data load --- */
  useEffect(() => {
    try {
      const stored = localStorage.getItem("zoobicon_user");
      if (stored) {
        const u = JSON.parse(stored);
        setUser(u);

        // Ensure referral stats exist
        let s = getReferralStats();
        if (!s.referralCode && u.email) {
          s = {
            ...s,
            referralCode: generateReferralCode(u.email),
          };
          localStorage.setItem("zoobicon_referral_stats", JSON.stringify(s));
        }
        setStats(s);
        setTier(getReferralTier(s.signups));
      }
    } catch { /* ignore */ }
    setLeaderboard(getTopReferrers());
  }, []);

  /* --- Copy referral link --- */
  const copyLink = useCallback(() => {
    if (!stats) return;
    const link = getReferralLink(stats.referralCode);
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      trackReferralClick();
      setStats(getReferralStats());
      setTimeout(() => setCopied(false), 2000);
    });
  }, [stats]);

  /* --- Share helpers --- */
  const referralLink = stats ? getReferralLink(stats.referralCode) : "";
  const shareText = "I've been building amazing websites with Zoobicon AI in seconds. Sign up with my link and we both get 5 free builds!";

  function shareTwitter() {
    trackReferralClick();
    setStats(getReferralStats());
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(referralLink)}`, "_blank");
  }
  function shareLinkedIn() {
    trackReferralClick();
    setStats(getReferralStats());
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`, "_blank");
  }
  function shareEmail() {
    trackReferralClick();
    setStats(getReferralStats());
    window.open(`mailto:?subject=${encodeURIComponent("Build websites with AI — free builds for us both!")}&body=${encodeURIComponent(`${shareText}\n\n${referralLink}`)}`, "_blank");
  }
  function shareWhatsApp() {
    trackReferralClick();
    setStats(getReferralStats());
    window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${referralLink}`)}`, "_blank");
  }

  /* --- Status badge color --- */
  function statusColor(status: string) {
    switch (status) {
      case "active": return "text-stone-400 bg-stone-500/10";
      case "built_first_site": return "text-stone-400 bg-stone-500/10";
      case "signed_up": return "text-stone-400 bg-stone-500/10";
      default: return "text-white/50 bg-white/5";
    }
  }
  function statusLabel(status: string) {
    switch (status) {
      case "active": return "Active";
      case "built_first_site": return "Built First Site";
      case "signed_up": return "Signed Up";
      default: return status;
    }
  }

  const savings = stats ? calculateSavings(stats.buildsEarned) : 0;

  return (
    <div className="relative min-h-screen">
      <BackgroundEffects preset="technical" />

      {/* ---- Nav ---- */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0a12]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Zoobicon</span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link href="/dashboard" className="text-sm text-white/65 hover:text-white transition-colors px-3 py-2 flex items-center gap-1.5">
                  <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                </Link>
                <button
                  onClick={() => { try { localStorage.removeItem("zoobicon_user"); } catch {} setUser(null); }}
                  className="text-sm text-white/65 hover:text-white transition-colors px-3 py-2 flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm text-white/65 hover:text-white transition-colors px-3 py-2">Sign in</Link>
                <Link href="/auth/signup" className="btn-gradient px-4 py-2 rounded-xl text-sm font-semibold text-white">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
      <CursorGlowTracker />

      <main>
        {/* ============================================================ */}
        {/*  HERO                                                        */}
        {/* ============================================================ */}
        <section className="relative py-20 lg:py-28 text-center">
          <HeroEffects variant="cyan" cursorGlow particles particleCount={35} aurora />
          <div className="max-w-3xl mx-auto px-6">
            <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-stone-500/20 bg-stone-500/5 text-stone-400 text-sm font-medium mb-6">
                <Gift className="w-3.5 h-3.5" />
                Referral Program
              </motion.div>
              <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-black tracking-tight mb-6">
                Share Zoobicon,<br />
                <span className="bg-gradient-to-r from-stone-400 via-stone-400 to-stone-400 bg-clip-text text-transparent">
                  Earn Free Builds
                </span>
              </motion.h1>
              <motion.p variants={fadeInUp} className="text-lg text-white/60 max-w-xl mx-auto mb-8">
                Give your friends 5 free AI website builds. When they build their first site, you get 5 free builds too. Everyone wins.
              </motion.p>
              {!user && (
                <motion.div variants={fadeInUp}>
                  <Link
                    href="/auth/signup"
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-stone-500 to-stone-500 hover:from-stone-400 hover:to-stone-400 transition-all shadow-lg shadow-stone-500/20"
                  >
                    Sign Up to Get Your Referral Link
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  LOGGED-IN DASHBOARD                                         */}
        {/* ============================================================ */}
        {user && stats && tier && (
          <div className="max-w-6xl mx-auto px-6 pb-24 space-y-12">

            {/* ---- Referral Link + QR ---- */}
            <motion.section
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={scaleIn}
              className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8"
            >
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-stone-400" />
                Your Referral Link
              </h2>
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1 w-full space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/80 font-mono truncate">
                      {referralLink}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={copyLink}
                      className={`px-4 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all ${
                        copied
                          ? "bg-stone-500/20 text-stone-400 border border-stone-500/30"
                          : "bg-gradient-to-r from-stone-500 to-stone-500 text-white"
                      }`}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? "Copied!" : "Copy"}
                    </motion.button>
                  </div>

                  {/* Share buttons */}
                  <div className="flex flex-wrap gap-2">
                    <ShareButton icon={Copy} label="Copy Link" color="bg-white/[0.06] hover:bg-white/[0.1] text-white/80" onClick={copyLink} />
                    <ShareButton icon={ExternalLink} label="MessageCircle" color="bg-stone-500/10 hover:bg-stone-500/20 text-stone-400 border border-stone-500/20" onClick={shareTwitter} />
                    <ShareButton icon={TrendingUp} label="LinkedIn" color="bg-stone-500/10 hover:bg-stone-500/20 text-stone-400 border border-stone-500/20" onClick={shareLinkedIn} />
                    <ShareButton icon={Mail} label="Email" color="bg-stone-500/10 hover:bg-stone-500/20 text-stone-400 border border-stone-500/20" onClick={shareEmail} />
                    <ShareButton icon={MessageSquare} label="WhatsApp" color="bg-stone-500/10 hover:bg-stone-500/20 text-stone-400 border border-stone-500/20" onClick={shareWhatsApp} />
                  </div>
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 bg-white rounded-xl">
                    <QRCode data={referralLink} size={140} />
                  </div>
                  <span className="text-xs text-white/40 flex items-center gap-1">
                    <QrCode className="w-3 h-3" /> Scan to share
                  </span>
                </div>
              </div>
            </motion.section>

            {/* ---- Stats Cards ---- */}
            <motion.section
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={staggerContainer}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {[
                { label: "Referrals Sent", value: stats.linkCopied, icon: Share2, color: "text-stone-400", bg: "from-stone-500/10 to-stone-500/5", border: "border-stone-500/20" },
                { label: "Friends Signed Up", value: stats.signups, icon: Users, color: "text-stone-400", bg: "from-stone-500/10 to-stone-500/5", border: "border-stone-500/20" },
                { label: "Builds Earned", value: stats.buildsEarned, icon: Gift, color: "text-stone-400", bg: "from-stone-500/10 to-stone-500/5", border: "border-stone-500/20" },
                { label: "Total Savings", value: savings, icon: TrendingUp, color: "text-stone-400", bg: "from-stone-500/10 to-stone-500/5", border: "border-stone-500/20", prefix: "$" },
              ].map((card) => (
                <motion.div
                  key={card.label}
                  variants={fadeInUp}
                  className={`bg-gradient-to-br ${card.bg} border ${card.border} rounded-2xl p-6 text-center`}
                >
                  <card.icon className={`w-6 h-6 ${card.color} mx-auto mb-3`} />
                  <div className={`text-3xl md:text-4xl font-black ${card.color}`}>
                    <AnimatedCounter value={card.value} prefix={card.prefix || ""} />
                  </div>
                  <div className="text-sm text-white/50 mt-1">{card.label}</div>
                </motion.div>
              ))}
            </motion.section>

            {/* ---- Tier Progress ---- */}
            <motion.section
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={scaleIn}
              className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8"
            >
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Crown className="w-5 h-5 text-stone-400" />
                Your Referral Tier
              </h2>
              <TierProgress tier={tier} signups={stats.signups} />

              {/* All tiers */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
                {[
                  { name: "Recruiter", badge: "🎯", range: "1-4 referrals", color: "border-stone-500/20 bg-stone-500/5" },
                  { name: "Ambassador", badge: "⭐", range: "5-19 referrals", color: "border-stone-500/20 bg-stone-500/5" },
                  { name: "Champion", badge: "🏆", range: "20+ referrals", color: "border-stone-500/20 bg-stone-500/5" },
                  { name: "Legend", badge: "💎", range: "50+ referrals", color: "border-stone-500/20 bg-stone-500/5" },
                ].map((t) => (
                  <div key={t.name} className={`border ${t.color} rounded-xl p-4 text-center`}>
                    <span className="text-2xl">{t.badge}</span>
                    <div className="text-sm font-bold mt-1">{t.name}</div>
                    <div className="text-xs text-white/40">{t.range}</div>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* ---- Referral History ---- */}
            <motion.section
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={scaleIn}
              className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8"
            >
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-stone-400" />
                Referral History
              </h2>
              {stats.history.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-white/15 mx-auto mb-4" />
                  <p className="text-white/40 text-sm">No referrals yet. Share your link to get started!</p>
                  <button
                    onClick={copyLink}
                    className="mt-4 inline-flex items-center gap-2 text-sm text-stone-400 hover:text-stone-300 transition-colors"
                  >
                    <Copy className="w-4 h-4" /> Copy your referral link
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-white/40">
                        <th className="text-left py-3 pr-4 font-medium">Referred User</th>
                        <th className="text-left py-3 pr-4 font-medium">Date</th>
                        <th className="text-left py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.history.map((entry) => (
                        <tr key={entry.id} className="border-b border-white/[0.03]">
                          <td className="py-3 pr-4 text-white/70 font-mono text-xs">{entry.name}</td>
                          <td className="py-3 pr-4 text-white/50">{new Date(entry.date).toLocaleDateString()}</td>
                          <td className="py-3">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor(entry.status)}`}>
                              {statusLabel(entry.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.section>

            {/* ---- Leaderboard ---- */}
            <motion.section
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={scaleIn}
              className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8"
            >
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-stone-400" />
                Top Referrers
              </h2>
              <div className="space-y-2">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.rank}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${
                      entry.rank <= 3
                        ? "bg-gradient-to-r from-stone-500/5 to-transparent border border-stone-500/10"
                        : "bg-white/[0.02] hover:bg-white/[0.04]"
                    }`}
                  >
                    <span className={`w-8 text-center font-black text-lg ${
                      entry.rank === 1 ? "text-stone-400" :
                      entry.rank === 2 ? "text-gray-300" :
                      entry.rank === 3 ? "text-stone-600" :
                      "text-white/30"
                    }`}>
                      {entry.rank <= 3 ? ["", "🥇", "🥈", "🥉"][entry.rank] : `#${entry.rank}`}
                    </span>
                    <div className="flex-1">
                      <span className="font-semibold text-sm">{entry.username}</span>
                      <span className="ml-2 text-xs text-white/40">{entry.badge} {entry.tier}</span>
                    </div>
                    <div className="text-sm font-bold text-stone-400">
                      {entry.referrals} referrals
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          </div>
        )}

        {/* ============================================================ */}
        {/*  HOW IT WORKS (visible to everyone)                          */}
        {/* ============================================================ */}
        <section className="py-20 border-t border-white/[0.06]">
          <div className="max-w-4xl mx-auto px-6">
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={staggerContainer}
              className="text-center mb-16"
            >
              <motion.h2 variants={fadeInUp} className="text-3xl md:text-5xl font-black mb-4">
                How It Works
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-white/50 text-lg">
                Three simple steps. Free builds for everyone.
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={staggerContainer}
              className="grid md:grid-cols-3 gap-8"
            >
              {[
                {
                  step: "1",
                  icon: Share2,
                  title: "Share Your Link",
                  desc: "Copy your unique referral link and share it with friends, on social media, or in your community.",
                  color: "from-stone-500 to-stone-500",
                  iconColor: "text-stone-400",
                },
                {
                  step: "2",
                  icon: Users,
                  title: "Friend Signs Up",
                  desc: "When your friend creates an account through your link, they immediately get 5 free AI website builds.",
                  color: "from-stone-500 to-stone-500",
                  iconColor: "text-stone-400",
                },
                {
                  step: "3",
                  icon: Gift,
                  title: "You Earn Builds",
                  desc: "Once your friend builds their first website, you get 5 free builds credited to your account. No cap.",
                  color: "from-stone-500 to-stone-500",
                  iconColor: "text-stone-400",
                },
              ].map((item) => (
                <motion.div
                  key={item.step}
                  variants={fadeInUp}
                  className="relative bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 text-center group hover:border-white/[0.12] transition-colors"
                >
                  <div className={`absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-r ${item.color} flex items-center justify-center text-sm font-black text-white`}>
                    {item.step}
                  </div>
                  <item.icon className={`w-10 h-10 ${item.iconColor} mx-auto mb-4 mt-4`} />
                  <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  REWARD TIERS (visible to everyone)                          */}
        {/* ============================================================ */}
        <section className="py-20 border-t border-white/[0.06]">
          <div className="max-w-4xl mx-auto px-6">
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={staggerContainer}
              className="text-center mb-16"
            >
              <motion.h2 variants={fadeInUp} className="text-3xl md:text-5xl font-black mb-4">
                Unlock <span className="bg-gradient-to-r from-stone-400 to-stone-400 bg-clip-text text-transparent">Referral Tiers</span>
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-white/50 text-lg">
                The more you refer, the higher you climb. Top referrers get exclusive perks.
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={staggerContainer}
              className="grid md:grid-cols-4 gap-4"
            >
              {[
                { name: "Recruiter", badge: "🎯", range: "1-4 referrals", reward: "5 builds per referral", color: "border-stone-500/20", bg: "bg-stone-500/5", glow: "shadow-stone-500/10" },
                { name: "Ambassador", badge: "⭐", range: "5-19 referrals", reward: "5 builds + priority support", color: "border-stone-500/20", bg: "bg-stone-500/5", glow: "shadow-stone-500/10" },
                { name: "Champion", badge: "🏆", range: "20-49 referrals", reward: "5 builds + 1 month Pro free", color: "border-stone-500/20", bg: "bg-stone-500/5", glow: "shadow-stone-500/10" },
                { name: "Legend", badge: "💎", range: "50+ referrals", reward: "5 builds + lifetime Pro", color: "border-stone-500/20", bg: "bg-stone-500/5", glow: "shadow-stone-500/10" },
              ].map((t, i) => (
                <motion.div
                  key={t.name}
                  variants={fadeInUp}
                  className={`border ${t.color} ${t.bg} rounded-2xl p-6 text-center shadow-lg ${t.glow} hover:scale-105 transition-transform`}
                >
                  <span className="text-4xl">{t.badge}</span>
                  <h3 className="text-lg font-bold mt-3 mb-1">{t.name}</h3>
                  <p className="text-xs text-white/40 mb-3">{t.range}</p>
                  <div className="text-sm text-white/70 bg-white/[0.04] rounded-lg px-3 py-2">
                    {t.reward}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  CTA                                                         */}
        {/* ============================================================ */}
        <section className="py-20 border-t border-white/[0.06]">
          <div className="max-w-2xl mx-auto px-6 text-center">
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp}>
                <Sparkles className="w-10 h-10 text-stone-400 mx-auto mb-6" />
              </motion.div>
              <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-black mb-4">
                Start Earning Free Builds Today
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-white/50 mb-8">
                There is no cap on referral rewards. The more friends you bring, the more you build for free.
              </motion.p>
              <motion.div variants={fadeInUp}>
                {user ? (
                  <button
                    onClick={copyLink}
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-stone-500 to-stone-500 hover:from-stone-400 hover:to-stone-400 transition-all shadow-lg shadow-stone-500/20"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    {copied ? "Link Copied!" : "Copy Your Referral Link"}
                  </button>
                ) : (
                  <Link
                    href="/auth/signup"
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-stone-500 to-stone-500 hover:from-stone-400 hover:to-stone-400 transition-all shadow-lg shadow-stone-500/20"
                  >
                    Sign Up to Start Referring
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                )}
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ---- Footer ---- */}
      <footer className="border-t border-white/[0.06] py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <Zap className="w-3.5 h-3.5" /> Zoobicon Referral Program
          </div>
          <div className="flex items-center gap-6 text-sm text-white/40">
            <Link href="/terms" className="hover:text-white/70 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-white/70 transition-colors">Privacy</Link>
            <Link href="/support" className="hover:text-white/70 transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
