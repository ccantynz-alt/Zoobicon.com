import { NextRequest } from "next/server";
import { sql } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const messages = await sql`
      SELECT id, role, content, status, changed_files, duration_ms, created_at
      FROM project_messages
      WHERE project_id = ${id}
      ORDER BY created_at ASC
    `;
    return Response.json({ messages });
  } catch (err) {
    const message = err instanceof Error ? err.message : "DB error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { role, content, status, changedFiles, durationMs } = await req.json();

    const [message] = await sql`
      INSERT INTO project_messages (project_id, role, content, status, changed_files, duration_ms)
      VALUES (${id}, ${role}, ${content || ''}, ${status || 'complete'}, ${changedFiles || []}, ${durationMs || null})
      RETURNING id, role, content, status, changed_files, duration_ms, created_at
    `;

    return Response.json({ message });
  } catch (err) {
    const message = err instanceof Error ? err.message : "DB error";
    return Response.json({ error: message }, { status: 500 });
  }
}
