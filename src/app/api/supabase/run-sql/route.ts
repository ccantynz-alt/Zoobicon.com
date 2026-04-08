import { NextRequest, NextResponse } from "next/server";
import { isConfigured, runSql, type ProvisionerError } from "@/lib/supabase-provisioner";

export const runtime = "nodejs";

interface RunSqlBody {
  projectRef?: unknown;
  sql?: unknown;
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

  let body: RunSqlBody;
  try {
    body = (await req.json()) as RunSqlBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", endpoint: "POST /api/supabase/run-sql" },
      { status: 400 }
    );
  }

  if (typeof body.projectRef !== "string" || !body.projectRef) {
    return NextResponse.json(
      { error: "projectRef is required (string)", endpoint: "POST /api/supabase/run-sql" },
      { status: 400 }
    );
  }
  if (typeof body.sql !== "string" || !body.sql) {
    return NextResponse.json(
      { error: "sql is required (string)", endpoint: "POST /api/supabase/run-sql" },
      { status: 400 }
    );
  }

  try {
    const rows = await runSql(body.projectRef, body.sql);
    return NextResponse.json({ ok: true, rows });
  } catch (err) {
    const e = err as ProvisionerError;
    const status = typeof e.status === "number" && e.status >= 400 ? e.status : 500;
    return NextResponse.json(
      {
        error: e.message ?? "SQL execution failed",
        endpoint: e.endpoint ?? "unknown",
        status: e.status ?? status,
        body: e.body ?? null,
      },
      { status }
    );
  }
}
