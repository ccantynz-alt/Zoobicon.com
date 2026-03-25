/**
 * Referral system — users earn free builds by inviting friends.
 * "Give a friend 1 free build, get 1 free build when they sign up."
 *
 * How it works:
 * 1. User gets a referral link: zoobicon.com/?ref=ref_XXXXXX
 * 2. Friend signs up via that link
 * 3. Both get 1 extra build credit added to their quota
 *
 * Referral codes are deterministic from the user's email.
 *
 * Architecture:
 * - Client-side: localStorage for instant UI, checkReferralParam() for URL detection
 * - Server-side: DB tables for persistent tracking, credit awarding
 */

// crypto is imported dynamically in server-side functions only
// to avoid breaking client-side imports

/* ========== Types ========== */

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

/* ========== Constants ========== */

const STORAGE_KEY = "zoobicon_referral_stats";
const BUILDS_PER_REFERRAL = 1;

/* ========== Tier definitions ========== */

const TIERS: ReferralTier[] = [
  { name: "Newcomer", badge: "🌱", color: "text-gray-400", minReferrals: 0, nextTier: "Recruiter", nextTierAt: 1 },
  { name: "Recruiter", badge: "🎯", color: "text-cyan-400", minReferrals: 1, nextTier: "Ambassador", nextTierAt: 5 },
  { name: "Ambassador", badge: "⭐", color: "text-yellow-400", minReferrals: 5, nextTier: "Champion", nextTierAt: 20 },
  { name: "Champion", badge: "🏆", color: "text-emerald-400", minReferrals: 20, nextTier: null, nextTierAt: null },
];

/* ========== Shared Helpers (work on client + server) ========== */

/** Simple deterministic hash that works in both browser and Node.js */
function clientHash(str: string): string {
  let hash = 0;
  const s = str.toLowerCase().trim();
  for (let i = 0; i < s.length; i++) {
    const char = s.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(36).padStart(8, "0").slice(0, 8);
}

/** Generate a deterministic referral code from email */
export function generateReferralCode(email: string): string {
  return `ref_${clientHash(email)}`;
}

/** Build the full referral link */
export function getReferralLink(code: string): string {
  return `https://zoobicon.com/?ref=${code}`;
}

/** Anonymize an email for display: "j***n@gmail.com" */
export function anonymizeEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***@***";
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
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

/* ========== Server-side DB Functions ========== */

/** Ensure the referrals table exists */
export async function ensureReferralTable(): Promise<void> {
  // Dynamic import to avoid pulling DB deps into client bundles
  const { sql } = await import("@/lib/db");
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS referrals (
        id SERIAL PRIMARY KEY,
        referrer_email TEXT NOT NULL,
        referred_email TEXT NOT NULL,
        referral_code TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'completed',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(referred_email)
      )
    `;
  } catch {
    // Table may already exist
  }
}

/**
 * Track a referral when a new user signs up with a ?ref= code.
 * Looks up the referrer by matching the code against all users,
 * records the referral, and credits both users with 1 extra build.
 * Returns true if referral was successfully tracked.
 */
export async function trackReferral(referralCode: string, referredEmail: string): Promise<boolean> {
  const { sql } = await import("@/lib/db");
  await ensureReferralTable();

  try {
    // Find the referrer: query users and compute code to match
    const users = await sql`SELECT email FROM users LIMIT 1000`;
    const referrer = users.find(
      (u: { email: string }) => generateReferralCode(u.email) === referralCode
    );
    if (!referrer) return false;

    // Don't allow self-referral
    if (referrer.email.toLowerCase() === referredEmail.toLowerCase()) return false;

    // Record the referral (unique on referred_email prevents double-counting)
    const result = await sql`
      INSERT INTO referrals (referrer_email, referred_email, referral_code, status)
      VALUES (${referrer.email}, ${referredEmail.toLowerCase()}, ${referralCode}, 'completed')
      ON CONFLICT (referred_email) DO NOTHING
      RETURNING id
    `;

    // If insert was a no-op (already referred), skip crediting
    if (!result || result.length === 0) return false;

    // Credit both users: decrement their usage count by 1 (giving them 1 free build)
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    for (const email of [referrer.email, referredEmail.toLowerCase()]) {
      await sql`
        INSERT INTO usage_tracking (email, usage_type, month, count)
        VALUES (${email}, 'referral_credit', ${monthStart.toISOString()}, ${BUILDS_PER_REFERRAL})
        ON CONFLICT (email, usage_type, month)
        DO UPDATE SET count = usage_tracking.count + ${BUILDS_PER_REFERRAL}, updated_at = NOW()
      `;
    }

    return true;
  } catch (err) {
    console.error("[Referral] Error tracking referral:", err);
    return false;
  }
}

/**
 * Get referral stats for a user (server-side, from DB).
 */
export async function getReferralStatsFromDB(email: string): Promise<{
  code: string;
  totalReferred: number;
  creditsEarned: number;
  history: Array<{ referred_email: string; created_at: string }>;
}> {
  const code = generateReferralCode(email);
  const { sql } = await import("@/lib/db");
  await ensureReferralTable();

  try {
    const countRows = await sql`
      SELECT COUNT(*) as total FROM referrals
      WHERE referrer_email = ${email.toLowerCase()} AND status = 'completed'
    `;
    const total = Number(countRows[0]?.total || 0);

    const historyRows = await sql`
      SELECT referred_email, created_at FROM referrals
      WHERE referrer_email = ${email.toLowerCase()} AND status = 'completed'
      ORDER BY created_at DESC
      LIMIT 20
    `;

    return {
      code,
      totalReferred: total,
      creditsEarned: total * BUILDS_PER_REFERRAL,
      history: historyRows.map((r: { referred_email: string; created_at: string }) => ({
        referred_email: anonymizeEmail(r.referred_email),
        created_at: r.created_at,
      })),
    };
  } catch (err) {
    console.error("[Referral] Error fetching stats:", err);
    return { code, totalReferred: 0, creditsEarned: 0, history: [] };
  }
}

/* ========== Client-side Helpers ========== */

/** Generate referral code on client side (same algorithm as server) */
export function generateReferralCodeClient(email: string): string {
  return generateReferralCode(email);
}

function getDefaultStats(email?: string): ReferralStats {
  return {
    referralCode: email ? generateReferralCodeClient(email) : "",
    linkCopied: 0,
    signups: 0,
    buildsEarned: 0,
    history: [],
  };
}

/** Get referral stats from localStorage (client-side instant access) */
export function getReferralStats(): ReferralStats {
  if (typeof window === "undefined") return getDefaultStats();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
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

/** Save referral stats to localStorage */
function saveStats(stats: ReferralStats): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch { /* storage full */ }
}

/** Track a referral link copy/share (client-side) */
export function trackReferralClick(): void {
  const stats = getReferralStats();
  stats.linkCopied += 1;
  saveStats(stats);
}

/** Update client-side stats after a successful server-side referral */
export function updateLocalReferralStats(serverStats: {
  code: string;
  totalReferred: number;
  creditsEarned: number;
}): void {
  const stats = getReferralStats();
  stats.referralCode = serverStats.code;
  stats.signups = serverStats.totalReferred;
  stats.buildsEarned = serverStats.creditsEarned;
  saveStats(stats);
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

/** Get the current referral tier based on signup count */
export { TIERS as REFERRAL_TIERS };

/** Calculate total savings in dollars */
export function calculateSavings(buildsEarned: number): number {
  return buildsEarned * 3; // ~$3 estimated value per build
}

/** Get mock leaderboard data */
export function getTopReferrers(): LeaderboardEntry[] {
  return [
    { rank: 1, username: "alex_builds", referrals: 87, tier: "Champion", badge: "🏆" },
    { rank: 2, username: "sarah_dev", referrals: 64, tier: "Champion", badge: "🏆" },
    { rank: 3, username: "mike_studio", referrals: 52, tier: "Champion", badge: "🏆" },
    { rank: 4, username: "code_ninja", referrals: 41, tier: "Champion", badge: "🏆" },
    { rank: 5, username: "web_wizard", referrals: 33, tier: "Champion", badge: "🏆" },
  ];
}
