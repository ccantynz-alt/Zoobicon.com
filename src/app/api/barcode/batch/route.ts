import { NextResponse } from "next/server";
import { batchScan, MissingEnvError } from "@/lib/barcode";

export const runtime = "nodejs";

interface BatchBody {
  imageUrls?: unknown;
}

export async function POST(req: Request): Promise<NextResponse> {
  let body: BatchBody;
  try {
    body = (await req.json()) as BatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const urls = body.imageUrls;
  if (
    !Array.isArray(urls) ||
    urls.length === 0 ||
    !urls.every((u): u is string => typeof u === "string" && u.length > 0)
  ) {
    return NextResponse.json(
      { error: "imageUrls (string[]) is required" },
      { status: 400 },
    );
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Missing required environment variable: ANTHROPIC_API_KEY", variable: "ANTHROPIC_API_KEY" },
      { status: 503 },
    );
  }
  try {
    const results = await batchScan(urls);
    return NextResponse.json({ ok: true, count: results.length, results });
  } catch (err) {
    if (err instanceof MissingEnvError) {
      return NextResponse.json(
        { error: err.message, variable: err.variable },
        { status: 503 },
      );
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
