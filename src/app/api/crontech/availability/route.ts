/**
 * GET /api/crontech/availability
 *
 * Lightweight check the builder client calls on mount to decide whether
 * to show Vapron as an enabled deploy target.
 *
 * Returns { available: boolean, base: string }.
 * Uses Edge runtime — no cold-start delay.
 */

import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    available: Boolean(process.env.VAPRON_PAT || process.env.CRONTECH_PAT),
    base: process.env.VAPRON_API_BASE || process.env.CRONTECH_API_BASE || "https://api.crontech.ai",
  });
}
