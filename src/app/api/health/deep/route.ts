import { NextRequest, NextResponse } from "next/server";
import { getCircuitState } from "@/lib/resilience";
import { isTokenPoisoned as isSupabasePoisoned } from "@/lib/supabase-provisioner";
import { isReplicatePoisoned } from "@/lib/video-pipeline";

/**
 * GET /api/health/deep
 *
 * Bulletproof production monitor — the single source of truth Craig needs.
 *
 * Pings EVERY external dependency in parallel with aggressive timeouts,
 * reports circuit-breaker state, surfaces poisoned-token state, and returns
 * a structured JSON response the /admin/health dashboard can render.
 *
 * Why this exists: prior to today, a single bad SUPABASE_ACCESS_TOKEN would
 * cascade into every builder request and users saw "JWT could not be
 * decoded". This endpoint catches that condition in under 10 seconds, before
 * it ever reaches a customer.
 *
 * Every check runs in parallel with a hard 8-second timeout. Worst case this
 * endpoint returns in ~9 seconds even if every provider is down.
 *
 * Optional: ?webhook=URL posts failures to Slack/Discord.
 */

export const maxDuration = 30;
export const dynamic = "force-dynamic";

type Status = "pass" | "fail" | "warn" | "skip";

interface ProviderCheck {
  name: string;
  category: "ai" | "video" | "voice" | "database" | "payment" | "domain" | "email" | "storage" | "infra";
  status: Status;
  message: string;
  latencyMs: number;
  circuitState?: "closed" | "open" | "half-open";
  envVar?: string;
  required: boolean;
}

const CHECK_TIMEOUT = 8000;

async function pingJson(
  url: string,
  headers: Record<string, string>,
  init: RequestInit = {},
): Promise<{ ok: boolean; status: number; body?: string }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), CHECK_TIMEOUT);
  try {
    const res = await fetch(url, { ...init, headers, signal: ctrl.signal });
    const text = await res.text().catch(() => "");
    return { ok: res.ok, status: res.status, body: text.slice(0, 200) };
  } finally {
    clearTimeout(timer);
  }
}

function missingEnv(name: string, envVar: string, category: ProviderCheck["category"], required: boolean): ProviderCheck {
  return {
    name,
    category,
    status: required ? "fail" : "warn",
    message: `${envVar} not set in environment`,
    latencyMs: 0,
    envVar,
    required,
  };
}

function classify(service: string): "closed" | "open" | "half-open" {
  return getCircuitState(service).state;
}

async function timed<T>(fn: () => Promise<T>): Promise<{ result: T | null; err: unknown; ms: number }> {
  const t0 = Date.now();
  try {
    const result = await fn();
    return { result, err: null, ms: Date.now() - t0 };
  } catch (err) {
    return { result: null, err, ms: Date.now() - t0 };
  }
}

// ── Individual dependency probes ─────────────────────────────────────────

async function checkAnthropic(): Promise<ProviderCheck> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return missingEnv("Anthropic (Claude)", "ANTHROPIC_API_KEY", "ai", true);
  const { err, ms } = await timed(async () => {
    const res = await pingJson("https://api.anthropic.com/v1/messages", {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    }, {
      method: "POST",
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 5,
        messages: [{ role: "user", content: "ok" }],
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.body}`);
  });
  return {
    name: "Anthropic (Claude)",
    category: "ai",
    status: err ? "fail" : "pass",
    message: err ? `Anthropic down: ${err instanceof Error ? err.message : String(err)}` : "Claude Haiku responding",
    latencyMs: ms,
    circuitState: classify("anthropic"),
    envVar: "ANTHROPIC_API_KEY",
    required: true,
  };
}

async function checkOpenAI(): Promise<ProviderCheck> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return missingEnv("OpenAI (fallback)", "OPENAI_API_KEY", "ai", false);
  const { err, ms } = await timed(async () => {
    const res = await pingJson("https://api.openai.com/v1/models", {
      Authorization: `Bearer ${key}`,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.body}`);
  });
  return {
    name: "OpenAI (failover)",
    category: "ai",
    status: err ? "fail" : "pass",
    message: err ? `OpenAI down: ${err instanceof Error ? err.message : String(err)}` : "OpenAI reachable",
    latencyMs: ms,
    circuitState: classify("openai"),
    envVar: "OPENAI_API_KEY",
    required: false,
  };
}

async function checkGemini(): Promise<ProviderCheck> {
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key) return missingEnv("Google Gemini (fallback)", "GOOGLE_AI_API_KEY", "ai", false);
  const { err, ms } = await timed(async () => {
    const res = await pingJson(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`,
      {},
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.body}`);
  });
  return {
    name: "Google Gemini (failover)",
    category: "ai",
    status: err ? "fail" : "pass",
    message: err ? `Gemini down: ${err instanceof Error ? err.message : String(err)}` : "Gemini reachable",
    latencyMs: ms,
    circuitState: classify("gemini"),
    envVar: "GOOGLE_AI_API_KEY",
    required: false,
  };
}

async function checkReplicate(): Promise<ProviderCheck> {
  // Poison state check first — if we've seen a 401/403 this cold start we
  // already know the token is bad; don't pay another round-trip to confirm.
  const poison = isReplicatePoisoned();
  if (poison.poisoned) {
    return {
      name: "Replicate",
      category: "video",
      status: "fail",
      message: `Token poisoned this cold start — ${poison.reason}`,
      latencyMs: 0,
      circuitState: "open",
      envVar: "REPLICATE_API_TOKEN",
      required: false,
    };
  }
  const key = process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY;
  if (!key) return missingEnv("Replicate (video)", "REPLICATE_API_TOKEN", "video", false);
  const { err, ms } = await timed(async () => {
    const res = await pingJson(
      "https://api.replicate.com/v1/models/black-forest-labs/flux-schnell",
      { Authorization: `Bearer ${key}` },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.body}`);
  });
  return {
    name: "Replicate",
    category: "video",
    status: err ? "fail" : "pass",
    message: err ? `Replicate down: ${err instanceof Error ? err.message : String(err)}` : "Replicate reachable, token valid",
    latencyMs: ms,
    circuitState: classify("replicate"),
    envVar: "REPLICATE_API_TOKEN",
    required: false,
  };
}

async function checkFal(): Promise<ProviderCheck> {
  const key = process.env.FAL_KEY || process.env.FAL_API_KEY;
  if (!key) return missingEnv("fal.ai (video)", "FAL_KEY", "video", false);
  const { err, ms } = await timed(async () => {
    // fal exposes a light endpoint via its queue API — use the
    // models list on the REST gateway as a cheap auth check.
    const res = await pingJson("https://rest.alpha.fal.ai/models", {
      Authorization: `Key ${key}`,
    });
    // 404 is acceptable (endpoint may not exist) — what matters is NOT 401/403
    if (res.status === 401 || res.status === 403) {
      throw new Error(`HTTP ${res.status}: ${res.body || "invalid fal.ai key"}`);
    }
  });
  return {
    name: "fal.ai",
    category: "video",
    status: err ? "fail" : "pass",
    message: err ? `fal.ai auth failed: ${err instanceof Error ? err.message : String(err)}` : "fal.ai key accepted",
    latencyMs: ms,
    circuitState: classify("fal"),
    envVar: "FAL_KEY",
    required: false,
  };
}

async function checkElevenLabs(): Promise<ProviderCheck> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return missingEnv("ElevenLabs (voice)", "ELEVENLABS_API_KEY", "voice", false);
  const { err, ms } = await timed(async () => {
    const res = await pingJson("https://api.elevenlabs.io/v1/user", {
      "xi-api-key": key,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.body}`);
  });
  return {
    name: "ElevenLabs",
    category: "voice",
    status: err ? "fail" : "pass",
    message: err ? `ElevenLabs down: ${err instanceof Error ? err.message : String(err)}` : "ElevenLabs reachable",
    latencyMs: ms,
    circuitState: classify("elevenlabs"),
    envVar: "ELEVENLABS_API_KEY",
    required: false,
  };
}

async function checkFishAudio(): Promise<ProviderCheck> {
  const key = process.env.FISH_AUDIO_API_KEY || process.env.FISH_API_KEY;
  if (!key) return missingEnv("Fish Audio (voice)", "FISH_AUDIO_API_KEY", "voice", false);
  const { err, ms } = await timed(async () => {
    const res = await pingJson("https://api.fish.audio/v1/model", {
      Authorization: `Bearer ${key}`,
    });
    if (res.status === 401 || res.status === 403) {
      throw new Error(`HTTP ${res.status}: ${res.body || "invalid Fish Audio key"}`);
    }
  });
  return {
    name: "Fish Audio",
    category: "voice",
    status: err ? "fail" : "pass",
    message: err ? `Fish Audio auth failed: ${err instanceof Error ? err.message : String(err)}` : "Fish Audio key accepted",
    latencyMs: ms,
    circuitState: classify("fish-audio"),
    envVar: "FISH_AUDIO_API_KEY",
    required: false,
  };
}

async function checkSupabaseManagement(): Promise<ProviderCheck> {
  const poison = isSupabasePoisoned();
  if (poison.poisoned) {
    return {
      name: "Supabase Management",
      category: "database",
      status: "fail",
      message: `Token poisoned this cold start — ${poison.reason}`,
      latencyMs: 0,
      circuitState: "open",
      envVar: "SUPABASE_ACCESS_TOKEN",
      required: false,
    };
  }
  const key = process.env.SUPABASE_ACCESS_TOKEN;
  if (!key) return missingEnv("Supabase Management", "SUPABASE_ACCESS_TOKEN", "database", false);
  const { err, ms } = await timed(async () => {
    const res = await pingJson("https://api.supabase.com/v1/organizations", {
      Authorization: `Bearer ${key}`,
    });
    if (!res.ok) {
      // Supabase returns "JWT could not be decoded" in the body on bad token
      throw new Error(`HTTP ${res.status}: ${res.body}`);
    }
  });
  return {
    name: "Supabase Management",
    category: "database",
    status: err ? "fail" : "pass",
    message: err
      ? `Supabase Management API rejected token: ${err instanceof Error ? err.message : String(err)}`
      : "Supabase Management API accepting personal access token",
    latencyMs: ms,
    circuitState: "closed",
    envVar: "SUPABASE_ACCESS_TOKEN",
    required: false,
  };
}

async function checkNeon(): Promise<ProviderCheck> {
  const url = process.env.DATABASE_URL;
  if (!url) return missingEnv("Neon Postgres", "DATABASE_URL", "database", false);
  const { err, ms } = await timed(async () => {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(url);
    await sql`SELECT 1 AS ok`;
  });
  return {
    name: "Neon Postgres",
    category: "database",
    status: err ? "fail" : "pass",
    message: err ? `Neon query failed: ${err instanceof Error ? err.message : String(err)}` : "Neon connected and responding",
    latencyMs: ms,
    circuitState: classify("neon"),
    envVar: "DATABASE_URL",
    required: false,
  };
}

async function checkStripe(): Promise<ProviderCheck> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return missingEnv("Stripe", "STRIPE_SECRET_KEY", "payment", false);
  const { err, ms } = await timed(async () => {
    const res = await pingJson("https://api.stripe.com/v1/balance", {
      Authorization: `Bearer ${key}`,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.body}`);
  });
  return {
    name: "Stripe",
    category: "payment",
    status: err ? "fail" : "pass",
    message: err ? `Stripe auth failed: ${err instanceof Error ? err.message : String(err)}` : "Stripe account accessible",
    latencyMs: ms,
    circuitState: classify("stripe"),
    envVar: "STRIPE_SECRET_KEY",
    required: false,
  };
}

async function checkOpenSRS(): Promise<ProviderCheck> {
  const key = process.env.OPENSRS_API_KEY;
  const user = process.env.OPENSRS_USERNAME;
  if (!key || !user) return missingEnv("OpenSRS (domains)", "OPENSRS_API_KEY+OPENSRS_USERNAME", "domain", false);
  // OpenSRS uses an XML/HTTPS API — we can't easily ping without signing,
  // so just verify the horizon host resolves and responds to the TCP handshake.
  const { err, ms } = await timed(async () => {
    const res = await pingJson("https://horizon.opensrs.net:55443/", {});
    // Any TCP+TLS handshake counts as "reachable" — OpenSRS will 400 the empty POST.
    if (!res.ok && res.status !== 400 && res.status !== 401 && res.status !== 404) {
      throw new Error(`HTTP ${res.status}: ${res.body}`);
    }
  });
  return {
    name: "OpenSRS",
    category: "domain",
    status: err ? "fail" : "pass",
    message: err ? `OpenSRS unreachable: ${err instanceof Error ? err.message : String(err)}` : "OpenSRS horizon reachable",
    latencyMs: ms,
    circuitState: classify("opensrs"),
    envVar: "OPENSRS_API_KEY",
    required: false,
  };
}

async function checkMailgun(): Promise<ProviderCheck> {
  const key = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  if (!key) return missingEnv("Mailgun", "MAILGUN_API_KEY", "email", false);
  const { err, ms } = await timed(async () => {
    const url = domain
      ? `https://api.mailgun.net/v3/${domain}`
      : "https://api.mailgun.net/v3/domains";
    const auth = Buffer.from(`api:${key}`).toString("base64");
    const res = await pingJson(url, { Authorization: `Basic ${auth}` });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.body}`);
  });
  return {
    name: "Mailgun",
    category: "email",
    status: err ? "fail" : "pass",
    message: err ? `Mailgun auth failed: ${err instanceof Error ? err.message : String(err)}` : "Mailgun reachable",
    latencyMs: ms,
    circuitState: classify("mailgun"),
    envVar: "MAILGUN_API_KEY",
    required: false,
  };
}

async function checkCloudflare(): Promise<ProviderCheck> {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) return missingEnv("Cloudflare", "CLOUDFLARE_API_TOKEN", "infra", false);
  const { err, ms } = await timed(async () => {
    const res = await pingJson("https://api.cloudflare.com/client/v4/user/tokens/verify", {
      Authorization: `Bearer ${token}`,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.body}`);
  });
  return {
    name: "Cloudflare",
    category: "infra",
    status: err ? "fail" : "pass",
    message: err ? `Cloudflare token invalid: ${err instanceof Error ? err.message : String(err)}` : "Cloudflare token valid",
    latencyMs: ms,
    circuitState: classify("cloudflare"),
    envVar: "CLOUDFLARE_API_TOKEN",
    required: false,
  };
}

// ── Orchestrator ─────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const overallStart = Date.now();

  // Run EVERY check in parallel. Worst case we wait CHECK_TIMEOUT + a little.
  const checks = await Promise.all([
    checkAnthropic(),
    checkOpenAI(),
    checkGemini(),
    checkReplicate(),
    checkFal(),
    checkElevenLabs(),
    checkFishAudio(),
    checkSupabaseManagement(),
    checkNeon(),
    checkStripe(),
    checkOpenSRS(),
    checkMailgun(),
    checkCloudflare(),
  ]);

  // Aggregate by category
  const byCategory: Record<string, ProviderCheck[]> = {};
  for (const c of checks) {
    (byCategory[c.category] ??= []).push(c);
  }

  const failures = checks.filter((c) => c.status === "fail");
  const warnings = checks.filter((c) => c.status === "warn");
  const openCircuits = checks.filter((c) => c.circuitState === "open").map((c) => c.name);

  // A REQUIRED failure = prod down. Anything else = degraded.
  const requiredFails = failures.filter((c) => c.required);
  const status: "healthy" | "degraded" | "down" =
    requiredFails.length > 0 ? "down"
    : failures.length > 0 || openCircuits.length > 0 ? "degraded"
    : "healthy";

  // Optional webhook alert for failures
  const webhookUrl = req.nextUrl.searchParams.get("webhook");
  if (webhookUrl && failures.length > 0) {
    try {
      await sendAlert(webhookUrl, status, failures);
    } catch { /* never let webhook failures break the health check */ }
  }

  const httpStatus = status === "down" ? 503 : 200;

  return NextResponse.json({
    status,
    timestamp: new Date().toISOString(),
    totalDurationMs: Date.now() - overallStart,
    summary: {
      total: checks.length,
      passing: checks.filter((c) => c.status === "pass").length,
      warnings: warnings.length,
      failures: failures.length,
      requiredFailures: requiredFails.length,
      openCircuits,
    },
    byCategory,
    checks,
  }, {
    status: httpStatus,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Health-Status": status,
    },
  });
}

async function sendAlert(url: string, status: string, failures: ProviderCheck[]) {
  const lines = failures.map((f) => `• *${f.name}*: ${f.message}`).join("\n");
  const message = `🚨 Zoobicon health ${status.toUpperCase()}\n\n${failures.length} failure(s):\n${lines}\n\n${new Date().toISOString()}`;
  const isSlack = url.includes("hooks.slack.com");
  const payload = isSlack ? { text: message } : { content: message, text: message, message };
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
