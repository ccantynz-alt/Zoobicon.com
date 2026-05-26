/**
 * Zoobicon API Gateway — Always-Warm Unified Service Layer
 *
 * Single endpoint that keeps all services warm and eliminates cold starts.
 * Instead of calling Replicate/Supabase/Mailgun individually (each with
 * their own cold starts), everything routes through our gateway.
 *
 * Architecture:
 *   Client → api.zoobicon.ai → Routes to appropriate service
 *                              ├── /video → Replicate (models kept warm)
 *                              ├── /site → Claude API (always warm)
 *                              ├── /db → Supabase/Neon
 *                              ├── /email → Mailgun/Postal
 *                              ├── /auth → Supabase Auth
 *                              ├── /storage → Supabase Storage/B2
 *                              └── /domains → OpenSRS
 *
 * Model warmup strategy:
 *   - Cron job pings Replicate models every 5 minutes with minimal input
 *   - Keeps Fish Speech, FLUX, SadTalker containers warm
 *   - First real request hits a warm model = instant response
 *   - Cost: ~$0.50/day for warmup pings (saves minutes per real request)
 */

import { NextRequest } from "next/server";

export const maxDuration = 300;

// modelWarmupState + WARMUP_INTERVAL_MS removed 2026-05-26 — Rule 19
// retired, no Replicate video models to keep warm.

/**
 * Warm up Replicate models — RETIRED 2026-05-26.
 * Called by cron job every 5 minutes to prevent cold starts.
 */
export async function warmupModels(): Promise<{ warmed: string[]; failed: string[] }> {
  // Rule 19 retired 2026-05-26 — AI Video Creator removed from launch
  // scope. Replicate model warm-up (fish-speech, flux-schnell, sadtalker)
  // is no longer relevant. Returning an empty result keeps the cron
  // endpoint (/api/cron/warmup) happy without touching Replicate.
  return { warmed: [], failed: [] };
}

/**
 * Service router — unified entry point for all backend operations.
 * This is the foundation for api.zoobicon.ai
 */
export async function routeRequest(
  service: string,
  action: string,
  params: Record<string, unknown>
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    switch (service) {
      case "video":
        // Rule 19 retired 2026-05-26 — AI Video Creator removed from
        // launch scope. video-pipeline module was deleted in the cut.
        // Route kept registered so the API surface stays consistent
        // and we get clean analytics on how often video is requested.
        return {
          success: false,
          error: "AI Video Creator was removed from Zoobicon's launch scope. Try /api/generate/react for site generation.",
        };

      case "site":
        // Site generation handled by /api/generate/react
        return { success: false, error: "Use /api/generate/react directly" };

      case "db":
        const { provisionBackend } = await import("./backend-service");
        const backend = await provisionBackend(
          params.appName as string,
          params.email as string,
          params.description as string,
          params.schema as string | undefined
        );
        return { success: true, data: backend };

      case "email":
        const { sendAppEmail } = await import("./backend-service");
        const emailResult = await sendAppEmail(params as any);
        return { success: emailResult.success, data: emailResult };

      case "domains":
        // Domain search handled by /api/domains/search
        return { success: false, error: "Use /api/domains/search directly" };

      default:
        return { success: false, error: `Unknown service: ${service}` };
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Service error",
    };
  }
}
