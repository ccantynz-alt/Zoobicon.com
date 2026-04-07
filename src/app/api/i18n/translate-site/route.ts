import { NextRequest, NextResponse } from "next/server";
import {
  translateReactFiles,
  TranslatorConfigError,
  SUPPORTED_LANGUAGES,
} from "@/lib/i18n-translator";

export const runtime = "nodejs";
export const maxDuration = 300;

interface TranslateSiteBody {
  files?: Record<string, string>;
  targetLang?: string;
  sourceLang?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: TranslateSiteBody;
  try {
    body = (await req.json()) as TranslateSiteBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const files = body.files;
  const targetLang = body.targetLang;
  const sourceLang = body.sourceLang ?? "en";

  if (!files || typeof files !== "object" || Array.isArray(files)) {
    return NextResponse.json(
      { error: "Missing required field: files (Record<string,string>)" },
      { status: 400 }
    );
  }
  if (!targetLang || typeof targetLang !== "string") {
    return NextResponse.json(
      { error: "Missing required field: targetLang (string)" },
      { status: 400 }
    );
  }
  if (!SUPPORTED_LANGUAGES.find((l) => l.code === targetLang)) {
    return NextResponse.json(
      {
        error: `Unsupported targetLang: ${targetLang}`,
        supported: SUPPORTED_LANGUAGES.map((l) => l.code),
      },
      { status: 400 }
    );
  }

  // Validate file map shape
  for (const [path, content] of Object.entries(files)) {
    if (typeof path !== "string" || typeof content !== "string") {
      return NextResponse.json(
        { error: "files must map string paths to string contents" },
        { status: 400 }
      );
    }
  }

  try {
    const translated = await translateReactFiles(files, targetLang, sourceLang);
    return NextResponse.json({ files: translated });
  } catch (err) {
    if (err instanceof TranslatorConfigError) {
      return NextResponse.json(
        {
          error: err.message,
          envVar: "ANTHROPIC_API_KEY",
          fix: "Set ANTHROPIC_API_KEY in your Vercel environment variables.",
        },
        { status: 503 }
      );
    }
    const message = err instanceof Error ? err.message : "Site translation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
