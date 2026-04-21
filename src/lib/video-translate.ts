// ---------------------------------------------------------------------------
// Video Translation — Multi-Language Translation with Lip Sync
//
// Translates an existing AI spokesperson video into multiple languages
// using HeyGen's Video Translate API. Produces lip-synced versions
// where the avatar appears to speak each target language natively.
//
// API Docs: https://docs.heygen.com/reference/video-translate
//
// Env vars:
//   HEYGEN_API_KEY — API key from HeyGen dashboard (same as heygen.ts)
// ---------------------------------------------------------------------------

const HEYGEN_API = "https://api.heygen.com";

export interface TranslationRequest {
  videoUrl: string;         // Source video URL (must be publicly accessible)
  targetLanguages: string[]; // e.g., ["es", "fr", "de", "ja", "pt"]
  preserveVoice?: boolean;  // Try to keep original voice characteristics
}

export interface TranslationResult {
  language: string;
  languageName: string;
  status: "pending" | "processing" | "completed" | "failed";
  videoUrl?: string;
  translationId?: string;
  error?: string;
}

export interface TranslationStatusResponse {
  translationId: string;
  status: "pending" | "processing" | "completed" | "failed";
  videoUrl?: string;
  error?: string;
}

export interface SupportedLanguage {
  code: string;
  name: string;
  flag: string;
}

// Supported languages with display names
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: "en", name: "English", flag: "\u{1F1EC}\u{1F1E7}" },
  { code: "es", name: "Spanish", flag: "\u{1F1EA}\u{1F1F8}" },
  { code: "fr", name: "French", flag: "\u{1F1EB}\u{1F1F7}" },
  { code: "de", name: "German", flag: "\u{1F1E9}\u{1F1EA}" },
  { code: "it", name: "Italian", flag: "\u{1F1EE}\u{1F1F9}" },
  { code: "pt", name: "Portuguese", flag: "\u{1F1E7}\u{1F1F7}" },
  { code: "ja", name: "Japanese", flag: "\u{1F1EF}\u{1F1F5}" },
  { code: "ko", name: "Korean", flag: "\u{1F1F0}\u{1F1F7}" },
  { code: "zh", name: "Chinese", flag: "\u{1F1E8}\u{1F1F3}" },
  { code: "hi", name: "Hindi", flag: "\u{1F1EE}\u{1F1F3}" },
  { code: "ar", name: "Arabic", flag: "\u{1F1F8}\u{1F1E6}" },
  { code: "nl", name: "Dutch", flag: "\u{1F1F3}\u{1F1F1}" },
  { code: "sv", name: "Swedish", flag: "\u{1F1F8}\u{1F1EA}" },
  { code: "pl", name: "Polish", flag: "\u{1F1F5}\u{1F1F1}" },
  { code: "tr", name: "Turkish", flag: "\u{1F1F9}\u{1F1F7}" },
  { code: "ru", name: "Russian", flag: "\u{1F1F7}\u{1F1FA}" },
  { code: "th", name: "Thai", flag: "\u{1F1F9}\u{1F1ED}" },
  { code: "vi", name: "Vietnamese", flag: "\u{1F1FB}\u{1F1F3}" },
  { code: "id", name: "Indonesian", flag: "\u{1F1EE}\u{1F1E9}" },
  { code: "ms", name: "Malay", flag: "\u{1F1F2}\u{1F1FE}" },
];

/**
 * Look up a language's display name by its code
 */
export function getLanguageName(code: string): string {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code)?.name || code;
}

/**
 * Translate a video into one target language via HeyGen Video Translate API.
 * Returns a translation ID for polling status.
 */
export async function submitTranslation(
  videoUrl: string,
  targetLanguage: string,
): Promise<{ translationId: string }> {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) {
    throw new Error("Video translation is coming soon. Stay tuned!");
  }

  const res = await fetch(`${HEYGEN_API}/v2/video_translate`, {
    method: "POST",
    headers: {
      "X-Api-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      video_url: videoUrl,
      output_language: targetLanguage,
      translate_audio_only: false, // Full lip sync
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`[video-translate] API error for ${targetLanguage}:`, res.status, errText);
    const lower = errText.toLowerCase();
    if (lower.includes("insufficient") || lower.includes("credit") || lower.includes("quota")) {
      throw new Error("Translation credits exhausted. Please try again later.");
    }
    if (res.status === 429) {
      throw new Error("Too many translation requests. Please wait a moment and try again.");
    }
    throw new Error(`Translation API error (${res.status})`);
  }

  const data = await res.json();
  const translationId = data?.data?.video_translate_id;
  if (!translationId) {
    throw new Error("No translation ID returned from API.");
  }

  console.log(`[video-translate] Translation started: ${translationId} (${targetLanguage})`);
  return { translationId };
}

/**
 * Check the status of a video translation job.
 */
export async function getTranslationStatus(
  translationId: string,
): Promise<TranslationStatusResponse> {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) {
    return {
      translationId,
      status: "failed",
      error: "Video translation is coming soon.",
    };
  }

  const res = await fetch(
    `${HEYGEN_API}/v2/video_translate/${translationId}`,
    {
      headers: {
        "X-Api-Key": apiKey,
      },
    },
  );

  if (!res.ok) {
    return {
      translationId,
      status: "failed",
      error: `Failed to check translation status (${res.status})`,
    };
  }

  const data = await res.json();
  const info = data?.data;

  return {
    translationId,
    status: info?.status === "success" ? "completed" : info?.status || "pending",
    videoUrl: info?.url || info?.video_url || undefined,
    error: info?.error || undefined,
  };
}

/**
 * Translate a video into multiple target languages.
 * Submits all translations in parallel and returns initial results with translation IDs.
 */
export async function translateVideo(
  request: TranslationRequest,
): Promise<TranslationResult[]> {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) {
    return request.targetLanguages.map((lang) => ({
      language: lang,
      languageName: getLanguageName(lang),
      status: "failed" as const,
      error: "Video translation is coming soon",
    }));
  }

  const results: TranslationResult[] = [];

  for (const lang of request.targetLanguages) {
    try {
      const { translationId } = await submitTranslation(request.videoUrl, lang);
      results.push({
        language: lang,
        languageName: getLanguageName(lang),
        status: "processing",
        translationId,
      });
    } catch (err) {
      results.push({
        language: lang,
        languageName: getLanguageName(lang),
        status: "failed",
        error: err instanceof Error ? err.message : "Translation failed",
      });
    }
  }

  return results;
}

/**
 * Check if video translation is available (HeyGen API key configured)
 */
export function isTranslationAvailable(): boolean {
  return !!process.env.HEYGEN_API_KEY;
}
