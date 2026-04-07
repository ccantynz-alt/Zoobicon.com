import { NextRequest, NextResponse } from "next/server";
import { atsScore, extractKeywords, MissingApiKeyError, Resume } from "@/lib/resume-builder";

export const runtime = "nodejs";

interface AtsBody {
  resume: Resume;
  jobDescription: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as AtsBody;
    if (!body || !body.resume || !body.jobDescription) {
      return NextResponse.json(
        { error: "resume and jobDescription are required" },
        { status: 400 }
      );
    }
    const keywords = await extractKeywords(body.jobDescription);
    const score = await atsScore(body.resume, body.jobDescription);
    return NextResponse.json({ score, keywords });
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
