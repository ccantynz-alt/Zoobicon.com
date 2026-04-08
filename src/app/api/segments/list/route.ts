import { NextResponse } from "next/server";
import { listSegments } from "@/lib/customer-segmentation";

export const runtime = "nodejs";

export async function GET(req: Request): Promise<NextResponse> {
  const url = new URL(req.url);
  const ownerId = url.searchParams.get("ownerId");
  if (!ownerId) {
    return NextResponse.json(
      { error: "ownerId query param required" },
      { status: 400 }
    );
  }
  try {
    const segments = await listSegments(ownerId);
    return NextResponse.json({ segments });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
