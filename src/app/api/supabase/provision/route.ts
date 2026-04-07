import { NextRequest, NextResponse } from "next/server";
import {
  isConfigured,
  provisionFullStack,
  type SchemaSpec,
  type AuthProvider,
  type ProvisionerError,
} from "@/lib/supabase-provisioner";

export const runtime = "nodejs";

interface ProvisionBody {
  name?: unknown;
  region?: unknown;
  schema?: unknown;
  auth?: unknown;
  buckets?: unknown;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isConfigured()) {
    return NextResponse.json(
      {
        error: "Supabase integration not configured",
        endpoint: "env",
        hint: "Set SUPABASE_ACCESS_TOKEN and SUPABASE_ORG_ID in Vercel env vars.",
      },
      { status: 503 }
    );
  }

  let body: ProvisionBody;
  try {
    body = (await req.json()) as ProvisionBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", endpoint: "POST /api/supabase/provision" },
      { status: 400 }
    );
  }

  if (!body.name || typeof body.name !== "string") {
    return NextResponse.json(
      { error: "name is required (string)", endpoint: "POST /api/supabase/provision" },
      { status: 400 }
    );
  }

  try {
    const result = await provisionFullStack({
      name: body.name,
      region: typeof body.region === "string" ? body.region : undefined,
      schema:
        body.schema && typeof body.schema === "object"
          ? (body.schema as SchemaSpec)
          : undefined,
      auth: Array.isArray(body.auth) ? (body.auth as AuthProvider[]) : undefined,
      buckets: Array.isArray(body.buckets)
        ? (body.buckets as { name: string; public?: boolean }[])
        : undefined,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const e = err as ProvisionerError;
    const status = typeof e.status === "number" && e.status >= 400 ? e.status : 500;
    return NextResponse.json(
      {
        error: e.message ?? "Provisioning failed",
        endpoint: e.endpoint ?? "unknown",
        status: e.status ?? status,
        body: e.body ?? null,
      },
      { status }
    );
  }
}
