/**
 * Launch Video Script Generator
 *
 * Pure function that turns a freshly-built site's tagline + value prop into a
 * 30-second voiceover script suitable for the spokesperson video pipeline.
 *
 * The script is intentionally short (~70-90 words) — that hits ~30 seconds
 * at the ~150 wpm pace the TTS chain produces. We open and close on the
 * brand name so the viewer remembers it even if they only hear the first
 * or last second.
 *
 * Failures are LOUD — Law 8: no silent fallbacks to template "Acme Inc"
 * scripts. If the LLM fails, the caller gets a typed error and surfaces it.
 */
import { callLLMWithFailover, describeLLMError } from "@/lib/llm-provider";

const MIN_WORDS = 50;
const MAX_WORDS = 110;
const TARGET_WORDS = 80; // ~30s @ 150wpm

export interface BuildLaunchVideoScriptInput {
  tagline: string;
  valueProp: string;
  brandName: string;
  brandColor?: string;
}

export interface LaunchVideoScript {
  script: string;
  durationEstimateSec: number;
  wordCount: number;
  modelUsed: string;
}

export class LaunchVideoScriptError extends Error {
  constructor(
    message: string,
    public readonly reason:
      | "no_provider"
      | "llm_failed"
      | "empty_response"
      | "missing_input",
  ) {
    super(message);
    this.name = "LaunchVideoScriptError";
  }
}

/**
 * Turn a site's brand info into a 30-second voiceover script.
 *
 * Throws LaunchVideoScriptError on failure — never returns garbage placeholder
 * copy. The caller decides how to surface that to the user.
 */
export async function buildLaunchVideoScript(
  input: BuildLaunchVideoScriptInput,
): Promise<LaunchVideoScript> {
  const tagline = (input.tagline || "").trim();
  const valueProp = (input.valueProp || "").trim();
  const brandName = (input.brandName || "").trim();

  if (!brandName) {
    throw new LaunchVideoScriptError(
      "brandName is required to write a launch video script",
      "missing_input",
    );
  }
  if (!tagline && !valueProp) {
    throw new LaunchVideoScriptError(
      "Either tagline or valueProp must be provided",
      "missing_input",
    );
  }

  const system = `You are a top-tier brand-launch copywriter. You write 30-second voiceover scripts for product hero videos — the kind that play on autoloop in a website's hero section.

You MUST respond with ONLY valid JSON, no markdown fences, no commentary.

JSON schema:
{
  "script": "the complete narration, single paragraph, no stage directions, no speaker tags",
  "wordCount": number
}

WRITING RULES:
- Target ${TARGET_WORDS} words (acceptable: ${MIN_WORDS}-${MAX_WORDS} words). At ~150 wpm this lands in 30 seconds.
- The brand name MUST appear in the FIRST sentence and the LAST sentence.
- Open with a hook — a contrarian take, a vivid moment, or a sharp promise. NEVER "in today's fast-paced world".
- Speak to ONE person. Use "you" liberally.
- Vary sentence length. Punchy openers. One longer flowing line in the middle to build momentum. Crisp close.
- Use concrete specifics over vague claims (e.g. "in 30 seconds", "without a developer", "no credit card") — not "seamlessly" or "revolutionary".
- End with a clear, confident invitation. The website is already loaded behind the video, so the CTA is implicit — don't say "click below" or "visit our website".
- The script will be spoken by an AI voice over a looping spokesperson clip. Avoid sound effects, bracketed cues, or anything that isn't pure spoken narration.

BANNED PHRASES: "in today's", "level up", "take it to the next level", "game-changer", "revolutionary", "seamless", "cutting-edge", "look no further", "without further ado".`;

  const userMessage = `Write a 30-second hero launch video voiceover for this brand.

BRAND NAME: ${brandName}
TAGLINE: ${tagline || "(none provided — infer from value prop)"}
VALUE PROPOSITION: ${valueProp || "(none provided — infer from tagline)"}
${input.brandColor ? `BRAND ACCENT COLOR: ${input.brandColor}` : ""}

Write the JSON now. The script must mention "${brandName}" in the first AND last sentence.`;

  let response;
  try {
    response = await callLLMWithFailover(
      {
        model: "claude-haiku-4-5-20251001",
        system,
        userMessage,
        maxTokens: 1024,
      },
      (provider, model) => {
        console.warn(
          `[launch-video-script] Failed over to ${provider}:${model}`,
        );
      },
    );
  } catch (err) {
    throw new LaunchVideoScriptError(
      `All LLM providers failed: ${describeLLMError(err)}`,
      "llm_failed",
    );
  }

  const raw = (response.text || "").trim();
  if (!raw) {
    throw new LaunchVideoScriptError(
      "LLM returned an empty response",
      "empty_response",
    );
  }

  // Best-effort JSON extraction — handle code fences and stray prose.
  let parsed: { script?: unknown; wordCount?: unknown } = {};
  try {
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace <= firstBrace) {
      throw new Error("no JSON object found");
    }
    parsed = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
  } catch {
    // Fallback: treat the whole response as the script if it looks prose-y.
    if (/^[A-Z]/.test(raw) && raw.split(/\s+/).length >= MIN_WORDS) {
      parsed = { script: raw };
    } else {
      throw new LaunchVideoScriptError(
        "LLM response was not valid JSON and not usable as plain text",
        "empty_response",
      );
    }
  }

  const script =
    typeof parsed.script === "string" ? parsed.script.trim() : "";
  if (!script) {
    throw new LaunchVideoScriptError(
      "LLM response missing 'script' field",
      "empty_response",
    );
  }

  const wordCount = script.split(/\s+/).filter(Boolean).length;
  // 150 wpm => seconds per word = 0.4
  const durationEstimateSec = Math.max(
    8,
    Math.round((wordCount / 150) * 60),
  );

  return {
    script,
    durationEstimateSec,
    wordCount,
    modelUsed: response.model,
  };
}
