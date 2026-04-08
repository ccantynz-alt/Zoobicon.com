import { NextResponse } from "next/server";
import { createCourse, type CourseModule } from "@/lib/lms-engine";

export const runtime = "nodejs";

interface CreateBody {
  userId?: string;
  title?: string;
  description?: string;
  modules?: CourseModule[];
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL is not set" }, { status: 503 });
  }
  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.userId || !body.title || !body.description || !Array.isArray(body.modules)) {
    return NextResponse.json(
      { error: "Missing required fields: userId, title, description, modules" },
      { status: 400 }
    );
  }
  try {
    const course = await createCourse({
      userId: body.userId,
      title: body.title,
      description: body.description,
      modules: body.modules,
    });
    return NextResponse.json({ course });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
