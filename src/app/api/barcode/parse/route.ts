import { NextResponse } from "next/server";
import { parseQrFromImage, MissingEnvError } from "@/lib/barcode";

export const runtime = "nodejs";

interface ParseBody {
  imageUrl?: unknown;
}

export async function POST(req: Request): Promise<NextResponse> {
  let body: ParseBody;
  try {
    body = (await req.json()) as ParseBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const imageUrl = body.imageUrl;
  if (typeof imageUrl !== "string" || imageUrl.length === 0) {
    return NextResponse.json(
      { error: "imageUrl (string) is required" },
      { status: 400 },
    );
  }
  try {
    const result = await parseQrFromImage(imageUrl);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    if (err instanceof MissingEnvError) {
      return NextResponse.json(
        { error: err.message, variable: err.variable },
        { status: 503 },
      );
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
