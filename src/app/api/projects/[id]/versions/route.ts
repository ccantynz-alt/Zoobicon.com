/**
 * Project versions — every save creates a snapshot.
 *
 * POST /api/projects/[id]/versions     create snapshot
 * GET  /api/projects/[id]/versions     list snapshots
 *
 * Access follows the parent project's visibility (admin_private →
 * owner-or-admin only). 404s on unauthorised reads rather than 403,
 * consistent with the parent route.
 */

import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CreateVersionBody {
  files: Record<string, string>;
  deps?: Record<string, string>;
  label?: string;
}

async function loadProject(id: string) {
  const rows = await sql`
    SELECT id, user_email, visibility, current_version
    FROM projects WHERE id = ${id} LIMIT 1
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
    SELECT id, label, version, created_at
    FROM project_versions
    WHERE project_id = ${params.id}
    ORDER BY version DESC
    LIMIT 100
  `;
  return NextResponse.json({ versions: rows });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { user } = await authenticateRequest(req);
  const project = await loadProject(params.id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canAccess(project, user.email, user.role)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: CreateVersionBody;
  try {
    body = (await req.json()) as CreateVersionBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const nextVersion = ((project.current_version as number) || 0) + 1;
  try {
    const rows = await sql`
      INSERT INTO project_versions (project_id, version, label, files, deps)
      VALUES (
        ${params.id},
        ${nextVersion},
        ${body.label || `v${nextVersion}`},
        ${JSON.stringify(body.files)}::jsonb,
        ${JSON.stringify(body.deps || {})}::jsonb
      )
      RETURNING id, version, label, created_at
    `;
    await sql`UPDATE projects SET current_version = ${nextVersion}, updated_at = NOW() WHERE id = ${params.id}`;
    return NextResponse.json({ version: rows[0] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Snapshot failed" },
      { status: 500 },
    );
  }
}
