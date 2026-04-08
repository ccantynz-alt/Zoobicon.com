import { NextResponse } from "next/server";
import { analyzeContract } from "@/lib/contract-generator";

export const runtime = "nodejs";

interface AnalyzeBody {
  text?: string;
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Missing required env var: ANTHROPIC_API_KEY" },
      { status: 503 }
    );
  }
  let body: AnalyzeBody;
  try {
    body = (await req.json()) as AnalyzeBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.text || typeof body.text !== "string") {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }
  try {
    const analysis = await analyzeContract(body.text);
    return NextResponse.json({ analysis });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
