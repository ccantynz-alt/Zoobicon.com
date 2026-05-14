/**
 * POST /api/flywheel/capture — append flywheel events.
 *
 * KILLER-MOVES-BUILDER.md #B26b. Builder UI calls this in the
 * background as the user types, picks components, pauses on preview,
 * deploys, etc. Server appends each event to flywheel_events for
 * later consolidation into intelligence the flywheel can act on.
 *
 * Events arrive in batches to avoid per-keystroke round trips. The
 * client buffers 1-50 events client-side and flushes on a 2s timer
 * or before navigation.
 *
 * No auth required — anonymous users contribute to the cross-customer
 * pattern bank. Authenticated users' events are tagged with their
 * email so their personal flywheel context can use them later.
 *
 * Cost: pure DB insert, no AI. Fast.
 */

import { NextRequest } from "next/server";
import { captureBatch } from "@/lib/flywheel/events";
import type { FlywheelEvent } from "@/lib/flywheel/events";

export const runtime = "edge";

interface RequestBody {
  events?: Array<{
    buildId?: string;
    sessionId?: string;
    type?: string;
    payload?: Record<string, unknown>;
  }>;
}

const ALLOWED_TYPES = new Set([
  "prompt_typing",
  "prompt_submit",
  "components_picked",
  "build_complete",
  "build_failed",
  "edit_request",
  "edit_complete",
  "preview_dwell",
  "regenerate",
  "deploy",
]);

export async function POST(req: NextRequest): Promise<Response> {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.events || !Array.isArray(body.events) || body.events.length === 0) {
    return Response.json({ error: "events array required" }, { status: 400 });
  }

  // Cap batch size to prevent abuse.
  const events = body.events.slice(0, 200);

  // Validate + normalise each event. Skip malformed ones rather than
  // failing the whole batch — we'd rather capture partial data than
  // none.
  const userEmail = req.headers.get("x-user-email") || null;
  const valid: FlywheelEvent[] = [];
  let skipped = 0;
  for (const e of events) {
    if (!e || typeof e !== "object") {
      skipped++;
      continue;
    }
    if (!e.buildId || typeof e.buildId !== "string") {
      skipped++;
      continue;
    }
    if (!e.type || !ALLOWED_TYPES.has(e.type)) {
      skipped++;
      continue;
    }
    valid.push({
      buildId: e.buildId.slice(0, 100),
      sessionId: typeof e.sessionId === "string" ? e.sessionId.slice(0, 100) : undefined,
      userEmail,
      type: e.type as FlywheelEvent["type"],
      payload: (typeof e.payload === "object" && e.payload !== null) ? e.payload : {},
    });
  }

  if (valid.length > 0) {
    await captureBatch(valid);
  }

  return Response.json({ accepted: valid.length, skipped });
}

export async function GET(): Promise<Response> {
  return Response.json({
    name: "Flywheel event capture",
    method: "POST",
    body: { events: "[{ buildId, sessionId?, type, payload }]" },
    allowedTypes: Array.from(ALLOWED_TYPES),
    maxBatchSize: 200,
  });
}
