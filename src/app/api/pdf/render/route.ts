import { NextRequest, NextResponse } from "next/server";
import { htmlToPdfBuffer } from "@/lib/pdf-generator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RenderRequest {
  html: string;
}

function isRenderRequest(value: unknown): value is RenderRequest {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.html === "string" && v.html.length > 0;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  if (!isRenderRequest(body)) {
    return NextResponse.json(
      { error: "Missing required field: html (non-empty string)" },
      { status: 400 },
    );
  }

  const result = await htmlToPdfBuffer(body.html);

  return new NextResponse(new Uint8Array(result.buffer), {
    status: 200,
    headers: {
      "Content-Type": result.contentType,
      "Content-Disposition": `inline; filename="document.${
        result.mode === "pdf" ? "pdf" : "html"
      }"`,
      "X-PDF-Mode": result.mode,
      "Cache-Control": "no-store",
    },
  });
}
