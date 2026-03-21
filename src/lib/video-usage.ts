// ---------------------------------------------------------------------------
// Video Usage Tracking & Quota Enforcement
//
// Tracks video pipeline usage per user per month and enforces plan-based
// limits to protect API costs (Runway, ElevenLabs, DALL-E, etc.).
//
// Each "video credit" = one full pipeline run (storyboard + images + render
// + voiceover + subtitles). Individual stages also consume partial credits.
//
// Cost basis per video: ~$1.10
//   - Scene images (6x DALL-E 3): ~$0.48
//   - Video rendering (6x Runway): ~$0.60
//   - Voiceover (ElevenLabs, ~200 words): ~$0.03
//   - Subtitles: $0 (local computation)
//
// DB table: video_usage (created if not exists)
// ---------------------------------------------------------------------------

import { sql } from "@/lib/db";

// ---------------------------------------------------------------------------
// Overage pricing — per-unit rates when users exceed their plan cap
// ---------------------------------------------------------------------------

export interface OveragePack {
  id: string;
  name: string;
  videos: number;
  images: number;
  renders: number;
  voiceovers: number;
  price: number;           // USD cents
  priceDisplay: string;    // e.g. "$4.99"
  savings?: string;        // e.g. "Save 20%"
}

export const OVERAGE_PACKS: OveragePack[] = [
  {
    id: "video-credits-5",
    name: "5 Video Credits",
    videos: 5,
    images: 30,    // 5 x 6 scenes
    renders: 30,
    voiceovers: 10,
    price: 1499,
    priceDisplay: "$14.99",
  },
  {
    id: "video-credits-15",
    name: "15 Video Credits",
    videos: 15,
    images: 100,
    renders: 90,
    voiceovers: 30,
    price: 3499,
    priceDisplay: "$34.99",
    savings: "Save 22%",
  },
  {
    id: "video-credits-50",
    name: "50 Video Credits",
    videos: 50,
    images: 350,
    renders: 300,
    voiceovers: 100,
    price: 8999,
    priceDisplay: "$89.99",
    savings: "Save 40%",
  },
];

// Per-unit overage rates (fallback if not buying a pack)
export const OVERAGE_UNIT_RATES = {
  video: 349,      // $3.49 per full pipeline run
  image: 15,       // $0.15 per scene image
  render: 25,      // $0.25 per scene render
  voiceover: 99,   // $0.99 per voiceover
};

// ---------------------------------------------------------------------------
// Plan limits — designed so every tier is profitable
// ---------------------------------------------------------------------------

export interface VideoPlanLimits {
  monthlyVideos: number;           // Full pipeline runs
  monthlyImageGenerations: number; // Individual scene image gens
  monthlyRenders: number;          // Individual video render scenes
  monthlyVoiceovers: number;       // Individual voiceover generations
  maxDurationSeconds: number;      // Max video duration allowed
  maxScenesPerVideo: number;       // Max scenes per storyboard
  hasVideoAccess: boolean;         // Can use video pipeline at all
}

const VIDEO_PLAN_LIMITS: Record<string, VideoPlanLimits> = {
  // Free / Starter — storyboard only, no pipeline
  free: {
    monthlyVideos: 0,
    monthlyImageGenerations: 0,
    monthlyRenders: 0,
    monthlyVoiceovers: 0,
    maxDurationSeconds: 30,
    maxScenesPerVideo: 6,
    hasVideoAccess: false,
  },
  starter: {
    monthlyVideos: 0,
    monthlyImageGenerations: 0,
    monthlyRenders: 0,
    monthlyVoiceovers: 0,
    maxDurationSeconds: 30,
    maxScenesPerVideo: 6,
    hasVideoAccess: false,
  },
  // Creator ($19/mo) — no video included, needs add-on
  creator: {
    monthlyVideos: 0,
    monthlyImageGenerations: 0,
    monthlyRenders: 0,
    monthlyVoiceovers: 0,
    maxDurationSeconds: 30,
    maxScenesPerVideo: 6,
    hasVideoAccess: false,
  },
  // Video Add-on ($19/mo) — conservative limits, $19 revenue vs ~$5.50 cost for 5 videos
  addon: {
    monthlyVideos: 5,
    monthlyImageGenerations: 30,   // 5 videos x 6 scenes
    monthlyRenders: 30,            // 5 videos x 6 scenes
    monthlyVoiceovers: 10,         // 5 full + 5 re-gens
    maxDurationSeconds: 60,
    maxScenesPerVideo: 8,
    hasVideoAccess: true,
  },
  // Pro ($49/mo) — moderate limits, $49 revenue vs ~$11 cost for 10 videos
  pro: {
    monthlyVideos: 10,
    monthlyImageGenerations: 80,   // 10 videos x 8 scenes
    monthlyRenders: 60,            // 10 videos x 6 scenes
    monthlyVoiceovers: 20,
    maxDurationSeconds: 90,
    maxScenesPerVideo: 10,
    hasVideoAccess: true,
  },
  // Agency ($99/mo) — generous limits, $99 revenue vs ~$27.50 cost for 25 videos
  agency: {
    monthlyVideos: 25,
    monthlyImageGenerations: 200,
    monthlyRenders: 150,
    monthlyVoiceovers: 50,
    maxDurationSeconds: 90,
    maxScenesPerVideo: 10,
    hasVideoAccess: true,
  },
  // Enterprise ($299/mo) — high limits (not truly unlimited to prevent abuse)
  enterprise: {
    monthlyVideos: 100,
    monthlyImageGenerations: 800,
    monthlyRenders: 600,
    monthlyVoiceovers: 200,
    maxDurationSeconds: 120,
    maxScenesPerVideo: 12,
    hasVideoAccess: true,
  },
  // Unlimited legacy plan
  unlimited: {
    monthlyVideos: 50,
    monthlyImageGenerations: 400,
    monthlyRenders: 300,
    monthlyVoiceovers: 100,
    maxDurationSeconds: 90,
    maxScenesPerVideo: 10,
    hasVideoAccess: true,
  },
};

export function getVideoPlanLimits(plan: string, hasAddon: boolean = false): VideoPlanLimits {
  // If user has the video add-on, give them addon limits (or their plan limits if higher)
  if (hasAddon) {
    const planLimits = VIDEO_PLAN_LIMITS[plan] || VIDEO_PLAN_LIMITS.free;
    const addonLimits = VIDEO_PLAN_LIMITS.addon;

    // Return the higher of plan limits or addon limits
    if (planLimits.hasVideoAccess && planLimits.monthlyVideos > addonLimits.monthlyVideos) {
      return planLimits;
    }
    return addonLimits;
  }

  return VIDEO_PLAN_LIMITS[plan] || VIDEO_PLAN_LIMITS.free;
}

// ---------------------------------------------------------------------------
// Usage tracking types
// ---------------------------------------------------------------------------

export type VideoUsageType = "video" | "image" | "render" | "voiceover" | "subtitle";

export interface VideoUsage {
  email: string;
  period: string;           // "YYYY-MM"
  videos: number;
  imageGenerations: number;
  renders: number;
  voiceovers: number;
  subtitles: number;
}

export interface UsageCheck {
  allowed: boolean;
  reason?: string;
  current: number;
  limit: number;
  remaining: number;
  usingOverage?: boolean;   // true when plan limit hit but overage credits available
}

// ---------------------------------------------------------------------------
// DB operations
// ---------------------------------------------------------------------------

/**
 * Ensure the video_usage table exists.
 */
export async function ensureVideoUsageTable(): Promise<void> {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS video_usage (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        period VARCHAR(7) NOT NULL,
        usage_type VARCHAR(20) NOT NULL,
        count INTEGER NOT NULL DEFAULT 0,
        last_used_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(email, period, usage_type)
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_video_usage_email_period
      ON video_usage(email, period)
    `;
  } catch (err) {
    console.error("[video-usage] Failed to create table:", err);
  }
}

/**
 * Ensure the video_overage_credits table exists.
 */
export async function ensureOverageTable(): Promise<void> {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS video_overage_credits (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        pack_id VARCHAR(50) NOT NULL,
        stripe_session_id VARCHAR(255),
        videos_purchased INTEGER NOT NULL DEFAULT 0,
        images_purchased INTEGER NOT NULL DEFAULT 0,
        renders_purchased INTEGER NOT NULL DEFAULT 0,
        voiceovers_purchased INTEGER NOT NULL DEFAULT 0,
        videos_remaining INTEGER NOT NULL DEFAULT 0,
        images_remaining INTEGER NOT NULL DEFAULT 0,
        renders_remaining INTEGER NOT NULL DEFAULT 0,
        voiceovers_remaining INTEGER NOT NULL DEFAULT 0,
        purchased_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '90 days')
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_overage_email
      ON video_overage_credits(email)
    `;
  } catch (err) {
    console.error("[video-usage] Failed to create overage table:", err);
  }
}

/**
 * Add overage credits after a successful Stripe payment.
 */
export async function addOverageCredits(
  email: string,
  pack: OveragePack,
  stripeSessionId?: string
): Promise<void> {
  try {
    await ensureOverageTable();
    await sql`
      INSERT INTO video_overage_credits (
        email, pack_id, stripe_session_id,
        videos_purchased, images_purchased, renders_purchased, voiceovers_purchased,
        videos_remaining, images_remaining, renders_remaining, voiceovers_remaining
      ) VALUES (
        ${email}, ${pack.id}, ${stripeSessionId || ""},
        ${pack.videos}, ${pack.images}, ${pack.renders}, ${pack.voiceovers},
        ${pack.videos}, ${pack.images}, ${pack.renders}, ${pack.voiceovers}
      )
    `;
  } catch (err) {
    console.error("[video-usage] Failed to add overage credits:", err);
  }
}

/**
 * Get total remaining overage credits for a user (across all non-expired packs).
 */
export interface OverageCredits {
  videos: number;
  images: number;
  renders: number;
  voiceovers: number;
}

export async function getOverageCredits(email: string): Promise<OverageCredits> {
  const credits: OverageCredits = { videos: 0, images: 0, renders: 0, voiceovers: 0 };
  try {
    await ensureOverageTable();
    const rows = await sql`
      SELECT
        COALESCE(SUM(videos_remaining), 0) AS videos,
        COALESCE(SUM(images_remaining), 0) AS images,
        COALESCE(SUM(renders_remaining), 0) AS renders,
        COALESCE(SUM(voiceovers_remaining), 0) AS voiceovers
      FROM video_overage_credits
      WHERE email = ${email} AND expires_at > NOW()
    `;
    if (rows.length > 0) {
      credits.videos = Number(rows[0].videos);
      credits.images = Number(rows[0].images);
      credits.renders = Number(rows[0].renders);
      credits.voiceovers = Number(rows[0].voiceovers);
    }
  } catch (err) {
    console.error("[video-usage] Failed to get overage credits:", err);
  }
  return credits;
}

/**
 * Consume overage credits (FIFO — oldest pack first).
 * Returns true if credits were successfully consumed.
 */
export async function consumeOverageCredits(
  email: string,
  type: VideoUsageType,
  amount: number = 1
): Promise<boolean> {
  const col = type === "image" ? "images_remaining"
    : type === "render" ? "renders_remaining"
    : type === "voiceover" ? "voiceovers_remaining"
    : "videos_remaining";

  try {
    await ensureOverageTable();
    // Get packs with remaining credits, oldest first
    const packs = await sql`
      SELECT id, ${sql(col)} AS remaining
      FROM video_overage_credits
      WHERE email = ${email} AND expires_at > NOW() AND ${sql(col)} > 0
      ORDER BY purchased_at ASC
    `;

    let toConsume = amount;
    for (const pack of packs) {
      if (toConsume <= 0) break;
      const deduct = Math.min(toConsume, Number(pack.remaining));
      await sql`
        UPDATE video_overage_credits
        SET ${sql(col)} = ${sql(col)} - ${deduct}
        WHERE id = ${pack.id}
      `;
      toConsume -= deduct;
    }

    return toConsume <= 0; // true if all credits were covered
  } catch (err) {
    console.error("[video-usage] Failed to consume overage credits:", err);
    return false;
  }
}

/**
 * Get current month period string: "YYYY-MM"
 */
export function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Get usage for a user in the current period.
 */
export async function getVideoUsage(email: string): Promise<VideoUsage> {
  const period = getCurrentPeriod();
  const usage: VideoUsage = {
    email,
    period,
    videos: 0,
    imageGenerations: 0,
    renders: 0,
    voiceovers: 0,
    subtitles: 0,
  };

  try {
    const rows = await sql`
      SELECT usage_type, count FROM video_usage
      WHERE email = ${email} AND period = ${period}
    `;

    for (const row of rows) {
      switch (row.usage_type) {
        case "video": usage.videos = row.count; break;
        case "image": usage.imageGenerations = row.count; break;
        case "render": usage.renders = row.count; break;
        case "voiceover": usage.voiceovers = row.count; break;
        case "subtitle": usage.subtitles = row.count; break;
      }
    }
  } catch (err) {
    console.error("[video-usage] Failed to get usage:", err);
  }

  return usage;
}

/**
 * Increment usage counter for a specific type.
 */
export async function incrementVideoUsage(
  email: string,
  type: VideoUsageType,
  amount: number = 1
): Promise<void> {
  const period = getCurrentPeriod();

  try {
    await sql`
      INSERT INTO video_usage (email, period, usage_type, count, last_used_at)
      VALUES (${email}, ${period}, ${type}, ${amount}, NOW())
      ON CONFLICT (email, period, usage_type)
      DO UPDATE SET
        count = video_usage.count + ${amount},
        last_used_at = NOW()
    `;
  } catch (err) {
    console.error("[video-usage] Failed to increment:", err);
  }
}

/**
 * Check if a user can perform a specific video action.
 * Now checks overage credits when plan limit is exceeded.
 */
export function checkVideoQuota(
  usage: VideoUsage,
  limits: VideoPlanLimits,
  type: VideoUsageType,
  overageCredits?: OverageCredits
): UsageCheck {
  if (!limits.hasVideoAccess) {
    return {
      allowed: false,
      reason: "Video pipeline requires Pro plan or the AI Video Creator add-on ($19/mo).",
      current: 0,
      limit: 0,
      remaining: 0,
    };
  }

  let current: number;
  let limit: number;
  let overageRemaining = 0;

  switch (type) {
    case "video":
      current = usage.videos;
      limit = limits.monthlyVideos;
      overageRemaining = overageCredits?.videos ?? 0;
      break;
    case "image":
      current = usage.imageGenerations;
      limit = limits.monthlyImageGenerations;
      overageRemaining = overageCredits?.images ?? 0;
      break;
    case "render":
      current = usage.renders;
      limit = limits.monthlyRenders;
      overageRemaining = overageCredits?.renders ?? 0;
      break;
    case "voiceover":
      current = usage.voiceovers;
      limit = limits.monthlyVoiceovers;
      overageRemaining = overageCredits?.voiceovers ?? 0;
      break;
    case "subtitle":
      return { allowed: true, current: usage.subtitles, limit: Infinity, remaining: Infinity };
    default:
      return { allowed: false, reason: "Unknown usage type", current: 0, limit: 0, remaining: 0 };
  }

  const planRemaining = Math.max(0, limit - current);
  const totalRemaining = planRemaining + overageRemaining;

  if (current >= limit && overageRemaining <= 0) {
    const typeLabel = type === "image" ? "image generation" : type === "render" ? "video render" : type;
    return {
      allowed: false,
      reason: `Monthly ${typeLabel} limit reached (${current}/${limit}). Purchase additional credits or upgrade your plan.`,
      current,
      limit,
      remaining: 0,
    };
  }

  return {
    allowed: true,
    current,
    limit,
    remaining: totalRemaining,
    usingOverage: planRemaining === 0 && overageRemaining > 0,
  } as UsageCheck;
}

/**
 * Full quota check for a complete video pipeline run.
 * Checks all stages at once before starting.
 */
export function checkFullPipelineQuota(
  usage: VideoUsage,
  limits: VideoPlanLimits,
  sceneCount: number = 6
): { allowed: boolean; reason?: string; checks: Record<string, UsageCheck> } {
  const checks = {
    video: checkVideoQuota(usage, limits, "video"),
    image: checkVideoQuota(usage, limits, "image"),
    render: checkVideoQuota(usage, limits, "render"),
    voiceover: checkVideoQuota(usage, limits, "voiceover"),
  };

  // Check if we have enough for this specific run
  if (!checks.video.allowed) {
    return { allowed: false, reason: checks.video.reason, checks };
  }
  if (checks.image.remaining < sceneCount) {
    return {
      allowed: false,
      reason: `Not enough image credits. Need ${sceneCount} for this video, ${checks.image.remaining} remaining this month.`,
      checks,
    };
  }
  if (checks.render.remaining < sceneCount) {
    return {
      allowed: false,
      reason: `Not enough render credits. Need ${sceneCount} scenes, ${checks.render.remaining} remaining this month.`,
      checks,
    };
  }
  if (!checks.voiceover.allowed) {
    return { allowed: false, reason: checks.voiceover.reason, checks };
  }

  return { allowed: true, checks };
}

/**
 * Get a user-friendly usage summary for display.
 */
export function getUsageSummary(
  usage: VideoUsage,
  limits: VideoPlanLimits,
  overageCredits?: OverageCredits
): {
  videos: { used: number; limit: number; pct: number; overage: number };
  images: { used: number; limit: number; pct: number; overage: number };
  renders: { used: number; limit: number; pct: number; overage: number };
  voiceovers: { used: number; limit: number; pct: number; overage: number };
} {
  const pct = (used: number, limit: number) =>
    limit === 0 ? 0 : Math.min(100, Math.round((used / limit) * 100));

  return {
    videos: { used: usage.videos, limit: limits.monthlyVideos, pct: pct(usage.videos, limits.monthlyVideos), overage: overageCredits?.videos ?? 0 },
    images: { used: usage.imageGenerations, limit: limits.monthlyImageGenerations, pct: pct(usage.imageGenerations, limits.monthlyImageGenerations), overage: overageCredits?.images ?? 0 },
    renders: { used: usage.renders, limit: limits.monthlyRenders, pct: pct(usage.renders, limits.monthlyRenders), overage: overageCredits?.renders ?? 0 },
    voiceovers: { used: usage.voiceovers, limit: limits.monthlyVoiceovers, pct: pct(usage.voiceovers, limits.monthlyVoiceovers), overage: overageCredits?.voiceovers ?? 0 },
  };
}

/**
 * Helper: After incrementing usage, consume overage credits if plan limit was exceeded.
 * Call this after incrementVideoUsage() in API routes.
 */
export async function consumeOverageIfNeeded(
  email: string,
  plan: string | undefined,
  hasAddon: boolean | undefined,
  type: VideoUsageType,
  amount: number
): Promise<void> {
  try {
    const limits = getVideoPlanLimits(plan || "free", !!hasAddon);
    const usage = await getVideoUsage(email);

    let current: number;
    let planLimit: number;

    switch (type) {
      case "video": current = usage.videos; planLimit = limits.monthlyVideos; break;
      case "image": current = usage.imageGenerations; planLimit = limits.monthlyImageGenerations; break;
      case "render": current = usage.renders; planLimit = limits.monthlyRenders; break;
      case "voiceover": current = usage.voiceovers; planLimit = limits.monthlyVoiceovers; break;
      default: return;
    }

    const overUsed = current - planLimit;
    if (overUsed > 0) {
      await consumeOverageCredits(email, type, Math.min(overUsed, amount));
    }
  } catch (err) {
    console.error("[video-usage] consumeOverageIfNeeded error:", err);
  }
}
