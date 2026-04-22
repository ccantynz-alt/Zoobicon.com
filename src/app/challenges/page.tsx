"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Trophy,
  Users,
  Clock,
  Crown,
  Sparkles,
  Flame,
  Target,
  Star,
  Medal,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Zap,
  Calendar,
  Award,
} from "lucide-react";

/* ---------- animation helpers ---------- */
const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};
const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

/* ---------- types ---------- */
interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  participants: number;
  prize: string;
  status: "active" | "past" | "upcoming";
  winner?: string;
  winnerAvatar?: string;
  startDate: string;
  endDate: string;
  gradient: string;
}

interface LeaderboardEntry {
  rank: number;
  username: string;
  wins: number;
  participations: number;
  points: number;
  tier: "Master" | "Pro" | "Rising";
}

/* ---------- gradient map for challenge categories ---------- */
const CATEGORY_GRADIENTS: Record<string, string> = {
  Restaurant: "from-stone-600 to-stone-400",
  Portfolio: "from-stone-600 to-stone-500",
  "E-Commerce": "from-stone-600 to-stone-400",
  SaaS: "from-stone-600 to-stone-400",
  Agency: "from-stone-600 to-stone-400",
  "Landing Page": "from-stone-600 to-stone-400",
  Blog: "from-stone-600 to-stone-400",
  Creative: "from-stone-600 to-stone-400",
};

/* ---------- demo data ---------- */
const DEMO_CHALLENGES: Challenge[] = [
  {
    id: "current-1",
    title: "Best Restaurant Site",
    description:
      "Design a stunning restaurant website that makes visitors hungry. Focus on ambiance, menu presentation, and online reservations.",
    category: "Restaurant",
    participants: 142,
    prize: "1 Month Pro Free",
    status: "active",
    startDate: "2026-03-17",
    endDate: "2026-03-24",
    gradient: "from-stone-600 to-stone-400",
  },
  {
    id: "past-1",
    title: "Most Creative Portfolio",
    description:
      "Push the limits of creativity. Build a portfolio that showcases personality as much as skill.",
    category: "Portfolio",
    participants: 218,
    prize: "1 Month Pro Free",
    status: "past",
    winner: "PixelQueen",
    winnerAvatar: "P",
    startDate: "2026-03-10",
    endDate: "2026-03-17",
    gradient: "from-stone-600 to-stone-500",
  },
  {
    id: "past-2",
    title: "E-Commerce Excellence",
    description:
      "Build the perfect online store. Clean product grids, smooth checkout flow, and trust-building design.",
    category: "E-Commerce",
    participants: 189,
    prize: "1 Month Pro Free",
    status: "past",
    winner: "BuilderMax",
    winnerAvatar: "B",
    startDate: "2026-03-03",
    endDate: "2026-03-10",
    gradient: "from-stone-600 to-stone-400",
  },
  {
    id: "past-3",
    title: "SaaS Landing Page Sprint",
    description:
      "Create a conversion-optimized SaaS landing page. Hero, features, pricing, testimonials — make it sell.",
    category: "SaaS",
    participants: 256,
    prize: "1 Month Pro Free",
    status: "past",
    winner: "CodeNinja42",
    winnerAvatar: "C",
    startDate: "2026-02-24",
    endDate: "2026-03-03",
    gradient: "from-stone-600 to-stone-400",
  },
  {
    id: "past-4",
    title: "Agency Showcase Challenge",
    description:
      "Build a digital agency website that wins clients on first impression. Credibility, case studies, and a killer CTA.",
    category: "Agency",
    participants: 134,
    prize: "1 Month Pro Free",
    status: "past",
    winner: "DesignDragon",
    winnerAvatar: "D",
    startDate: "2026-02-17",
    endDate: "2026-02-24",
    gradient: "from-stone-600 to-stone-400",
  },
  {
    id: "past-5",
    title: "Minimal Blog Masterclass",
    description:
      "Less is more. Create a beautiful, readable blog with perfect typography and effortless navigation.",
    category: "Blog",
    participants: 167,
    prize: "1 Month Pro Free",
    status: "past",
    winner: "TypeCraft",
    winnerAvatar: "T",
    startDate: "2026-02-10",
    endDate: "2026-02-17",
    gradient: "from-stone-600 to-stone-400",
  },
  {
    id: "past-6",
    title: "Dark Mode Showcase",
    description:
      "Design a site that proves dark mode can be elegant, not just dark. Focus on contrast, color pops, and readability.",
    category: "Creative",
    participants: 203,
    prize: "1 Month Pro Free",
    status: "past",
    winner: "NightOwl",
    winnerAvatar: "N",
    startDate: "2026-02-03",
    endDate: "2026-02-10",
    gradient: "from-stone-600 to-stone-400",
  },
  {
    id: "past-7",
    title: "One-Page Wonder",
    description:
      "Everything on one page. Build the most impactful single-page site with smooth scroll and storytelling flow.",
    category: "Landing Page",
    participants: 291,
    prize: "1 Month Pro Free",
    status: "past",
    winner: "ScrollMaster",
    winnerAvatar: "S",
    startDate: "2026-01-27",
    endDate: "2026-02-03",
    gradient: "from-stone-600 to-stone-400",
  },
];

const DEMO_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, username: "PixelQueen", wins: 4, participations: 8, points: 2840, tier: "Master" },
  { rank: 2, username: "CodeNinja42", wins: 3, participations: 8, points: 2560, tier: "Master" },
  { rank: 3, username: "BuilderMax", wins: 3, participations: 7, points: 2310, tier: "Master" },
  { rank: 4, username: "DesignDragon", wins: 2, participations: 8, points: 1990, tier: "Pro" },
  { rank: 5, username: "ScrollMaster", wins: 2, participations: 6, points: 1780, tier: "Pro" },
  { rank: 6, username: "TypeCraft", wins: 1, participations: 7, points: 1540, tier: "Pro" },
  { rank: 7, username: "NightOwl", wins: 1, participations: 5, points: 1280, tier: "Rising" },
  { rank: 8, username: "DevArtist", wins: 0, participations: 8, points: 1120, tier: "Rising" },
];

/* ---------- countdown helper ---------- */
function useCountdown(endDate: string) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    function calc() {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      };
    }
    setTimeLeft(calc());
    const interval = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  return timeLeft;
}

/* ---------- tier badge colors ---------- */
function tierColor(tier: string) {
  switch (tier) {
    case "Master":
      return "text-stone-400 bg-stone-500/10 border-stone-500/20";
    case "Pro":
      return "text-stone-400 bg-stone-500/10 border-stone-500/20";
    default:
      return "text-gray-400 bg-white/[0.04] border-white/[0.06]";
  }
}

function rankIcon(rank: number) {
  if (rank === 1) return <Crown className="w-4 h-4 text-stone-400" />;
  if (rank === 2) return <Medal className="w-4 h-4 text-gray-300" />;
  if (rank === 3) return <Medal className="w-4 h-4 text-stone-600" />;
  return <span className="text-xs text-gray-500 font-mono w-4 text-center">{rank}</span>;
}

/* ========== CHALLENGE CARD ========== */
function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const isPast = challenge.status === "past";

  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden hover:border-stone-500/30 hover:shadow-lg hover:shadow-stone-500/10 transition-all duration-300"
    >
      {/* Gradient thumbnail */}
      <div className={`relative h-40 bg-gradient-to-br ${challenge.gradient} overflow-hidden`}>
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
            <Trophy className="w-8 h-8 text-white/80 mx-auto mb-2 drop-shadow-lg" />
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-white/90 text-xs backdrop-blur-sm font-medium">
              {challenge.category}
            </span>
          </div>
        </div>
        {/* Status badge */}
        <div className="absolute top-3 right-3">
          {isPast ? (
            <span className="px-2.5 py-1 rounded-full bg-black/50 text-gray-300 text-xs backdrop-blur-sm">
              Completed
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-stone-500/20 border border-stone-500/30 text-stone-400 text-xs backdrop-blur-sm font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-pulse" />
              Active
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-stone-400 transition-colors">
          {challenge.title}
        </h3>
        <p className="text-sm text-gray-400 leading-relaxed line-clamp-2 mb-4 min-h-[2.5rem]">
          {challenge.description}
        </p>

        {/* Meta row */}
        <div className="flex items-center justify-between mb-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {challenge.participants} participants
          </span>
          <span className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-stone-500" />
            {challenge.prize}
          </span>
        </div>

        {/* Winner or Join CTA */}
        <div className="pt-3 border-t border-white/[0.06]">
          {isPast && challenge.winner ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-stone-500 to-stone-600 flex items-center justify-center text-[11px] font-bold text-white">
                  {challenge.winnerAvatar}
                </div>
                <div>
                  <p className="text-xs text-gray-400">Winner</p>
                  <p className="text-sm font-semibold text-white">{challenge.winner}</p>
                </div>
              </div>
              <Crown className="w-5 h-5 text-stone-400" />
            </div>
          ) : (
            <Link
              href="/builder"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-stone-600 to-stone-600 hover:from-stone-500 hover:to-stone-500 text-white text-sm font-semibold rounded-xl transition-all"
            >
              <Zap className="w-4 h-4" />
              Join Challenge
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ========== MAIN PAGE ========== */
export default function ChallengesPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const activeChallenge = DEMO_CHALLENGES.find((c) => c.status === "active")!;
  const pastChallenges = DEMO_CHALLENGES.filter((c) => c.status === "past");
  const countdown = useCountdown(activeChallenge.endDate);

  // Auth check
  useEffect(() => {
    try {
      const u = localStorage.getItem("zoobicon_user");
      if (u) setIsLoggedIn(true);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0a1628] text-white">
      {/* ===== NAV ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a1628]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Home
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

      {/* ===== HERO ===== */}
      <div className="pt-32 pb-12 px-6 text-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-stone-500/8 via-stone-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-stone-500/10 border border-stone-500/20 text-stone-400 text-sm font-medium mb-6">
            <Trophy className="w-4 h-4" />
            Weekly Competitions
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-stone-500/20 text-stone-300 uppercase tracking-wider">
              Beta
            </span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-4">
            Weekly Design{" "}
            <span className="bg-gradient-to-r from-stone-400 to-stone-400 bg-clip-text text-transparent">
              Challenges
            </span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Compete with builders worldwide. Every week a new theme, a new challenge, a new
            chance to prove you are the best. Winners earn prizes and community recognition.
          </p>
        </motion.div>
      </div>

      {/* ===== ACTIVE CHALLENGE ===== */}
      <div className="max-w-5xl mx-auto px-6 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative rounded-3xl overflow-hidden border border-white/[0.08]"
        >
          {/* Background gradient */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${activeChallenge.gradient} opacity-15`}
          />
          <div className="absolute inset-0 bg-[#0a1628]/70 backdrop-blur-sm" />

          <div className="relative p-8 sm:p-12">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
              {/* Left: challenge info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 rounded-full bg-stone-500/15 border border-stone-500/25 text-stone-400 text-xs font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-stone-400 animate-pulse" />
                    Active Now
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-gray-400 text-xs">
                    Week #9
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black mb-3">{activeChallenge.title}</h2>
                <p className="text-gray-400 text-lg mb-6 max-w-xl">
                  {activeChallenge.description}
                </p>
                <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-stone-500" />
                    {activeChallenge.participants} builders competing
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-stone-500" />
                    {activeChallenge.prize}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    {activeChallenge.category}
                  </span>
                </div>
                <Link
                  href="/builder"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-stone-500 to-stone-500 hover:from-stone-400 hover:to-stone-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-stone-500/20 hover:shadow-stone-500/30 text-base"
                >
                  <Flame className="w-5 h-5" />
                  Enter This Challenge
                </Link>
              </div>

              {/* Right: countdown */}
              <div className="lg:text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">
                  Time Remaining
                </p>
                <div className="flex items-center gap-3">
                  {[
                    { val: countdown.days, label: "Days" },
                    { val: countdown.hours, label: "Hrs" },
                    { val: countdown.minutes, label: "Min" },
                    { val: countdown.seconds, label: "Sec" },
                  ].map((unit) => (
                    <div key={unit.label} className="text-center">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-1">
                        <span className="text-2xl sm:text-3xl font-black tabular-nums">
                          {String(unit.val).padStart(2, "0")}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                        {unit.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ===== HOW IT WORKS ===== */}
      <div className="max-w-5xl mx-auto px-6 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl font-bold text-center mb-10">
            How It{" "}
            <span className="bg-gradient-to-r from-stone-400 to-stone-400 bg-clip-text text-transparent">
              Works
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Target,
                title: "Join",
                description:
                  "Check the weekly theme and enter the challenge. Open to all builders, free and Pro.",
                step: "01",
                color: "text-stone-400",
                border: "border-stone-500/20 hover:border-stone-500/40",
                glow: "group-hover:shadow-stone-500/10",
              },
              {
                icon: Sparkles,
                title: "Build",
                description:
                  "Use the Zoobicon builder to create your best site matching the theme. One submission per week.",
                step: "02",
                color: "text-stone-400",
                border: "border-stone-500/20 hover:border-stone-500/40",
                glow: "group-hover:shadow-stone-500/10",
              },
              {
                icon: Trophy,
                title: "Win",
                description:
                  "Community votes pick the winner every Sunday. Top builders earn prizes and leaderboard points.",
                step: "03",
                color: "text-stone-400",
                border: "border-stone-500/20 hover:border-stone-500/40",
                glow: "group-hover:shadow-stone-500/10",
              },
            ].map((step) => (
              <motion.div
                key={step.step}
                variants={fadeInUp}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`group relative rounded-2xl bg-white/[0.02] border ${step.border} p-6 transition-all duration-300 hover:shadow-lg ${step.glow}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center ${step.color}`}
                  >
                    <step.icon className="w-6 h-6" />
                  </div>
                  <span className="text-3xl font-black text-white/[0.06]">{step.step}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ===== PAST CHALLENGES ===== */}
      <div className="max-w-7xl mx-auto px-6 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">
              Past{" "}
              <span className="bg-gradient-to-r from-gray-300 to-gray-500 bg-clip-text text-transparent">
                Challenges
              </span>
            </h2>
            <span className="text-sm text-gray-500">{pastChallenges.length} completed</span>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {pastChallenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* ===== LEADERBOARD ===== */}
      <div className="max-w-3xl mx-auto px-6 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">
              <span className="bg-gradient-to-r from-stone-400 to-stone-400 bg-clip-text text-transparent">
                Leaderboard
              </span>
            </h2>
            <p className="text-sm text-gray-500">Top builders across all challenges</p>
          </div>

          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[2.5rem_1fr_4rem_4.5rem_5rem_4.5rem] gap-4 px-5 py-3 border-b border-white/[0.06] text-xs text-gray-500 font-medium uppercase tracking-wider">
              <span>#</span>
              <span>Builder</span>
              <span className="text-center">Wins</span>
              <span className="text-center">Played</span>
              <span className="text-right">Points</span>
              <span className="text-right">Tier</span>
            </div>

            {/* Rows */}
            {DEMO_LEADERBOARD.map((entry, i) => (
              <motion.div
                key={entry.username}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className={`grid grid-cols-[2.5rem_1fr_4rem_4.5rem_5rem_4.5rem] gap-4 items-center px-5 py-3.5 transition-colors hover:bg-white/[0.02] ${
                  i < DEMO_LEADERBOARD.length - 1 ? "border-b border-white/[0.04]" : ""
                } ${entry.rank <= 3 ? "bg-white/[0.01]" : ""}`}
              >
                {/* Rank */}
                <div className="flex items-center justify-center">{rankIcon(entry.rank)}</div>

                {/* Username */}
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      entry.rank === 1
                        ? "bg-gradient-to-br from-stone-500 to-stone-600"
                        : entry.rank === 2
                        ? "bg-gradient-to-br from-gray-400 to-gray-500"
                        : entry.rank === 3
                        ? "bg-gradient-to-br from-stone-600 to-stone-700"
                        : "bg-gradient-to-br from-stone-600 to-stone-600"
                    }`}
                  >
                    {entry.username.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-white">{entry.username}</span>
                </div>

                {/* Wins */}
                <span className="text-sm text-center text-gray-300 font-semibold tabular-nums">
                  {entry.wins}
                </span>

                {/* Participations */}
                <span className="text-sm text-center text-gray-500 tabular-nums">
                  {entry.participations}
                </span>

                {/* Points */}
                <span className="text-sm text-right text-gray-300 font-semibold tabular-nums">
                  {entry.points.toLocaleString()}
                </span>

                {/* Tier */}
                <div className="flex justify-end">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${tierColor(
                      entry.tier
                    )}`}
                  >
                    {entry.tier}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
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
              Ready to{" "}
              <span className="bg-gradient-to-r from-stone-400 to-stone-400 bg-clip-text text-transparent">
                compete
              </span>
              ?
            </h2>
            <p className="text-gray-400 mb-8">
              Jump into this week&apos;s challenge. Build something incredible, earn community
              recognition, and win prizes.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="/builder"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-stone-500 to-stone-500 hover:from-stone-400 hover:to-stone-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-stone-500/20"
              >
                <Flame className="w-4 h-4" />
                Join This Week&apos;s Challenge
              </Link>
              <Link
                href="/gallery"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/[0.04] border border-white/[0.08] text-gray-300 hover:text-white hover:bg-white/[0.06] font-medium rounded-xl transition-all"
              >
                Browse Gallery
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/[0.06] py-12 px-6 text-center">
        <div className="flex items-center justify-center gap-6 text-xs text-gray-600 flex-wrap">
          <Link href="/" className="hover:text-gray-400 transition-colors">Home</Link>
          <Link href="/pricing" className="hover:text-gray-400 transition-colors">Pricing</Link>
          <Link href="/gallery" className="hover:text-gray-400 transition-colors">Gallery</Link>
          <Link href="/generators" className="hover:text-gray-400 transition-colors">Generators</Link>
          <Link href="/privacy" className="hover:text-gray-400 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-gray-400 transition-colors">Terms</Link>
          <Link href="/support" className="hover:text-gray-400 transition-colors">Support</Link>
        </div>
        <p className="text-xs text-gray-700 mt-4">
          &copy; {new Date().getFullYear()} Zoobicon. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
