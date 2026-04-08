/**
 * POST /api/generate/react-stream
 *
 * Streams a Sandpack-ready React project as Server-Sent Events.
 * Built on the new primitives:
 *   - src/lib/anthropic-cached.ts        (callClaude / streamClaude)
 *   - src/lib/builder-critique.ts        (runQualityLoop)
 *   - src/lib/component-registry/index.ts (60-component registry)
 *
 * Event types emitted:
 *   phase     { phase, message }
 *   component { name, code, position }
 *   files     { files }
 *   score     { score, issues }
 *   error     { message, hint }
 *   done      { finalFiles, score, durationMs }
 *
 * Bible Law 8: every error path emits an "error" SSE event with a clear hint.
 */

import { NextRequest } from "next/server";
import { callClaude, streamClaude } from "@/lib/anthropic-cached";
import { runQualityLoop } from "@/lib/builder-critique";
import {
  needsBackend,
  detectBackendNeeds,
  generateBackend,
  generateSchemaPrompt,
} from "@/lib/backend-generator";
import { callLLMWithFailover, getAvailableProviders } from "@/lib/llm-provider";

export const maxDuration = 300;

type Mode = "fast" | "premium";

interface RequestBody {
  prompt: string;
  mode?: Mode;
}

interface SSEWriter {
  send: (event: string, data: unknown) => void;
  close: () => void;
}

function makeWriter(controller: ReadableStreamDefaultController<Uint8Array>): SSEWriter {
  const encoder = new TextEncoder();
  let closed = false;
  return {
    send(event, data) {
      if (closed) return;
      const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      try {
        controller.enqueue(encoder.encode(payload));
      } catch {
        closed = true;
      }
    },
    close() {
      if (closed) return;
      closed = true;
      try {
        controller.close();
      } catch {
        /* already closed */
      }
    },
  };
}

const MODEL_HAIKU = "claude-haiku-4-5";
const MODEL_SONNET = "claude-sonnet-4-6";

/** Build the cacheable registry catalog the planner sees. */
function buildRegistryCatalog(): string {
  const lines: string[] = [
    "ZOOBICON COMPONENT REGISTRY — pick the best variant per slot.",
    "",
  ];
  const cats = Array.from(new Set(REGISTRY.map((c) => c.category))).sort();
  for (const cat of cats) {
    lines.push(`## ${cat}`);
    for (const c of getByCategory(cat)) {
      lines.push(`- id="${c.id}" variant="${c.variant}" tags=[${c.tags.join(",")}] — ${c.description}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

const PLANNER_SYSTEM_CACHEABLE = `You are the section planner for the Zoobicon AI website builder.

Your job: pick the best component id for each slot in a website, drawn ONLY from the registry catalog provided below. You return JSON only.

Rules:
- Pick exactly one id per slot you include.
- Use slots that match the user's intent (a SaaS site needs pricing + logos; a restaurant needs gallery + contact).
- Order: navbar first, footer last. Hero second.
- Never invent ids. If a slot has no good fit, omit it.
- Output ONLY JSON, no prose, no markdown fences.

Schema:
{
  "brandName": "<short brand name inferred from prompt>",
  "primaryColor": "<hex>",
  "bgColor": "<hex>",
  "selections": [
    { "slot": "navbar|hero|features|stats|logos|testimonials|pricing|faq|cta|about|contact|gallery|blog|ecommerce|forms|footer|misc",
      "id": "<registry id>" }
  ]
}

REGISTRY CATALOG:
${buildRegistryCatalog()}`;

interface PlannerSelection {
  slot: string;
  id: string;
}

interface PlannerOutput {
  brandName?: string;
  primaryColor?: string;
  bgColor?: string;
  selections: PlannerSelection[];
}

function safeParseJson<T>(raw: string): T | null {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = (fenced ? fenced[1] : raw).trim();
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(body.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

interface PlanResult {
  components: RegistryComponent[];
  brandName: string;
  primaryColor: string;
  bgColor: string;
}

function inferBrandName(prompt: string): string {
  const m = prompt.match(/(?:called|named|for)\s+([A-Z][A-Za-z0-9]+)/);
  return m ? m[1] : "Northwind";
}

async function planComponents(prompt: string): Promise<PlanResult> {
  const res = await callClaude({
    model: MODEL_HAIKU,
    system: "Return only JSON matching the schema.",
    systemCacheable: PLANNER_SYSTEM_CACHEABLE,
    messages: [{ role: "user", content: `User prompt: ${prompt}` }],
    maxTokens: 1500,
    temperature: 0.4,
  });

  const text = res.content.map((c) => c.text ?? "").join("");
  const parsed = safeParseJson<PlannerOutput>(text);

  const resolved: RegistryComponent[] = [];
  if (parsed && Array.isArray(parsed.selections)) {
    for (const sel of parsed.selections) {
      const comp = getById(sel.id);
      if (comp) resolved.push(comp);
    }
  }

  if (resolved.length < 3) {
    const fallback = selectComponentsForPrompt(prompt);
    return {
      components: fallback,
      brandName: parsed?.brandName ?? inferBrandName(prompt),
      primaryColor: parsed?.primaryColor ?? "#4f46e5",
      bgColor: parsed?.bgColor ?? "#ffffff",
    };
  }

  return {
    components: resolved,
    brandName: parsed?.brandName ?? inferBrandName(prompt),
    primaryColor: parsed?.primaryColor ?? "#4f46e5",
    bgColor: parsed?.bgColor ?? "#ffffff",
  };
}

const CUSTOMISER_SYSTEM = `You customise a single React component for the Zoobicon AI website builder.

You receive:
- A base component file (TypeScript + Tailwind).
- A customisation brief (brand, voice, colors, copy direction).

Your job: rewrite the component, preserving its structure, exports, and Tailwind classes, but replacing all placeholder copy with real, specific, on-brand copy.

Hard rules:
- Output ONLY the full updated TypeScript file. No prose. No markdown fences.
- Keep the same default export name and signature.
- Keep imports identical unless you genuinely need a new one.
- Replace AI-slop words ("revolutionary", "unleash", "empower", "synergy", "next-generation", "game-changer", "leverage", "elevate", "seamless", "cutting-edge") with specific copy.
- Use real-sounding metrics, not "10,000+ users".
- Add aria-labels to icon-only buttons. Add alt text to images. Keep responsive classes.`;

interface CustomiseArgs {
  baseCode: string;
  brandName: string;
  category: ComponentCategory;
  variant: string;
  prompt: string;
  primaryColor: string;
  model: string;
}

function stripFencesAndWrap(raw: string): string {
  const m = raw.match(/```(?:tsx?|typescript)?\s*([\s\S]*?)```/);
  const code = (m ? m[1] : raw).trim();
  if (!code.includes("import React")) {
    return `import React from "react";\n\n${code}\n`;
  }
  return `${code}\n`;
}

async function customiseComponent(args: CustomiseArgs): Promise<string> {
  const userMsg =
    `BRAND: ${args.brandName}\n` +
    `PRIMARY COLOR: ${args.primaryColor}\n` +
    `SECTION: ${args.category} (${args.variant})\n` +
    `USER PROMPT: ${args.prompt}\n\n` +
    `BASE COMPONENT FILE:\n${args.baseCode}\n\n` +
    `Output the full updated TypeScript file only.`;

  let collected = "";
  for await (const delta of streamClaude({
    model: args.model,
    system: CUSTOMISER_SYSTEM,
    messages: [{ role: "user", content: userMsg }],
    maxTokens: 4000,
    temperature: 0.6,
  })) {
    if (delta.type === "text" && delta.text) {
      collected += delta.text;
    }
  }

  return stripFencesAndWrap(collected);
}

function buildPackageJson(): string {
  return JSON.stringify(
    {
      name: "zoobicon-generated-site",
      version: "1.0.0",
      private: true,
      dependencies: {
        react: "^18.3.1",
        "react-dom": "^18.3.1",
      },
    },
    null,
    2,
  );
}

        // ── Phase 3: Stream each component progressively ──
        // Build AI client — REQUIRED for customization. We need at least ONE
        // provider key (Anthropic, OpenAI, or Google). The customizer
        // prefers Anthropic first via the SDK, then cross-provider failover.
        const apiKey = process.env.ANTHROPIC_API_KEY;
        const availableProviders = getAvailableProviders();
        if (!apiKey && availableProviders.length === 0) {
          send({
            type: "error",
            message:
              "AI service is not configured. Set ANTHROPIC_API_KEY (or OPENAI_API_KEY / GOOGLE_AI_API_KEY) in your Vercel environment variables.",
          });
          send({ type: "done", files, dependencies: {} });
          controller.close();
          return;
        }
        // The Anthropic client is only used as the primary path. The
        // failover layer (callLLMWithFailover) handles OpenAI/Gemini.
        // If Anthropic key is missing we still proceed — Sonnet pass will
        // immediately fail and the failover layer will try other providers.
        const client = new Anthropic({
          apiKey: apiKey || "missing",
          timeout: 30000,
        });

function classifyError(err: unknown): { message: string; hint: string } {
  const e = err as { message?: string; status?: number } | undefined;
  const msg = e?.message ?? String(err);
  if (msg.includes("ANTHROPIC_API_KEY")) {
    return {
      message: msg,
      hint: "Set ANTHROPIC_API_KEY in Vercel environment variables, then redeploy.",
    };
  }
  if (e?.status === 429 || msg.includes("rate")) {
    return {
      message: msg,
      hint: "Anthropic rate limit hit — wait 30 seconds and try again, or upgrade your Anthropic plan.",
    };
  }
  if (e?.status === 401 || msg.includes("401")) {
    return {
      message: msg,
      hint: "ANTHROPIC_API_KEY is invalid. Rotate the key in the Anthropic console and update Vercel.",
    };
  }
  if (msg.includes("timeout") || msg.includes("ETIMEDOUT")) {
    return {
      message: msg,
      hint: "Upstream model timed out. Retry once — the route has a 300s budget.",
    };
  }
  return {
    message: msg,
    hint: "Check the server logs for the full stack trace. If this persists, run `npm run build` locally.",
  };
}

export async function POST(req: NextRequest): Promise<Response> {
  const startedAt = Date.now();

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return new Response(
      JSON.stringify({
        error: "Invalid JSON body. Expected { prompt: string, mode?: 'fast'|'premium' }",
      }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }

  const prompt = (body.prompt ?? "").trim();
  const mode: Mode = body.mode === "premium" ? "premium" : "fast";

        // ── Phase 3b: Customize ALL components in parallel. As each one
        // resolves, patch the shared files map and emit a partial event.
        // Track per-section results so we can surface partial AI failures
        // to the user (Law 8 — never silent failures).
        let customizedCount = 0;
        const failedSections: { category: string; reason: string }[] = [];

        const customizationPromises = components.map((comp, i) => {
          const fileName = fileNames[i];
          const label = SECTION_LABELS[comp.category] || comp.category;
          return customizeComponent(
            client,
            comp,
            promptTrimmed,
            i === 0
          ).then((result) => {
            customizedCount++;
            if (result.ok && result.code) {
              files[fileName] = `import React from "react";\n\n${result.code}\n`;
              files["App.tsx"] = registry.buildAppFile(addedComponents);
              send({
                type: "partial",
                files: { ...files },
                fileCount: totalComponents,
                totalComponents,
                latestFile: fileName,
                section: comp.category,
                customized: true,
                modelUsed: result.modelUsed,
              });
              send({
                type: "status",
                message: `Customized ${label} (${customizedCount}/${totalComponents})`,
                phase: "building",
                current: customizedCount,
                total: totalComponents,
                section: comp.category,
              });
            } else {
              const reason = result.reason || "AI customization unavailable";
              failedSections.push({ category: comp.category, reason });
              console.warn(
                `[react-stream] ${comp.category} fell back to template — ${reason}`
              );
              send({
                type: "status",
                message: `${label} kept as template — ${reason} (${customizedCount}/${totalComponents})`,
                phase: "building",
                current: customizedCount,
                total: totalComponents,
                section: comp.category,
                templateFallback: true,
                reason,
              });
            }
          });
        });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const writer = makeWriter(controller);

        // If MORE than half the sections fell back to template, this is a
        // user-visible failure. Surface it as a non-fatal warning so they
        // know exactly what happened and can retry. The site still renders.
        if (failedSections.length > 0) {
          const failureRate = failedSections.length / totalComponents;
          const unique = Array.from(new Set(failedSections.map((f) => f.reason)));
          const sample = unique[0] || "AI provider unavailable";
          const providers = getAvailableProviders();
          send({
            type: "warning",
            severity: failureRate >= 0.5 ? "high" : "low",
            message:
              failureRate >= 0.5
                ? `AI customization failed for ${failedSections.length}/${totalComponents} sections (${sample.slice(0, 80)}). Site rendered with template copy. ${
                    providers.length === 1
                      ? "Add OPENAI_API_KEY or GOOGLE_AI_API_KEY for automatic failover."
                      : "Try again in a moment."
                  }`
                : `${failedSections.length}/${totalComponents} sections kept template copy (${sample.slice(0, 60)}).`,
            failedSections: failedSections.map((f) => f.category),
            providersAvailable: providers,
          });
        }

        // ── Phase 4: Apply brand colors (already computed in parallel) ──
        send({
          type: "status",
          message: "Applying brand colors...",
          phase: "finalizing",
          current: totalComponents,
          total: totalComponents,
        });

        // ── PHASE 2: selecting ──
        writer.send("phase", {
          phase: "selecting",
          message: "Picking best components for each section…",
        });
        const { components, brandName, primaryColor, bgColor } = await planComponents(prompt);

        const files: Record<string, string> = {
          "package.json": buildPackageJson(),
          "tailwind.config.js": buildTailwindConfig(),
          "styles.css": buildStylesFile({ primaryColor, bgColor }),
          "App.tsx": buildAppFile([]),
        };
        writer.send("files", { files });

        // ── PHASE 3: generating ──
        writer.send("phase", {
          phase: "generating",
          message: `Customising ${components.length} components for ${brandName}…`,
        });

        const customiserModel = mode === "premium" ? MODEL_SONNET : MODEL_HAIKU;
        const accumulated: RegistryComponent[] = [];

        for (let i = 0; i < components.length; i++) {
          const comp = components[i];
          let updatedCode: string;
          try {
            // Generate schema SQL via AI if we need a database. Tries
            // Anthropic first, then falls back across providers so the
            // schema still appears even when Anthropic is rate-limited.
            let schemaSQL: string | undefined;
            if (backendNeeds.database) {
              const schemaSystem =
                "You are a PostgreSQL database architect. Output ONLY valid SQL. No markdown fences, no explanation.";
              const schemaUser = generateSchemaPrompt(promptTrimmed);

              const stripFences = (raw: string): string =>
                raw.replace(/^```(?:sql)?\n?/, "").replace(/\n?```$/, "").trim();

              // Pass 1 — direct Anthropic Haiku
              if (apiKey) {
                try {
                  const schemaResponse = await client.messages.create({
                    model: "claude-haiku-4-5-20251001",
                    max_tokens: 4096,
                    system: schemaSystem,
                    messages: [{ role: "user", content: schemaUser }],
                  });
                  const sqlText =
                    schemaResponse.content.find(
                      (b: Anthropic.ContentBlock) => b.type === "text"
                    )?.text || "";
                  schemaSQL = stripFences(sqlText);
                } catch (schemaErr) {
                  console.warn(
                    `[react-stream] Schema generation (Haiku) failed: ${
                      schemaErr instanceof Error ? schemaErr.message : "unknown"
                    }`
                  );
                }
              }

              // Pass 2 — cross-provider failover if pass 1 didn't yield SQL
              if (!schemaSQL) {
                try {
                  const fb = await callLLMWithFailover({
                    model: "claude-sonnet-4-6",
                    system: schemaSystem,
                    userMessage: schemaUser,
                    maxTokens: 4096,
                  });
                  schemaSQL = stripFences(fb.text);
                } catch (schemaErr) {
                  console.warn(
                    `[react-stream] Schema generation failover failed: ${
                      schemaErr instanceof Error ? schemaErr.message : "unknown"
                    }`
                  );
                }
              }

              if (schemaSQL) {
                files["setup/migration.sql"] = schemaSQL;
                send({
                  type: "partial",
                  files: { ...files },
                  fileCount: totalComponents,
                  totalComponents,
                  latestFile: "setup/migration.sql",
                  section: "backend",
                });
              }
            }

          const { fileName } = buildComponentFile(comp);
          files[fileName] = updatedCode;
          accumulated.push(comp);
          files["App.tsx"] = buildAppFile(accumulated);

          writer.send("component", {
            name: comp.id,
            code: updatedCode,
            position: i,
          });
        }

        writer.send("files", { files });

        // ── PHASE 4: critique loop (premium only) ──
        let finalFiles = files;
        let finalScore = 0;

        if (mode === "premium") {
          try {
            writer.send("phase", {
              phase: "critiquing",
              message: "Running $100K quality critique…",
            });
            const loop = await runQualityLoop({
              files,
              originalPrompt: prompt,
              maxPasses: 2,
            });
            finalFiles = loop.finalFiles;
            finalScore = loop.finalScore;

            const lastCritique = loop.history[loop.history.length - 1];
            writer.send("score", {
              score: finalScore,
              issues: lastCritique?.issues ?? [],
            });

            if (loop.passes > 1) {
              writer.send("phase", {
                phase: "refining",
                message: `Refined ${loop.passes - 1} time(s) — final score ${finalScore}/100`,
              });
            }
            writer.send("files", { files: finalFiles });
          } catch (err) {
            const { message, hint } = classifyError(err);
            writer.send("error", {
              message: `Critique loop failed: ${message}`,
              hint: `${hint} The unrefined site is still usable.`,
            });
          }
        }

        // ── PHASE 5: done ──
        writer.send("phase", { phase: "done", message: "Build complete." });
        writer.send("done", {
          finalFiles,
          score: finalScore,
          durationMs: Date.now() - startedAt,
        });
        writer.close();
      } catch (err) {
        const { message, hint } = classifyError(err);
        writer.send("error", { message, hint });
        writer.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}

// ── Per-Component AI Customization ──

/**
 * Customize result — either succeeds with the new code, or fails with a reason.
 * Never silent. The streaming endpoint surfaces the reason to the user.
 */
export interface CustomizeResult {
  ok: boolean;
  code: string | null;
  reason?: string;
  modelUsed?: string;
}

/**
 * Customize a single component's content. Tries Haiku first, then falls back
 * across Anthropic models AND cross-provider (OpenAI/Gemini) via
 * callLLMWithFailover. Never throws — always returns a CustomizeResult so
 * callers can surface partial failures to the user (Law 8 — never silent).
 */
async function customizeComponent(
  client: Anthropic,
  component: { category: string; variant: string; code: string; description: string },
  businessPrompt: string,
  isFirstComponent: boolean
): Promise<CustomizeResult> {
  const systemPrompt = `You are a senior product designer + copywriter customizing a premium React component for a specific business. Your output must look like a $100K agency built it — not a template fill.

OUTPUT RULES:
- Output ONLY the updated React component code. No imports, no markdown fences, no explanation.
- Do NOT add imports — the caller handles imports.
- Keep the same default export function name.
- You MAY tighten/extend className strings to add the design upgrades below — but never break the layout's responsive grid or remove existing structural divs.

COPY RULES (this is what users actually read — make it world-class):
- Headlines: punchy, specific, benefit-led. NO marketing fluff like "revolutionary", "cutting-edge", "next-generation", "unleash", "empower". Use concrete nouns + verbs.
- Subheads: 1 sentence, max 18 words, names a real outcome.
- Feature copy: lead with the user benefit, not the feature name. "Ship in 30 seconds" not "Ultra-fast deployment".
- Testimonials: specific person + role + company + quantified result ("cut onboarding from 3 weeks to 2 days", "$1.4M ARR in 90 days"). Real-sounding names, real-sounding companies.
- CTA buttons: action verbs ("Start free", "See it live", "Book a demo"). Never "Learn more" or "Get started" alone.
- Stats: precise numbers with context ("99.97% uptime", "47ms median response", "12,400+ teams").

DESIGN UPGRADE RULES (apply where the existing className already supports it):
- Headlines: prefer text-balance, tracking-tight, gradient text via bg-clip-text where the variant uses dark backgrounds.
- Buttons: must include hover:scale-[1.02] active:scale-[0.98] transition-transform when they don't already.
- Cards: must include hover:-translate-y-0.5 transition-all duration-300 when they don't already.
- Icons: pick the MOST evocative lucide icon for the business (Sparkles, Zap, Rocket, ShieldCheck, TrendingUp, Layers, Workflow, etc.) — never generic Circle/Square.
- Trust signals: when the component has a logo strip / metrics row / "trusted by" area, fill it with believable enterprise names + real-sounding metrics.

NEVER:
- Use lorem ipsum, "Lorem", "Acme", "Company Name", "Your Business", or any obvious placeholder.
- Output empty href="#" without descriptive aria-label.
- Leave any string in the original placeholder language. Every visible string must be customized for THIS business.`;

  const userMessage = `Business: ${businessPrompt}

This is a ${component.category} component (${component.variant} variant): ${component.description}

${isFirstComponent ? "This is the first section visitors see — make the content especially compelling." : ""}

Current code:
${component.code}

Return ONLY the updated component code with customized content. Same structure, new text.`;

  // Sanitize/validate AI text into a usable component file
  const sanitize = (text: string): string | null => {
    if (!text || !text.trim()) return null;
    let code = text.trim();
    if (code.startsWith("```")) {
      code = code.replace(/^```(?:tsx?|jsx?|javascript|typescript)?\n?/, "").replace(/\n?```$/, "");
    }
    code = code
      .split("\n")
      .filter((line: string) => !line.trim().startsWith("import "))
      .join("\n")
      .trim();
    if (!code.includes("export default") && !code.includes("function")) {
      return null;
    }
    return code;
  };

  // Pass 1 — Anthropic Haiku via the direct SDK (fast & cheap)
  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const text =
      response.content.find(
        (b: Anthropic.ContentBlock) => b.type === "text"
      )?.text || "";

    const code = sanitize(text);
    if (code) return { ok: true, code, modelUsed: "claude-haiku-4-5" };
    console.warn(
      `[react-stream] Haiku returned unusable output for ${component.category}/${component.variant} (${text.length} chars)`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(
      `[react-stream] Haiku failed for ${component.category}/${component.variant}: ${msg}`
    );
  }

  // Pass 2 — Cross-provider failover (Anthropic Sonnet → OpenAI → Gemini)
  // callLLMWithFailover handles the chain and skips providers without API keys.
  try {
    const fb = await callLLMWithFailover({
      model: "claude-sonnet-4-6",
      system: systemPrompt,
      userMessage,
      maxTokens: 4096,
    });
    const code = sanitize(fb.text);
    if (code) {
      console.log(
        `[react-stream] Customized ${component.category} via fallback ${fb.provider}/${fb.model}`
      );
      return { ok: true, code, modelUsed: fb.model };
    }
    return {
      ok: false,
      code: null,
      reason: `Fallback model ${fb.model} returned unusable output`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(
      `[react-stream] All AI providers failed for ${component.category}: ${msg}`
    );
    return { ok: false, code: null, reason: msg };
  }
}

/**
 * Quick AI call to determine appropriate brand colors for the business.
 * Tries Haiku first then falls back across providers. Returns null only when
 * every provider has been exhausted (caller falls back to defaults + warns).
 */
async function determineBrandColors(
  client: Anthropic,
  businessPrompt: string
): Promise<{ primary: string; bg: string } | null> {
  const systemPrompt =
    'Given a business description, return a JSON object with "primary" (brand accent color hex) and "bg" (background color hex, usually #ffffff or #f9fafb). Tech = blue/indigo, health = green/teal, food = warm/amber, luxury = dark/gold, creative = purple/pink. Output ONLY JSON, no explanation.';

  const parseColors = (text: string): { primary: string; bg: string } | null => {
    if (!text) return null;
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace <= firstBrace) return null;
    try {
      const colors = JSON.parse(text.slice(firstBrace, lastBrace + 1));
      if (colors && typeof colors.primary === "string" && typeof colors.bg === "string") {
        return { primary: colors.primary, bg: colors.bg };
      }
    } catch (parseErr) {
      console.warn(
        `[react-stream] Brand color JSON parse failed: ${parseErr instanceof Error ? parseErr.message : "unknown"}`
      );
    }
    return null;
  };

  // Pass 1 — Haiku via direct SDK
  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: systemPrompt,
      messages: [{ role: "user", content: businessPrompt }],
    });

    const text =
      response.content.find(
        (b: Anthropic.ContentBlock) => b.type === "text"
      )?.text || "";

    const colors = parseColors(text);
    if (colors) return colors;
  } catch (err) {
    console.warn(
      `[react-stream] Brand color (Haiku) failed: ${err instanceof Error ? err.message : "unknown"}`
    );
  }

  // Pass 2 — cross-provider failover
  try {
    const fb = await callLLMWithFailover({
      model: "claude-sonnet-4-6",
      system: systemPrompt,
      userMessage: businessPrompt,
      maxTokens: 200,
    });
    const colors = parseColors(fb.text);
    if (colors) return colors;
  } catch (err) {
    console.warn(
      `[react-stream] Brand color failover failed: ${err instanceof Error ? err.message : "unknown"}`
    );
  }

  return null;
}

/**
 * Wrap the App.tsx code with AuthProvider if auth is needed.
 * Adds the import and wraps the return JSX.
 */
function wrapAppWithAuth(appCode: string, useSupabase: boolean): string {
  // Add AuthProvider import at the top
  const authImport = `import { AuthProvider } from './components/AuthProvider';\n`;

  // Check if already wrapped
  if (appCode.includes("AuthProvider")) return appCode;

  // Add import after the last import line
  const lines = appCode.split("\n");
  let lastImportIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("import ")) lastImportIdx = i;
  }

  if (lastImportIdx >= 0) {
    lines.splice(lastImportIdx + 1, 0, authImport);
  } else {
    lines.unshift(authImport);
  }

  // Wrap the return JSX with <AuthProvider>
  let code = lines.join("\n");

  // Find the return ( ... ) and wrap its content
  // Match: return ( <div ...> ... </div> )
  code = code.replace(
    /return\s*\(\s*\n(\s*)<(div|main|section)/,
    `return (\n$1<AuthProvider>\n$1<$2`
  );

  // Find the closing of the return
  // Look for the last </div> or </main> or </section> before the closing )
  const returnMatch = code.match(/return\s*\(/);
  if (returnMatch) {
    // Find matching close — wrap the outermost element
    // Simple approach: add </AuthProvider> before the last closing paren of return
    code = code.replace(
      /(\s*<\/(div|main|section)>\s*)\)/,
      `$1</AuthProvider>\n  )`
    );
  }

  return code;
}
