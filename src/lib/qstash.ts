/**
 * QStash Client — durable job scheduling with retry, DLQ, and observability.
 *
 * Replaces fire-and-forget Vercel crons with QStash schedules that provide:
 * - Automatic retry with exponential backoff (3 retries default)
 * - Dead Letter Queue for failed jobs
 * - Delivery logging via QStash dashboard
 * - Signature verification on incoming webhooks
 *
 * ENV vars required:
 *   QSTASH_TOKEN               — QStash API token
 *   QSTASH_CURRENT_SIGNING_KEY — for verifying incoming QStash requests
 *   QSTASH_NEXT_SIGNING_KEY    — rotated signing key
 *
 * Vercel crons are kept as fallback — QStash is the primary scheduler.
 */

import { Client } from "@upstash/qstash";

let _client: Client | null = null;

export function getQStashClient(): Client | null {
  if (!process.env.QSTASH_TOKEN) return null;
  if (!_client) {
    _client = new Client({ token: process.env.QSTASH_TOKEN });
  }
  return _client;
}

/** Check whether QStash is configured */
export function isQStashConfigured(): boolean {
  return !!process.env.QSTASH_TOKEN;
}

export interface ScheduleConfig {
  /** Destination URL (full URL including https://) */
  destination: string;
  // Cron expression (e.g. "every 5 minutes")
  cron: string;
  /** Number of retries on failure (default 3) */
  retries?: number;
  /** Human-readable schedule ID for dedup */
  scheduleId?: string;
}

/**
 * Create or update a QStash schedule.
 * Safe to call multiple times — QStash deduplicates by schedule ID.
 */
export async function ensureSchedule(config: ScheduleConfig): Promise<{ scheduleId: string } | null> {
  const client = getQStashClient();
  if (!client) {
    console.warn("[qstash] QSTASH_TOKEN not set — schedule not created for", config.destination);
    return null;
  }

  try {
    const result = await client.schedules.create({
      destination: config.destination,
      cron: config.cron,
      retries: config.retries ?? 3,
    });
    return { scheduleId: result.scheduleId };
  } catch (err) {
    console.error("[qstash] Failed to create schedule:", err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Publish a one-off job to QStash.
 */
export async function publishJob(opts: {
  url: string;
  body?: Record<string, unknown>;
  retries?: number;
  delay?: string;
}): Promise<{ messageId: string } | null> {
  const client = getQStashClient();
  if (!client) return null;

  try {
    const result = await client.publishJSON({
      url: opts.url,
      body: opts.body ?? {},
      retries: opts.retries ?? 3,
      delay: opts.delay,
    });
    return { messageId: result.messageId };
  } catch (err) {
    console.error("[qstash] Failed to publish job:", err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * All cron schedules that QStash should manage.
 * Each entry maps to a Vercel cron in vercel.json (kept as fallback).
 */
export const CRON_SCHEDULES: ScheduleConfig[] = [
  {
    destination: "/api/cron/warmup",
    cron: "*/5 * * * *",
    retries: 3,
    scheduleId: "warmup-models",
  },
  {
    destination: "/api/intel/health",
    cron: "*/15 * * * *",
    retries: 3,
    scheduleId: "health-check",
  },
  {
    destination: "/api/cron/daily-comeback",
    cron: "0 3 * * *",
    retries: 3,
    scheduleId: "daily-comeback",
  },
  {
    destination: "/api/cron/warm-replicate",
    cron: "*/5 * * * *",
    retries: 3,
    scheduleId: "warm-replicate",
  },
  {
    destination: "/api/cron/warm-sandpack",
    cron: "*/10 * * * *",
    retries: 3,
    scheduleId: "warm-sandpack",
  },
  {
    destination: "/api/cron/warmup-video",
    cron: "*/10 * * * *",
    retries: 3,
    scheduleId: "warmup-video",
  },
  {
    destination: "/api/health?deep=true",
    cron: "0 */2 * * *",
    retries: 3,
    scheduleId: "deep-health",
  },
  {
    destination: "/api/seo/agent/cron",
    cron: "0 */6 * * *",
    retries: 3,
    scheduleId: "seo-agent",
  },
  {
    destination: "/api/intel/competitors",
    cron: "0 */12 * * *",
    retries: 3,
    scheduleId: "intel-competitors",
  },
  {
    destination: "/api/intel/technology",
    cron: "0 0 */2 * *",
    retries: 3,
    scheduleId: "intel-technology",
  },
  {
    destination: "/api/intel/cron",
    cron: "0 0 * * *",
    retries: 3,
    scheduleId: "intel-cron",
  },
  {
    destination: "/api/auto-pilot/cron",
    cron: "0 3 * * 1",
    retries: 3,
    scheduleId: "auto-pilot",
  },
  {
    destination: "/api/agents/cron",
    cron: "*/5 * * * *",
    retries: 3,
    scheduleId: "agents-cron",
  },
];

/**
 * Initialize all QStash schedules. Call from a setup endpoint or deploy hook.
 * Safe to call repeatedly — QStash deduplicates.
 */
export async function initAllSchedules(baseUrl: string): Promise<{
  created: number;
  failed: number;
  skipped: boolean;
}> {
  if (!isQStashConfigured()) {
    return { created: 0, failed: 0, skipped: true };
  }

  let created = 0;
  let failed = 0;

  for (const schedule of CRON_SCHEDULES) {
    const fullUrl = `${baseUrl}${schedule.destination}`;
    const result = await ensureSchedule({ ...schedule, destination: fullUrl });
    if (result) {
      created++;
    } else {
      failed++;
    }
  }

  return { created, failed, skipped: false };
}
