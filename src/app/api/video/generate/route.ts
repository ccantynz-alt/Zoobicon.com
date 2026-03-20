import { NextResponse } from "next/server";

/**
 * AI Video Clip Generation via Luma Dream Machine API.
 *
 * Generates actual video clips from text descriptions of shots.
 * Each clip is ~5s and can be stitched into the final video.
 *
 * Requires: LUMA_API_KEY in .env.local
 * Sign up at: https://lumalabs.ai/api
 * Pricing: ~$0.35 per 5-second clip
 */

const LUMA_API_KEY = process.env.LUMA_API_KEY;
const LUMA_API_BASE = "https://api.lumalabs.ai/dream-machine/v1";

export interface VideoClipRequest {
  prompt: string;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  duration?: number;
  loop?: boolean;
}

export interface VideoClipStatus {
  id: string;
  status: "queued" | "dreaming" | "completed" | "failed";
  videoUrl?: string;
  thumbnailUrl?: string;
  prompt: string;
  createdAt: string;
}

// POST: Start generating a video clip
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, aspectRatio = "9:16", shots } = body;

    if (!LUMA_API_KEY) {
      return NextResponse.json({
        status: "not_configured",
        message: "Luma Dream Machine API not configured. Add LUMA_API_KEY to .env.local to enable AI video generation.",
        setup: {
          steps: [
            "Sign up at lumalabs.ai/api",
            "Create an API key in your dashboard",
            "Add LUMA_API_KEY=your_key to .env.local",
            "Restart the dev server",
          ],
          pricing: "~$0.35 per 5-second video clip",
          alternatives: [
            { name: "Runway Gen-4", url: "https://runwayml.com", price: "$0.50/clip", quality: "Best" },
            { name: "Kling AI", url: "https://klingapi.com", price: "$0.35/clip", quality: "Fast" },
          ],
        },
      });
    }

    // If `shots` array is provided, queue generation for each shot
    if (shots?.length) {
      const results = [];

      for (const shot of shots) {
        const enhancedPrompt = buildVideoPrompt(shot.visual, shot.mood, shot.textOverlay);

        const res = await fetch(`${LUMA_API_BASE}/generations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${LUMA_API_KEY}`,
          },
          body: JSON.stringify({
            prompt: enhancedPrompt,
            aspect_ratio: aspectRatio,
            loop: false,
          }),
        });

        if (!res.ok) {
          const err = await res.text().catch(() => "");
          results.push({
            shotNumber: shot.shotNumber,
            status: "failed",
            error: `Luma API error ${res.status}: ${err}`,
          });
          continue;
        }

        const data = await res.json();
        results.push({
          shotNumber: shot.shotNumber,
          generationId: data.id,
          status: data.state || "queued",
          prompt: enhancedPrompt,
        });
      }

      return NextResponse.json({ results });
    }

    // Single clip generation
    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const res = await fetch(`${LUMA_API_BASE}/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LUMA_API_KEY}`,
      },
      body: JSON.stringify({
        prompt,
        aspect_ratio: aspectRatio,
        loop: false,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Luma API error ${res.status}: ${errText}`);
    }

    const data = await res.json();

    return NextResponse.json({
      generationId: data.id,
      status: data.state || "queued",
      prompt,
    });
  } catch (err) {
    console.error("Video generation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Video generation failed" },
      { status: 500 }
    );
  }
}

// GET: Check generation status
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const generationId = searchParams.get("id");

  if (!generationId) {
    return NextResponse.json({ error: "Generation ID required" }, { status: 400 });
  }

  if (!LUMA_API_KEY) {
    return NextResponse.json({ error: "Luma API not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(`${LUMA_API_BASE}/generations/${generationId}`, {
      headers: { Authorization: `Bearer ${LUMA_API_KEY}` },
    });

    if (!res.ok) {
      throw new Error(`Luma API error ${res.status}`);
    }

    const data = await res.json();

    return NextResponse.json({
      id: data.id,
      status: data.state,
      videoUrl: data.assets?.video || null,
      thumbnailUrl: data.assets?.thumbnail || null,
      prompt: data.request?.prompt || "",
      createdAt: data.created_at,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Status check failed" },
      { status: 500 }
    );
  }
}

/**
 * Enhance a shot description into a cinematic video prompt.
 */
function buildVideoPrompt(visual: string, mood: string, textOverlay?: string): string {
  const moodModifiers: Record<string, string> = {
    energetic: "dynamic camera movement, vibrant colors, fast energy",
    calm: "smooth steady camera, soft lighting, peaceful atmosphere",
    dramatic: "cinematic lighting, high contrast, dramatic angles",
    satisfying: "clean satisfying motion, perfect timing, smooth transitions",
    confident: "steady professional camera, clean composition, confident tone",
    playful: "fun bouncy motion, bright colors, playful energy",
    urgent: "fast cuts, intense colors, urgency, motion blur",
    inspirational: "soaring camera, golden light, aspirational feeling",
  };

  const modifier = moodModifiers[mood] || moodModifiers.confident;

  let prompt = `${visual}. ${modifier}. Professional marketing video, high production value, 4K quality.`;

  if (textOverlay) {
    prompt += ` Bold text "${textOverlay}" appears prominently on screen with motion graphics.`;
  }

  return prompt;
}
