import { NextRequest, NextResponse } from "next/server";
import { inpaintImage } from "@/lib/image-editor";

export const runtime = "nodejs";

interface InpaintBody {
  url?: string;
  maskUrl?: string;
  prompt?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: InpaintBody;
  try {
    body = (await req.json()) as InpaintBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }
  const url = typeof body.url === "string" ? body.url : "";
  const maskUrl = typeof body.maskUrl === "string" ? body.maskUrl : "";
  const prompt = typeof body.prompt === "string" ? body.prompt : "";
  if (!url || !maskUrl || !prompt) {
    return NextResponse.json(
      { ok: false, error: "url, maskUrl and prompt are required" },
      { status: 400 }
    );
  }
  const result = await inpaintImage(url, maskUrl, prompt);
  return NextResponse.json(result, { status: result.ok ? 200 : result.status ?? 500 });
}
