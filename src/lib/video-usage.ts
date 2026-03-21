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
 */
export function checkVideoQuota(
  usage: VideoUsage,
  limits: VideoPlanLimits,
  type: VideoUsageType
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

  switch (type) {
    case "video":
      current = usage.videos;
      limit = limits.monthlyVideos;
      break;
    case "image":
      current = usage.imageGenerations;
      limit = limits.monthlyImageGenerations;
      break;
    case "render":
      current = usage.renders;
      limit = limits.monthlyRenders;
      break;
    case "voiceover":
      current = usage.voiceovers;
      limit = limits.monthlyVoiceovers;
      break;
    case "subtitle":
      // Subtitles are free (local computation), always allowed
      return { allowed: true, current: usage.subtitles, limit: Infinity, remaining: Infinity };
    default:
      return { allowed: false, reason: "Unknown usage type", current: 0, limit: 0, remaining: 0 };
  }

  const remaining = Math.max(0, limit - current);

  if (current >= limit) {
    const typeLabel = type === "image" ? "image generation" : type === "render" ? "video render" : type;
    return {
      allowed: false,
      reason: `Monthly ${typeLabel} limit reached (${current}/${limit}). Resets next month or upgrade your plan for more.`,
      current,
      limit,
      remaining: 0,
    };
  }

  return {
    allowed: true,
    current,
    limit,
    remaining,
  };
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
  limits: VideoPlanLimits
): {
  videos: { used: number; limit: number; pct: number };
  images: { used: number; limit: number; pct: number };
  renders: { used: number; limit: number; pct: number };
  voiceovers: { used: number; limit: number; pct: number };
} {
  const pct = (used: number, limit: number) =>
    limit === 0 ? 0 : Math.min(100, Math.round((used / limit) * 100));

  return {
    videos: { used: usage.videos, limit: limits.monthlyVideos, pct: pct(usage.videos, limits.monthlyVideos) },
    images: { used: usage.imageGenerations, limit: limits.monthlyImageGenerations, pct: pct(usage.imageGenerations, limits.monthlyImageGenerations) },
    renders: { used: usage.renders, limit: limits.monthlyRenders, pct: pct(usage.renders, limits.monthlyRenders) },
    voiceovers: { used: usage.voiceovers, limit: limits.monthlyVoiceovers, pct: pct(usage.voiceovers, limits.monthlyVoiceovers) },
  };
}
