import { NextRequest, NextResponse } from "next/server";
import {
  createProject,
  executeSQL,
  generateClientCode,
  isSupabaseConfigured,
} from "@/lib/supabase-provision";

/**
 * POST /api/supabase/provision
 *
 * Auto-provisions a Supabase project for a generated app:
 *   1. Creates a new isolated Supabase project
 *   2. Runs the SQL schema against it
 *   3. Returns client code ready to inject into the generated app
 *
 * This is Lovable's moat — we now match it.
 *
 * Body: { appName: string, schemaSQL?: string, region?: string }
 * Returns: { project, clientCode, envVars }
 */
export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error: "Supabase integration not configured",
          hint: "Admin must set SUPABASE_ACCESS_TOKEN and SUPABASE_ORG_ID in Vercel env vars.",
        },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { appName, schemaSQL, region } = body;

    if (!appName || typeof appName !== "string") {
      return NextResponse.json(
        { error: "appName is required" },
        { status: 400 }
      );
    }

    // Step 1: Create isolated Supabase project
    const project = await createProject(appName, region || "us-east-1");

    // Step 2: Run schema SQL if provided
    if (schemaSQL && typeof schemaSQL === "string") {
      try {
        await executeSQL(project.id, schemaSQL);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Schema execution failed";
        // Project created but schema failed — return partial success
        return NextResponse.json(
          {
            project,
            warning: `Project created but schema failed: ${msg}`,
            envVars: {
              NEXT_PUBLIC_SUPABASE_URL: project.projectUrl,
              NEXT_PUBLIC_SUPABASE_ANON_KEY: project.anonKey,
            },
          },
          { status: 207 }
        );
      }
    }

    // Step 3: Generate ready-to-inject client code
    const clientCode = generateClientCode(project.projectUrl, project.anonKey);

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        projectUrl: project.projectUrl,
        region: project.region,
      },
      clientCode,
      envVars: {
        NEXT_PUBLIC_SUPABASE_URL: project.projectUrl,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: project.anonKey,
      },
      message: "Supabase project provisioned. Client code ready to inject.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Provisioning failed";
    console.error("[supabase/provision] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/supabase/provision
 * Returns whether Supabase integration is available.
 */
export async function GET() {
  return NextResponse.json({
    configured: isSupabaseConfigured(),
  });
}
