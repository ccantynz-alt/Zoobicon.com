import { NextRequest, NextResponse } from "next/server";
import { submitForm } from "@/lib/form-builder";

export const runtime = "nodejs";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    const data = (await req.json()) as Record<string, unknown>;
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip");
    const ua = req.headers.get("user-agent");
    const submission = await submitForm(params.formId, data, { ip, ua });
    return NextResponse.json(
      { ok: true, id: submission.id },
      { headers: CORS }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 400, headers: CORS }
    );
  }
}
