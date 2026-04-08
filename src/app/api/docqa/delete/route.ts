import { NextRequest, NextResponse } from "next/server";
import { deleteDocument } from "@/lib/doc-qa";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 503 });
  }
  try {
    const body = (await req.json()) as { id?: string };
    if (!body.id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    await deleteDocument(body.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "delete failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
