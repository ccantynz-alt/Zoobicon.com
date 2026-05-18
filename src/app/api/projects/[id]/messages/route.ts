/**
 * Project messages — chat log per project (ChatPanel persistence).
 *
 * POST /api/projects/[id]/messages   append message
 * GET  /api/projects/[id]/messages   list messages
 *
 * Same visibility gate as the parent project.
 */

import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CreateMessageBody {
  role: string;
  content: string;
  status?: string;
  changedFiles?: string[];
  durationMs?: number;
}

async function loadProject(id: string) {
  const rows = await sql`
    SELECT id, user_email, visibility FROM projects WHERE id = ${id} LIMIT 1
  `;
  return rows[0] || null;
}

function canAccess(project: Record<string, unknown>, userEmail: string, role: string): boolean {
  if (project.visibility === "public") return true;
  if (project.user_email === userEmail) return true;
  if (role === "admin") return true;
  return false;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { user } = await authenticateRequest(req);
  const project = await loadProject(params.id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canAccess(project, user.email, user.role)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const rows = await sql`
    SELECT id, role, content, status, changed_files, duration_ms, created_at
    FROM project_messages
    WHERE project_id = ${params.id}
    ORDER BY created_at ASC
    LIMIT 500
  `;
  return NextResponse.json({ messages: rows });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { user } = await authenticateRequest(req);
  const project = await loadProject(params.id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canAccess(project, user.email, user.role)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: CreateMessageBody;
  try {
    body = (await req.json()) as CreateMessageBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const rows = await sql`
      INSERT INTO project_messages (project_id, role, content, status, changed_files, duration_ms)
      VALUES (
        ${params.id},
        ${body.role},
        ${body.content || ""},
        ${body.status || "complete"},
        ${body.changedFiles || []},
        ${body.durationMs || null}
      )
      RETURNING id, created_at
    `;
    return NextResponse.json({ message: rows[0] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Insert failed" },
      { status: 500 },
    );
  }
}
