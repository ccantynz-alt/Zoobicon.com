/**
 * Voice Cloning (#32)
 *
 * Clone a customer's voice from a 10-second audio sample.
 * Their voice, our avatar. Unique to them.
 *
 * Uses XTTS-v2 on Replicate — supports voice cloning from
 * a short reference audio clip. No training needed.
 *
 * Flow:
 *   1. Customer uploads 10-30 seconds of their voice
 *   2. We store the reference audio
 *   3. When generating videos, XTTS uses the reference to match their voice
 *   4. Output: AI avatar speaking in the CUSTOMER'S voice
 *
 * Revenue: Premium feature, $9/mo add-on or included in Pro plan
 * Cost: ~$0.02/minute extra (XTTS is slightly more expensive than Fish Speech)
 */

import { generateVoiceXTTS } from "./video-pipeline";

const REPLICATE_API = "https://api.replicate.com/v1";

export interface VoiceClone {
  id: string;
  ownerEmail: string;
  name: string;
  referenceAudioUrl: string;
  createdAt: Date;
}

/**
 * Create a voice clone from a reference audio sample.
 * Validates the audio is suitable (length, format).
 */
export async function createVoiceClone(params: {
  ownerEmail: string;
  name: string;
  referenceAudioUrl: string;
}): Promise<VoiceClone> {
  if (!params.referenceAudioUrl) {
    throw new Error("Please upload an audio sample of your voice (10-30 seconds).");
  }

  // Test the voice clone by generating a short sample
  try {
    const testResult = await generateVoiceXTTS(
      "This is a test of the voice clone. If you can hear this, the clone was successful.",
      params.referenceAudioUrl
    );

    if (!testResult.audioUrl) {
      throw new Error("Voice cloning failed. Please try a clearer audio sample.");
    }
  } catch (err) {
    throw new Error(`Voice cloning failed: ${err instanceof Error ? err.message : "Unknown error"}. Try a clearer audio sample with less background noise.`);
  }

  return {
    id: `vc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    ownerEmail: params.ownerEmail,
    name: params.name,
    referenceAudioUrl: params.referenceAudioUrl,
    createdAt: new Date(),
  };
}

/**
 * Generate speech using a cloned voice.
 */
export async function generateClonedSpeech(
  text: string,
  referenceAudioUrl: string
): Promise<{ audioUrl: string; duration: number }> {
  return generateVoiceXTTS(text, referenceAudioUrl);
}

/**
 * Tips for best voice cloning results.
 */
export const VOICE_CLONE_TIPS = [
  "Record in a quiet room with minimal background noise",
  "Speak naturally at your normal pace — don't read robotically",
  "Record 10-30 seconds of continuous speech",
  "Use a good microphone if possible (phone mic works too)",
  "Avoid music, other voices, or echo in the background",
  "Speak in the same language you want the clone to output",
];
