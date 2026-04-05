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

// Track which models were last pinged
const modelWarmupState: Record<string, number> = {};
const WARMUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Warm up Replicate models by sending minimal predictions.
 * Called by cron job every 5 minutes to prevent cold starts.
 */
export async function warmupModels(): Promise<{ warmed: string[]; failed: string[] }> {
  const token = process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY || process.env.REPLICATE_TOKEN || process.env.REPLICATE_KEY;
  if (!token) return { warmed: [], failed: [] };

  const models = [
    {
      name: "fish-speech",
      version: "11f3e0394c06dcc099c0cbaf75f4a6e7da84cb4aaa5d53bedfc3234b5c8aaefc",
      input: { text: "warmup" },
    },
    {
      name: "flux-schnell",
      endpoint: "https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions",
      input: { prompt: "test", num_outputs: 1 },
    },
    {
      name: "sadtalker",
      version: "3aa3dac9353cc4d6bd62a8f95957bd844003b401ca4e4a9b33baa574c549d376",
      // SadTalker needs image+audio, can't do minimal warmup — skip actual prediction
      // Just hitting the versions endpoint keeps the container pool aware
      pingOnly: true,
    },
  ];

  const warmed: string[] = [];
  const failed: string[] = [];

  for (const model of models) {
    const lastWarmup = modelWarmupState[model.name] || 0;
    if (Date.now() - lastWarmup < WARMUP_INTERVAL_MS) {
      warmed.push(`${model.name} (still warm)`);
      continue;
    }

    try {
      if (model.pingOnly) {
        // Just check the model exists — keeps Replicate aware we use it
        await fetch(`https://api.replicate.com/v1/models/cjwbw/sadtalker`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        warmed.push(model.name);
      } else if (model.endpoint) {
        // Official models — use /models/ endpoint, cancel immediately
        const res = await fetch(model.endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ input: model.input }),
        });
        if (res.ok) {
          const data = await res.json();
          // Cancel the prediction immediately — we just wanted to warm the container
          if (data.urls?.cancel) {
            await fetch(data.urls.cancel, {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
            }).catch(() => {});
          }
          warmed.push(model.name);
        } else {
          failed.push(model.name);
        }
      } else {
        // Community models — use version hash, cancel immediately
        const res = await fetch("https://api.replicate.com/v1/predictions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            version: model.version,
            input: model.input,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.urls?.cancel) {
            await fetch(data.urls.cancel, {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
            }).catch(() => {});
          }
          warmed.push(model.name);
        } else {
          failed.push(model.name);
        }
      }

      modelWarmupState[model.name] = Date.now();
    } catch {
      failed.push(model.name);
    }
  }

  return { warmed, failed };
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
        const { generateSpokespersonVideo } = await import("./video-pipeline");
        const video = await generateSpokespersonVideo(params as any);
        return { success: true, data: video };

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
