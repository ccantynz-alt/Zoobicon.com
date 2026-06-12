/**
 * Admin-private builds (added 2026-05-17).
 *
 * Craig wants to be able to build his own projects in the AI Builder
 * without them leaking into public lists (gallery, showcase, intel
 * exports, agency client views, the future Vapron project map).
 *
 * Mechanism — one column on `projects` and `sites`:
 *   visibility TEXT NOT NULL DEFAULT 'public'
 *
 * Valid values: 'public' | 'admin_private'
 *
 * On save:
 *   visibilityForRequest(request)  → looks at the request's auth claim
 *                                    (Vapron token role, or the
 *                                    legacy x-admin header on the dev
 *                                    path) and returns the value to
 *                                    write into the column.
 *
 * On read:
 *   visibilityWhereClause(opts)    → SQL fragment to AND into public
 *                                    listings. Returns '' (no filter)
 *                                    when the reader is admin viewing
 *                                    their own admin queue.
 *
 * The default writes 'public' so existing behaviour doesn't change.
 * Admin-only builds only appear when an authenticated admin saves them,
 * AND only show up to admin readers.
 */

import type { NextRequest } from "next/server";
import { authenticateRequest } from "./auth-guard";

export type Visibility = "public" | "admin_private";

/**
 * Decide which visibility to stamp on a new project/site, given the
 * incoming request. Returns 'admin_private' if and only if the caller
 * authenticates as an admin AND explicitly opts in via the
 * `x-zoobicon-visibility: admin_private` header (or the request body's
 * `visibility` field — the save handler can pass that through).
 *
 * Defaulting to 'public' is intentional — Craig has to actively flag
 * something as private; mass-defaulting his builds to private would
 * make them invisible to him in the public preview surfaces too.
 */
export async function visibilityForRequest(
  request: Request | NextRequest,
  explicit?: Visibility,
): Promise<Visibility> {
  if (explicit === "admin_private") {
    const { user } = await authenticateRequest(request);
    if (user?.role === "admin") return "admin_private";
  }
  return "public";
}

/**
 * Filter for public read paths. Pass `{ includePrivate: true }` only on
 * admin-only routes (e.g. /admin/builds, /admin/showcase).
 *
 * Returns the literal SQL fragment to splice into a WHERE clause.
 * Designed for tagged-template `sql\`\`` usage: callers concat the
 * string in directly rather than parameterising — the value is fixed
 * and never user-supplied.
 */
export function visibilityWhereClause(opts?: { includePrivate?: boolean }): string {
  if (opts?.includePrivate) return ""; // no filter
  return "AND visibility = 'public' ";
}
