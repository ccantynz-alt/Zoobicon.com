import { NextRequest, NextResponse } from "next/server";
import { validateCode, type Language } from "@/lib/code-formatter";

export const runtime = "nodejs";

interface ValidateBody {
  code?: string;
  language?: Language;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: ValidateBody;
  try {
    body = (await req.json()) as ValidateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.code !== "string" || !body.language) {
    return NextResponse.json(
      { error: "Provide { code, language }" },
      { status: 400 }
    );
  }

  try {
    const result = validateCode(body.code, body.language);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Validation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
