import { NextRequest } from "next/server";
import { authenticateWordPressRequest, apiResponse, apiError } from "@/lib/wordpress-api";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const auth = await authenticateWordPressRequest(req);
  if (auth instanceof Response) return auth;

  try {
    const { prompt, style = "realistic", size = "1024x1024" } = await req.json();
    if (!prompt) return apiError(400, "missing_prompt", "An image description is required");

    const replicateToken = process.env.REPLICATE_API_TOKEN;
    if (!replicateToken) {
      return apiError(500, "config_error", "Image generation not configured");
    }

    const [width, height] = size.split("x").map(Number);

    // Use Replicate FLUX via direct API (no SDK dependency)
    const res = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${replicateToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          prompt: `${style} style: ${prompt}`,
          num_outputs: 1,
          aspect_ratio: width === height ? "1:1" : width > height ? "16:9" : "9:16",
          output_format: "webp",
          output_quality: 90,
        },
      }),
    });

    if (!res.ok) {
      console.error("[wp-image] Replicate API error:", res.status);
      return apiError(500, "generation_failed", "Image generation service unavailable");
    }

    let data = await res.json();

    // Poll for completion if async
    if (data.urls?.get && data.status !== "succeeded") {
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const pollRes = await fetch(data.urls.get, {
          headers: { Authorization: `Bearer ${replicateToken}` },
        });
        data = await pollRes.json();
        if (data.status === "succeeded" || data.status === "failed") break;
      }
    }

    const imageUrl = Array.isArray(data.output) ? data.output[0] : data.output;
    if (!imageUrl) {
      return apiError(500, "generation_failed", "No image was generated");
    }

    return apiResponse({
      url: typeof imageUrl === "string" ? imageUrl : String(imageUrl),
      prompt,
      style,
      size,
    });
  } catch (error) {
    console.error("[wp-image]", error);
    return apiError(500, "image_failed", "Image generation failed");
  }
}
