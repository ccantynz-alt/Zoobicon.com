import { NextRequest } from "next/server";
import { sql } from "@/lib/db";

/**
 * GET /api/hosting/sites/[siteId]/versions/[versionId]
 * Fetch a specific version's code for viewing or rollback.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ siteId: string; versionId: string }> }
) {
  try {
    const { siteId: slug, versionId } = await params;

    const [site] = await sql`
      SELECT id FROM sites WHERE slug = ${slug} AND status = 'active' LIMIT 1
    `;

    if (!site) {
      return Response.json({ error: "Site not found" }, { status: 404 });
    }

    const [deployment] = await sql`
      SELECT id, code, commit_message, created_at, size
      FROM deployments
      WHERE id = ${versionId} AND site_id = ${site.id} AND code IS NOT NULL
      LIMIT 1
    `;

    if (!deployment) {
      return Response.json({ error: "Version not found" }, { status: 404 });
    }

    return Response.json({
      version: {
        id: deployment.id,
        code: deployment.code,
        message: deployment.commit_message,
        deployedAt: deployment.created_at,
        size: deployment.size,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
