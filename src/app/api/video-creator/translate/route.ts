import { NextRequest } from "next/server";
import {
  translateVideo,
  getTranslationStatus,
  isTranslationAvailable,
  SUPPORTED_LANGUAGES,
} from "@/lib/video-translate";

export const maxDuration = 60;

/**
 * POST /api/video-creator/translate — Start video translation
 *
 * Body: {
 *   videoUrl: string,           // Source video URL
 *   targetLanguages: string[],  // e.g., ["es", "fr", "de"]
 * }
 *
 * Returns: { results: TranslationResult[] }
 */
export async function POST(req: NextRequest) {
  try {
    if (!isTranslationAvailable()) {
      return Response.json(
        {
          error: "Multi-language video translation is coming soon! Stay tuned.",
          comingSoon: true,
        },
        { status: 503 },
      );
    }

    const body = await req.json();
    const { videoUrl, targetLanguages } = body;

    if (!videoUrl?.trim()) {
      return Response.json(
        { error: "Source video URL is required." },
        { status: 400 },
      );
    }

    if (
      !targetLanguages ||
      !Array.isArray(targetLanguages) ||
      targetLanguages.length === 0
    ) {
      return Response.json(
        { error: "Select at least one target language." },
        { status: 400 },
      );
    }

    if (targetLanguages.length > 10) {
      return Response.json(
        { error: "Maximum 10 languages per batch. Please translate in batches." },
        { status: 400 },
      );
    }

    // Validate language codes
    const validCodes = new Set(SUPPORTED_LANGUAGES.map((l) => l.code));
    const invalid = targetLanguages.filter((l: string) => !validCodes.has(l));
    if (invalid.length > 0) {
      return Response.json(
        { error: `Unsupported language(s): ${invalid.join(", ")}` },
        { status: 400 },
      );
    }

    const results = await translateVideo({ videoUrl, targetLanguages });

    return Response.json({
      results,
      message: `Translation started for ${results.filter((r) => r.status === "processing").length} language(s). Each translation takes 2-5 minutes.`,
    });
  } catch (err) {
    console.error("[video-creator/translate] POST error:", err);
    const message =
      err instanceof Error ? err.message : "Video translation failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/video-creator/translate — Check translation status or list languages
 *
 * Query params:
 *   ?action=status&translationId=xxx — Check a single translation
 *   ?action=languages — List supported languages
 *   (no params) — Return availability info + supported languages
 */
export async function GET(req: NextRequest) {
  try {
    const action = req.nextUrl.searchParams.get("action");
    const translationId = req.nextUrl.searchParams.get("translationId");

    if (action === "status" && translationId) {
      if (!isTranslationAvailable()) {
        return Response.json(
          { translationId, status: "failed", error: "Translation not available." },
        );
      }
      const status = await getTranslationStatus(translationId);
      return Response.json(status);
    }

    if (action === "languages") {
      return Response.json({
        languages: SUPPORTED_LANGUAGES,
        available: isTranslationAvailable(),
      });
    }

    // Default: return availability + languages
    return Response.json({
      available: isTranslationAvailable(),
      languages: SUPPORTED_LANGUAGES,
    });
  } catch (err) {
    console.error("[video-creator/translate] GET error:", err);
    return Response.json(
      {
        error: "Failed to load translation data.",
        available: false,
        languages: SUPPORTED_LANGUAGES,
      },
      { status: 500 },
    );
  }
}
