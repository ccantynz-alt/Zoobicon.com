/**
 * Projects — minimal store for the AI Builder.
 *
 * GET    /api/projects?email=&includePrivate=1  list (admin gets private when includePrivate=1)
 * POST   /api/projects                           create
 *
 * Per-project ops live under /api/projects/[id]/.
 *
 * Rule 31 — auth delegated to Crontech SSO. `visibility` is admin-only;
 * defaults to 'public' for everyone else.
 */

import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth-guard";
import { visibilityForRequest, type Visibility } from "@/lib/visibility";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CreateBody {
  name: string;
  email?: string;
  prompt?: string;
  code?: string;
  template?: string;
  visibility?: Visibility;
}

export async function GET(req: NextRequest) {
  const { user } = await authenticateRequest(req);
  const url = new URL(req.url);
  const email = url.searchParams.get("email") || user.email;
  const wantPrivate = url.searchParams.get("includePrivate") === "1";
  const includePrivate = wantPrivate && user.role === "admin";

  try {
    const rows = includePrivate
      ? await sql`
          SELECT id, name, prompt, template, visibility, created_at, updated_at
          FROM projects
          WHERE user_email = ${email}
          ORDER BY updated_at DESC
          LIMIT 200
        `
      : await sql`
          SELECT id, name, prompt, template, visibility, created_at, updated_at
          FROM projects
          WHERE user_email = ${email} AND visibility = 'public'
          ORDER BY updated_at DESC
          LIMIT 200
        `;
    return NextResponse.json({ projects: rows });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to list projects" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const { user } = await authenticateRequest(req);
  const email = body.email || user.email;
  const visibility = await visibilityForRequest(req, body.visibility);

  try {
    const rows = await sql`
      INSERT INTO projects (user_email, name, prompt, code, template, visibility)
      VALUES (${email}, ${body.name}, ${body.prompt || ""}, ${body.code || ""}, ${body.template || null}, ${visibility})
      RETURNING id, name, visibility, created_at
    `;
    return NextResponse.json(rows[0]);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create project" },
      { status: 500 },
    );
  }
}
