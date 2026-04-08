import { NextRequest, NextResponse } from "next/server";
import {
  deployToVercel,
  isVercelConfigured,
  type VercelDeployRequest,
} from "@/lib/vercel-deploy";

export const maxDuration = 300;
export const runtime = "nodejs";

interface DeployBody {
  projectName?: unknown;
  files?: unknown;
  framework?: unknown;
  envVars?: unknown;
}

function isStringRecord(v: unknown): v is Record<string, string> {
  if (typeof v !== "object" || v === null) return false;
  for (const val of Object.values(v as Record<string, unknown>)) {
    if (typeof val !== "string") return false;
  }
  return true;
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ ok: true, available: isVercelConfigured() });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: DeployBody;
  try {
    body = (await request.json()) as DeployBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  if (typeof body.projectName !== "string" || body.projectName.trim() === "") {
    return NextResponse.json(
      { ok: false, error: "projectName is required." },
      { status: 400 }
    );
  }
  if (!isStringRecord(body.files) || Object.keys(body.files).length === 0) {
    return NextResponse.json(
      { ok: false, error: "files must be a non-empty object of path -> content strings." },
      { status: 400 }
    );
  }
  const framework = body.framework;
  if (
    framework !== undefined &&
    framework !== "nextjs" &&
    framework !== "vite" &&
    framework !== "static"
  ) {
    return NextResponse.json(
      { ok: false, error: "framework must be one of: nextjs, vite, static." },
      { status: 400 }
    );
  }
  let envVars: Record<string, string> | undefined;
  if (body.envVars !== undefined) {
    if (!isStringRecord(body.envVars)) {
      return NextResponse.json(
        { ok: false, error: "envVars must be an object of string -> string." },
        { status: 400 }
      );
    }
    envVars = body.envVars;
  }

  const req: VercelDeployRequest = {
    projectName: body.projectName,
    files: body.files,
    framework,
    envVars,
  };

  try {
    const result = await deployToVercel(req);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Vercel deployment failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
