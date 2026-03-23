import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { logAudit } from "@/lib/audit";

/**
 * GDPR Article 15 — Right of Access
 * Exports all user data as a downloadable JSON file.
 */
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email query parameter is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Gather all user data in parallel
    const [
      users,
      sites,
      projects,
      auditLogs,
      agencyGenerations,
    ] = await Promise.all([
      sql`SELECT id, email, name, role, plan, auth_provider, created_at, updated_at
          FROM users WHERE email = ${normalizedEmail} LIMIT 1`.catch(() => []),
      sql`SELECT id, name, slug, plan, status, settings, created_at, updated_at
          FROM sites WHERE email = ${normalizedEmail}
          ORDER BY created_at DESC`.catch(() => []),
      sql`SELECT id, name, prompt, template, created_at, updated_at
          FROM projects WHERE user_email = ${normalizedEmail}
          ORDER BY created_at DESC`.catch(() => []),
      sql`SELECT id, action, ip, metadata, created_at
          FROM audit_log WHERE email = ${normalizedEmail}
          ORDER BY created_at DESC`.catch(() => []),
      sql`SELECT id, agency_id, generator_type, period, created_at
          FROM agency_generations WHERE user_email = ${normalizedEmail}
          ORDER BY created_at DESC`.catch(() => []),
    ]);

    // Fetch deployments for user's sites
    const siteIds = sites.map((s: { id: string }) => s.id);
    let deployments: unknown[] = [];
    if (siteIds.length > 0) {
      try {
        deployments = await sql`
          SELECT d.id, d.site_id, d.environment, d.status, d.url, d.size,
                 d.commit_message, d.created_at
          FROM deployments d
          WHERE d.site_id = ANY(${siteIds}::uuid[])
          ORDER BY d.created_at DESC
        `;
      } catch {
        // Deployments query may fail if no sites exist
      }
    }

    // Fetch consent data if table exists
    let consents: unknown[] = [];
    try {
      consents = await sql`
        SELECT email, analytics, marketing, necessary, updated_at
        FROM user_consents WHERE email = ${normalizedEmail} LIMIT 1
      `;
    } catch {
      // Table may not exist yet
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      email: normalizedEmail,
      profile: users[0] || null,
      sites,
      deployments,
      projects,
      auditLog: auditLogs,
      agencyGenerations,
      consents: consents[0] || null,
    };

    // Log the export action (fire-and-forget)
    logAudit({
      action: "data_export",
      email: normalizedEmail,
      ip,
      metadata: {
        sitesCount: sites.length,
        projectsCount: projects.length,
        deploymentsCount: deployments.length,
      },
    }).catch(() => {});

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="zoobicon-data-export-${normalizedEmail}-${Date.now()}.json"`,
      },
    });
  } catch (err) {
    console.error("Data export error:", err);
    return NextResponse.json(
      { error: "Failed to export user data" },
      { status: 500 }
    );
  }
}
