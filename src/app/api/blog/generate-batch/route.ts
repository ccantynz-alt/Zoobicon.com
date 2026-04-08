import { NextRequest, NextResponse } from "next/server";
import { generateBlogBatch, type BlogGenRequest } from "@/lib/blog-generator";

export const maxDuration = 300;
export const runtime = "nodejs";

const VALID_LENGTHS = ["short", "medium", "long"] as const;
const VALID_TONES = ["professional", "casual", "technical", "playful", "authoritative"] as const;

export async function GET() {
  return NextResponse.json({
    ok: true,
    available: !!process.env.ANTHROPIC_API_KEY,
    message: process.env.ANTHROPIC_API_KEY
      ? "Batch blog generator ready. POST { topics: string[], options?: {...} }."
      : "Batch blog generator unavailable: ANTHROPIC_API_KEY not set.",
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
      { ok: false, error: "Body must be a JSON object with a 'topics' array." },
      { status: 400 }
    );
  }

  const b = body as Record<string, unknown>;
  if (!Array.isArray(b.topics)) {
    return NextResponse.json(
      { ok: false, error: "'topics' must be an array of strings." },
      { status: 400 }
    );
  }

  const topics = (b.topics as unknown[])
    .filter((t): t is string => typeof t === "string")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  if (topics.length === 0 || topics.length > 20) {
    return NextResponse.json(
      { ok: false, error: "'topics' must contain 1-20 non-empty strings." },
      { status: 400 }
    );
  }

  for (const t of topics) {
    if (t.length > 200) {
      return NextResponse.json(
        { ok: false, error: `Each topic must be 1-200 characters. Offending: "${t.slice(0, 50)}..."` },
        { status: 400 }
      );
    }
  }

  const optsRaw = (b.options ?? {}) as Record<string, unknown>;
  if (optsRaw && typeof optsRaw !== "object") {
    return NextResponse.json(
      { ok: false, error: "'options' must be an object." },
      { status: 400 }
    );
  }

  if (optsRaw.length !== undefined && !VALID_LENGTHS.includes(optsRaw.length as (typeof VALID_LENGTHS)[number])) {
    return NextResponse.json(
      { ok: false, error: `'options.length' must be one of: ${VALID_LENGTHS.join(", ")}` },
      { status: 400 }
    );
  }

  if (optsRaw.tone !== undefined && !VALID_TONES.includes(optsRaw.tone as (typeof VALID_TONES)[number])) {
    return NextResponse.json(
      { ok: false, error: `'options.tone' must be one of: ${VALID_TONES.join(", ")}` },
      { status: 400 }
    );
  }

  const options: Omit<BlogGenRequest, "topic"> = {
    keywords: Array.isArray(optsRaw.keywords)
      ? (optsRaw.keywords as unknown[]).filter((k): k is string => typeof k === "string")
      : undefined,
    tone: optsRaw.tone as BlogGenRequest["tone"],
    length: optsRaw.length as BlogGenRequest["length"],
    audience: typeof optsRaw.audience === "string" ? optsRaw.audience : undefined,
    callToAction: typeof optsRaw.callToAction === "string" ? optsRaw.callToAction : undefined,
    outline: Array.isArray(optsRaw.outline)
      ? (optsRaw.outline as unknown[]).filter((o): o is string => typeof o === "string")
      : undefined,
  };

  try {
    const posts = await generateBlogBatch(topics, options);
    const succeededTopics = new Set(posts.map((p) => p.title));
    const failed = topics.filter((t, i) => {
      // best-effort: posts may have AI-rewritten titles, so use index alignment fallback
      return i >= posts.length || !succeededTopics.has(posts[i]?.title ?? "");
    });
    return NextResponse.json({
      ok: true,
      posts,
      failed: posts.length === topics.length ? [] : failed,
      requested: topics.length,
      succeeded: posts.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error generating blog batch.";
    const isAuthError = /ANTHROPIC_API_KEY/.test(message);
    return NextResponse.json(
      {
        ok: false,
        error: message,
        hint: isAuthError
          ? "Set ANTHROPIC_API_KEY in your Vercel environment variables."
          : "Check server logs. Some topics may have failed individually.",
      },
      { status: isAuthError ? 503 : 500 }
    );
  }
}
