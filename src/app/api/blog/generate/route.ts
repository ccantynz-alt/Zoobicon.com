import { NextRequest, NextResponse } from "next/server";
import { generateBlogPost, type BlogGenRequest } from "@/lib/blog-generator";

export const maxDuration = 120;
export const runtime = "nodejs";

const VALID_LENGTHS = ["short", "medium", "long"] as const;
const VALID_TONES = ["professional", "casual", "technical", "playful", "authoritative"] as const;

export async function GET() {
  return NextResponse.json({
    ok: true,
    available: !!process.env.ANTHROPIC_API_KEY,
    message: process.env.ANTHROPIC_API_KEY
      ? "Blog generator ready."
      : "Blog generator unavailable: ANTHROPIC_API_KEY not set in environment.",
  });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { ok: false, error: "Body must be a JSON object with a 'topic' field." },
      { status: 400 }
    );
  }

  const b = body as Record<string, unknown>;
  const topic = typeof b.topic === "string" ? b.topic.trim() : "";
  if (!topic || topic.length < 1 || topic.length > 200) {
    return NextResponse.json(
      { ok: false, error: "'topic' is required and must be 1-200 characters." },
      { status: 400 }
    );
  }

  if (b.length !== undefined && !VALID_LENGTHS.includes(b.length as (typeof VALID_LENGTHS)[number])) {
    return NextResponse.json(
      { ok: false, error: `'length' must be one of: ${VALID_LENGTHS.join(", ")}` },
      { status: 400 }
    );
  }

  if (b.tone !== undefined && !VALID_TONES.includes(b.tone as (typeof VALID_TONES)[number])) {
    return NextResponse.json(
      { ok: false, error: `'tone' must be one of: ${VALID_TONES.join(", ")}` },
      { status: 400 }
    );
  }

  if (b.keywords !== undefined && !Array.isArray(b.keywords)) {
    return NextResponse.json(
      { ok: false, error: "'keywords' must be an array of strings." },
      { status: 400 }
    );
  }

  if (b.outline !== undefined && !Array.isArray(b.outline)) {
    return NextResponse.json(
      { ok: false, error: "'outline' must be an array of strings." },
      { status: 400 }
    );
  }

  const genReq: BlogGenRequest = {
    topic,
    keywords: Array.isArray(b.keywords)
      ? (b.keywords as unknown[]).filter((k): k is string => typeof k === "string")
      : undefined,
    tone: b.tone as BlogGenRequest["tone"],
    length: b.length as BlogGenRequest["length"],
    audience: typeof b.audience === "string" ? b.audience : undefined,
    callToAction: typeof b.callToAction === "string" ? b.callToAction : undefined,
    outline: Array.isArray(b.outline)
      ? (b.outline as unknown[]).filter((o): o is string => typeof o === "string")
      : undefined,
  };

  try {
    const post = await generateBlogPost(genReq);
    return NextResponse.json({ ok: true, post });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error generating blog post.";
    const isAuthError = /ANTHROPIC_API_KEY/.test(message);
    return NextResponse.json(
      {
        ok: false,
        error: message,
        hint: isAuthError
          ? "Set ANTHROPIC_API_KEY in your Vercel environment variables."
          : "Check server logs for details. The fallback model may also have failed.",
      },
      { status: isAuthError ? 503 : 500 }
    );
  }
}
