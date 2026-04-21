import { NextRequest, NextResponse } from "next/server";
import { listDocuments } from "@/lib/doc-qa";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 503 });
  }
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }
  try {
    const docs = await listDocuments(userId);
    return NextResponse.json({ docs });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "list failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
