/**
 * Per-project ops.
 *
 * GET    /api/projects/[id]    → single project (with files + deps)
 * PATCH  /api/projects/[id]    → update code/files/visibility
 * DELETE /api/projects/[id]    → delete
 *
 * Visibility rule: a project tagged 'admin_private' is only readable
 * (and mutable) by the owner OR an admin. Anyone else hitting it gets a
 * 404 (not a 403 — we don't leak existence).
 */

import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth-guard";
import type { Visibility } from "@/lib/visibility";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PatchBody {
  name?: string;
  code?: string;
  files?: Record<string, string>;
  deps?: Record<string, string>;
  template?: string;
  visibility?: Visibility;
}

async function load(id: string) {
  const rows = await sql`
    SELECT id, user_email, name, prompt, code, files, deps, template, visibility, created_at, updated_at
    FROM projects
    WHERE id = ${id}
    LIMIT 1
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
  const project = await load(params.id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canAccess(project, user.email, user.role)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ project });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { user } = await authenticateRequest(req);
  const project = await load(params.id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canAccess(project, user.email, user.role)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Visibility flip requires admin.
  if (body.visibility && body.visibility !== project.visibility && user.role !== "admin") {
    return NextResponse.json({ error: "Admin required to change visibility" }, { status: 403 });
  }

  try {
    // Build a single update touching only provided fields. Neon's
    // tagged-template driver doesn't have a column-builder, so we run
    // narrow updates per field instead of one mega-SQL.
    if (body.name !== undefined) {
      await sql`UPDATE projects SET name = ${body.name}, updated_at = NOW() WHERE id = ${params.id}`;
    }
    if (body.code !== undefined) {
      await sql`UPDATE projects SET code = ${body.code}, updated_at = NOW() WHERE id = ${params.id}`;
    }
    if (body.files !== undefined) {
      await sql`UPDATE projects SET files = ${JSON.stringify(body.files)}::jsonb, updated_at = NOW() WHERE id = ${params.id}`;
    }
    if (body.deps !== undefined) {
      await sql`UPDATE projects SET deps = ${JSON.stringify(body.deps)}::jsonb, updated_at = NOW() WHERE id = ${params.id}`;
    }
    if (body.template !== undefined) {
      await sql`UPDATE projects SET template = ${body.template}, updated_at = NOW() WHERE id = ${params.id}`;
    }
    if (body.visibility !== undefined) {
      await sql`UPDATE projects SET visibility = ${body.visibility}, updated_at = NOW() WHERE id = ${params.id}`;
    }
    const updated = await load(params.id);
    return NextResponse.json({ project: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { user } = await authenticateRequest(req);
  const project = await load(params.id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canAccess(project, user.email, user.role)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    await sql`DELETE FROM projects WHERE id = ${params.id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Delete failed" },
      { status: 500 },
    );
  }
}
