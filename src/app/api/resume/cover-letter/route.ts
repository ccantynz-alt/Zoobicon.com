import { NextRequest, NextResponse } from "next/server";
import { coverLetter, MissingApiKeyError, Resume } from "@/lib/resume-builder";

export const runtime = "nodejs";

interface CoverLetterBody {
  resume: Resume;
  jobDescription: string;
  company: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as CoverLetterBody;
    if (!body || !body.resume || !body.jobDescription || !body.company) {
      return NextResponse.json(
        { error: "resume, jobDescription, and company are required" },
        { status: 400 }
      );
    }
    const letter = await coverLetter({
      resume: body.resume,
      jobDescription: body.jobDescription,
      company: body.company,
    });
    return NextResponse.json({ letter });
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
