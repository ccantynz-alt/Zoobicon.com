import { NextRequest, NextResponse } from "next/server";
import { generateLogo, type LogoStyle } from "@/lib/logo-generator";

export const runtime = "nodejs";
export const maxDuration = 120;

const VALID_STYLES: ReadonlyArray<LogoStyle> = [
  "minimal",
  "modern",
  "playful",
  "luxury",
  "tech",
  "organic",
];

interface LogoRequestBody {
  brand?: unknown;
  industry?: unknown;
  style?: unknown;
  colors?: unknown;
  tagline?: unknown;
}

export async function POST(req: NextRequest) {
  let body: LogoRequestBody;
  try {
    body = (await req.json()) as LogoRequestBody;
  } catch {
    return NextResponse.json(
      {
        error: "Invalid JSON body",
        hint: "POST a JSON object with at least { brand: string }",
      },
      { status: 400 }
    );
  }

  if (!body.brand || typeof body.brand !== "string" || !body.brand.trim()) {
    return NextResponse.json(
      {
        error: "Missing required field: brand",
        hint: 'Example: { "brand": "Acme", "style": "modern" }',
      },
      { status: 400 }
    );
  }

  let style: LogoStyle | undefined;
  if (body.style !== undefined) {
    if (
      typeof body.style !== "string" ||
      !VALID_STYLES.includes(body.style as LogoStyle)
    ) {
      return NextResponse.json(
        {
          error: "Invalid style",
          hint: `style must be one of: ${VALID_STYLES.join(", ")}`,
        },
        { status: 400 }
      );
    }
    style = body.style as LogoStyle;
  }

  const industry =
    typeof body.industry === "string" ? body.industry : undefined;
  const tagline = typeof body.tagline === "string" ? body.tagline : undefined;
  const colors =
    Array.isArray(body.colors) &&
    body.colors.every((c): c is string => typeof c === "string")
      ? body.colors
      : undefined;

  try {
    const result = await generateLogo({
      brand: body.brand.trim(),
      industry,
      style,
      colors,
      tagline,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Logo generation failed",
        message,
        hint: "Check that OPENAI_API_KEY or STABILITY_API_KEY is set in Vercel env vars. The image-gen fallback chain will use Unsplash as last resort.",
      },
      { status: 500 }
    );
  }
}
