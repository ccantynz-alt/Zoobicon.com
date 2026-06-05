import { NextRequest, NextResponse } from "next/server";

/**
 * Admin env-var status — GET /api/admin/env-status
 *
 * Returns `{ [key]: boolean }` for the env vars the admin panel
 * displays, so the UI can tell the difference between "this is
 * required" (config intent) and "this is set in Vercel" (actual
 * state). Only returns booleans — never the value — so an
 * unauthenticated read is harmless, but we still gate it behind
 * the same admin login check as the rest of the admin surface.
 *
 * The gate: caller must send `x-admin-email` matching ADMIN_EMAIL.
 * That header is set by AdminShell after a successful sign-in,
 * via the existing localStorage payload.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TRACKED_KEYS = [
  // Core AI
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
  "GOOGLE_AI_API_KEY",
  // Images
  "STABILITY_API_KEY",
  "UNSPLASH_ACCESS_KEY",
  // Database & Auth
  "DATABASE_URL",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
  "RESET_TOKEN_SECRET",
  // OAuth
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GITHUB_OAUTH_CLIENT_ID",
  "GITHUB_OAUTH_CLIENT_SECRET",
  // Payments
  "STRIPE_SECRET_KEY",
  "STRIPE_CREATOR_PRICE_ID",
  "STRIPE_PRO_PRICE_ID",
  "STRIPE_AGENCY_PRICE_ID",
  "STRIPE_WEBHOOK_SECRET",
  // Email
  "MAILGUN_API_KEY",
  "MAILGUN_DOMAIN",
  "MAILGUN_WEBHOOK_SIGNING_KEY",
  "ADMIN_NOTIFICATION_EMAIL",
  // Infrastructure
  "NEXT_PUBLIC_APP_URL",
  "CLOUDFLARE_API_TOKEN",
  "CLOUDFLARE_ZONE_ID",
  "CLOUDFLARE_ACCOUNT_ID",
  // Integrations
  "GITHUB_TOKEN",
  "SLACK_BOT_TOKEN",
  "SLACK_SIGNING_SECRET",
] as const;

export async function GET(req: NextRequest) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const callerEmail = req.headers.get("x-admin-email")?.trim().toLowerCase();
  if (!adminEmail || !callerEmail || callerEmail !== adminEmail.toLowerCase()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const status: Record<string, boolean> = {};
  for (const key of TRACKED_KEYS) {
    const value = process.env[key];
    status[key] = typeof value === "string" && value.length > 0;
  }

  return NextResponse.json({ status });
}
