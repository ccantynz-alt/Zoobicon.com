import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

/**
 * GET /api/health — Quick health check (pages + API keys)
 * POST /api/health — Deep health check (actually tests generation)
 *
 * Can be called by external cron services (UptimeRobot, cron-job.org, Vercel Cron)
 * to continuously monitor the builder while you're away.
 *
 * Optional query params:
 *   ?webhook=URL  — POST results to a webhook (Slack, Discord, etc.)
 *   ?deep=true    — Run the full generation test (takes 30-60s)
 */

export const maxDuration = 120;

interface CheckResult {
  name: string;
  status: "pass" | "fail" | "warn";
  message: string;
  durationMs: number;
}

// Quick check — runs in <2 seconds, good for uptime monitoring
export async function GET(req: NextRequest) {
  const checks: CheckResult[] = [];
  const overallStart = Date.now();

  // 1. API key configured
  const keyStart = Date.now();
  const apiKey = process.env.ANTHROPIC_API_KEY;
  checks.push({
    name: "anthropic_api_key",
    status: apiKey ? "pass" : "fail",
    message: apiKey ? "API key configured" : "ANTHROPIC_API_KEY missing",
    durationMs: Date.now() - keyStart,
  });

  // 2 & 3. Test Haiku auth + Opus access IN PARALLEL to cut wait time
  if (apiKey) {
    const authCheck = async (): Promise<CheckResult> => {
      const start = Date.now();
      try {
        const c = new Anthropic({ apiKey, timeout: 15_000 });
        await c.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 10,
          messages: [{ role: "user", content: "Say OK" }],
        });
        return { name: "anthropic_auth", status: "pass", message: "API key valid, Anthropic reachable", durationMs: Date.now() - start };
      } catch (err) {
        return { name: "anthropic_auth", status: "fail", message: `API auth failed: ${err instanceof Error ? err.message : String(err)}`, durationMs: Date.now() - start };
      }
    };

    const opusCheck = async (): Promise<CheckResult> => {
      const start = Date.now();
      try {
        const c = new Anthropic({ apiKey, timeout: 30_000 });
        const res = await c.messages.create({
          model: "claude-opus-4-6",
          max_tokens: 10,
          messages: [{ role: "user", content: "Say OK" }],
        });
        const text = res.content.find((b) => b.type === "text")?.text || "";
        return { name: "opus_access", status: text ? "pass" : "fail", message: text ? "Opus model accessible" : "Opus returned empty response", durationMs: Date.now() - start };
      } catch (err) {
        return { name: "opus_access", status: "fail", message: `Opus NOT accessible: ${err instanceof Error ? err.message : String(err)}. This means ALL new builds will fail.`, durationMs: Date.now() - start };
      }
    };

    const [authResult, opusResult] = await Promise.all([authCheck(), opusCheck()]);
    checks.push(authResult, opusResult);
  }

  // 4. Check OpenAI key (optional)
  checks.push({
    name: "openai_api_key",
    status: process.env.OPENAI_API_KEY ? "pass" : "warn",
    message: process.env.OPENAI_API_KEY ? "OpenAI key configured" : "OpenAI key missing (optional)",
    durationMs: 0,
  });

  // 4. Check Google AI key (optional)
  checks.push({
    name: "google_ai_key",
    status: process.env.GOOGLE_AI_API_KEY ? "pass" : "warn",
    message: process.env.GOOGLE_AI_API_KEY ? "Google AI key configured" : "Google AI key missing (optional)",
    durationMs: 0,
  });

  // 5. Database connectivity
  const dbStart = Date.now();
  const dbUrl = process.env.DATABASE_URL;
  checks.push({
    name: "database",
    status: dbUrl ? "pass" : "warn",
    message: dbUrl ? "Database URL configured" : "No DATABASE_URL — running without DB",
    durationMs: Date.now() - dbStart,
  });

  const hasFail = checks.some((c) => c.status === "fail");
  const deep = req.nextUrl.searchParams.get("deep") === "true";

  // If deep=true, also run a quick generation test — 45s timeout
  if (deep && apiKey) {
    const genStart = Date.now();
    try {
      const client = new Anthropic({ apiKey, timeout: 45_000 });
      const res = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        system: "You are a website generator. Output a minimal but complete HTML page with a hero section, a features section, and a footer. Output ONLY the raw HTML, no code fences.",
        messages: [{ role: "user", content: "Build a simple landing page for a coffee shop" }],
      });

      const text = res.content.find((b) => b.type === "text")?.text || "";
      const hasBody = /<body[^>]*>/i.test(text);
      const bodyMatch = text.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      const bodyText = bodyMatch
        ? bodyMatch[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
        : "";

      if (hasBody && bodyText.length > 50) {
        checks.push({
          name: "generation_test",
          status: "pass",
          message: `Haiku generated ${text.length} chars HTML, ${bodyText.length} chars body text`,
          durationMs: Date.now() - genStart,
        });
      } else {
        checks.push({
          name: "generation_test",
          status: "fail",
          message: `Generation produced empty body (${bodyText.length} chars body text, ${text.length} total chars)`,
          durationMs: Date.now() - genStart,
        });
      }
    } catch (err) {
      checks.push({
        name: "generation_test",
        status: "fail",
        message: `Generation test failed: ${err instanceof Error ? err.message : String(err)}`,
        durationMs: Date.now() - genStart,
      });
    }
  }

  // Send webhook notification if requested and there are failures
  const webhookUrl = req.nextUrl.searchParams.get("webhook");
  if (webhookUrl && hasFail) {
    try {
      await sendWebhookAlert(webhookUrl, checks);
    } catch {
      // Webhook failure shouldn't break the health check
    }
  }

  const response = {
    status: hasFail ? "unhealthy" : "healthy",
    timestamp: new Date().toISOString(),
    totalDurationMs: Date.now() - overallStart,
    checks,
  };

  return NextResponse.json(response, {
    status: hasFail ? 503 : 200,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

// Deep check — actually generates a site and validates the output
export async function POST(req: NextRequest) {
  const checks: CheckResult[] = [];
  const overallStart = Date.now();

  const body = await req.json().catch(() => ({}));
  const webhookUrl = body.webhook || null;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      checks: [{ name: "anthropic_api_key", status: "fail", message: "No API key", durationMs: 0 }],
    }, { status: 503 });
  }

  // 1. Test non-streaming generation (the fallback path)
  {
    const start = Date.now();
    try {
      const res = await fetch(new URL("/api/generate", req.url).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "A simple one-page site for a plumber called Fix-It Fred in Auckland. Include hero, services, testimonials, and footer.",
          tier: "standard",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Unknown" }));
        throw new Error(`HTTP ${res.status}: ${data.error}`);
      }

      const data = await res.json();
      const html = data.html || "";
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      const bodyText = bodyMatch
        ? bodyMatch[1].replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
        : "";

      if (bodyText.length >= 100) {
        checks.push({
          name: "generate_nonstream",
          status: "pass",
          message: `Generated ${html.length} chars HTML, ${bodyText.length} chars body content`,
          durationMs: Date.now() - start,
        });
      } else {
        checks.push({
          name: "generate_nonstream",
          status: "fail",
          message: `Empty body: ${bodyText.length} chars body text (need 100+), total HTML ${html.length} chars`,
          durationMs: Date.now() - start,
        });
      }
    } catch (err) {
      checks.push({
        name: "generate_nonstream",
        status: "fail",
        message: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - start,
      });
    }
  }

  // 2. Test streaming generation
  {
    const start = Date.now();
    try {
      const res = await fetch(new URL("/api/generate/stream", req.url).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "A one-page site for a dog groomer called Paws & Claws in Wellington",
          tier: "standard",
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream body");
      const decoder = new TextDecoder();
      let accumulated = "";
      let gotDone = false;

      const timeout = setTimeout(() => reader.cancel(), 120000);
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of decoder.decode(value, { stream: true }).split("\n")) {
            if (!line.startsWith("data: ")) continue;
            try {
              const event = JSON.parse(line.slice(6));
              if (event.type === "chunk") accumulated += event.content;
              if (event.type === "replace") accumulated = event.content;
              if (event.type === "done") gotDone = true;
            } catch { /* skip */ }
          }
        }
      } finally {
        clearTimeout(timeout);
      }

      const bodyMatch = accumulated.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      const bodyText = bodyMatch
        ? bodyMatch[1].replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
        : "";

      if (gotDone && bodyText.length >= 100) {
        checks.push({
          name: "generate_stream",
          status: "pass",
          message: `Streamed ${accumulated.length} chars, ${bodyText.length} chars body content`,
          durationMs: Date.now() - start,
        });
      } else {
        checks.push({
          name: "generate_stream",
          status: "fail",
          message: `Stream ${gotDone ? "completed" : "never finished"}, body: ${bodyText.length} chars`,
          durationMs: Date.now() - start,
        });
      }
    } catch (err) {
      checks.push({
        name: "generate_stream",
        status: "fail",
        message: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - start,
      });
    }
  }

  const hasFail = checks.some((c) => c.status === "fail");

  // Alert via webhook if failures detected
  if (webhookUrl && hasFail) {
    try {
      await sendWebhookAlert(webhookUrl, checks);
    } catch {
      // Non-fatal
    }
  }

  return NextResponse.json({
    status: hasFail ? "unhealthy" : "healthy",
    timestamp: new Date().toISOString(),
    totalDurationMs: Date.now() - overallStart,
    checks,
  }, {
    status: hasFail ? 503 : 200,
    headers: { "Cache-Control": "no-store" },
  });
}

async function sendWebhookAlert(url: string, checks: CheckResult[]) {
  const failures = checks.filter((c) => c.status === "fail");
  const message = `🚨 Zoobicon Health Alert\n\n${failures.length} check(s) failed:\n${failures.map((f) => `• ${f.name}: ${f.message}`).join("\n")}\n\nTime: ${new Date().toISOString()}`;

  // Support both Slack-style and generic JSON webhooks
  const isSlack = url.includes("hooks.slack.com");
  const payload = isSlack
    ? { text: message }
    : { content: message, text: message, message };

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
