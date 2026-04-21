// Public image generation API — POST /api/v1/images
// Uses the 4-model Replicate fallback pipeline (Bible Law 9).
import { NextRequest, NextResponse } from "next/server";
import {
  generateImagePipeline,
  isImageGenAvailable,
  PIPELINE_MODELS,
  type ImageGenRequest,
} from "@/lib/image-gen";

export const maxDuration = 120;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function bad(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    available: isImageGenAvailable(),
    models: PIPELINE_MODELS.map((m) => m.slug),
  });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return bad("Invalid JSON body");
  }

  if (!body || typeof body !== "object") {
    return bad("Body must be a JSON object");
  }

  const b = body as Record<string, unknown>;

  const prompt = typeof b.prompt === "string" ? b.prompt.trim() : "";
  if (!prompt) return bad("prompt is required");
  if (prompt.length > 1000) return bad("prompt must be 1000 characters or fewer");

  const numImages =
    typeof b.numImages === "number" ? Math.floor(b.numImages) : 1;
  if (numImages < 1 || numImages > 4) {
    return bad("numImages must be between 1 and 4");
  }

  const width = typeof b.width === "number" ? Math.floor(b.width) : 1024;
  const height = typeof b.height === "number" ? Math.floor(b.height) : 1024;
  if (width < 256 || width > 2048) {
    return bad("width must be between 256 and 2048");
  }
  if (height < 256 || height > 2048) {
    return bad("height must be between 256 and 2048");
  }

  const allowedStyles = new Set([
    "photo",
    "illustration",
    "logo",
    "icon",
    "anime",
    "3d",
  ]);
  let style: ImageGenRequest["style"];
  if (typeof b.style === "string") {
    if (!allowedStyles.has(b.style)) {
      return bad(
        "style must be one of: photo, illustration, logo, icon, anime, 3d"
      );
    }
    style = b.style as ImageGenRequest["style"];
  }

  const negativePrompt =
    typeof b.negativePrompt === "string" ? b.negativePrompt : undefined;
  const steps =
    typeof b.steps === "number" && b.steps > 0 ? Math.floor(b.steps) : undefined;
  const seed = typeof b.seed === "number" ? Math.floor(b.seed) : undefined;

  const reqPayload: ImageGenRequest = {
    prompt,
    negativePrompt,
    width,
    height,
    steps,
    numImages,
    style,
    seed,
  };

  try {
    const result = await generateImagePipeline(reqPayload);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/v1/images] generation failed:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
