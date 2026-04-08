import { NextRequest, NextResponse } from "next/server";
import { generateQR, QRCodeError, type QRFormat } from "@/lib/qr-code";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get("text");
  const sizeRaw = searchParams.get("size");
  const formatRaw = searchParams.get("format");

  if (!text) {
    return NextResponse.json(
      {
        error: "Missing required parameter: text",
        hint: "Pass ?text=hello to generate a QR code.",
      },
      { status: 400 }
    );
  }

  const size = sizeRaw ? parseInt(sizeRaw, 10) : 300;
  const format: QRFormat = formatRaw === "png" ? "png" : "svg";

  try {
    const { buffer, contentType } = await generateQR(text, size, format);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (err) {
    if (err instanceof QRCodeError) {
      return NextResponse.json(
        { error: err.message, hint: err.hint },
        { status: 502 }
      );
    }
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "QR generation failed", details: message },
      { status: 500 }
    );
  }
}
