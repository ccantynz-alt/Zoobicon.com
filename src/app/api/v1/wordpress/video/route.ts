import { NextRequest } from "next/server";
import { authenticateWordPressRequest, callAI, apiResponse, apiError } from "@/lib/wordpress-api";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const auth = await authenticateWordPressRequest(req);
  if (auth instanceof Response) return auth;

  try {
    const { post_content, post_title, style = "professional", duration = 30 } = await req.json();

    if (!post_content && !post_title) {
      return apiError(400, "missing_content", "post_content or post_title is required");
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return apiError(503, "video_unavailable", "Video generation is not configured on this server");
    }

    // Generate a video script from the post content using AI
    const scriptPrompt = `You are a professional video scriptwriter. Based on the following blog post or article, write a concise video script suitable for a ${duration}-second video.
Style: ${style}
Keep the script natural, engaging, and within the time limit.
Output ONLY the spoken script text, no stage directions or formatting.`;

    const script = await callAI(
      scriptPrompt,
      `Title: ${post_title || "Untitled"}\n\nContent:\n${(post_content || "").substring(0, 3000)}`,
      500
    );

    // Call Replicate for text-to-speech (Fish Speech model)
    const replicateToken = process.env.REPLICATE_API_TOKEN;

    const ttsResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${replicateToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "tts",
        input: {
          text: script,
          language: "en",
        },
      }),
    });

    if (!ttsResponse.ok) {
      // Return script without video if Replicate fails — still useful
      return apiResponse({
        video_url: null,
        script,
        duration,
        style,
        message: "Script generated. Video pipeline temporarily unavailable — try again shortly.",
      });
    }

    const prediction = await ttsResponse.json() as { id: string; urls?: { get: string } };

    // Poll for completion (up to 60 seconds)
    let videoUrl: string | null = null;
    const pollUrl = prediction.urls?.get || `https://api.replicate.com/v1/predictions/${prediction.id}`;

    for (let i = 0; i < 12; i++) {
      await new Promise(r => setTimeout(r, 5000));
      const pollRes = await fetch(pollUrl, {
        headers: { Authorization: `Token ${replicateToken}` },
      });
      const status = await pollRes.json() as { status: string; output?: string | string[] };
      if (status.status === "succeeded") {
        videoUrl = Array.isArray(status.output) ? status.output[0] : (status.output || null);
        break;
      }
      if (status.status === "failed") break;
    }

    return apiResponse({
      video_url: videoUrl,
      script,
      duration,
      style,
    });
  } catch (error) {
    console.error("[wp-video]", error);
    return apiError(500, "video_failed", "Video generation failed");
  }
}
