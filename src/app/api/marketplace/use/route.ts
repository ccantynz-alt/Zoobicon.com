import { NextRequest, NextResponse } from "next/server";
import { useTemplate } from "@/lib/template-marketplace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as { templateId?: string; buyerId?: string };
    if (!body.templateId || !body.buyerId) {
      return NextResponse.json({ error: "templateId and buyerId required" }, { status: 400 });
    }
    const result = await useTemplate(body.templateId, body.buyerId);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
