import { NextResponse } from "next/server";
import { enrollStudent } from "@/lib/lms-engine";

export const runtime = "nodejs";

interface EnrollBody {
  courseId?: string;
  studentId?: string;
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL is not set" }, { status: 503 });
  }
  let body: EnrollBody;
  try {
    body = (await req.json()) as EnrollBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.courseId || !body.studentId) {
    return NextResponse.json({ error: "Missing courseId or studentId" }, { status: 400 });
  }
  try {
    const enrollment = await enrollStudent(body.courseId, body.studentId);
    return NextResponse.json({ enrollment });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
