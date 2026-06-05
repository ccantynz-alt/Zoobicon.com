/**
 * PATCH /api/crontech/update
 *
 * Re-deploys an edited project to Crontech without creating a new
 * projectId. The builder calls this when the user clicks "Deploy" and
 * a crontechProjectId is already known from the initial deploy.
 *
 * Body: { projectId: string, files: Record<string,string>, deps?: Record<string,string> }
 * Returns: { ok, status, url, mocked? }
 */

import { NextRequest, NextResponse } from "next/server";
import { patchCrontech } from "@/lib/crontech-sync";
import { authenticateRequest } from "@/lib/auth-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface UpdateBody {
  projectId: string;
  files: Record<string, string>;
  deps?: Record<string, string>;
}

export async function PATCH(req: NextRequest) {
  let body: UpdateBody;
  try {
    body = (await req.json()) as UpdateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.projectId || !body.files || Object.keys(body.files).length === 0) {
    return NextResponse.json({ error: "projectId and files required" }, { status: 400 });
  }

  await authenticateRequest(req);

  const result = await patchCrontech(body.projectId, {
    files: body.files,
    deps: body.deps,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error || "Crontech update failed" },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    status: result.status,
    url: result.url,
    projectId: result.projectId,
    mocked: result.mocked || false,
  });
}
