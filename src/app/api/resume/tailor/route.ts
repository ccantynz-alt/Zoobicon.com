import { NextRequest, NextResponse } from "next/server";
import { tailorResume, MissingApiKeyError, Resume } from "@/lib/resume-builder";

export const runtime = "nodejs";

interface TailorBody {
  resume: Resume;
  jobDescription: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as TailorBody;
    if (!body || !body.resume || !body.jobDescription) {
      return NextResponse.json(
        { error: "resume and jobDescription are required" },
        { status: 400 }
      );
    }
    const tailored = await tailorResume(body.resume, body.jobDescription);
    return NextResponse.json({ resume: tailored });
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
