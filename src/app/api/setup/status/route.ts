/**
 * /api/setup/status — what does the platform need to take orders?
 *
 * Returns a list of checks across the categories the setup dashboard
 * renders: AI providers, DB, payments, domains, video, email, auth,
 * infra. Each check is { id, label, category, required, status, detail }
 * matching the Check interface in src/app/admin/setup/page.tsx.
 *
 * status ∈ "ok" | "missing" | "warn" | "fail"
 *   ok       — wired and verified
 *   missing  — env var or table not set up
 *   warn     — set up but not the recommended config
 *   fail     — set up but actively broken (best-effort detection)
 *
 * "required: true" items are revenue blockers — the setup dashboard
 * surfaces them first.
 *
 * Why an inline route not a library: the checks are mostly env-var
 * lookups + one or two DB introspects. No reusable surface, no
 * recurring caller other than this page.
 *
 * Rule 19 (video retired) and Rule 31 (email/hosting/auth delegated
 * to Crontech) are reflected — email checks ask about Crontech tokens,
 * video category is omitted.
 */

import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

type Status = "ok" | "missing" | "warn" | "fail";

interface Check {
  id: string;
  label: string;
  category: "ai" | "db" | "payments" | "domains" | "video" | "email" | "auth" | "infra";
  required: boolean;
  status: Status;
  detail?: string;
}

interface Summary {
  total: number;
  ok: number;
  warn: number;
  missing: number;
  fail: number;
  requiredOk: number;
  requiredTotal: number;
}

function envStatus(name: string): { status: Status; detail: string } {
  const v = process.env[name];
  if (!v || !v.trim()) return { status: "missing", detail: `${name} not set` };
  return { status: "ok", detail: `${name} set (${v.length} chars)` };
}

async function dbTableStatus(table: string): Promise<{ status: Status; detail: string }> {
  if (!process.env.DATABASE_URL) {
    return { status: "missing", detail: "DATABASE_URL not set" };
  }
  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = (await sql`
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ${table}
      LIMIT 1
    `) as Array<{ "?column?"?: number }>;
    if (rows.length === 0) {
      return { status: "missing", detail: `${table} table does not exist — visit /api/db/init` };
    }
    return { status: "ok", detail: `${table} exists` };
  } catch (err) {
    return {
      status: "fail",
      detail: err instanceof Error ? err.message : "DB introspection failed",
    };
  }
}

export async function GET() {
  const checks: Check[] = [];

  // ── AI providers ─────────────────────────────────────────────
  const anthropic = envStatus("ANTHROPIC_API_KEY");
  checks.push({
    id: "ai-anthropic",
    label: "Anthropic API key (Claude — Opus/Sonnet/Haiku)",
    category: "ai",
    required: true,
    status: anthropic.status,
    detail: anthropic.detail,
  });

  const openai = envStatus("OPENAI_API_KEY");
  checks.push({
    id: "ai-openai",
    label: "OpenAI API key (failover for Claude)",
    category: "ai",
    required: false,
    status: openai.status === "missing" ? "warn" : openai.status,
    detail:
      openai.status === "missing"
        ? "Optional but recommended — provides failover when Claude is rate-limited"
        : openai.detail,
  });

  const gemini = envStatus("GOOGLE_AI_API_KEY");
  checks.push({
    id: "ai-gemini",
    label: "Google Gemini API key (free 1500/day failover)",
    category: "ai",
    required: false,
    status: gemini.status === "missing" ? "warn" : gemini.status,
    detail:
      gemini.status === "missing"
        ? "Free tier — recommended as third failover provider"
        : gemini.detail,
  });

  // ── Database ─────────────────────────────────────────────────
  const dbUrl = envStatus("DATABASE_URL");
  checks.push({
    id: "db-url",
    label: "Neon Postgres connection",
    category: "db",
    required: true,
    status: dbUrl.status,
    detail: dbUrl.detail,
  });

  if (dbUrl.status === "ok") {
    const users = await dbTableStatus("users");
    checks.push({
      id: "db-users",
      label: "users table",
      category: "db",
      required: true,
      status: users.status,
      detail: users.detail,
    });

    const domainsTbl = await dbTableStatus("registered_domains");
    checks.push({
      id: "db-registered-domains",
      label: "registered_domains table (OpenSRS purchases)",
      category: "db",
      required: true,
      status: domainsTbl.status,
      detail: domainsTbl.detail,
    });

    const hn = await dbTableStatus("hn_threads");
    checks.push({
      id: "db-hn",
      label: "hn_threads table (Intel Flywheel)",
      category: "db",
      required: false,
      status: hn.status === "missing" ? "warn" : hn.status,
      detail:
        hn.status === "missing"
          ? "Auto-creates on first /api/intel/hn/run hit"
          : hn.detail,
    });
  }

  // ── Payments ─────────────────────────────────────────────────
  const stripeSk = envStatus("STRIPE_SECRET_KEY");
  checks.push({
    id: "payments-stripe-sk",
    label: "Stripe secret key (live)",
    category: "payments",
    required: true,
    status: stripeSk.status,
    detail: stripeSk.detail,
  });

  const stripeWh = envStatus("STRIPE_WEBHOOK_SECRET");
  checks.push({
    id: "payments-stripe-wh",
    label: "Stripe webhook secret",
    category: "payments",
    required: true,
    status: stripeWh.status,
    detail: stripeWh.detail,
  });

  // ── Domains ──────────────────────────────────────────────────
  const opensrs = envStatus("OPENSRS_API_KEY");
  checks.push({
    id: "domains-opensrs-key",
    label: "OpenSRS API key (domain registry)",
    category: "domains",
    required: true,
    status: opensrs.status,
    detail: opensrs.detail,
  });

  const opensrsEnv = process.env.OPENSRS_ENV;
  checks.push({
    id: "domains-opensrs-env",
    label: "OpenSRS environment",
    category: "domains",
    required: true,
    status: opensrsEnv === "live" ? "ok" : opensrsEnv === "test" ? "warn" : "missing",
    detail:
      opensrsEnv === "live"
        ? "Live — real domain purchases will register"
        : opensrsEnv === "test"
        ? "Test env — purchases will run against the test horizon"
        : "OPENSRS_ENV not set — defaults to test; set to 'live' for production",
  });

  // ── Video ────────────────────────────────────────────────────
  // Rule 19: AI Video Creator retired 2026-05-26. Category surfaces a
  // single informational row so the dashboard reflects current scope
  // rather than leaving a confusing empty section.
  checks.push({
    id: "video-retired",
    label: "AI Video Creator retired (Rule 19)",
    category: "video",
    required: false,
    status: "ok",
    detail: "Out of scope. Revive as a separate focused product if it ships again.",
  });

  // ── Email (Crontech BLK-030) ─────────────────────────────────
  const emailToken = envStatus("EMAIL_SEND_TOKEN");
  checks.push({
    id: "email-crontech-token",
    label: "Crontech email service bearer token",
    category: "email",
    required: false,
    status: emailToken.status === "missing" ? "warn" : emailToken.status,
    detail:
      emailToken.status === "missing"
        ? "HN Flywheel digest emails will be stubbed until this is set"
        : emailToken.detail,
  });

  const emailFrom = envStatus("EMAIL_FROM");
  checks.push({
    id: "email-from",
    label: "EMAIL_FROM sender address",
    category: "email",
    required: false,
    status: emailFrom.status === "missing" ? "warn" : emailFrom.status,
    detail:
      emailFrom.status === "missing"
        ? "Defaults to 'Zoobicon <noreply@mail.zoobicon.com>' if unset"
        : emailFrom.detail,
  });

  // ── Auth (Crontech SSO shim per Rule 31) ─────────────────────
  const crontechPat = envStatus("CRONTECH_PAT");
  checks.push({
    id: "auth-crontech",
    label: "Crontech SSO project access token",
    category: "auth",
    required: false,
    status: crontechPat.status === "missing" ? "warn" : crontechPat.status,
    detail:
      crontechPat.status === "missing"
        ? "Builder runs anonymously until Crontech SSO is wired"
        : crontechPat.detail,
  });

  // ── Infrastructure ───────────────────────────────────────────
  const replicate = envStatus("REPLICATE_API_TOKEN");
  checks.push({
    id: "infra-replicate",
    label: "Replicate API token (image generation)",
    category: "infra",
    required: false,
    status: replicate.status === "missing" ? "warn" : replicate.status,
    detail:
      replicate.status === "missing"
        ? "Image-generation features will skip Replicate models"
        : replicate.detail,
  });

  const cronSecret = envStatus("CRON_SECRET");
  checks.push({
    id: "infra-cron-secret",
    label: "CRON_SECRET (guards /api/intel/*/run + /api/intel/cron)",
    category: "infra",
    required: false,
    status: cronSecret.status === "missing" ? "warn" : cronSecret.status,
    detail:
      cronSecret.status === "missing"
        ? "Cron endpoints are unauthenticated until this is set — risk of abuse"
        : cronSecret.detail,
  });

  // ── Summary ──────────────────────────────────────────────────
  const summary: Summary = {
    total: checks.length,
    ok: checks.filter((c) => c.status === "ok").length,
    warn: checks.filter((c) => c.status === "warn").length,
    missing: checks.filter((c) => c.status === "missing").length,
    fail: checks.filter((c) => c.status === "fail").length,
    requiredOk: checks.filter((c) => c.required && c.status === "ok").length,
    requiredTotal: checks.filter((c) => c.required).length,
  };

  return NextResponse.json({ summary, checks });
}
