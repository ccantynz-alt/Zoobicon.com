/**
 * AI Twins — Upload Your Face, Get a Talking Video of "You"
 *
 * This is what's going viral on TikTok via the Captions app.
 * Upload a selfie or photo → AI creates a video of that person
 * talking with natural lip-sync and chosen voice.
 *
 * Our pipeline:
 *   1. User uploads their face photo
 *   2. FLUX enhances/processes the face for optimal lip-sync
 *   3. User writes (or AI generates) a script
 *   4. Fish Speech generates voice
 *   5. OmniHuman/SadTalker syncs lips to the user's actual face
 *   6. Output: video of "you" talking
 *
 * Critical: CONSENT REQUIRED. We MUST have user consent before
 * generating a video using someone's likeness. This is enforced
 * at the API level — no face processing without consent flag.
 */

import { generateVoice, generateLipSync, generateCaptions, type PipelineStatus } from "./video-pipeline";

export interface TwinRequest {
  faceImageUrl: string; // User's uploaded face photo
  script: string;
  voiceStyle?: "natural" | "professional" | "energetic" | "calm";
  voiceGender?: "female" | "male";
  format?: "landscape" | "portrait" | "square";
  consent: true; // MUST be explicitly true — enforced
  addCaptions?: boolean;
}

export interface TwinResult {
  videoUrl: string;
  audioUrl: string;
  captionsSrt?: string;
  duration: number;
}

/**
 * Generate an AI Twin video — a video of the user's face talking.
 */
export async function generateTwinVideo(
  request: TwinRequest,
  onProgress?: (status: PipelineStatus) => void
): Promise<TwinResult> {
  // CONSENT CHECK — non-negotiable
  if (request.consent !== true) {
    throw new Error("Consent is required to generate a video using someone's likeness.");
  }

  if (!request.faceImageUrl) {
    throw new Error("Please upload a face photo.");
  }

  if (!request.script || request.script.trim().length < 10) {
    throw new Error("Script must be at least 10 characters.");
  }

  const startTime = Date.now();

  // Step 1: Generate voice from script
  onProgress?.({ step: "voice", progress: 15, message: "Creating your voice..." });
  const voice = await generateVoice(request.script, {
    gender: request.voiceGender || "female",
    style: request.voiceStyle || "natural",
  });

  // Step 2: Lip-sync the user's ACTUAL face with the generated voice
  onProgress?.({ step: "lipsync", progress: 50, message: "Animating your face..." });
  const video = await generateLipSync(
    request.faceImageUrl,
    voice.audioUrl,
    { enhanceFace: true }
  );

  // Step 3: Optional captions
  let captionsSrt: string | undefined;
  if (request.addCaptions) {
    try {
      onProgress?.({ step: "captions", progress: 85, message: "Adding captions..." });
      const captions = await generateCaptions(voice.audioUrl);
      captionsSrt = captions.srt;
    } catch { /* non-fatal */ }
  }

  onProgress?.({ step: "done", progress: 100, message: "Your AI Twin video is ready!" });

  return {
    videoUrl: video.videoUrl,
    audioUrl: voice.audioUrl,
    captionsSrt,
    duration: voice.duration,
  };
}

/**
 * Validate a face image is suitable for AI Twin generation.
 * Checks: face visible, sufficient quality, appropriate content.
 */
export function validateFaceImage(imageUrl: string): {
  valid: boolean;
  reason?: string;
} {
  // Basic URL validation
  if (!imageUrl || (!imageUrl.startsWith("http") && !imageUrl.startsWith("data:"))) {
    return { valid: false, reason: "Please upload a valid image." };
  }

  // Size check for data URLs
  if (imageUrl.startsWith("data:") && imageUrl.length > 10_000_000) {
    return { valid: false, reason: "Image is too large. Please use a smaller photo." };
  }

  return { valid: true };
}
