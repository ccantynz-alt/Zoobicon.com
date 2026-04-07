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
        // Build AI client — REQUIRED for customization
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          send({
            type: "error",
            message: "AI service is not configured. Please contact support or check that ANTHROPIC_API_KEY is set.",
          });
          send({ type: "done", files, dependencies: {} });
          controller.close();
          return;
        }
        const client = new Anthropic({ apiKey, timeout: 30000 });

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
        let customizedCount = 0;
        const customizationPromises = components.map((comp, i) => {
          const fileName = fileNames[i];
          const label = SECTION_LABELS[comp.category] || comp.category;
          return customizeComponent(
            client,
            comp,
            promptTrimmed,
            i === 0
          )
            .then((customized) => {
              customizedCount++;
              if (customized) {
                files[fileName] = `import React from "react";\n\n${customized}\n`;
                files["App.tsx"] = registry.buildAppFile(addedComponents);
                send({
                  type: "partial",
                  files: { ...files },
                  fileCount: totalComponents,
                  totalComponents,
                  latestFile: fileName,
                  section: comp.category,
                  customized: true,
                });
              }
              send({
                type: "status",
                message: `Customizing (${customizedCount}/${totalComponents})...`,
                phase: "building",
                current: customizedCount,
                total: totalComponents,
                section: comp.category,
              });
            })
            .catch((err) => {
              customizedCount++;
              const msg = err instanceof Error ? err.message : "Unknown error";
              console.error(
                `[react-stream] Customization failed for ${comp.category}: ${msg}`
              );
              send({
                type: "status",
                message: `${label} loaded (AI customization unavailable — using template) (${customizedCount}/${totalComponents})`,
                phase: "building",
                current: customizedCount,
                total: totalComponents,
                section: comp.category,
              });
            });
        });

        await Promise.allSettled(customizationPromises);

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
            // Generate schema SQL via AI if we have a client and need a database
            let schemaSQL: string | undefined;
            if (client && backendNeeds.database) {
              try {
                const schemaResponse = await client.messages.create({
                  model: "claude-haiku-4-5-20251001",
                  max_tokens: 4096,
                  system: "You are a PostgreSQL database architect. Output ONLY valid SQL. No markdown fences, no explanation.",
                  messages: [
                    {
                      role: "user",
                      content: generateSchemaPrompt(promptTrimmed),
                    },
                  ],
                });

                const sqlText =
                  schemaResponse.content.find(
                    (b: Anthropic.ContentBlock) => b.type === "text"
                  )?.text || "";

                // Strip markdown fences if present
                schemaSQL = sqlText
                  .replace(/^```(?:sql)?\n?/, "")
                  .replace(/\n?```$/, "")
                  .trim();

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
              } catch (schemaErr) {
                console.warn("[react-stream] Schema generation failed:", schemaErr);
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
 * Customize a single component's content using Haiku (fast, cheap).
 * Returns the updated component code, or null if customization fails.
 */
async function customizeComponent(
  client: Anthropic,
  component: { category: string; variant: string; code: string; description: string },
  businessPrompt: string,
  isFirstComponent: boolean
): Promise<string | null> {
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

    if (!text.trim()) return null;

    // Strip any markdown fences the model might have added
    let code = text.trim();
    if (code.startsWith("```")) {
      code = code.replace(/^```(?:tsx?|jsx?|javascript|typescript)?\n?/, "").replace(/\n?```$/, "");
    }

    // Strip any import lines the model might have added (we handle imports ourselves)
    code = code
      .split("\n")
      .filter((line) => !line.startsWith("import "))
      .join("\n")
      .trim();

    // Basic validation: must contain "export default" or "function"
    if (!code.includes("export default") && !code.includes("function")) {
      return null;
    }

    return code;
  } catch {
    return null;
  }
}

/**
 * Quick AI call to determine appropriate brand colors for the business.
 * Returns { primary, secondary, bg, text } hex colors.
 */
async function determineBrandColors(
  client: Anthropic,
  businessPrompt: string
): Promise<{ primary: string; bg: string } | null> {
  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system:
        'Given a business description, return a JSON object with "primary" (brand accent color hex) and "bg" (background color hex, usually #ffffff or #f9fafb). Tech = blue/indigo, health = green/teal, food = warm/amber, luxury = dark/gold, creative = purple/pink. Output ONLY JSON, no explanation.',
      messages: [{ role: "user", content: businessPrompt }],
    });

    const text =
      response.content.find(
        (b: Anthropic.ContentBlock) => b.type === "text"
      )?.text || "";

    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace <= firstBrace) return null;

    const colors = JSON.parse(text.slice(firstBrace, lastBrace + 1));
    if (colors.primary && colors.bg) return colors;
    return null;
  } catch {
    return null;
  }
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
