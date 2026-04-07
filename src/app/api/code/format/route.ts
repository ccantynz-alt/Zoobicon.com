import { NextRequest, NextResponse } from "next/server";
import { formatCode, formatProject, type Language } from "@/lib/code-formatter";

export const runtime = "nodejs";

interface FormatBody {
  code?: string;
  language?: Language;
  files?: Record<string, string>;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: FormatBody;
  try {
    body = (await req.json()) as FormatBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.files && typeof body.files === "object") {
    try {
      const formatted = await formatProject(body.files);
      return NextResponse.json({ files: formatted });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Format failed";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (typeof body.code === "string" && body.language) {
    try {
      const result = formatCode(body.code, body.language);
      return NextResponse.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Format failed";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  return NextResponse.json(
    { error: "Provide either { code, language } or { files }" },
    { status: 400 }
  );
}
