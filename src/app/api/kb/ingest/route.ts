import { NextRequest, NextResponse } from "next/server";
import { ingestDocument } from "@/lib/knowledge-base";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface IngestBody {
  ownerId?: string;
  title?: string;
  content?: string;
  sourceUrl?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: IngestBody;
  try {
    body = (await req.json()) as IngestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { ownerId, title, content, sourceUrl } = body;
  if (!ownerId || typeof ownerId !== "string") {
    return NextResponse.json({ error: "ownerId is required" }, { status: 400 });
  }
  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  try {
    const result = await ingestDocument(ownerId, title, content, sourceUrl);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status =
      err instanceof Error && typeof (err as Error & { status?: number }).status === "number"
        ? ((err as Error & { status?: number }).status as number)
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
