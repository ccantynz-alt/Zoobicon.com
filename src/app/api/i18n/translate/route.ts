import { NextRequest, NextResponse } from "next/server";
import {
  translateText,
  TranslatorConfigError,
  SUPPORTED_LANGUAGES,
} from "@/lib/i18n-translator";

export const runtime = "nodejs";
export const maxDuration = 60;

interface TranslateBody {
  text?: string;
  targetLang?: string;
  sourceLang?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: TranslateBody;
  try {
    body = (await req.json()) as TranslateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = body.text;
  const targetLang = body.targetLang;
  const sourceLang = body.sourceLang ?? "en";

  if (!text || typeof text !== "string") {
    return NextResponse.json(
      { error: "Missing required field: text (string)" },
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

  try {
    const translation = await translateText(text, targetLang, sourceLang);
    return NextResponse.json({ translation });
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
    const message = err instanceof Error ? err.message : "Translation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
