/**
 * Streaming React Generation via Component Registry
 *
 * Progressive streaming — each component appears in the preview as soon as it's ready:
 *   1. Select components from registry based on prompt (<1 second)
 *   2. Send styles + empty App.tsx shell immediately
 *   3. For each component (navbar → hero → features → ...):
 *      a. Send the raw component file (appears instantly in preview)
 *      b. AI customizes content for that section in parallel
 *      c. Send updated component with custom content
 *   4. Total: <30 seconds for a complete, polished, customized site
 *
 * The user watches the site build itself: navbar first, then hero, then features, etc.
 */

import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  authenticateRequest,
  checkUsageQuota,
  trackUsage,
} from "@/lib/auth-guard";
import {
  needsBackend,
  detectBackendNeeds,
  generateBackend,
  generateSchemaPrompt,
} from "@/lib/backend-generator";
import { callLLMWithFailover, getAvailableProviders } from "@/lib/llm-provider";

export const maxDuration = 300;

// Lazy-load the component registry to avoid circular initialization at build time.
async function getRegistry() {
  const mod = await import("@/lib/component-registry");
  return mod;
}

/** Human-readable label for progress messages */
const SECTION_LABELS: Record<string, string> = {
  navbar: "navigation bar",
  hero: "hero section",
  features: "features section",
  about: "about section",
  testimonials: "testimonials",
  stats: "statistics section",
  faq: "FAQ section",
  cta: "call to action",
  footer: "footer",
  contact: "contact section",
  gallery: "gallery",
  blog: "blog section",
  pricing: "pricing section",
  ecommerce: "e-commerce section",
  forms: "form section",
};

export async function POST(req: NextRequest) {
  // Auth
  const auth = await authenticateRequest(req, {
    requireAuth: true,
    requireVerified: true,
  });
  if (auth.error) return auth.error;

  const quota = await checkUsageQuota(
    auth.user!.email,
    auth.user!.plan,
    "generation"
  );
  if (quota.error) return quota.error;

  let body: { prompt?: string; fullStack?: boolean };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { prompt, fullStack } = body;
  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    return Response.json({ error: "Prompt required" }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Accumulated file state — grows as each component is added
      let files: Record<string, string> = {};
      let backendDeps: Record<string, string> = {};

      try {
        const registry = await getRegistry();
        const promptTrimmed = prompt.trim();

        // ── Phase 1: Select components from registry (<1ms) ──
        const components = registry.selectComponentsForPrompt(promptTrimmed);
        const totalComponents = components.length;

        send({
          type: "status",
          message: `Selected ${totalComponents} sections — building your site...`,
          phase: "selecting",
        });

        // ── Phase 2: Send styles.css + skeleton App.tsx immediately ──
        files["styles.css"] = registry.buildStylesFile();
        files["App.tsx"] = registry.buildAppFile([]);
        send({
          type: "partial",
          files: { ...files },
          fileCount: 0,
          totalComponents,
          latestFile: "styles.css",
        });

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

        // Track which components have been added so far (for incremental App.tsx)
        const addedComponents: typeof components = [];

        // Start brand colors determination in parallel with component streaming
        const colorsPromise = determineBrandColors(client, promptTrimmed).catch((err) => {
          console.warn("[react-stream] Brand color detection failed, using defaults:", err);
          return null;
        });

        // ── Phase 3a: Sequentially deliver raw scaffolds so the user sees
        // the full skeleton build up (navbar → hero → features → ...) in <2s.
        const fileNames: string[] = [];
        for (let i = 0; i < components.length; i++) {
          const comp = components[i];
          const stepNumber = i + 1;

          const { fileName, code } = registry.buildComponentFile(comp);
          fileNames.push(fileName);
          files[fileName] = code;
          addedComponents.push(comp);
          files["App.tsx"] = registry.buildAppFile(addedComponents);

          send({
            type: "partial",
            files: { ...files },
            fileCount: stepNumber,
            totalComponents,
            latestFile: fileName,
            section: comp.category,
          });
        }

        send({
          type: "status",
          message: `Customizing ${totalComponents} sections in parallel...`,
          phase: "building",
          current: 0,
          total: totalComponents,
        });

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

        await Promise.allSettled(customizationPromises);

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

        const colors = await colorsPromise;
        if (colors) {
          files["styles.css"] = registry.buildStylesFile({
            primaryColor: colors.primary,
            bgColor: colors.bg,
          });
          send({
            type: "partial",
            files: { ...files },
            fileCount: totalComponents,
            totalComponents,
            latestFile: "styles.css",
            customized: true,
          });
        }

        // ── Phase 5: Backend Generation (if full-stack mode) ──
        const wantsBackend = fullStack || needsBackend(promptTrimmed);

        if (wantsBackend) {
          const backendNeeds = detectBackendNeeds(promptTrimmed);
          const needsList = Object.entries(backendNeeds)
            .filter(([, v]) => v)
            .map(([k]) => k);

          send({
            type: "status",
            message: `Setting up backend (${needsList.join(", ")})...`,
            phase: "backend",
            current: totalComponents,
            total: totalComponents,
          });

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

            // Provision Supabase (or fall back to localStorage)
            const appName = promptTrimmed.slice(0, 40).replace(/[^a-zA-Z0-9 ]/g, "").trim() || "app";
            const backendResult = await generateBackend(
              appName,
              promptTrimmed,
              auth.user!.email,
              schemaSQL,
            );

            // Merge backend files into the build
            for (const [filePath, code] of Object.entries(backendResult.files)) {
              files[filePath] = code;
            }
            backendDeps = backendResult.dependencies;

            // Update App.tsx to wrap with AuthProvider if auth is needed
            if (backendResult.needs.auth && files["App.tsx"]) {
              files["App.tsx"] = wrapAppWithAuth(files["App.tsx"], backendResult.provisioned);
            }

            send({
              type: "partial",
              files: { ...files },
              fileCount: totalComponents,
              totalComponents,
              latestFile: "lib/" + (backendResult.provisioned ? "supabase.ts" : "backend.ts"),
              section: "backend",
              customized: true,
            });

            const modeLabel = backendResult.provisioned
              ? "Supabase (real Postgres + auth + storage)"
              : "Local mode (localStorage — deploy to Zoobicon Cloud for real database)";

            send({
              type: "status",
              message: `Backend ready — ${modeLabel}`,
              phase: "backend",
              current: totalComponents,
              total: totalComponents,
              backendProvisioned: backendResult.provisioned,
              backendNeeds: backendResult.needs,
            });
          } catch (backendErr) {
            const msg = backendErr instanceof Error ? backendErr.message : "Unknown error";
            console.error("[react-stream] Backend generation failed:", msg);
            send({
              type: "status",
              message: `Backend setup skipped (${msg.slice(0, 60)}) — site works as frontend-only`,
              phase: "backend",
              current: totalComponents,
              total: totalComponents,
            });
          }
        }

        send({
          type: "status",
          message: "Site ready",
          phase: "complete",
          current: totalComponents,
          total: totalComponents,
        });

        // Track usage
        trackUsage(auth.user!.email, "generation").catch(() => {});
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Generation failed";
        send({ type: "error", message });
      }

      // Always close cleanly with the final file set + any backend dependencies
      send({ type: "done", files, dependencies: backendDeps });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
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
