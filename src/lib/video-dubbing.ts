/**
 * AI Video Dubbing — Multi-Language Video Generation
 *
 * Generate the SAME video in multiple languages simultaneously.
 * Fish Speech supports 50+ languages — we use this to dub videos
 * into any language while keeping the same avatar lip-synced.
 *
 * Flow:
 *   Original video (English) → Translate script → Generate voice per language →
 *   Re-sync lips for each language → Output multiple videos
 *
 * This is what HeyGen charges $149/mo for. We do it at $0.10-0.30/language.
 */

import { generateVoice, generateLipSync, type PipelineStatus } from "./video-pipeline";

export interface DubbingRequest {
  originalScript: string;
  avatarImageUrl: string; // The same avatar face for all languages
  targetLanguages: string[]; // ["es", "fr", "ja", "de", "pt"]
  voiceGender?: "female" | "male";
}

export interface DubbedVideo {
  language: string;
  languageName: string;
  videoUrl: string;
  audioUrl: string;
  translatedScript: string;
}

// Supported languages with Fish Speech
export const DUBBING_LANGUAGES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese (Mandarin)",
  ar: "Arabic",
  hi: "Hindi",
  ru: "Russian",
  nl: "Dutch",
  sv: "Swedish",
  pl: "Polish",
  tr: "Turkish",
  th: "Thai",
  vi: "Vietnamese",
  id: "Indonesian",
  ms: "Malay",
};

/**
 * Translate a script into another language using Claude.
 */
async function translateScript(
  script: string,
  targetLang: string,
  targetLangName: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Translation service unavailable");

  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    messages: [{
      role: "user",
      content: `Translate this video script to ${targetLangName}. Keep the same tone, pacing, and [pause] markers. Output ONLY the translated text, nothing else.\n\nScript:\n${script}`,
    }],
  });

  const text = response.content.find(b => b.type === "text")?.text || "";
  return text.trim();
}

/**
 * Dub a video into multiple languages.
 * Each language gets: translated script → voice generation → lip-sync.
 * All languages process in parallel for speed.
 */
export async function dubVideo(
  request: DubbingRequest,
  onProgress?: (status: PipelineStatus) => void
): Promise<DubbedVideo[]> {
  const results: DubbedVideo[] = [];
  const total = request.targetLanguages.length;

  // Process languages in parallel (batches of 3 to not overwhelm APIs)
  const batchSize = 3;
  for (let i = 0; i < request.targetLanguages.length; i += batchSize) {
    const batch = request.targetLanguages.slice(i, i + batchSize);

    const batchPromises = batch.map(async (langCode) => {
      const langName = DUBBING_LANGUAGES[langCode] || langCode;
      const progressBase = Math.floor((i / total) * 100);

      try {
        // Step 1: Translate script
        onProgress?.({
          step: "translate",
          progress: progressBase + 10,
          message: `Translating to ${langName}...`,
        });
        const translatedScript = await translateScript(
          request.originalScript,
          langCode,
          langName
        );

        // Step 2: Generate voice in target language
        onProgress?.({
          step: "voice",
          progress: progressBase + 40,
          message: `Generating ${langName} voice...`,
        });
        const voice = await generateVoice(translatedScript, {
          gender: request.voiceGender || "female",
        });

        // Step 3: Lip-sync with the same avatar
        onProgress?.({
          step: "lipsync",
          progress: progressBase + 70,
          message: `Syncing ${langName} video...`,
        });
        const video = await generateLipSync(
          request.avatarImageUrl,
          voice.audioUrl
        );

        return {
          language: langCode,
          languageName: langName,
          videoUrl: video.videoUrl,
          audioUrl: voice.audioUrl,
          translatedScript,
        };
      } catch (err) {
        console.error(`[dubbing] Failed for ${langName}:`, err);
        return null;
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.filter((r): r is DubbedVideo => r !== null));
  }

  onProgress?.({
    step: "done",
    progress: 100,
    message: `Dubbed into ${results.length} language(s)`,
  });

  return results;
}

/**
 * Estimate cost for dubbing.
 * ~$0.15-0.30 per language (voice + lip-sync on Replicate).
 */
export function estimateDubbingCost(languageCount: number): {
  costPerLanguage: number;
  totalCost: number;
  estimatedTime: string;
} {
  const costPerLanguage = 0.20; // Average on Replicate
  return {
    costPerLanguage,
    totalCost: costPerLanguage * languageCount,
    estimatedTime: `${Math.ceil(languageCount * 1.5)} minutes`, // ~90s per language
  };
}
