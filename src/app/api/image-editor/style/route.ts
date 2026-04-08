import { NextRequest, NextResponse } from "next/server";
import { styleTransfer } from "@/lib/image-editor";

export const runtime = "nodejs";

interface StyleBody {
  url?: string;
  style?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: StyleBody;
  try {
    body = (await req.json()) as StyleBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }
  const url = typeof body.url === "string" ? body.url : "";
  const style = typeof body.style === "string" ? body.style : "";
  if (!url || !style) {
    return NextResponse.json(
      { ok: false, error: "url and style are required" },
      { status: 400 }
    );
  }
  const result = await styleTransfer(url, style);
  return NextResponse.json(result, { status: result.ok ? 200 : result.status ?? 500 });
}
