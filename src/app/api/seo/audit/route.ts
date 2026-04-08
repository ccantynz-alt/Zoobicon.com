import { NextRequest, NextResponse } from "next/server";
import { auditSite } from "@/lib/seo-agent";

export const maxDuration = 30;

function validateUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const url = validateUrl(body?.url);
    if (!url) {
      return NextResponse.json({ ok: false, error: "Invalid or missing url" }, { status: 400 });
    }
    const audit = await auditSite({ url, options: body?.options });
    return NextResponse.json({ ok: true, audit });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = validateUrl(req.nextUrl.searchParams.get("url"));
    if (!url) {
      return NextResponse.json({ ok: false, error: "Invalid or missing url query param" }, { status: 400 });
    }
    const audit = await auditSite({ url });
    return NextResponse.json({ ok: true, audit });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
