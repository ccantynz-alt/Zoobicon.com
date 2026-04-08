import { NextResponse } from "next/server";
import { listTopLeads } from "@/lib/lead-scoring";

export const runtime = "nodejs";

export async function GET(req: Request): Promise<Response> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "DATABASE_URL is not set" },
      { status: 503 }
    );
  }
  const url = new URL(req.url);
  const limitRaw = url.searchParams.get("limit");
  const limit = Math.min(
    500,
    Math.max(1, limitRaw ? parseInt(limitRaw, 10) || 50 : 50)
  );

  try {
    const leads = await listTopLeads(limit);
    return NextResponse.json({ leads, count: leads.length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "List error" },
      { status: 500 }
    );
  }
}
