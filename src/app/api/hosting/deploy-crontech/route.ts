import { NextRequest } from "next/server";
import { deployToCrontech, isCrontechEnabled } from "@/lib/crontech-adapter";

/**
 * POST /api/hosting/deploy-crontech
 *
 * Deploys a generated site to CronTech.
 * Requires CRONTECH_API_URL + CRONTECH_API_KEY in environment.
 *
 * Body: {
 *   name: string          // site/project name
 *   code: string          // built HTML (or entry file content)
 *   files?: Record<string, string>  // full file map for React apps
 *   dependencies?: Record<string, string>
 *   email?: string        // owner email for project association
 * }
 *
 * Returns: { url, slug, deployTimeMs }
 */
export async function POST(req: NextRequest) {
  if (!isCrontechEnabled()) {
    return Response.json(
      {
        error: "CronTech is not configured. Add CRONTECH_API_URL and CRONTECH_API_KEY to your Vercel environment variables.",
        setup: "Contact Craig for CronTech credentials.",
      },
      { status: 503 }
    );
  }

  let body: {
    name?: string;
    code?: string;
    files?: Record<string, string>;
    dependencies?: Record<string, string>;
    email?: string;
  };

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.name?.trim()) {
    return Response.json({ error: "Site name is required." }, { status: 400 });
  }

  if (!body.code && (!body.files || Object.keys(body.files).length === 0)) {
    return Response.json({ error: "Either code or files is required." }, { status: 400 });
  }

  const slug = body.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  // Build file map — for HTML deploys, wrap in index.html
  const files: Record<string, string> = body.files ?? {};
  if (!body.files && body.code) {
    files["index.html"] = body.code;
  }

  try {
    const result = await deployToCrontech({
      projectId: slug,
      files,
      dependencies: body.dependencies ?? {},
      envVars: {},
    });

    return Response.json({
      url: result.url,
      slug,
      deployId: result.deployId,
      deployTimeMs: result.durationMs,
      logs: result.logs,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "CronTech deploy failed";
    return Response.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/hosting/deploy-crontech
 * Returns whether CronTech is configured and available.
 */
export async function GET() {
  return Response.json({
    available: isCrontechEnabled(),
    provider: "crontech",
  });
}
