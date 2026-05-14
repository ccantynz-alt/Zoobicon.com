/**
 * Flywheel event capture — KILLER-MOVES-BUILDER.md #B26b.
 *
 * Captures keystroke-level user interactions across the builder so the
 * flywheel can learn from intent, not just outcomes. Where
 * successful-builds.ts stores the END-STATE of a build, this module
 * captures the JOURNEY:
 *
 *   - prompt_typing   — user is mid-typing (debounced server-side
 *                       receive every 2s, not every keystroke)
 *   - prompt_submit   — user hit Build
 *   - components_picked — planner selected component lineup
 *   - build_complete  — build finished successfully
 *   - build_failed    — build failed with reason
 *   - edit_request    — user typed a chat edit
 *   - edit_complete   — edit succeeded
 *   - preview_dwell   — user spent N seconds looking at the preview
 *                       (proxy for "did it look right")
 *   - regenerate      — user re-rolled the build (proxy for "didn't
 *                       like it")
 *   - deploy          — user deployed to *.zoobicon.sh (the strongest
 *                       success signal)
 *
 * Storage: append-only `flywheel_events` table. Best-effort writes —
 * if Neon is slow, the user's build is not blocked. A nightly
 * consolidation job (queued: not built yet) rolls events into
 * higher-level memories.
 *
 * Privacy: event captures the build_id + session_id, NOT the literal
 * user prompt. The prompt lives in builds.prompt_head (telemetry) and
 * flywheel_successful_builds.prompt_head — both subject to 500-char
 * truncation + (for cross-customer few-shot) anonymisation.
 *
 * Cost: zero AI cost. This is pure DB capture. The intelligence comes
 * later when consolidation runs over accumulated events.
 */

import { sql } from "@/lib/db";

export type FlywheelEventType =
  | "prompt_typing"
  | "prompt_submit"
  | "components_picked"
  | "build_complete"
  | "build_failed"
  | "edit_request"
  | "edit_complete"
  | "preview_dwell"
  | "regenerate"
  | "deploy";

export interface FlywheelEvent {
  /** Unique build/session correlation key. Same buildId across all
   *  events from one build attempt. */
  buildId: string;
  /** Session correlation (browser tab) — survives across builds for
   *  the same user session. Lets us see "user tried 3 prompts in
   *  this session before deploying." */
  sessionId?: string;
  /** Authenticated user email if known. */
  userEmail?: string | null;
  type: FlywheelEventType;
  /** Event-specific payload. Schema varies by type — kept loose so
   *  new event types don't require a migration. */
  payload: Record<string, unknown>;
}

export async function captureEvent(event: FlywheelEvent): Promise<void> {
  try {
    await sql`
      INSERT INTO flywheel_events (build_id, session_id, user_email, type, payload)
      VALUES (
        ${event.buildId},
        ${event.sessionId ?? null},
        ${event.userEmail ?? null},
        ${event.type},
        ${JSON.stringify(event.payload)}::jsonb
      )
    `;
  } catch (err) {
    console.warn("[flywheel/events] capture failed (non-fatal):", err instanceof Error ? err.message : err);
  }
}

/**
 * Helper for batched event capture — used by the client to send a
 * burst of typing events without N round trips. Server inserts all
 * at once.
 */
export async function captureBatch(events: FlywheelEvent[]): Promise<void> {
  if (events.length === 0) return;
  // Postgres limits parameterised queries; chunk to 50 per insert.
  const CHUNK = 50;
  for (let i = 0; i < events.length; i += CHUNK) {
    const chunk = events.slice(i, i + CHUNK);
    try {
      // Build VALUES tuples dynamically. Each tuple is 5 params.
      const valueTuples = chunk.map(
        (_e, idx) => {
          const base = idx * 5;
          return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}::jsonb)`;
        },
      );
      const params: unknown[] = [];
      for (const e of chunk) {
        params.push(e.buildId, e.sessionId ?? null, e.userEmail ?? null, e.type, JSON.stringify(e.payload));
      }
      const query =
        `INSERT INTO flywheel_events (build_id, session_id, user_email, type, payload) ` +
        `VALUES ${valueTuples.join(", ")}`;
      await sql.query(query, params);
    } catch (err) {
      console.warn("[flywheel/events] batch capture chunk failed:", err instanceof Error ? err.message : err);
    }
  }
}

// ───────────────────────────────────────────────────────────────────────
// Session-level insights — read side
// ───────────────────────────────────────────────────────────────────────

export interface SessionSummary {
  sessionId: string;
  startedAt: string;
  endedAt: string;
  buildCount: number;
  regenerationCount: number;
  deployCount: number;
  /** True when the user deployed something this session — strongest
   *  success signal we have. */
  successful: boolean;
}

export async function getSessionSummary(sessionId: string): Promise<SessionSummary | null> {
  try {
    const rows = await sql<{
      started: string;
      ended: string;
      build_count: string;
      regen_count: string;
      deploy_count: string;
    }>`
      SELECT
        MIN(created_at)::text                                              AS started,
        MAX(created_at)::text                                              AS ended,
        COUNT(*) FILTER (WHERE type = 'prompt_submit')::text               AS build_count,
        COUNT(*) FILTER (WHERE type = 'regenerate')::text                  AS regen_count,
        COUNT(*) FILTER (WHERE type = 'deploy')::text                      AS deploy_count
      FROM flywheel_events
      WHERE session_id = ${sessionId}
      GROUP BY session_id
      LIMIT 1
    `;
    if (rows.length === 0) return null;
    const r = rows[0];
    const deployCount = Number(r.deploy_count);
    return {
      sessionId,
      startedAt: r.started,
      endedAt: r.ended,
      buildCount: Number(r.build_count),
      regenerationCount: Number(r.regen_count),
      deployCount,
      successful: deployCount > 0,
    };
  } catch (err) {
    console.warn("[flywheel/events] session summary failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

// ───────────────────────────────────────────────────────────────────────
// Aggregate intelligence — patterns mined from events
// ───────────────────────────────────────────────────────────────────────

/**
 * Returns the average build-to-deploy time for sessions that
 * eventually deployed. Useful for measuring "how fast does a user
 * get to a working site." We want this to trend DOWN as the
 * flywheel matures (every accumulated few-shot example should shave
 * latency off the next build).
 */
export async function getAvgTimeToFirstDeploy(): Promise<number | null> {
  try {
    const rows = await sql<{ avg_seconds: string }>`
      WITH session_first_submit AS (
        SELECT session_id, MIN(created_at) AS submit_at
        FROM flywheel_events
        WHERE type = 'prompt_submit'
        GROUP BY session_id
      ),
      session_first_deploy AS (
        SELECT session_id, MIN(created_at) AS deploy_at
        FROM flywheel_events
        WHERE type = 'deploy'
        GROUP BY session_id
      )
      SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (d.deploy_at - s.submit_at))), 0)::text AS avg_seconds
      FROM session_first_submit s
      JOIN session_first_deploy d ON s.session_id = d.session_id
      WHERE d.deploy_at >= NOW() - INTERVAL '30 days'
    `;
    return rows[0] ? Number(rows[0].avg_seconds) : null;
  } catch (err) {
    console.warn("[flywheel/events] avgTimeToFirstDeploy failed:", err instanceof Error ? err.message : err);
    return null;
  }
}
