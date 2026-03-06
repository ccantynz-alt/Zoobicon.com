import { NextRequest } from "next/server";
import { sql } from "@/lib/db";

/** PATCH /api/projects/[id] — update a project */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name, prompt, code } = await request.json();
    const updates: Record<string, string> = {};
    if (name !== undefined) updates.name = name;
    if (prompt !== undefined) updates.prompt = prompt;
    if (code !== undefined) updates.code = code;

    if (Object.keys(updates).length === 0) {
      return Response.json({ error: "Nothing to update" }, { status: 400 });
    }

    const [row] = await sql`
      UPDATE projects
      SET
        name       = COALESCE(${updates.name ?? null}, name),
        prompt     = COALESCE(${updates.prompt ?? null}, prompt),
        code       = COALESCE(${updates.code ?? null}, code),
        updated_at = NOW()
      WHERE id = ${params.id}
      RETURNING *
    `;

    if (!row) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    return Response.json({ project: row });
  } catch (err) {
    const message = err instanceof Error ? err.message : "DB error";
    return Response.json({ error: message }, { status: 500 });
  }
}

/** DELETE /api/projects/[id] — delete a project */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [row] = await sql`
      DELETE FROM projects WHERE id = ${params.id} RETURNING id
    `;
    if (!row) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "DB error";
    return Response.json({ error: message }, { status: 500 });
  }
}
