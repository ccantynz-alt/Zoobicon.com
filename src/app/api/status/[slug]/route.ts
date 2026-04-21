import { NextRequest, NextResponse } from "next/server";
import { getPageData } from "@/lib/status-page";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
): Promise<NextResponse> {
  try {
    const data = await getPageData(params.slug);
    if (!data) {
      return NextResponse.json({ error: "not found" }, { status: 404, headers: CORS_HEADERS });
    }
    return NextResponse.json(data, { headers: CORS_HEADERS });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
