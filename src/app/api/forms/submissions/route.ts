import { NextRequest, NextResponse } from "next/server";
import { getSubmissions } from "@/lib/form-builder";

export const runtime = "nodejs";

function isAdmin(req: NextRequest): boolean {
  if (req.headers.get("x-admin") === "1") return true;
  const auth = req.headers.get("authorization") ?? "";
  const adminKey = process.env.ADMIN_API_KEY;
  if (adminKey && auth === `Bearer ${adminKey}`) return true;
  return false;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const formId = req.nextUrl.searchParams.get("formId");
  if (!formId) {
    return NextResponse.json({ error: "formId is required" }, { status: 400 });
  }
  const limitParam = req.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Math.min(1000, Math.max(1, Number(limitParam))) : 100;
  try {
    const submissions = await getSubmissions(formId, limit);
    return NextResponse.json({ ok: true, submissions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
