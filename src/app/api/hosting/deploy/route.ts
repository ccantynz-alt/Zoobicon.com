import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// In-memory storage — would be backed by a database (e.g. Postgres) in prod.
// ---------------------------------------------------------------------------
export interface Deployment {
  id: string;
  siteId: string;
  environment: "production" | "staging" | "preview";
  status: "live" | "building" | "failed";
  url: string;
  size: number; // bytes
  createdAt: string;
}

const deployments = new Map<string, Deployment>();

/** Expose the store so sibling routes (sites, analytics) can read deployments. */
export { deployments };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const SITE_ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

function buildUrl(
  siteId: string,
  environment: Deployment["environment"],
  deploymentId: string
): string {
  switch (environment) {
    case "production":
      return `https://${siteId}.zoobicon.sh`;
    case "staging":
      return `https://${siteId}-staging.zoobicon.sh`;
    case "preview":
      return `https://${deploymentId}.preview.zoobicon.sh`;
  }
}

// ---------------------------------------------------------------------------
// POST /api/hosting/deploy — deploy a site
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { siteId, code, environment = "production" } = body as {
      siteId?: string;
      code?: string;
      environment?: string;
    };

    // --- Validation -----------------------------------------------------------
    if (!siteId || typeof siteId !== "string") {
      return NextResponse.json(
        { error: "siteId is required and must be a string." },
        { status: 400 }
      );
    }

    if (!SITE_ID_RE.test(siteId)) {
      return NextResponse.json(
        {
          error:
            "siteId must be alphanumeric with optional hyphens (e.g. my-site-1).",
        },
        { status: 400 }
      );
    }

    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return NextResponse.json(
        { error: "code is required and must be a non-empty string." },
        { status: 400 }
      );
    }

    const validEnvs = ["production", "staging", "preview"] as const;
    if (!validEnvs.includes(environment as (typeof validEnvs)[number])) {
      return NextResponse.json(
        {
          error: `environment must be one of: ${validEnvs.join(", ")}.`,
        },
        { status: 400 }
      );
    }

    const env = environment as Deployment["environment"];

    // --- Build deployment record ----------------------------------------------
    const deploymentId = randomUUID();
    const size = Buffer.byteLength(code, "utf-8");
    const url = buildUrl(siteId, env, deploymentId);
    const now = new Date().toISOString();

    const deployment: Deployment = {
      id: deploymentId,
      siteId,
      environment: env,
      status: "live",
      url,
      size,
      createdAt: now,
    };

    deployments.set(deploymentId, deployment);

    return NextResponse.json(
      {
        deploymentId,
        url,
        environment: env,
        status: "live",
        size,
        deployedAt: now,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
