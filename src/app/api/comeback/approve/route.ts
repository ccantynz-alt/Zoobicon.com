import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Action = "approve" | "reject" | "edit";

interface Body {
  draftId?: string;
  action?: Action;
  content?: string;
  userId?: string;
}

async function ensureTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS comeback_approvals (
      id         TEXT PRIMARY KEY,
      draft_id   TEXT NOT NULL,
      user_id    TEXT,
      action     TEXT NOT NULL,
      content    TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "DATABASE_URL not set" },
      { status: 503 }
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { draftId, action, content, userId } = body;
  if (!draftId || typeof draftId !== "string") {
    return NextResponse.json(
      { error: "draftId is required" },
      { status: 400 }
    );
  }
  if (action !== "approve" && action !== "reject" && action !== "edit") {
    return NextResponse.json(
      { error: "action must be approve | reject | edit" },
      { status: 400 }
    );
  }
  if (action === "edit" && (!content || typeof content !== "string")) {
    return NextResponse.json(
      { error: "content is required when action is edit" },
      { status: 400 }
    );
  }

  try {
    await ensureTable();

    const id = `cba_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    await sql`
      INSERT INTO comeback_approvals (id, draft_id, user_id, action, content)
      VALUES (${id}, ${draftId}, ${userId ?? null}, ${action}, ${content ?? null})
    `;

    let publishResult: unknown = null;
    if (action === "approve") {
      try {
        const mod = (await import("@/lib/blog-generator")) as {
          publishDraft: (
            draftId: string,
            opts?: { content?: string }
          ) => Promise<unknown>;
        };
        publishResult = await mod.publishDraft(draftId, {
          content: content,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json(
          {
            ok: false,
            error: `Approval logged but publish failed: ${message}`,
            approvalId: id,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      ok: true,
      approvalId: id,
      action,
      publishResult,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: `Approval failed: ${message}` },
      { status: 500 }
    );
  }
}
