import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/debug/pipeline — Pipeline diagnostic crawler
 *
 * Runs a minimal test through each pipeline stage and reports exactly
 * where things succeed, fail, or hang. Returns detailed timing and
 * error info for every step.
 *
 * Query params:
 *   ?prompt=...  — Custom test prompt (default: simple coffee shop site)
 *   ?stage=all   — Which stages to test: "all", "planner", "developer", "enhancer"
 */

export const maxDuration = 300;

interface StepResult {
  step: string;
  model: string;
  status: "pass" | "fail" | "skip";
  durationMs: number;
  outputChars: number;
  error?: string;
  details?: string;
}

export async function GET(req: NextRequest) {
  const steps: StepResult[] = [];
  const overallStart = Date.now();
  const stage = req.nextUrl.searchParams.get("stage") || "all";
  const testPrompt = req.nextUrl.searchParams.get("prompt") || "A simple one-page website for a coffee shop called Bean & Brew in Auckland. Include hero, menu highlights, about section, and footer.";

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      status: "fail",
      error: "AI service is temporarily unavailable.",
      steps: [],
    }, { status: 500 });
  }

  const client = new Anthropic({ apiKey, timeout: 90_000 });

  // ── Step 1: Test Haiku (planner model) ──
  let strategyOutput = "";
  if (stage === "all" || stage === "planner") {
    const s1Start = Date.now();
    try {
      const res = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        system: "You are a website strategist. Given a brief, output a short JSON strategy with keys: targetAudience, tone, colorPalette, sections. Output ONLY valid JSON.",
        messages: [{ role: "user", content: `Brief: ${testPrompt}` }],
      });
      const text = res.content.find((b) => b.type === "text")?.text || "";
      strategyOutput = text;
      const hasJSON = text.includes("{");
      steps.push({
        step: "1. Strategist (Haiku)",
        model: "claude-haiku-4-5-20251001",
        status: hasJSON ? "pass" : "fail",
        durationMs: Date.now() - s1Start,
        outputChars: text.length,
        details: hasJSON ? `JSON strategy received (${text.length} chars)` : `No JSON in output: "${text.substring(0, 200)}"`,
      });
    } catch (err) {
      steps.push({
        step: "1. Strategist (Haiku)",
        model: "claude-haiku-4-5-20251001",
        status: "fail",
        durationMs: Date.now() - s1Start,
        outputChars: 0,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    // ── Step 2: Test Haiku parallel (Brand + Copywriter) ──
    const s2Start = Date.now();
    try {
      const [brandRes, copyRes] = await Promise.all([
        client.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 2048,
          system: "You are a brand designer. Output a short JSON with: primaryColor, secondaryColor, fontHeading, fontBody, style. ONLY valid JSON.",
          messages: [{ role: "user", content: `Strategy: ${strategyOutput}\nBrief: ${testPrompt}` }],
        }),
        client.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 2048,
          system: "You are a copywriter. Output a short JSON with keys: headline, subheadline, ctaText, aboutText. ONLY valid JSON.",
          messages: [{ role: "user", content: `Strategy: ${strategyOutput}\nBrief: ${testPrompt}` }],
        }),
      ]);
      const brandText = brandRes.content.find((b) => b.type === "text")?.text || "";
      const copyText = copyRes.content.find((b) => b.type === "text")?.text || "";
      steps.push({
        step: "2. Brand + Copywriter (Haiku, parallel)",
        model: "claude-haiku-4-5-20251001",
        status: brandText && copyText ? "pass" : "fail",
        durationMs: Date.now() - s2Start,
        outputChars: brandText.length + copyText.length,
        details: `Brand: ${brandText.length} chars, Copy: ${copyText.length} chars`,
      });
    } catch (err) {
      steps.push({
        step: "2. Brand + Copywriter (Haiku, parallel)",
        model: "claude-haiku-4-5-20251001",
        status: "fail",
        durationMs: Date.now() - s2Start,
        outputChars: 0,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    // ── Step 3: Test Haiku (Architect) ──
    const s3Start = Date.now();
    try {
      const res = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        system: "You are a web architect. Output a short JSON with: sections (array of section names in order), layout (string). ONLY valid JSON.",
        messages: [{ role: "user", content: `Brief: ${testPrompt}` }],
      });
      const text = res.content.find((b) => b.type === "text")?.text || "";
      steps.push({
        step: "3. Architect (Haiku)",
        model: "claude-haiku-4-5-20251001",
        status: text.includes("{") ? "pass" : "fail",
        durationMs: Date.now() - s3Start,
        outputChars: text.length,
      });
    } catch (err) {
      steps.push({
        step: "3. Architect (Haiku)",
        model: "claude-haiku-4-5-20251001",
        status: "fail",
        durationMs: Date.now() - s3Start,
        outputChars: 0,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  } else {
    steps.push({ step: "1-3. Planner agents", model: "haiku", status: "skip", durationMs: 0, outputChars: 0 });
  }

  // ── Step 4: Test Opus (Developer — the critical one) ──
  let devHtml = "";
  if (stage === "all" || stage === "developer") {
    const s4Start = Date.now();
    try {
      const res = await client.messages.create({
        model: "claude-opus-4-6",
        max_tokens: 8192,
        system: "You are a web developer. Build a simple but complete HTML page. Output ONLY raw HTML starting with <!DOCTYPE html>. Include a nav, hero, one content section, and footer. Use inline styles. No code fences.",
        messages: [{ role: "user", content: `Build a simple page for: ${testPrompt}\n\nIMPORTANT: Start your response IMMEDIATELY with <!DOCTYPE html>. Output raw HTML only.` }],
      });
      const text = res.content.find((b) => b.type === "text")?.text || "";
      devHtml = text;
      const hasDoctype = /<!doctype/i.test(text);
      const hasBody = /<body/i.test(text);
      const bodyMatch = text.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      const bodyChars = bodyMatch
        ? bodyMatch[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().length
        : 0;

      steps.push({
        step: "4. Developer (Opus) — THE CRITICAL STEP",
        model: "claude-opus-4-6",
        status: hasBody && bodyChars > 50 ? "pass" : "fail",
        durationMs: Date.now() - s4Start,
        outputChars: text.length,
        details: `DOCTYPE: ${hasDoctype}, <body>: ${hasBody}, body text: ${bodyChars} chars, stop: ${res.stop_reason}`,
        ...(bodyChars <= 50 ? { error: `Body only has ${bodyChars} visible chars — likely empty page` } : {}),
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      steps.push({
        step: "4. Developer (Opus) — THE CRITICAL STEP",
        model: "claude-opus-4-6",
        status: "fail",
        durationMs: Date.now() - s4Start,
        outputChars: 0,
        error: errMsg,
      });

      // Try Sonnet fallback
      const s4bStart = Date.now();
      try {
        const fallbackRes = await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 8192,
          system: "You are a web developer. Build a simple but complete HTML page. Output ONLY raw HTML starting with <!DOCTYPE html>. Include a nav, hero, one content section, and footer. Use inline styles. No code fences.",
          messages: [{ role: "user", content: `Build a simple page for: ${testPrompt}\n\nIMPORTANT: Start your response IMMEDIATELY with <!DOCTYPE html>. Output raw HTML only.` }],
        });
        const text = fallbackRes.content.find((b) => b.type === "text")?.text || "";
        devHtml = text;
        const bodyMatch = text.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        const bodyChars = bodyMatch
          ? bodyMatch[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().length
          : 0;
        steps.push({
          step: "4b. Developer FALLBACK (Sonnet)",
          model: "claude-sonnet-4-6",
          status: bodyChars > 50 ? "pass" : "fail",
          durationMs: Date.now() - s4bStart,
          outputChars: text.length,
          details: `Sonnet fallback: body text ${bodyChars} chars`,
        });
      } catch (fallbackErr) {
        steps.push({
          step: "4b. Developer FALLBACK (Sonnet)",
          model: "claude-sonnet-4-6",
          status: "fail",
          durationMs: Date.now() - s4bStart,
          outputChars: 0,
          error: fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr),
        });
      }
    }
  } else {
    steps.push({ step: "4. Developer", model: "opus", status: "skip", durationMs: 0, outputChars: 0 });
  }

  // ── Step 5: Test Sonnet (Enhancement agent) ──
  if ((stage === "all" || stage === "enhancer") && devHtml) {
    const s5Start = Date.now();
    try {
      const htmlSnippet = devHtml.substring(0, 4000); // Don't send full HTML, just enough to test
      const res = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        system: "You are an SEO specialist. Output ONLY a JSON object with keys: title, description, ogTags (array). No HTML, just JSON.",
        messages: [{ role: "user", content: `Analyze this HTML and suggest SEO improvements:\n\n${htmlSnippet}` }],
      });
      const text = res.content.find((b) => b.type === "text")?.text || "";
      steps.push({
        step: "5. Enhancement agent (Sonnet) — SEO test",
        model: "claude-sonnet-4-6",
        status: text.length > 10 ? "pass" : "fail",
        durationMs: Date.now() - s5Start,
        outputChars: text.length,
      });
    } catch (err) {
      steps.push({
        step: "5. Enhancement agent (Sonnet) — SEO test",
        model: "claude-sonnet-4-6",
        status: "fail",
        durationMs: Date.now() - s5Start,
        outputChars: 0,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // ── Step 6: Test full pipeline endpoint ──
  if (stage === "all") {
    const s6Start = Date.now();
    try {
      const pipelineRes = await fetch(new URL("/api/generate/pipeline", req.url).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: testPrompt, tier: "standard" }),
      });

      if (pipelineRes.ok) {
        const data = await pipelineRes.json();
        const html = data.html || "";
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        const bodyChars = bodyMatch
          ? bodyMatch[1].replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().length
          : 0;
        const agentInfo = (data.agents || []).map((a: { name: string; duration: number }) =>
          `${a.name}: ${(a.duration / 1000).toFixed(1)}s`
        ).join(", ");

        steps.push({
          step: "6. FULL PIPELINE (end-to-end)",
          model: "pipeline",
          status: bodyChars >= 100 ? "pass" : "fail",
          durationMs: Date.now() - s6Start,
          outputChars: html.length,
          details: `${data.agentCount} agents, total ${(data.totalDuration / 1000).toFixed(1)}s, body: ${bodyChars} chars | ${agentInfo}`,
          ...(bodyChars < 100 ? { error: `Pipeline returned only ${bodyChars} body chars` } : {}),
        });
      } else {
        const errData = await pipelineRes.json().catch(() => ({ error: "Unknown" }));
        steps.push({
          step: "6. FULL PIPELINE (end-to-end)",
          model: "pipeline",
          status: "fail",
          durationMs: Date.now() - s6Start,
          outputChars: 0,
          error: `HTTP ${pipelineRes.status}: ${errData.error}`,
        });
      }
    } catch (err) {
      steps.push({
        step: "6. FULL PIPELINE (end-to-end)",
        model: "pipeline",
        status: "fail",
        durationMs: Date.now() - s6Start,
        outputChars: 0,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const failedSteps = steps.filter((s) => s.status === "fail");
  const passedSteps = steps.filter((s) => s.status === "pass");

  return NextResponse.json({
    status: failedSteps.length === 0 ? "healthy" : "failing",
    summary: `${passedSteps.length}/${steps.filter(s => s.status !== "skip").length} steps passed`,
    totalDurationMs: Date.now() - overallStart,
    totalDurationSec: ((Date.now() - overallStart) / 1000).toFixed(1),
    failedSteps: failedSteps.map((s) => `${s.step}: ${s.error || s.details}`),
    steps,
  }, {
    status: failedSteps.length === 0 ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
