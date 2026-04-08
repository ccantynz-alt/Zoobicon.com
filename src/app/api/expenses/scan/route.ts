import { NextResponse } from "next/server";
import { scanReceipt } from "@/lib/expense-tracker";

export const runtime = "nodejs";

interface ScanBody {
  imageUrl?: string;
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set" }, { status: 503 });
  }
  let body: ScanBody;
  try {
    body = (await req.json()) as ScanBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.imageUrl) {
    return NextResponse.json({ error: "Missing imageUrl" }, { status: 400 });
  }
  try {
    const receipt = await scanReceipt(body.imageUrl);
    return NextResponse.json({ receipt });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
