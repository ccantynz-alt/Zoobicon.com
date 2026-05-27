/**
 * POST /api/builds/validate
 *
 * Smoke-checks a generated file tree BEFORE the client tries to
 * render it in the preview. Returns structured issues the builder
 * UI can show without scrolling through Sandpack's error overlay or
 * waiting 30s for a TIME_OUT.
 *
 * Body: { files: Record<string, string> }
 * Returns: BuildValidationResult — see src/lib/build-validator.ts
 *
 * This is the cheap, dep-free Phase 1 of the smoke check Craig asked
 * for. Phase 2 layers real Chrome (Browserless.io or self-hosted
 * Playwright) on top to also catch runtime exceptions + paint errors.
 * The two layers compose — validator runs first (cheap, fast), real
 * Chrome runs second only if needed.
 */

import { NextRequest, NextResponse } from "next/server";
import { validateBuild } from "@/lib/build-validator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

interface RequestBody {
  files?: Record<string, string>;
}

export async function POST(req: NextRequest) {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON. Expected { files: Record<string, string> }" },
      { status: 400 },
    );
  }

  if (!body.files || typeof body.files !== "object") {
    return NextResponse.json(
      { error: "files is required (object of path → content)" },
      { status: 400 },
    );
  }

  const fileCount = Object.keys(body.files).length;
  if (fileCount === 0) {
    return NextResponse.json(
      { error: "files is empty — nothing to validate" },
      { status: 400 },
    );
  }
  if (fileCount > 200) {
    return NextResponse.json(
      { error: `Too many files (${fileCount} > 200 cap)` },
      { status: 413 },
    );
  }

  try {
    const result = validateBuild(body.files);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "validator crashed";
    console.error("[builds/validate] unexpected:", message);
    return NextResponse.json(
      { error: `Validator crashed: ${message}` },
      { status: 500 },
    );
  }
}
