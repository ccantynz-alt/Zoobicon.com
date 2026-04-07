import { NextRequest, NextResponse } from "next/server";
import { recolorImage } from "@/lib/image-editor";

export const runtime = "nodejs";

interface RecolorBody {
  url?: string;
  palette?: unknown;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: RecolorBody;
  try {
    body = (await req.json()) as RecolorBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }
  const url = typeof body.url === "string" ? body.url : "";
  const palette: string[] = Array.isArray(body.palette)
    ? body.palette.filter((c): c is string => typeof c === "string")
    : [];
  if (!url || palette.length === 0) {
    return NextResponse.json(
      { ok: false, error: "url and non-empty palette[] are required" },
      { status: 400 }
    );
  }
  const result = await recolorImage(url, palette);
  return NextResponse.json(result, { status: result.ok ? 200 : result.status ?? 500 });
}
