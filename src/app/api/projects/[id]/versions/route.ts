import { NextRequest } from "next/server";
import { sql } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const versions = await sql`
      SELECT id, version, label, created_at
      FROM project_versions
      WHERE project_id = ${id}
      ORDER BY version ASC
    `;
    return Response.json({ versions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "DB error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { files, deps, label } = await req.json();

    // Get next version number
    const [{ max }] = await sql`SELECT COALESCE(MAX(version), 0) as max FROM project_versions WHERE project_id = ${id}`;
    const nextVersion = (max || 0) + 1;

    const [version] = await sql`
      INSERT INTO project_versions (project_id, version, files, deps, label)
      VALUES (${id}, ${nextVersion}, ${JSON.stringify(files)}, ${JSON.stringify(deps || {})}, ${label || ''})
      RETURNING id, version, label, created_at
    `;

    // Update project's current version
    await sql`UPDATE projects SET current_version = ${nextVersion}, files = ${JSON.stringify(files)}, deps = ${JSON.stringify(deps || {})}, updated_at = NOW() WHERE id = ${id}`;

    return Response.json({ version });
  } catch (err) {
    const message = err instanceof Error ? err.message : "DB error";
    return Response.json({ error: message }, { status: 500 });
  }
}
