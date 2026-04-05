import { NextRequest } from "next/server";

/**
 * GET /api/video-creator/health
 *
 * Diagnostic endpoint — checks if each Replicate model is accessible.
 * Tests token validity AND model availability for every model in the pipeline.
 *
 * Usage:
 *   /api/video-creator/health?admin=true        — basic check
 *   /api/video-creator/health?admin=true&deep=1  — test every model individually
 */
export async function GET(req: NextRequest) {
  const isAdmin = req.nextUrl.searchParams.get("admin") === "true";
  const deep = req.nextUrl.searchParams.get("deep") === "1";

  const token =
    process.env.REPLICATE_API_TOKEN ||
    process.env.REPLICATE_API_KEY ||
    process.env.REPLICATE_TOKEN ||
    process.env.REPLICATE_KEY;

  if (!token) {
    return Response.json({
      status: "error",
      message: "No Replicate API token found.",
      fix: "Add REPLICATE_API_TOKEN to Vercel environment variables and redeploy.",
      envVars: isAdmin ? {
        REPLICATE_API_TOKEN: !!process.env.REPLICATE_API_TOKEN,
        REPLICATE_API_KEY: !!process.env.REPLICATE_API_KEY,
      } : undefined,
    });
  }

  const masked = token.length > 10
    ? `${token.slice(0, 4)}...${token.slice(-4)}`
    : "***";

  // All models used in the video pipeline
  const pipelineModels = [
    { name: "Kokoro TTS", path: "jaaari/kokoro-82m", role: "Voice (primary)" },
    { name: "Fish Speech", path: "jichengdu/fish-speech", role: "Voice (fallback 1)" },
    { name: "Orpheus TTS", path: "lucataco/orpheus-3b-0.1-ft", role: "Voice (fallback 2)" },
    { name: "XTTS v2", path: "lucataco/xtts-v2", role: "Voice (fallback 3)" },
    { name: "FLUX.1 schnell", path: "black-forest-labs/flux-schnell", role: "Avatar generation" },
    { name: "OmniHuman", path: "bytedance/omni-human", role: "Lip-sync (primary)" },
    { name: "SadTalker (cjwbw)", path: "cjwbw/sadtalker", role: "Lip-sync (fallback 1)" },
    { name: "SadTalker (lucataco)", path: "lucataco/sadtalker", role: "Lip-sync (fallback 2)" },
    { name: "Whisper", path: "openai/whisper", role: "Captions (optional)" },
    { name: "MusicGen", path: "meta/musicgen", role: "Music (optional)" },
  ];

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // Quick check: test token with one model
  try {
    const quickRes = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-schnell", { headers });
    if (!quickRes.ok) {
      return Response.json({
        status: "error",
        message: `Replicate token invalid (HTTP ${quickRes.status}).`,
        tokenPreview: isAdmin ? masked : undefined,
        fix: quickRes.status === 401
          ? "Token is invalid. Get a new one at replicate.com/account/api-tokens."
          : `Replicate returned ${quickRes.status}. Check your account.`,
      });
    }
  } catch (err) {
    return Response.json({
      status: "error",
      message: "Cannot reach Replicate API.",
      detail: err instanceof Error ? err.message : "Network error",
    });
  }

  // Deep check: test each model individually
  if (deep && isAdmin) {
    const results: Array<{
      name: string;
      path: string;
      role: string;
      status: "ok" | "missing" | "error";
      latestVersion?: string;
      detail?: string;
    }> = [];

    await Promise.all(
      pipelineModels.map(async (model) => {
        try {
          const res = await fetch(`https://api.replicate.com/v1/models/${model.path}`, { headers });
          if (res.ok) {
            const data = await res.json();
            results.push({
              name: model.name,
              path: model.path,
              role: model.role,
              status: "ok",
              latestVersion: data.latest_version?.id?.slice(0, 12) || "unknown",
            });
          } else {
            results.push({
              name: model.name,
              path: model.path,
              role: model.role,
              status: res.status === 404 ? "missing" : "error",
              detail: `HTTP ${res.status}`,
            });
          }
        } catch (err) {
          results.push({
            name: model.name,
            path: model.path,
            role: model.role,
            status: "error",
            detail: err instanceof Error ? err.message : "fetch error",
          });
        }
      })
    );

    const okCount = results.filter(r => r.status === "ok").length;
    const criticalMissing = results.filter(r =>
      r.status !== "ok" && !r.role.includes("optional") && !r.role.includes("fallback")
    );

    return Response.json({
      status: criticalMissing.length === 0 ? "ok" : "degraded",
      message: `${okCount}/${results.length} models accessible.${criticalMissing.length > 0 ? ` Critical: ${criticalMissing.map(r => r.name).join(", ")} unavailable.` : ""}`,
      tokenPreview: masked,
      models: results,
      pipeline: {
        voice: results.filter(r => r.role.startsWith("Voice")).some(r => r.status === "ok") ? "ok" : "broken",
        avatar: results.find(r => r.role === "Avatar generation")?.status === "ok" ? "ok" : "broken",
        lipSync: results.filter(r => r.role.startsWith("Lip-sync")).some(r => r.status === "ok") ? "ok" : "broken",
      },
    });
  }

  // Basic check passed
  return Response.json({
    status: "ok",
    message: "Replicate token valid. Add ?deep=1 for full model check.",
    tokenPreview: isAdmin ? masked : undefined,
    hint: isAdmin ? "Use /api/video-creator/health?admin=true&deep=1 to test all models" : undefined,
  });
}
