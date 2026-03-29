import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { checkFeatureAccess } from "@/lib/agency-limits";

type RouteContext = { params: Promise<{ agencyId: string }> };

/**
 * POST /api/agencies/[agencyId]/bulk
 * Start a bulk generation job: { businesses: [{ name, industry, description }] }
 * Returns the jobId for polling status.
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { agencyId } = await context.params;
    const body = await req.json();
    const { businesses } = body as {
      businesses?: Array<{
        name: string;
        industry: string;
        description: string;
      }>;
    };

    if (!businesses || !Array.isArray(businesses) || businesses.length === 0) {
      return Response.json(
        { error: "businesses array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Verify agency exists and check plan
    const [agency] = await sql`
      SELECT id, plan FROM agencies WHERE id = ${agencyId} AND status != 'deleted'
    `;
    if (!agency) {
      return Response.json({ error: "Agency not found" }, { status: 404 });
    }

    // Enforce bulk generation feature gate
    const featureCheck = checkFeatureAccess(agency.plan as string || "starter", "bulkGeneration");
    if (!featureCheck.allowed) {
      return Response.json({ error: featureCheck.reason }, { status: 403 });
    }

    // Cap bulk jobs at 50 businesses per request
    if (businesses.length > 50) {
      return Response.json(
        { error: "Maximum 50 businesses per bulk job" },
        { status: 400 }
      );
    }

    const [job] = await sql`
      INSERT INTO bulk_jobs (agency_id, status, total_count, input_data)
      VALUES (${agencyId}, 'pending', ${businesses.length}, ${JSON.stringify(businesses)}::jsonb)
      RETURNING *
    `;

    // In production, this would trigger a background worker to process each business.
    // For now, we mark the job as processing and process sequentially via a lightweight
    // background fetch to the generate endpoint. The caller should poll GET with jobId.
    processJobInBackground(job.id, agencyId, businesses).catch((err) =>
      console.error("Bulk job processing error:", err)
    );

    return Response.json({ jobId: job.id, status: "pending", totalCount: businesses.length }, { status: 201 });
  } catch (err: unknown) {
    console.error("POST /api/agencies/[agencyId]/bulk error:", err);
    return Response.json(
      { error: "Failed to start bulk job" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agencies/[agencyId]/bulk?jobId=...
 * Get bulk job status.
 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { agencyId } = await context.params;
    const jobId = req.nextUrl.searchParams.get("jobId");

    if (jobId) {
      const [job] = await sql`
        SELECT * FROM bulk_jobs
        WHERE id = ${jobId} AND agency_id = ${agencyId}
      `;
      if (!job) {
        return Response.json({ error: "Job not found" }, { status: 404 });
      }
      return Response.json({ job });
    }

    // List all jobs for the agency
    const jobs = await sql`
      SELECT id, status, total_count, completed_count, failed_count, created_at, completed_at
      FROM bulk_jobs
      WHERE agency_id = ${agencyId}
      ORDER BY created_at DESC
      LIMIT 20
    `;

    return Response.json({ jobs });
  } catch (err: unknown) {
    console.error("GET /api/agencies/[agencyId]/bulk error:", err);
    return Response.json(
      { error: "Failed to fetch bulk job" },
      { status: 500 }
    );
  }
}

/**
 * Background processor for bulk generation jobs.
 * Calls the generate API for each business, updates job status as it goes.
 */
async function processJobInBackground(
  jobId: string,
  agencyId: string,
  businesses: Array<{ name: string; industry: string; description: string }>
) {
  await sql`
    UPDATE bulk_jobs SET status = 'processing' WHERE id = ${jobId}
  `;

  const results: Array<{
    name: string;
    status: string;
    html?: string;
    error?: string;
  }> = [];

  for (const biz of businesses) {
    try {
      const prompt = `Create a professional website for ${biz.name}, a ${biz.industry} business. ${biz.description}`;

      // Use the quick generation endpoint for speed in bulk mode
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000";

      const resp = await fetch(`${baseUrl}/api/generate/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style: "modern" }),
      });

      if (resp.ok) {
        const data = await resp.json();
        results.push({
          name: biz.name,
          status: "completed",
          html: data.html || data.code || "",
        });
      } else {
        results.push({
          name: biz.name,
          status: "failed",
          error: `Generate API returned ${resp.status}`,
        });
      }
    } catch (err: unknown) {
      results.push({
        name: biz.name,
        status: "failed",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }

    // Update counts after each business
    const completedCount = results.filter((r) => r.status === "completed").length;
    const failedCount = results.filter((r) => r.status === "failed").length;

    await sql`
      UPDATE bulk_jobs SET
        completed_count = ${completedCount},
        failed_count = ${failedCount},
        results = ${JSON.stringify(results)}::jsonb
      WHERE id = ${jobId}
    `;
  }

  // Mark job as completed
  const finalStatus =
    results.every((r) => r.status === "failed") ? "failed" : "completed";

  await sql`
    UPDATE bulk_jobs SET
      status = ${finalStatus},
      completed_at = NOW()
    WHERE id = ${jobId}
  `;
}
