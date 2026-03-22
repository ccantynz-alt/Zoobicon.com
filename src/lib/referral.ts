/**
 * Referral Program Utilities
 *
 * Tracks referral links, signups, and earned builds.
 * MVP uses localStorage; upgrade to DB when ready.
 */

/* ---------- Types ---------- */

export interface ReferralEntry {
  id: string;
  name: string; // anonymized, e.g. "j***n@gmail.com"
  date: string; // ISO string
  status: "signed_up" | "built_first_site" | "active";
}

export interface ReferralStats {
  referralCode: string;
  linkCopied: number;
  signups: number;
  buildsEarned: number;
  history: ReferralEntry[];
}

export interface ReferralTier {
  name: string;
  badge: string;
  color: string;
  minReferrals: number;
  nextTier: string | null;
  nextTierAt: number | null;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  referrals: number;
  tier: string;
  badge: string;
}

/* ---------- Constants ---------- */

const STORAGE_KEY = "zoobicon_referral_stats";
const BUILDS_PER_REFERRAL = 5;
const BUILD_VALUE_DOLLARS = 3; // estimated value per build

/* ---------- Tier definitions ---------- */

const TIERS: ReferralTier[] = [
  { name: "Newcomer", badge: "🌱", color: "text-gray-400", minReferrals: 0, nextTier: "Recruiter", nextTierAt: 1 },
  { name: "Recruiter", badge: "🎯", color: "text-cyan-400", minReferrals: 1, nextTier: "Ambassador", nextTierAt: 5 },
  { name: "Ambassador", badge: "⭐", color: "text-yellow-400", minReferrals: 5, nextTier: "Champion", nextTierAt: 20 },
  { name: "Champion", badge: "🏆", color: "text-emerald-400", minReferrals: 20, nextTier: null, nextTierAt: null },
];

/* ---------- Helpers ---------- */

/** Simple deterministic hash from an email to produce a referral code */
export function generateReferralCode(email: string): string {
  let hash = 0;
  const str = email.toLowerCase().trim();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  const positive = Math.abs(hash);
  const code = positive.toString(36).padStart(6, "0").slice(0, 8);
  return `ref_${code}`;
}

/** Build the full referral link */
export function getReferralLink(code: string): string {
  return `https://zoobicon.com/?ref=${code}`;
}

/** Anonymize an email for display: "j***n@gmail.com" */
function anonymizeEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***@***";
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

/* ---------- Storage ---------- */

function getDefaultStats(email?: string): ReferralStats {
  return {
    referralCode: email ? generateReferralCode(email) : "",
    linkCopied: 0,
    signups: 0,
    buildsEarned: 0,
    history: [],
  };
}

/** Get referral stats from localStorage */
export function getReferralStats(): ReferralStats {
  if (typeof window === "undefined") return getDefaultStats();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    // Initialize from user data if available
    const userRaw = localStorage.getItem("zoobicon_user");
    if (userRaw) {
      const user = JSON.parse(userRaw);
      const stats = getDefaultStats(user.email);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
      return stats;
    }
    return getDefaultStats();
  } catch {
    return getDefaultStats();
  }
}

/** Save referral stats */
function saveStats(stats: ReferralStats): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // Storage full — ignore
  }
}

/** Track a referral link copy/share */
export function trackReferralClick(): void {
  const stats = getReferralStats();
  stats.linkCopied += 1;
  saveStats(stats);
}

/** Process a referral signup (called when someone signs up with a ref code) */
export function processReferralSignup(referredEmail: string, referrerCode: string): void {
  const stats = getReferralStats();
  if (stats.referralCode !== referrerCode) return; // Not our referral

  const entry: ReferralEntry = {
    id: `ref_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: anonymizeEmail(referredEmail),
    date: new Date().toISOString(),
    status: "signed_up",
  };

  stats.signups += 1;
  stats.buildsEarned += BUILDS_PER_REFERRAL;
  stats.history.unshift(entry);
  saveStats(stats);
}

/** Get the current referral tier based on signup count */
export function getReferralTier(signups: number): ReferralTier {
  let currentTier = TIERS[0];
  for (const tier of TIERS) {
    if (signups >= tier.minReferrals) {
      currentTier = tier;
    }
  }
  return currentTier;
}

/** Check URL for ?ref= param on page load */
export function checkReferralParam(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("ref") || null;
  } catch {
    return null;
  }
}

/** Calculate total savings in dollars */
export function calculateSavings(buildsEarned: number): number {
  return buildsEarned * BUILD_VALUE_DOLLARS;
}

/** Get mock leaderboard data */
export function getTopReferrers(): LeaderboardEntry[] {
  return [
    { rank: 1, username: "alex_builds", referrals: 87, tier: "Champion", badge: "🏆" },
    { rank: 2, username: "sarah_dev", referrals: 64, tier: "Champion", badge: "🏆" },
    { rank: 3, username: "mike_studio", referrals: 52, tier: "Champion", badge: "🏆" },
    { rank: 4, username: "code_ninja", referrals: 41, tier: "Champion", badge: "🏆" },
    { rank: 5, username: "web_wizard", referrals: 33, tier: "Champion", badge: "🏆" },
    { rank: 6, username: "pixel_pro", referrals: 28, tier: "Champion", badge: "🏆" },
    { rank: 7, username: "dev_queen", referrals: 19, tier: "Ambassador", badge: "⭐" },
    { rank: 8, username: "build_master", referrals: 14, tier: "Ambassador", badge: "⭐" },
    { rank: 9, username: "site_smith", referrals: 9, tier: "Ambassador", badge: "⭐" },
    { rank: 10, username: "ai_crafter", referrals: 6, tier: "Ambassador", badge: "⭐" },
  ];
}
