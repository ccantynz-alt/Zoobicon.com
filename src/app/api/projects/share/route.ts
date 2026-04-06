import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";

/**
 * In-memory share store — fallback when the database is unavailable.
 * TODO: Move to a persistent database table for production use.
 *
 * Schema suggestion:
 *   CREATE TABLE shared_projects (
 *     token      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *     project_id INTEGER NOT NULL REFERENCES projects(id),
 *     created_at TIMESTAMPTZ DEFAULT NOW()
 *   );
 */
const shareStore = new Map<
  string,
  { projectId: string; name: string; html: string; createdAt: number }
>();

/** POST /api/projects/share — generate a share token for a project */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, projectSlug, name, html } = body;

    // Accept either inline HTML or a project ID/slug to look up from DB
    let projectName = name || "Untitled Project";
    let projectHtml = html || "";

    // If no inline HTML provided, try to fetch from DB by ID or slug
    if (!projectHtml && (projectId || projectSlug)) {
      try {
        const identifier = projectId || projectSlug;
        const rows = await sql`
          SELECT name, code FROM projects WHERE id::text = ${identifier} OR name = ${identifier} LIMIT 1
        `;
        if (rows.length > 0) {
          projectName = rows[0].name || projectName;
          projectHtml = rows[0].code || "";
        }
      } catch {
        // DB unavailable — that's okay if html was provided inline
      }
    }

    if (!projectHtml) {
      return Response.json(
        { error: "No HTML content available to share. Provide html in the request body or a valid projectId." },
        { status: 400 }
      );
    }

    // Check if this project already has a share token (dedup by content hash)
    for (const [existingToken, entry] of shareStore.entries()) {
      if (entry.projectId === (projectId || projectSlug || "inline") && entry.html === projectHtml) {
        const shareUrl = `/shared/${existingToken}`;
        return Response.json({ token: existingToken, shareUrl, existing: true });
      }
    }

    const token = randomUUID();

    shareStore.set(token, {
      projectId: projectId || projectSlug || "inline",
      name: projectName,
      html: projectHtml,
      createdAt: Date.now(),
    });

    // Evict old entries if the store grows too large (max 500 shares in memory)
    if (shareStore.size > 500) {
      const entries = Array.from(shareStore.entries());
      entries.sort((a, b) => a[1].createdAt - b[1].createdAt);
      const removeCount = entries.length - 400;
      for (let i = 0; i < removeCount; i++) {
        shareStore.delete(entries[i][0]);
      }
    }

    const shareUrl = `/shared/${token}`;
    return Response.json({ token, shareUrl }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create share link";
    return Response.json({ error: message }, { status: 500 });
  }
}

/** GET /api/projects/share?token=... — retrieve shared project data */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return Response.json({ error: "token query param required" }, { status: 400 });
  }

  const entry = shareStore.get(token);

  if (!entry) {
    return Response.json(
      { error: "Share link not found or expired" },
      { status: 404 }
    );
  }

  return Response.json({
    name: entry.name,
    html: entry.html,
    createdAt: entry.createdAt,
  });
}
