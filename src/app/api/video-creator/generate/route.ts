import { callLLM } from "@/lib/llm-provider";

export const maxDuration = 60;

interface BrandSettings {
  colors?: string[];
  font?: string;
  logoUrl?: string;
}

interface GenerateRequest {
  projectType: string;
  script: string;
  style: string;
  platform: string;
  duration: number;
  music: string;
  brandSettings?: BrandSettings;
}

const STYLE_DESCRIPTIONS: Record<string, string> = {
  "modern-minimalist": "Clean, minimal design with lots of whitespace, subtle animations, muted color palette with one accent color. Geometric shapes, thin lines.",
  "bold-dynamic": "High energy, bold colors, fast cuts, dramatic zooms, strong typography. Eye-catching motion graphics and kinetic text.",
  "elegant-luxury": "Slow, deliberate movements. Gold and dark tones. Serif typography. Smooth transitions, soft lighting, premium feel.",
  "fun-playful": "Bright colors, bouncy animations, rounded shapes, playful typography. Quick transitions, fun sound effects cues.",
  "corporate-professional": "Clean and structured. Blue/gray palette. Sans-serif typography. Steady camera, professional lighting, data visualizations.",
  "cinematic": "Wide shots, dramatic lighting, film grain, letterbox framing. Slow dolly movements, atmospheric color grading, orchestral music cues.",
};

const PLATFORM_SPECS: Record<string, { aspect: string; resolution: string; notes: string }> = {
  tiktok: { aspect: "9:16", resolution: "1080x1920", notes: "Vertical. Hook in first 1-2s. Text safe zone in center 70%. Account for UI overlays." },
  "instagram-reels": { aspect: "9:16", resolution: "1080x1920", notes: "Vertical. Visual-first. Strong opening frame. Captions recommended." },
  youtube: { aspect: "16:9", resolution: "1920x1080", notes: "Horizontal. Can be more detailed. Strong thumbnail frame at start." },
  linkedin: { aspect: "16:9", resolution: "1920x1080", notes: "Professional tone. Captions mandatory (most watch muted). Value-first hook." },
  twitter: { aspect: "1:1", resolution: "1080x1080", notes: "Square. Punchy, concise. Text overlays important. Auto-plays muted." },
};

const PROJECT_TYPE_GUIDANCE: Record<string, string> = {
  "social-ad": "Focus on a strong hook (first 2 seconds), clear value proposition, social proof, and a compelling CTA. Fast-paced, benefit-driven.",
  "product-demo": "Start with the problem, show the product solving it, highlight key features with close-ups, end with pricing/CTA. Medium pace.",
  "explainer": "Open with a relatable problem, introduce the solution concept, break down how it works in 3-4 steps, close with benefits and CTA.",
  "testimonial": "Start with the person and their challenge, show the transformation, include specific metrics/results, end with recommendation.",
  "brand-story": "Narrative arc: origin/mission, challenges overcome, impact created, vision for the future. Emotional, authentic tone.",
  "tutorial": "Clear step-by-step structure. Number each step. Show, don't just tell. Close-up on important details. Recap at the end.",
};

export async function POST(request: Request) {
  try {
    const body: GenerateRequest = await request.json();
    const { projectType, script, style, platform, duration, music, brandSettings } = body;

    if (!projectType || !style || !platform || !duration) {
      return Response.json({ error: "Missing required fields: projectType, style, platform, duration" }, { status: 400 });
    }

    const styleDesc = STYLE_DESCRIPTIONS[style] || STYLE_DESCRIPTIONS["modern-minimalist"];
    const platformSpec = PLATFORM_SPECS[platform] || PLATFORM_SPECS["youtube"];
    const typeGuidance = PROJECT_TYPE_GUIDANCE[projectType] || PROJECT_TYPE_GUIDANCE["social-ad"];
    const brandColorStr = brandSettings?.colors?.length ? brandSettings.colors.join(", ") : "#7c3aed, #ec4899";
    const brandFontStr = brandSettings?.font || "Inter";

    const sceneCount = Math.max(4, Math.min(10, Math.ceil(duration / 10)));

    const systemPrompt = `You are a world-class video director who creates visually stunning, emotionally compelling storyboards. Think David Fincher meets TikTok — cinematic quality optimized for short attention spans.

You MUST respond with ONLY valid JSON — no markdown, no code fences, no explanation text.

JSON schema:
{
  "storyboard": [
    {
      "sceneNumber": number,
      "duration": "Xs" (string with seconds),
      "visualDescription": "Hyper-detailed cinematography description — lighting, composition, depth, color grading, subject positioning, mood, texture",
      "textOverlay": "Exact text shown on screen (empty string if none)",
      "transition": "Transition effect to next scene",
      "cameraMovement": "Precise camera movement with timing",
      "colorPalette": ["#hex1", "#hex2", "#hex3"]
    }
  ],
  "totalDuration": "${duration}s",
  "estimatedRenderTime": "2-5 minutes",
  "script": "The full narration/voiceover script",
  "musicCues": ["Description of music mood/changes at key moments"]
}

VISUAL DIRECTION RULES:
- Scene durations MUST add up to exactly ${duration} seconds
- Generate exactly ${sceneCount} scenes
- EVERY scene description must specify: (1) subject/action, (2) lighting direction and quality, (3) depth of field, (4) color grading/mood, (5) composition framing
- BAD: "A person using a laptop" — GOOD: "Close-up of hands on a glowing laptop keyboard, shallow depth of field, cool blue backlighting washing across the subject's face, soft bokeh from city lights in background, anamorphic lens flare from the screen"
- textOverlay = actual on-screen text (titles, stats, CTAs) — bold, impactful, and SHORT (max 8 words)
- Transitions should create RHYTHM: mix hard cuts for energy with dissolves for emotional beats
- Camera movements should have MOTIVATION: push in for intimacy, pull back for reveals, handheld for urgency, locked off for authority
- Each scene's colorPalette MUST use the brand colors (${brandColorStr}) as the foundation, with 1 scene-specific accent
- The script field should contain the complete voiceover/narration text${!script ? " — write a compelling, human-sounding script (not corporate)" : ""}
- musicCues should describe 3-5 specific mood shifts tied to scenes (e.g., "Scene 3: drop to silence before the reveal, then build with rising synths")

PACING RULES:
- Scene 1 is the HOOK — must be visually arresting in the first frame. No slow builds.
- Alternate between tight close-ups and wider establishing shots for visual variety
- The second-to-last scene should be the emotional peak (the "money shot")
- Final scene should feel like a resolution — calm, confident, clear CTA`;

    const userMessage = `Create a ${duration}-second ${projectType.replace(/-/g, " ")} video storyboard.

PROJECT TYPE GUIDANCE: ${typeGuidance}

VISUAL STYLE: ${style.replace(/-/g, " ")}
${styleDesc}

PLATFORM: ${platform} (${platformSpec.aspect}, ${platformSpec.resolution})
${platformSpec.notes}

BRAND COLORS: ${brandColorStr}
BRAND FONT: ${brandFontStr}

MUSIC PREFERENCE: ${music === "none" ? "No music — rely on sound effects and voiceover only" : `${music} mood/genre`}

${script ? `USER'S SCRIPT/BRIEF:\n${script}` : `No script provided. Generate a compelling script for a ${projectType.replace(/-/g, " ")} video.`}

Generate the complete storyboard as JSON.`;

    const response = await callLLM({
      model: "claude-sonnet-4-6",
      system: systemPrompt,
      userMessage,
      maxTokens: 8192,
    });

    // Parse the JSON response
    let parsed;
    try {
      // Try to extract JSON from the response in case there's any wrapper text
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON object found in response");
      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error("[video-creator/generate] Failed to parse LLM response:", response.text.slice(0, 500));
      return Response.json({ error: "Failed to parse storyboard. Please try again." }, { status: 500 });
    }

    // Validate the response structure
    if (!parsed.storyboard || !Array.isArray(parsed.storyboard) || parsed.storyboard.length === 0) {
      return Response.json({ error: "Invalid storyboard structure. Please try again." }, { status: 500 });
    }

    // Ensure required fields
    const result = {
      storyboard: parsed.storyboard.map((scene: Record<string, unknown>, i: number) => ({
        sceneNumber: scene.sceneNumber || i + 1,
        duration: scene.duration || `${Math.round(duration / sceneCount)}s`,
        visualDescription: scene.visualDescription || "",
        textOverlay: scene.textOverlay || "",
        transition: scene.transition || "cut",
        cameraMovement: scene.cameraMovement || "static",
        colorPalette: Array.isArray(scene.colorPalette) ? scene.colorPalette : brandSettings?.colors || ["#7c3aed", "#ec4899"],
      })),
      totalDuration: parsed.totalDuration || `${duration}s`,
      estimatedRenderTime: parsed.estimatedRenderTime || "2-5 minutes",
      script: parsed.script || script || "",
      musicCues: Array.isArray(parsed.musicCues) ? parsed.musicCues : [],
    };

    return Response.json(result);
  } catch (err) {
    console.error("[video-creator/generate] Error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
