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
 *   supabase  { projectUrl, anonKey, projectRef, needsAuth, needsDatabase, needsStorage, tables, authProviders, buckets }
 *   score     { score, issues }
 *   error     { message, hint }
 *   done      { finalFiles, score, durationMs, supabase? }
 *
 * Bible Law 8: every error path emits an "error" SSE event with a clear hint.
 */

import { NextRequest } from "next/server";
import { callClaude, streamClaude } from "@/lib/anthropic-cached";
import { runQualityLoop } from "@/lib/builder-critique";
import { callLLMWithFailover, getAvailableProviders } from "@/lib/llm-provider";
import {
  detectSupabaseNeeds,
  needsSupabase,
  generateSupabaseClient,
  generateAuthProvider,
} from "@/lib/supabase-detect";
import type { SupabaseNeeds, SupabaseProvisionResult } from "@/lib/supabase-detect";
import { isConfigured as isSupabaseConfigured } from "@/lib/supabase-provisioner";
// Component registry is imported lazily inside POST to avoid circular dependency
// at module load time (the registry's side-effect imports cause a TDZ error in webpack).
import type { RegistryComponent, ComponentCategory } from "@/lib/component-registry";

async function getRegistry() {
  const mod = await import("@/lib/component-registry");
  return mod;
}

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
async function buildRegistryCatalog(): Promise<string> {
  const { REGISTRY, getByCategory } = await getRegistry();
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

let _plannerSystemCache: string | null = null;
async function getPlannerSystemCacheable(): Promise<string> {
  if (_plannerSystemCache) return _plannerSystemCache;
  _plannerSystemCache = `You are the section planner for the Zoobicon AI website builder.

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
${await buildRegistryCatalog()}`;
  return _plannerSystemCache;
}

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
  const { getById, selectComponentsForPrompt } = await getRegistry();

  const res = await callClaude({
    model: MODEL_HAIKU,
    system: "Return only JSON matching the schema.",
    systemCacheable: await getPlannerSystemCacheable(),
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
- Add aria-labels to icon-only buttons. Add alt text to images. Keep responsive classes.
- For navbars: anchor links (href="#features", "#pricing", etc.) MUST match real section ids on the page. Only use: features, pricing, faq, about, contact. Never use #docs, #solutions, #markets, or any id that won't exist as a section.`;

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

function buildPackageJson(opts?: { withSupabase?: boolean }): string {
  const deps: Record<string, string> = {
    react: "^18.3.1",
    "react-dom": "^18.3.1",
  };
  if (opts?.withSupabase) {
    deps["@supabase/supabase-js"] = "^2.45.0";
  }
  return JSON.stringify(
    {
      name: "zoobicon-generated-site",
      version: "1.0.0",
      private: true,
      dependencies: deps,
    },
    null,
    2,
  );
}

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

function buildTailwindConfig(): string {
  return `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
`;
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

  if (!prompt) {
    return new Response(
      JSON.stringify({ error: "prompt is required" }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const writer = makeWriter(controller);
      try {
        // ── PHASE 1: planning ──
        writer.send("phase", {
          phase: "planning",
          message: "Analysing your prompt…",
        });

        // Detect full-stack intent (auth, database, storage needs)
        const supabaseNeeds = detectSupabaseNeeds(prompt);
        const wantsSupabase = needsSupabase(supabaseNeeds);
        const supabaseAvailable = wantsSupabase && isSupabaseConfigured();

        // ── PHASE 2: selecting ──
        writer.send("phase", {
          phase: "selecting",
          message: "Picking best components for each section…",
        });
        const { components, brandName, primaryColor, bgColor } =
          await planComponents(prompt);

        const registry = await getRegistry();

        const files: Record<string, string> = {
          "package.json": buildPackageJson({ withSupabase: wantsSupabase }),
          "tailwind.config.js": buildTailwindConfig(),
          "styles.css": registry.buildStylesFile({ primaryColor, bgColor }),
          "App.tsx": registry.buildAppFile([]),
        };
        writer.send("files", { files });

        // ── PHASE 3: generating (customise each component) ──
        writer.send("phase", {
          phase: "generating",
          message: `Customising ${components.length} components for ${brandName}…`,
        });

        const customiserModel =
          mode === "premium" ? MODEL_SONNET : MODEL_HAIKU;
        const accumulated: RegistryComponent[] = [];

        for (let i = 0; i < components.length; i++) {
          const comp = components[i];
          let updatedCode: string;
          try {
            updatedCode = await customiseComponent({
              baseCode: comp.code,
              brandName,
              category: comp.category,
              variant: comp.variant,
              prompt,
              primaryColor,
              model: customiserModel,
            });
          } catch {
            // Fallback: use template code as-is
            updatedCode = `import React from "react";\n\n${comp.code}\n`;
          }

          const { fileName } = registry.buildComponentFile(comp);
          files[fileName] = updatedCode;
          accumulated.push(comp);
          files["App.tsx"] = registry.buildAppFile(accumulated);

          writer.send("component", {
            name: comp.id,
            code: updatedCode,
            position: i,
          });
        }

        writer.send("files", { files });

        // ── PHASE 3.5: Supabase auto-provisioning (if full-stack detected) ──
        let supabaseResult: SupabaseProvisionResult | null = null;

        if (wantsSupabase) {
          if (supabaseAvailable) {
            // Supabase env vars are set — provision a real project
            try {
              writer.send("phase", {
                phase: "provisioning",
                message: "Setting up your database and auth…",
              });

              // Lazy-import provisioner (only loaded when needed)
              const provisioner = await import("@/lib/supabase-provisioner");

              const projectName = `zbk-${brandName.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30)}-${Date.now().toString(36)}`;

              const provision = await provisioner.provisionFullStack({
                name: projectName,
                region: "us-east-1",
                schema: supabaseNeeds.needsDatabase
                  ? {
                      profiles: {
                        columns: [
                          { name: "id", type: "uuid", primary: true, default: "gen_random_uuid()" },
                          { name: "user_id", type: "uuid", nullable: false },
                          { name: "display_name", type: "text" },
                          { name: "avatar_url", type: "text" },
                          { name: "created_at", type: "timestamptz", default: "now()" },
                          { name: "updated_at", type: "timestamptz", default: "now()" },
                        ],
                        rls: "owner",
                      },
                    }
                  : undefined,
                auth: supabaseNeeds.needsAuth ? ["email"] : undefined,
                buckets: supabaseNeeds.needsStorage
                  ? [{ name: "uploads", public: true }]
                  : undefined,
              });

              const projectUrl = provision.envVars.NEXT_PUBLIC_SUPABASE_URL;
              const anonKey = provision.envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

              // Inject Supabase client files into the generated project
              files["lib/supabase.ts"] = generateSupabaseClient(projectUrl, anonKey);
              if (supabaseNeeds.needsAuth) {
                files["lib/AuthProvider.tsx"] = generateAuthProvider();
              }
              files["package.json"] = buildPackageJson({ withSupabase: true });

              supabaseResult = {
                projectUrl,
                anonKey,
                projectRef: provision.project.projectRef,
                needsAuth: supabaseNeeds.needsAuth,
                needsDatabase: supabaseNeeds.needsDatabase,
                needsStorage: supabaseNeeds.needsStorage,
                tables: provision.tables,
                authProviders: provision.auth,
                buckets: provision.buckets.map((b) => b.name),
              };

              writer.send("supabase", supabaseResult);
              writer.send("files", { files });

              writer.send("phase", {
                phase: "provisioned",
                message: `Database ready — ${provision.tables.length} table(s), ${provision.auth.length > 0 ? "auth enabled" : "no auth"}, ${provision.buckets.length} bucket(s)`,
              });
            } catch (err) {
              // Supabase provisioning failure is non-fatal — site still works without it
              const msg = err instanceof Error ? err.message : String(err);
              writer.send("error", {
                message: `Supabase provisioning failed: ${msg}`,
                hint: "The site will still work but without a live database. You can connect Supabase manually later.",
              });

              // Still inject client stub with placeholder values so the code compiles
              files["lib/supabase.ts"] = generateSupabaseClient(
                "https://YOUR_PROJECT.supabase.co",
                "YOUR_ANON_KEY",
              );
              if (supabaseNeeds.needsAuth) {
                files["lib/AuthProvider.tsx"] = generateAuthProvider();
              }
              writer.send("files", { files });
            }
          } else {
            // Supabase env vars not set — inject placeholder client so code compiles
            writer.send("phase", {
              phase: "provisioning",
              message: "Full-stack features detected — injecting Supabase client (connect your project to go live)…",
            });

            files["lib/supabase.ts"] = generateSupabaseClient(
              "https://YOUR_PROJECT.supabase.co",
              "YOUR_ANON_KEY",
            );
            if (supabaseNeeds.needsAuth) {
              files["lib/AuthProvider.tsx"] = generateAuthProvider();
            }
            writer.send("files", { files });

            writer.send("phase", {
              phase: "provisioned",
              message: "Supabase client injected with placeholders — set SUPABASE_ACCESS_TOKEN to auto-provision real projects.",
            });
          }
        }

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

            const lastCritique =
              loop.history[loop.history.length - 1];
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
        writer.send("phase", {
          phase: "done",
          message: "Build complete.",
        });
        writer.send("done", {
          finalFiles,
          score: finalScore,
          durationMs: Date.now() - startedAt,
          ...(supabaseResult ? { supabase: supabaseResult } : {}),
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
