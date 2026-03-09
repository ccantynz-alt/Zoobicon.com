import { NextRequest, NextResponse } from "next/server";
import { generateImage, buildImagePrompts } from "@/lib/image-gen";

/**
 * AI Image Generation API
 *
 * POST /api/generate/ai-images
 * Body: { html: string, industry?: string }
 *   → Replaces placeholder images in HTML with AI-generated or high-quality stock images
 *
 * POST /api/generate/ai-images
 * Body: { prompt: string, width?: number, height?: number, style?: string }
 *   → Generates a single AI image
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ── Single image generation mode ──
    if (body.prompt && !body.html) {
      const image = await generateImage({
        prompt: body.prompt,
        width: body.width || 1024,
        height: body.height || 768,
        style: body.style || "photo",
        quality: body.quality || "standard",
      });

      return NextResponse.json({
        image,
        provider: image.provider,
      });
    }

    // ── Full page image replacement mode ──
    if (body.html && typeof body.html === "string") {
      const industry = body.industry || "business";
      const imagePrompts = buildImagePrompts(body.html, industry);

      if (imagePrompts.length === 0) {
        return NextResponse.json({
          html: body.html,
          replacements: [],
          message: "No placeholder images found",
        });
      }

      // Generate images for all placeholders
      const results = await Promise.all(
        imagePrompts.map(async (ip) => {
          const image = await generateImage({
            prompt: ip.prompt,
            width: ip.width,
            height: ip.height,
            style: ip.style,
          });
          return { placeholder: ip.placeholder, image };
        })
      );

      // Replace placeholders in HTML
      let updatedHtml = body.html;
      const replacements = results.map((r) => {
        updatedHtml = updatedHtml.split(r.placeholder).join(r.image.url);
        return {
          original: r.placeholder,
          replacement: r.image.url,
          provider: r.image.provider,
          prompt: r.image.prompt,
        };
      });

      return NextResponse.json({
        html: updatedHtml,
        replacements,
        imageCount: replacements.length,
        providers: [...new Set(replacements.map((r) => r.provider))],
      });
    }

    return NextResponse.json(
      { error: "Provide either { prompt } for single image or { html } for page replacement" },
      { status: 400 }
    );
  } catch (err) {
    console.error("AI image generation error:", err);
    return NextResponse.json({ error: "Image generation failed" }, { status: 500 });
  }
}
