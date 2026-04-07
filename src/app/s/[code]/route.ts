import { NextRequest, NextResponse } from "next/server";
import { resolveShortLink } from "@/lib/url-shortener";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
): Promise<NextResponse> {
  const code = params?.code;
  if (!code) {
    return NextResponse.json(
      { error: "Missing short code", hint: "Use /s/<code>" },
      { status: 400 }
    );
  }

  try {
    const target = await resolveShortLink(code);
    if (!target) {
      return NextResponse.json(
        {
          error: "Short link not found",
          hint: `No short link exists for code '${code}'.`,
        },
        { status: 404 }
      );
    }
    return NextResponse.redirect(target, 302);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Failed to resolve short link", details: message },
      { status: 500 }
    );
  }
}
