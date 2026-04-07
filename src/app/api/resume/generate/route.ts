import { NextRequest, NextResponse } from "next/server";
import { generateResume, MissingApiKeyError, ResumeInput } from "@/lib/resume-builder";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as ResumeInput;
    if (!body || !body.name || !body.title) {
      return NextResponse.json({ error: "name and title are required" }, { status: 400 });
    }
    const resume = await generateResume(body);
    return NextResponse.json({ resume });
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
