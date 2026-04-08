import { NextRequest, NextResponse } from "next/server";
import { listTemplates, getTemplate } from "@/lib/template-marketplace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (id) {
      const tpl = await getTemplate(id);
      if (!tpl) return NextResponse.json({ error: "not_found" }, { status: 404 });
      return NextResponse.json({ template: tpl });
    }
    const category = searchParams.get("category") ?? undefined;
    const search = searchParams.get("search") ?? undefined;
    const sortByRaw = searchParams.get("sortBy") ?? undefined;
    const sortBy =
      sortByRaw === "newest" || sortByRaw === "rating" || sortByRaw === "price" || sortByRaw === "popular"
        ? sortByRaw
        : undefined;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;
    const offset = searchParams.get("offset") ? Number(searchParams.get("offset")) : undefined;
    const templates = await listTemplates({ category, search, sortBy, limit, offset });
    return NextResponse.json({ templates });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
