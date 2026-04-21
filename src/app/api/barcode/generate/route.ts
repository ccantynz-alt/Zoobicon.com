import { NextResponse } from "next/server";
import { generateBarcode, type BarcodeType } from "@/lib/barcode";

export const runtime = "nodejs";

interface GenerateBody {
  text?: unknown;
  type?: unknown;
}

const ALLOWED: ReadonlyArray<BarcodeType> = ["code128", "ean13", "upc", "qr"];

function isBarcodeType(v: unknown): v is BarcodeType {
  return typeof v === "string" && (ALLOWED as ReadonlyArray<string>).includes(v);
}

export async function POST(req: Request): Promise<Response> {
  let body: GenerateBody;
  try {
    body = (await req.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { text, type } = body;
  if (typeof text !== "string" || text.length === 0) {
    return NextResponse.json(
      { error: "text (string) is required" },
      { status: 400 },
    );
  }
  if (!isBarcodeType(type)) {
    return NextResponse.json(
      { error: `type must be one of ${ALLOWED.join("|")}` },
      { status: 400 },
    );
  }
  try {
    const svg = generateBarcode(text, type);
    return new Response(svg, {
      status: 200,
      headers: {
        "content-type": "image/svg+xml; charset=utf-8",
        "cache-control": "public, max-age=3600",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
