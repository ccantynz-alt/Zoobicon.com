import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/setup/status
 *
 * Returns the current setup status — which env vars are configured, which DB
 * tables exist, which integrations can talk to their upstream. Powers the
 * /admin/setup status dashboard so Craig can see at a glance what's still
 * blocking revenue.
 *
 * Each check returns one of:
 *   - "ok"      — fully configured and reachable
 *   - "missing" — required configuration not present
 *   - "warn"    — present but unverified, optional, or partially configured
 *   - "fail"    — present but the live check failed
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Status = "ok" | "missing" | "warn" | "fail";

interface Check {
  id: string;
  label: string;
  category: "ai" | "db" | "payments" | "domains" | "video" | "email" | "auth" | "infra";
  required: boolean;
  status: Status;
  detail?: string;
}

function envCheck(
  id: string,
  label: string,
  category: Check["category"],
  required: boolean,
  envName: string | string[],
  detail?: string,
): Check {
  const names = Array.isArray(envName) ? envName : [envName];
  const missing = names.filter((n) => !process.env[n]);
  if (missing.length === 0) {
    return { id, label, category, required, status: "ok", detail: detail || `${names.join(" + ")} configured` };
  }
  return {
    id,
    label,
    category,
    required,
    status: required ? "missing" : "warn",
    detail: `Missing: ${missing.join(", ")}`,
  };
}

async function dbCheck(): Promise<Check[]> {
  const checks: Check[] = [];
  if (!process.env.DATABASE_URL) {
    checks.push({
      id: "db.url",
      label: "Neon DATABASE_URL",
      category: "db",
      required: true,
      status: "missing",
      detail: "Set DATABASE_URL in Vercel env vars (copy from console.neon.tech).",
    });
    checks.push({
      id: "db.tables",
      label: "Database tables (users, sites, registered_domains, …)",
      category: "db",
      required: true,
      status: "missing",
      detail: "Cannot check until DATABASE_URL is set.",
    });
    return checks;
  }
  checks.push({
    id: "db.url",
    label: "Neon DATABASE_URL",
    category: "db",
    required: true,
    status: "ok",
    detail: "DATABASE_URL configured.",
  });

  // Verify the core tables exist. We only check the half-dozen most
  // critical for revenue paths — full schema lives in /api/db/init.
  try {
    const { sql } = await import("@/lib/db");
    const required = [
      "users",
      "sites",
      "registered_domains",
      "support_tickets",
      "video_batches",
      "usage_tracking",
    ];
    const rows = (await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ANY(${required})
    `) as Array<{ table_name: string }>;
    const present = new Set(rows.map((r) => r.table_name));
    const missingTables = required.filter((t) => !present.has(t));
    if (missingTables.length === 0) {
      checks.push({
        id: "db.tables",
        label: "Database tables",
        category: "db",
        required: true,
        status: "ok",
        detail: `All ${required.length} core tables present.`,
      });
    } else {
      checks.push({
        id: "db.tables",
        label: "Database tables",
        category: "db",
        required: true,
        status: "missing",
        detail: `Missing: ${missingTables.join(", ")}. Visit /api/db/init to create.`,
      });
    }
  } catch (err) {
    checks.push({
      id: "db.tables",
      label: "Database tables",
      category: "db",
      required: true,
      status: "fail",
      detail: `Could not query schema: ${err instanceof Error ? err.message : "unknown error"}`,
    });
  }
  return checks;
}

async function getStatus(): Promise<Check[]> {
  const checks: Check[] = [];

  // ── AI providers ────────────────────────────────────────────────────────
  checks.push(
    envCheck("ai.anthropic", "Anthropic (Claude)", "ai", true, "ANTHROPIC_API_KEY",
      "Required for builder, domain finder, video pipeline."),
    envCheck("ai.openai", "OpenAI (GPT failover)", "ai", false, "OPENAI_API_KEY",
      "Optional cross-provider failover for the builder."),
    envCheck("ai.google", "Google AI (Gemini failover)", "ai", false, "GOOGLE_AI_API_KEY",
      "Optional free-tier 1500/day failover."),
  );

  // ── Database ────────────────────────────────────────────────────────────
  checks.push(...(await dbCheck()));

  // ── Payments ────────────────────────────────────────────────────────────
  checks.push(
    envCheck("payments.stripe", "Stripe (checkout)", "payments", true, "STRIPE_SECRET_KEY",
      "Required for any paid tier."),
    envCheck("payments.webhook", "Stripe webhook secret", "payments", true, "STRIPE_WEBHOOK_SECRET",
      "Required so subscriptions actually update plan in DB."),
    envCheck("payments.prices", "Stripe price IDs", "payments", true,
      ["STRIPE_PRICE_STARTER", "STRIPE_PRICE_PRO", "STRIPE_PRICE_AGENCY"],
      "Create products in dashboard.stripe.com then paste price IDs."),
  );

  // ── Domain registration ────────────────────────────────────────────────
  checks.push(
    envCheck("domains.opensrs", "OpenSRS (Tucows) registrar", "domains", true,
      ["OPENSRS_API_KEY", "OPENSRS_RESELLER_USER"],
      "Both required for live domain registration."),
  );
  if (process.env.OPENSRS_ENV === "live") {
    checks.push({
      id: "domains.live",
      label: "OpenSRS environment",
      category: "domains",
      required: false,
      status: "ok",
      detail: "OPENSRS_ENV=live (real registrations).",
    });
  } else {
    checks.push({
      id: "domains.live",
      label: "OpenSRS environment",
      category: "domains",
      required: false,
      status: "warn",
      detail: "OPENSRS_ENV is not 'live' — running in sandbox (no real registrations).",
    });
  }

  // ── Video ───────────────────────────────────────────────────────────────
  checks.push(
    envCheck("video.replicate", "Replicate (video pipeline)", "video", true, "REPLICATE_API_TOKEN",
      "Required for own video pipeline (Fish Audio, FLUX, lip-sync)."),
    envCheck("video.fal", "fal.ai (premium B-roll)", "video", false, "FAL_KEY",
      "Optional Veo 3.1 / Kling B-roll via fal.ai."),
    envCheck("video.elevenlabs", "ElevenLabs (voice cloning)", "video", false, "ELEVENLABS_API_KEY",
      "Optional voice cloning fallback."),
  );

  // ── Email ──────────────────────────────────────────────────────────────
  checks.push(
    envCheck("email.mailgun", "Mailgun (transactional)", "email", true,
      ["MAILGUN_API_KEY", "MAILGUN_DOMAIN"],
      "Required for verification + receipt emails."),
  );

  // ── Auth ────────────────────────────────────────────────────────────────
  checks.push(
    envCheck("auth.admin", "Admin login fallback", "auth", false,
      ["ADMIN_EMAIL", "ADMIN_PASSWORD"],
      "Lets the admin log in even when DB is down."),
    envCheck("auth.google", "Google OAuth", "auth", false,
      ["GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET"]),
    envCheck("auth.github", "GitHub OAuth", "auth", false,
      ["GITHUB_OAUTH_CLIENT_ID", "GITHUB_OAUTH_CLIENT_SECRET"]),
  );

  // ── Infra ───────────────────────────────────────────────────────────────
  checks.push(
    envCheck("infra.redis", "Upstash Redis (webhook idempotency)", "infra", false,
      ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
      "Cross-instance webhook dedup. In-memory fallback works without it."),
    envCheck("infra.supabase", "Supabase auto-provisioning", "infra", false,
      ["SUPABASE_ACCESS_TOKEN", "SUPABASE_ORG_ID"],
      "Generates per-customer Supabase projects from the builder."),
  );

  return checks;
}

export async function GET(_req: NextRequest) {
  const checks = await getStatus();
  const summary = {
    total: checks.length,
    ok: checks.filter((c) => c.status === "ok").length,
    warn: checks.filter((c) => c.status === "warn").length,
    missing: checks.filter((c) => c.status === "missing").length,
    fail: checks.filter((c) => c.status === "fail").length,
    requiredOk: checks.filter((c) => c.required && c.status === "ok").length,
    requiredTotal: checks.filter((c) => c.required).length,
  };
  return NextResponse.json({ summary, checks, generatedAt: new Date().toISOString() });
}
