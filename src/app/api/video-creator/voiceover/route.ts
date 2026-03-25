import { NextRequest } from "next/server";
import {
  generateVoiceover,
  generateSceneVoiceovers,
  getAvailableVoiceProvider,
  getConfiguredVoiceProviders,
  VOICE_PRESETS,
  estimateVoiceoverDuration,
  type VoiceConfig,
} from "@/lib/voiceover";
import {
  getVideoUsage,
  getVideoPlanLimits,
  checkVideoQuota,
  incrementVideoUsage,
  ensureVideoUsageTable,
  getOverageCredits,
  consumeOverageIfNeeded,
} from "@/lib/video-usage";

export const maxDuration = 120;

/**
 * POST /api/video-creator/voiceover — Generate voiceover from script
 *
 * Body: {
 *   script: string,
 *   scenes?: { sceneNumber: number, narration: string }[],
 *   voiceId?: string,
 *   provider?: "elevenlabs" | "playht",
 *   speed?: number,
 *   mode?: "full" | "per-scene",
 *   email?: string,
 *   plan?: string,
 *   hasAddon?: boolean,
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { script, scenes, voiceId, provider, speed, mode = "full", email, plan, hasAddon } = body;

    if (!script && (!scenes || scenes.length === 0)) {
      return Response.json(
        { error: "Either script or scenes array is required" },
        { status: 400 }
      );
    }

    // Quota enforcement
    if (email) {
      await ensureVideoUsageTable();
      const limits = getVideoPlanLimits(plan || "free", !!hasAddon);
      const usage = await getVideoUsage(email);
      const overageCredits = await getOverageCredits(email);
      const check = checkVideoQuota(usage, limits, "voiceover", overageCredits);
      if (!check.allowed) {
        return Response.json(
          { error: check.reason, quota: { current: check.current, limit: check.limit, remaining: check.remaining }, canBuyMore: true },
          { status: 429 }
        );
      }
    }

    const activeProvider = provider || getAvailableVoiceProvider();

    // Resolve voice preset — if user passes a preset name like "rachel", resolve to actual API voice ID
    let resolvedVoiceId = voiceId;
    if (voiceId) {
      const preset = VOICE_PRESETS.find((p) => p.id === voiceId);
      if (preset) {
        resolvedVoiceId = preset.voiceId;
      } else {
        // If it looks like a preset name but doesn't match, fall back to first available preset
        const isPresetName = voiceId.length < 30 && !voiceId.includes("/") && !voiceId.includes(":");
        if (isPresetName) {
          console.warn(`[voiceover] Unknown voice preset "${voiceId}", falling back to default`);
          const defaultPreset = VOICE_PRESETS.find((p) => p.provider === (activeProvider || "elevenlabs"));
          if (defaultPreset) resolvedVoiceId = defaultPreset.voiceId;
        }
        // Otherwise it might be a raw voice ID (long string) — pass through as-is
      }
    }

    const config: VoiceConfig = {
      provider: activeProvider,
      voiceId: resolvedVoiceId,
      speed: speed || 1.0,
    };

    if (mode === "per-scene" && scenes && scenes.length > 0) {
      const results = await generateSceneVoiceovers(scenes, config);
      if (email) {
        await incrementVideoUsage(email, "voiceover", results.length);
        await consumeOverageIfNeeded(email, plan, hasAddon, "voiceover", results.length);
      }
      return Response.json({
        mode: "per-scene",
        provider: activeProvider,
        sceneAudios: results,
        totalScenes: scenes.length,
        generatedScenes: results.length,
      });
    } else {
      const result = await generateVoiceover(script, config);
      if (email) {
        await incrementVideoUsage(email, "voiceover", 1);
        await consumeOverageIfNeeded(email, plan, hasAddon, "voiceover", 1);
      }
      return Response.json({
        mode: "full",
        ...result,
      });
    }
  } catch (err) {
    console.error("[video-creator/voiceover] Error:", err);
    const message = err instanceof Error ? err.message : "Voiceover generation failed";
    return Response.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/video-creator/voiceover — List available voices and providers
 */
export async function GET() {
  const provider = getAvailableVoiceProvider();
  const providers = getConfiguredVoiceProviders();

  // Filter presets by available provider
  const availablePresets = provider
    ? VOICE_PRESETS.filter((p) => p.provider === provider || p.provider === "browser")
    : VOICE_PRESETS;

  return Response.json({
    available: !!provider,
    activeProvider: provider,
    providers,
    voices: availablePresets,
    categories: {
      male: availablePresets.filter((p) => p.category === "male"),
      female: availablePresets.filter((p) => p.category === "female"),
    },
  });
}
