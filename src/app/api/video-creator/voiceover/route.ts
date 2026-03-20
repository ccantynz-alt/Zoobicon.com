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

export const maxDuration = 120;

/**
 * POST /api/video-creator/voiceover — Generate voiceover from script
 *
 * Body: {
 *   script: string,              // Full script text
 *   scenes?: { sceneNumber: number, narration: string }[],  // Per-scene narration
 *   voiceId?: string,            // Voice preset ID or provider voice ID
 *   provider?: "elevenlabs" | "playht",
 *   speed?: number,              // 0.5-2.0
 *   mode?: "full" | "per-scene"  // Generate one audio or per-scene clips
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { script, scenes, voiceId, provider, speed, mode = "full" } = body;

    if (!script && (!scenes || scenes.length === 0)) {
      return Response.json(
        { error: "Either script or scenes array is required" },
        { status: 400 }
      );
    }

    const activeProvider = provider || getAvailableVoiceProvider();
    if (!activeProvider) {
      return Response.json(
        {
          error: "No voice provider configured",
          message: "Set ELEVENLABS_API_KEY or PLAYHT_API_KEY + PLAYHT_USER_ID in your environment.",
          providers: getConfiguredVoiceProviders(),
          // Return duration estimate even without provider
          durationEstimate: script ? estimateVoiceoverDuration(script, speed || 1.0) : null,
        },
        { status: 503 }
      );
    }

    // Resolve voice preset
    let resolvedVoiceId = voiceId;
    if (voiceId) {
      const preset = VOICE_PRESETS.find((p) => p.id === voiceId);
      if (preset) {
        resolvedVoiceId = preset.voiceId;
      }
    }

    const config: VoiceConfig = {
      provider: activeProvider,
      voiceId: resolvedVoiceId,
      speed: speed || 1.0,
    };

    if (mode === "per-scene" && scenes && scenes.length > 0) {
      const results = await generateSceneVoiceovers(scenes, config);
      return Response.json({
        mode: "per-scene",
        provider: activeProvider,
        sceneAudios: results,
        totalScenes: scenes.length,
        generatedScenes: results.length,
      });
    } else {
      const result = await generateVoiceover(script, config);
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
