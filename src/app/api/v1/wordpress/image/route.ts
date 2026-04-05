import { NextRequest } from "next/server";
import { authenticateWordPressRequest, apiResponse, apiError } from "@/lib/wordpress-api";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const auth = await authenticateWordPressRequest(req);
  if (auth instanceof Response) return auth;

  try {
    const { prompt, style = "realistic", size = "1024x1024" } = await req.json();
    if (!prompt) return apiError(400, "missing_prompt", "An image description is required");

    // Use Replicate FLUX for image generation
    const replicateToken = process.env.REPLICATE_API_TOKEN;
    if (!replicateToken) {
      return apiError(500, "config_error", "Image generation not configured");
    }

    const Replicate = (await import("replicate")).default;
    const replicate = new Replicate({ auth: replicateToken });

    const [width, height] = size.split("x").map(Number);

    const output = await replicate.run(
      "black-forest-labs/flux-1.1-pro" as `${string}/${string}`,
      {
        input: {
          prompt: `${style} style: ${prompt}`,
          width: width || 1024,
          height: height || 1024,
          num_outputs: 1,
        },
      }
    );

    const imageUrl = Array.isArray(output) ? output[0] : output;
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
