import { NextRequest } from "next/server";
import { sql } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; versionId: string }> }) {
  const { id, versionId } = await params;
  try {
    const [version] = await sql`
      SELECT id, version, files, deps, label, created_at
      FROM project_versions
      WHERE id = ${versionId} AND project_id = ${id}
    `;
    if (!version) return Response.json({ error: "Version not found" }, { status: 404 });
    return Response.json({ version });
  } catch (err) {
    const message = err instanceof Error ? err.message : "DB error";
    return Response.json({ error: message }, { status: 500 });
  }
}
