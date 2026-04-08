import { NextResponse } from "next/server";
import { issueCertificate } from "@/lib/lms-engine";

export const runtime = "nodejs";

interface CertBody {
  enrollmentId?: string;
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL is not set" }, { status: 503 });
  }
  let body: CertBody;
  try {
    body = (await req.json()) as CertBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.enrollmentId) {
    return NextResponse.json({ error: "Missing enrollmentId" }, { status: 400 });
  }
  try {
    const certificate = await issueCertificate(body.enrollmentId);
    return NextResponse.json({ certificate });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
