import { NextRequest } from "next/server";
import { authenticateWordPressRequest, callAI, apiResponse, apiError } from "@/lib/wordpress-api";

export async function POST(req: NextRequest) {
  const auth = await authenticateWordPressRequest(req);
  if (auth instanceof Response) return auth;

  try {
    const { image_url } = await req.json();
    if (!image_url) return apiError(400, "missing_image", "An image URL is required");

    // Use Claude's vision capability to describe the image
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return apiError(500, "config_error", "AI not configured");

    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "url", url: image_url },
          },
          {
            type: "text",
            text: "Generate a concise, descriptive alt text for this image (max 125 characters). Focus on what's shown and its context. Output ONLY the alt text, nothing else.",
          },
        ],
      }],
    });

    const altText = response.content.find(b => b.type === "text")?.text?.trim() || "Image";
    return apiResponse({ alt_text: altText, image_url });
  } catch (error) {
    console.error("[wp-alt-text]", error);
    return apiError(500, "alt_text_failed", "Alt text generation failed");
  }
}
