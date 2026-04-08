import { NextResponse } from "next/server";
import { isConfigured, listProjects, type ProvisionerError } from "@/lib/supabase-provisioner";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
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
  try {
    const projects = await listProjects();
    return NextResponse.json({ ok: true, projects });
  } catch (err) {
    const e = err as ProvisionerError;
    const status = typeof e.status === "number" && e.status >= 400 ? e.status : 500;
    return NextResponse.json(
      {
        error: e.message ?? "List failed",
        endpoint: e.endpoint ?? "unknown",
        status: e.status ?? status,
        body: e.body ?? null,
      },
      { status }
    );
  }
}
