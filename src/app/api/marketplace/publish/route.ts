import { NextRequest, NextResponse } from "next/server";
import { publishTemplate } from "@/lib/template-marketplace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PublishBody {
  authorId?: string;
  name?: string;
  description?: string;
  category?: string;
  files?: Record<string, string>;
  dependencies?: Record<string, string>;
  priceCents?: number;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as PublishBody;
    if (!body.authorId || !body.name || !body.category || !body.files) {
      return NextResponse.json(
        { error: "authorId, name, category, files required" },
        { status: 400 }
      );
    }
    const tpl = await publishTemplate(
      body.authorId,
      body.name,
      body.description ?? "",
      body.category,
      body.files,
      body.dependencies ?? {},
      body.priceCents ?? 0
    );
    return NextResponse.json({ template: tpl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
