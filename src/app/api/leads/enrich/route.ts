import { NextResponse } from "next/server";
import { enrichLead } from "@/lib/lead-scoring";

export const runtime = "nodejs";

interface EnrichRequestBody {
  email: string;
}

export async function POST(req: Request): Promise<Response> {
  let body: EnrichRequestBody;
  try {
    body = (await req.json()) as EnrichRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.email || typeof body.email !== "string") {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  try {
    const enrichment = await enrichLead(body.email);
    return NextResponse.json({ enrichment });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Enrichment error" },
      { status: 500 }
    );
  }
}
