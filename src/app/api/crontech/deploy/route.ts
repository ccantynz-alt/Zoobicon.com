/**
 * POST /api/crontech/deploy
 *
 * The Deploy button in the AI Builder calls this. Loads the project
 * from the projects table, then hands the file tree off to Crontech
 * via src/lib/crontech-sync.ts.
 *
 * Body: { projectId: string }
 * Returns: { ok, url, status, mocked? }
 *
 * Auth: caller must own the project OR be admin. Anonymous + non-owner
 * gets 404 (consistent with /api/projects/[id]).
 */

import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth-guard";
import { pushToCrontech, crontechAvailable } from "@/lib/crontech-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface DeployBody {
  // Either supply projectId (DB-backed) or inline name+files (anonymous).
  projectId?: string;
  name?: string;
  files?: Record<string, string>;
  deps?: Record<string, string>;
  prompt?: string;
  template?: string | null;
}

export async function POST(req: NextRequest) {
  let body: DeployBody;
  try {
    body = (await req.json()) as DeployBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { user } = await authenticateRequest(req);

  let pushPayload: Parameters<typeof pushToCrontech>[0];

  if (body.projectId) {
    // DB-backed path — load + visibility/ownership check.
    const rows = await sql`
      SELECT id, name, user_email, files, deps, prompt, template, visibility
      FROM projects WHERE id = ${body.projectId} LIMIT 1
    `;
    const project = rows[0];
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isOwner = project.user_email === user.email;
    const isAdmin = user.role === "admin";
    if (project.visibility === "admin_private" && !isOwner && !isAdmin) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Not authorised" }, { status: 403 });
    }

    pushPayload = {
      name: (project.name as string) || `project-${project.id}`,
      files: (project.files as Record<string, string>) || {},
      deps: (project.deps as Record<string, string>) || {},
      meta: {
        createdBy: project.user_email as string,
        prompt: (project.prompt as string) || "",
        template: (project.template as string) || null,
        visibility: (project.visibility as "public" | "admin_private") || "public",
      },
    };
  } else {
    // Anonymous / unsaved path — inline files. No DB persistence, just
    // a direct hand-off so quick previews can be deployed without
    // creating a Zoobicon account first.
    if (!body.files || Object.keys(body.files).length === 0) {
      return NextResponse.json({ error: "files (or projectId) required" }, { status: 400 });
    }
    pushPayload = {
      name: body.name || "untitled",
      files: body.files,
      deps: body.deps || {},
      meta: {
        createdBy: user.email,
        prompt: body.prompt || "",
        template: body.template || null,
        visibility: "public",
      },
    };
  }

  const result = await pushToCrontech(pushPayload);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error || "Crontech deploy failed", available: crontechAvailable() },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    url: result.url,
    status: result.status,
    projectId: result.projectId,
    mocked: result.mocked || false,
  });
}
