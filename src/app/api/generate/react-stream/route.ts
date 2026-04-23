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
 *   done      { files, score, durationMs, supabase? }
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

/**
 * Map the route's semantic event names to the legacy event types the builder
 * client understands. The builder reads `data:` lines and dispatches on
 * `event.type`, accepting: status | partial | scaffold | scaffold-update |
 * customization | done | error.
 *
 * Previously, this writer emitted `event: NAME\ndata: {...}\n\n` SSE frames
 * — proper SSE — but the builder client never reads `event:` lines. Every
 * message was silently dropped and the safety net fired "No components
 * generated." That's the bug Craig has been hitting.
 */
function mapEvent(name: string, data: unknown): Record<string, unknown> {
  const obj =
    data && typeof data === "object" && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : { data };

  switch (name) {
    case "phase":
      // { phase, message } → status event the builder shows in the pipeline log
      return { type: "status", message: obj.message || obj.phase || "Working…", ...obj };
    case "files":
      // { files } → partial event the builder uses to update Sandpack preview
      return { type: "partial", ...obj };
    case "component": {
      // { name, code, position } → status log entry (partial already carries files)
      const position = typeof obj.position === "number" ? obj.position + 1 : undefined;
      return {
        type: "status",
        message: position ? `Customising ${obj.name} (#${position})` : `Customising ${obj.name}`,
        section: obj.name,
        phase: "building",
      };
    }
    case "supabase":
      return { type: "status", message: "Backend provisioned", supabase: obj };
    case "score":
      return { type: "status", message: `Quality score: ${obj.score ?? "?"}`, ...obj };
    case "done":
      return { type: "done", ...obj };
    case "error":
      return { type: "error", ...obj };
    default:
      return { type: name, ...obj };
  }
}

function makeWriter(controller: ReadableStreamDefaultController<Uint8Array>): SSEWriter {
  const encoder = new TextEncoder();
  let closed = false;
  return {
    send(event, data) {
      if (closed) return;
      const payload = mapEvent(event, data);
      const sse = `data: ${JSON.stringify(payload)}\n\n`;
      try {
        controller.enqueue(encoder.encode(sse));
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

  // Planning uses callLLMWithFailover so Anthropic outages don't kill builds.
  // Order: Anthropic Haiku (fastest) → Sonnet → OpenAI → Gemini.
  let text = "";
  try {
    const plannerSystem =
      "Return only JSON matching the schema.\n\n" + (await getPlannerSystemCacheable());
    const res = await callLLMWithFailover({
      model: MODEL_HAIKU,
      system: plannerSystem,
      userMessage: `User prompt: ${prompt}`,
      maxTokens: 1500,
    });
    text = res.text || "";
  } catch (err) {
    console.warn("[react-stream] planComponents LLM failed, using registry fallback:", err);
    // Registry fallback will take over below — no throw.
  }

  const parsed = text ? safeParseJson<PlannerOutput>(text) : null;

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
      primaryColor: parsed?.primaryColor ?? "#1c1917",
      bgColor: parsed?.bgColor ?? "#FAF9F6",
    };
  }

  return {
    components: resolved,
    brandName: parsed?.brandName ?? inferBrandName(prompt),
    primaryColor: parsed?.primaryColor ?? "#4f46e5",
    bgColor: parsed?.bgColor ?? "#ffffff",
  };
}

const CUSTOMISER_SYSTEM_BASE = `You customise a single React component for the Zoobicon AI website builder.

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

const THEME_BRIEFS: Record<string, string> = {
  editorial: `
EDITORIAL DESIGN SYSTEM — MANDATORY
This site ships on the Zoobicon editorial preset. It is a restrained, world-stage typographic aesthetic. You MUST:
- Use ONLY the stone- color family for every Tailwind color utility (from, via, to, text, bg, border, shadow, ring, outline, divide, etc.). NO violet, purple, fuchsia, pink, rose, indigo, blue, sky, cyan, teal, emerald, green, lime, yellow, amber, orange, red. Gray/slate/neutral/zinc/stone/black/white are fine, but prefer stone.
- Wrap one word or short phrase in each h1/h2 in <em>…</em> so the editorial Fraunces italic serif accent kicks in. Example: <h1>Design that <em>moves</em> people.</h1>
- Keep motion measured — subtle transitions only. No neon glows, no vibrant shadows, no arcade colors.
- Prefer understated copy. Editorial voice, not landing-page hype.`,

  light: `
LIGHT / BRIGHT DESIGN SYSTEM — MANDATORY
This site ships BRIGHT, AIRY, and WELCOMING — the visual opposite of the dark-tech default. You MUST:
- Backgrounds are WHITE (bg-white) or very light (bg-slate-50, bg-stone-50). NEVER bg-gray-900, bg-navy-950, bg-black, bg-[#0a1628], or any other dark background. If the base component has a dark background class, REPLACE it with bg-white.
- Primary text is dark on light: text-slate-900, text-stone-900, text-slate-800. Body text text-slate-600 or text-stone-600.
- Accent color is allowed and encouraged — pick ONE family (blue-600, indigo-600, sky-600, emerald-600, teal-600) and use it consistently for buttons, links, and highlights. Do NOT mix multiple accent colors.
- Borders are light: border-slate-200, border-stone-200, border-gray-200.
- Shadows are subtle: shadow-sm, shadow-md, shadow-slate-900/5. No black shadows on light backgrounds.
- Copy is warm, confident, human — not corporate jargon. Speak directly to the customer's need.
- Keep motion subtle. No neon, no glow, no gradient text that looks like a crypto site.`,

  warm: `
WARM / ARTISAN DESIGN SYSTEM — MANDATORY
This site ships on a warm cream + amber palette. Restaurant, bakery, hospitality, artisan voice. You MUST:
- Backgrounds are cream (bg-amber-50, bg-orange-50) or warm off-white. NEVER dark backgrounds.
- Primary text is deep warm tone: text-stone-900, text-amber-950, text-orange-950.
- Accent is amber/orange: amber-600, orange-600, or a deep rose like rose-700 for restaurants.
- Borders are warm: border-amber-200, border-stone-200.
- Wrap one evocative word in each h1/h2 in <em>…</em> so the Playfair italic serif accent renders.
- Copy is sensory, specific, inviting. Name real dishes, real rooms, real experiences.`,

  dark: `
DARK DESIGN SYSTEM — MANDATORY
This site ships DARK. You MUST:
- Backgrounds are dark: bg-navy-950, bg-[#0a1628], bg-navy-950, bg-zinc-950.
- Primary text is light: text-white, text-slate-100, text-stone-100. Body text text-slate-400 or text-slate-300.
- Accent color is neon-ish — cyan-400, emerald-400, violet-500, fuchsia-500 — pick ONE and stick with it.
- Borders are subtle white: border-white/10, border-slate-800.
- Shadows can use glow effects: shadow-cyan-500/20, shadow-violet-500/30.
- Copy is confident and technical. This is a cyber/crypto/gaming/devtool brand.`,
};

function buildCustomiserSystem(theme: "editorial" | "light" | "warm" | "dark"): string {
  return CUSTOMISER_SYSTEM_BASE + "\n" + (THEME_BRIEFS[theme] || THEME_BRIEFS.editorial);
}

// Back-compat default — the editorial preset is still the default when no theme is passed.
const CUSTOMISER_SYSTEM = buildCustomiserSystem("editorial");

interface CustomiseArgs {
  baseCode: string;
  brandName: string;
  category: ComponentCategory;
  variant: string;
  prompt: string;
  primaryColor: string;
  model: string;
  /** Visual theme — drives which system prompt is sent to the LLM. */
  theme: "editorial" | "light" | "warm" | "dark";
  /**
   * When true, the generated project has a live Supabase client wired
   * up at `./lib/supabase`. The customiser should wire real auth / data
   * calls into interactive elements (sign-in, sign-up, contact forms,
   * bookings) so the site actually works end-to-end.
   */
  supabase?: {
    needsAuth: boolean;
    needsDatabase: boolean;
    needsStorage: boolean;
  };
}

function stripFencesAndWrap(raw: string): string {
  const m = raw.match(/```(?:tsx?|typescript)?\s*([\s\S]*?)```/);
  const code = (m ? m[1] : raw).trim();
  if (!code.includes("import React")) {
    return `import React from "react";\n\n${code}\n`;
  }
  return `${code}\n`;
}

/**
 * When Supabase is provisioned, every interactive component (navbars with
 * Sign In, heroes with Sign Up, contact forms, auth pages) should wire
 * into the real client instead of shipping dead buttons. This block is
 * appended to the customiser's user message so the LLM knows the exact
 * imports and call patterns to use.
 */
function buildSupabaseBrief(needs: {
  needsAuth: boolean;
  needsDatabase: boolean;
  needsStorage: boolean;
}): string {
  const lines: string[] = [
    "",
    "BACKEND — SUPABASE IS WIRED",
    "This project has a live Supabase client at ./lib/supabase.ts. If this",
    "component has ANY interactive elements, wire them to the real client",
    "using the patterns below. Do NOT leave dead buttons.",
    "",
    'Import the client with: import { supabase } from "./lib/supabase";',
  ];

  if (needs.needsAuth) {
    lines.push(
      "",
      "AUTH (available):",
      "- Sign In buttons → onClick: await supabase.auth.signInWithPassword({ email, password })",
      "- Sign Up buttons → onClick: await supabase.auth.signUp({ email, password })",
      "- Sign Out → onClick: await supabase.auth.signOut()",
      "- OAuth (Google/GitHub) → await supabase.auth.signInWithOAuth({ provider: \"google\" })",
      "- Use React useState for email/password inputs. Show error messages on failure.",
      "- For navbars: show 'Sign In' / 'Sign Up' when signed out, 'Sign Out' when signed in",
      "  (use useEffect + supabase.auth.getSession() + supabase.auth.onAuthStateChange).",
    );
  }

  if (needs.needsDatabase) {
    lines.push(
      "",
      "DATABASE (available):",
      "- Contact forms → await supabase.from(\"messages\").insert({ name, email, message })",
      "- Bookings → await supabase.from(\"bookings\").insert({ ... })",
      "- Profile reads → await supabase.from(\"profiles\").select(\"*\").eq(\"user_id\", userId).single()",
      "- Wire real submit handlers. Show success / error states with useState.",
    );
  }

  if (needs.needsStorage) {
    lines.push(
      "",
      "STORAGE (available):",
      "- File uploads → await supabase.storage.from(\"uploads\").upload(path, file)",
      "- Public URLs → supabase.storage.from(\"uploads\").getPublicUrl(path)",
    );
  }

  lines.push(
    "",
    "Still keep imports minimal. Only add `import { supabase } from \"./lib/supabase\"`",
    "if this component actually needs it. Preserve the editorial design system.",
    "",
  );

  return lines.join("\n");
}

interface CustomiseResult {
  ok: boolean;
  code: string;           // Either the customised file, or the raw base component as a last-resort fallback
  reason?: string;        // Why we fell back — always populated when ok === false
  modelUsed?: string;     // The model that actually produced the code (for telemetry)
}

async function customiseComponent(args: CustomiseArgs): Promise<CustomiseResult> {
  const supabaseBrief = args.supabase ? buildSupabaseBrief(args.supabase) : "";
  const systemPrompt = buildCustomiserSystem(args.theme);
  const userMsg =
    `BRAND: ${args.brandName}\n` +
    `PRIMARY COLOR: ${args.primaryColor}\n` +
    `THEME: ${args.theme}\n` +
    `SECTION: ${args.category} (${args.variant})\n` +
    `USER PROMPT: ${args.prompt}\n` +
    supabaseBrief +
    `\nBASE COMPONENT FILE:\n${args.baseCode}\n\n` +
    `Output the full updated TypeScript file only.`;

  const attemptLog: string[] = [];

  // Try streaming Claude first (fastest path when Anthropic is healthy).
  try {
    let collected = "";
    for await (const delta of streamClaude({
      model: args.model,
      system: systemPrompt,
      messages: [{ role: "user", content: userMsg }],
      maxTokens: 4000,
      temperature: 0.6,
    })) {
      if (delta.type === "text" && delta.text) {
        collected += delta.text;
      }
    }
    if (collected.trim().length > 100) {
      return { ok: true, code: stripFencesAndWrap(collected), modelUsed: args.model };
    }
    attemptLog.push(`${args.model}: empty/short output`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    attemptLog.push(`${args.model}: ${msg.slice(0, 120)}`);
    console.warn(`[react-stream] streamClaude failed for ${args.category}:`, msg);
  }

  // Failover path — callLLMWithFailover cycles Anthropic → OpenAI → Gemini.
  // Any provider returning usable text wins. If they all fail, we return ok=false
  // with the raw base component as last-resort code so the build still completes,
  // and the caller surfaces a warning event to the UI (Law 8: never silent).
  try {
    const fb = await callLLMWithFailover({
      model: args.model,
      system: systemPrompt,
      userMessage: userMsg,
      maxTokens: 4000,
    });
    const text = (fb.text || "").trim();
    if (text.length > 100) {
      return { ok: true, code: stripFencesAndWrap(text), modelUsed: fb.model || args.model };
    }
    attemptLog.push(`failover: empty/short output`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    attemptLog.push(`failover: ${msg.slice(0, 120)}`);
    console.warn(`[react-stream] callLLMWithFailover failed for ${args.category}:`, msg);
  }

  return {
    ok: false,
    code: `import React from "react";\n\n${args.baseCode}\n`,
    reason: attemptLog.join(" | "),
  };
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
        // ── FLYWHEEL: load accumulated context from previous builds ──
        let flywheelContext = "";
        try {
          const { getMemories } = await import("@/lib/flywheel");
          const memories = await getMemories();
          // Filter to preference, brand, and context types only
          const relevant = memories
            .filter((m) => m.type === "preference" || m.type === "brand" || m.type === "context")
            .slice(0, 10);
          if (relevant.length > 0) {
            const lines = relevant.map((m) => `- [${m.type}] ${m.content}`);
            // Cap at ~500 chars to keep the injection concise
            let joined = lines.join("\n");
            if (joined.length > 500) {
              joined = joined.slice(0, 497) + "...";
            }
            flywheelContext = `\n\nContext from previous builds:\n${joined}\n`;
          }
        } catch (flywheelErr) {
          // Flywheel is a bonus — never break the build pipeline
          console.warn("[react-stream] Flywheel context load skipped:", flywheelErr);
        }

        // ── PHASE 1: planning ──
        writer.send("phase", {
          phase: "planning",
          message: "Analysing your prompt…",
        });

        // Detect full-stack intent (auth, database, storage needs)
        const supabaseNeeds = detectSupabaseNeeds(prompt);
        const wantsSupabase = needsSupabase(supabaseNeeds);
        const supabaseAvailable = wantsSupabase && isSupabaseConfigured();

        // ── FLOOR: emit a CINEMATIC INSTANT SHELL immediately. The shell is
        // a self-contained animated skeleton (hero + nav + features strip)
        // that mounts in Sandpack within ~1s of the POST, echoing the user's
        // prompt back to them. It's replaced live by real registry components
        // as each customisation finishes. This is the perceived-speed layer —
        // without it the user stares at a blank pre-warm spinner for the
        // 5-8s TTFB of the Haiku planning call.
        //
        // Law 8 bonus: if planning fails, the real error message surfaces
        // instead of being overridden by "No components generated".
        const registry = await getRegistry();
        const files: Record<string, string> = {
          "package.json": buildPackageJson({ withSupabase: supabaseAvailable }),
          "tailwind.config.js": buildTailwindConfig(),
          "styles.css": registry.buildStylesFile({ primaryColor: "#1c1917", bgColor: "#FAF9F6" }),
          "App.tsx": registry.buildShellAppFile(prompt),
        };
        writer.send("files", { files, fileCount: 0, totalComponents: 0 });

        // ── PHASE 2: selecting ──
        writer.send("phase", {
          phase: "selecting",
          message: "Picking best components for each section…",
        });
        const { components, brandName, primaryColor, bgColor } =
          await planComponents(prompt + flywheelContext);

        // Detect industry from the prompt once — drives imagery selection
        // for every component in this build (restaurants get warm hand/craft
        // imagery, SaaS gets workspace/dashboards, portfolio gets landscape).
        const industry = registry.detectIndustry(prompt);

        // Detect the visual theme the prompt actually wants. This is the
        // critical fix for "every site comes out dark editorial". Consumer-
        // facing verticals (transport, hospitality, medical, local services)
        // default to LIGHT. Food/hospitality default to WARM. Cyber/crypto/
        // gaming defaults to DARK. Everything else stays editorial.
        const theme = registry.detectTheme(prompt, industry);
        writer.send("phase", {
          phase: "themed",
          message: `Theme: ${theme} · Industry: ${industry}`,
        });

        // Update styles with the real brand colours now that planning succeeded.
        files["styles.css"] = registry.buildStylesFile({ primaryColor, bgColor, theme });

        // ── Pre-inject Supabase client ONLY when SUPABASE_ACCESS_TOKEN is
        // configured. Without it, no supabase files are emitted and the AI
        // prompt never mentions supabase imports — preventing the
        // "Could not find module './lib/supabase'" Sandpack error.
        if (supabaseAvailable) {
          files["lib/supabase.ts"] = generateSupabaseClient(
            "https://YOUR_PROJECT.supabase.co",
            "YOUR_ANON_KEY",
          );
          if (supabaseNeeds.needsAuth) {
            files["lib/AuthProvider.tsx"] = generateAuthProvider();
          }
          files["package.json"] = buildPackageJson({ withSupabase: true });
        }

        writer.send("files", { files, fileCount: 0, totalComponents: components.length });

        // ── PHASE 3: generating (customise each component) ──
        writer.send("phase", {
          phase: "generating",
          message: `Customising ${components.length} components for ${brandName}…`,
        });

        const customiserModel =
          mode === "premium" ? MODEL_SONNET : MODEL_HAIKU;

        // Supabase brief only passed to customiser when Supabase is
        // actually configured. Without this gate, the AI adds
        // `import { supabase } from "./lib/supabase"` to every
        // component — but the file doesn't exist in Sandpack.
        const customiserSupabase = supabaseAvailable
          ? {
              needsAuth: supabaseNeeds.needsAuth,
              needsDatabase: supabaseNeeds.needsDatabase,
              needsStorage: supabaseNeeds.needsStorage,
            }
          : undefined;

        // PARALLEL CUSTOMISATION — fire every Haiku call at once.
        // Previously sequential: ~12 components × ~2-3s = 24-36s wall time.
        // Now concurrent: total ≈ max single call ≈ 2-3s (plus whichever
        // finishes last). App.tsx is rebuilt in the ORIGINAL component
        // order each time one completes, so navbar always lands at the
        // top even if hero finishes customising first. Preview looks
        // coherent throughout the stream — components slot into place
        // in the right order as they arrive.
        const completedByIndex = new Map<number, RegistryComponent>();
        let completedCount = 0;
        const failedSections: Array<{ id: string; category: string; variant: string; reason: string }> = [];

        await Promise.all(
          components.map(async (comp, i) => {
            const result = await customiseComponent({
              baseCode: comp.code,
              brandName,
              category: comp.category,
              variant: comp.variant,
              prompt: prompt + flywheelContext,
              primaryColor,
              model: customiserModel,
              theme,
              supabase: customiserSupabase,
            });
            let updatedCode = result.code;
            if (!result.ok) {
              failedSections.push({
                id: comp.id,
                category: comp.category,
                variant: comp.variant,
                reason: result.reason || "unknown",
              });
              // Surface the failure to the client the moment it happens so the
              // UI can render a "this section used the base template" badge
              // instead of silently shipping placeholder copy (Law 8).
              writer.send("warning", {
                kind: "section-fallback",
                section: comp.id,
                category: comp.category,
                reason: result.reason,
              });
            }

            // Theme-aware reskin — regex pass guarantees the component
            // renders in the correct theme even when the LLM ignores the
            // system prompt. This is the HARD FIX for "every site comes
            // out dark even when it's an airport shuttle service": when
            // theme is "light", reskinLight swaps bg-navy-950 → bg-white,
            // text-white → text-stone-900, etc. When theme is "editorial",
            // reskinEditorial collapses vibrant colors into stone. When
            // theme is "dark", pass through unchanged. All reskins are
            // idempotent — safe to re-run on already-customised output.
            if (theme === "editorial") {
              updatedCode = registry.reskinEditorial(updatedCode);
            } else if (theme === "light") {
              updatedCode = registry.reskinLight(updatedCode);
            } else if (theme === "warm") {
              updatedCode = registry.reskinWarm(updatedCode);
            }
            // "dark" passes through unchanged.

            // Industry image swap — replace every Unsplash photo ID with one
            // drawn from the detected industry's curated pool, so imagery
            // matches the prompt instead of the base component's hardcoded
            // mountains/watches/dashboards.
            updatedCode = registry.swapImagesForIndustry(updatedCode, industry);

            // Auto-emphasize one word per h1/h2. Only runs on editorial +
            // warm themes — those are the themes with serif display fonts
            // that actually render the <em> as an italic accent. For light
            // and dark themes (both sans-serif), <em> would just look like
            // italicised noise, so we skip it.
            if (theme === "editorial" || theme === "warm") {
              updatedCode = registry.emphasizeHeadings(updatedCode);
            }

            // Write the component file
            const { fileName } = registry.buildComponentFile(comp, { theme });
            files[fileName] = updatedCode;

            // Record completion and rebuild App.tsx in ORIGINAL order —
            // skipping any holes from components still in-flight.
            completedByIndex.set(i, comp);
            completedCount++;
            const ordered: RegistryComponent[] = [];
            for (let j = 0; j < components.length; j++) {
              const done = completedByIndex.get(j);
              if (done) ordered.push(done);
            }
            files["App.tsx"] = registry.buildAppFile(ordered, { theme });

            writer.send("component", {
              name: comp.id,
              code: updatedCode,
              position: i,
            });

            // Progressive update — push the current files map so Sandpack
            // preview rebuilds as each component slots into place. This is
            // what makes the site appear to "build itself" live.
            writer.send("files", {
              files,
              fileCount: completedCount,
              totalComponents: components.length,
              section: comp.id,
              customized: true,
            });
          })
        );

        // Hard fail when every single component had to fall back to base
        // template code — that means no provider produced any customised
        // output and the entire build is a placeholder scaffold, which
        // directly violates the Filmora standard + Law 8. Better to tell
        // the user the real reason than ship a generic "Acme" site.
        if (failedSections.length === components.length && components.length > 0) {
          const providers = getAvailableProviders();
          const reasons = failedSections.slice(0, 3).map((f) => `${f.id}: ${f.reason}`).join(" / ");
          throw new Error(
            `Every section fell back to base template — no LLM provider produced customised output. ` +
            `Providers available: [${providers.join(", ") || "none"}]. Last reasons: ${reasons}`,
          );
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
              // Supabase provisioning failure is non-fatal — site still works without it.
              // Use fatal:false so the client treats this as a warning, not a build abort.
              // The JWT / token-expired path lives here (SUPABASE_ACCESS_TOKEN invalid in prod
              // would otherwise surface as "Something went wrong / JWT could not be decoded"
              // and kill the entire build even though it's non-fatal).
              const msg = err instanceof Error ? err.message : String(err);
              writer.send("error", {
                fatal: false,
                message: `Supabase provisioning skipped: ${msg}`,
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
            // Critique loop failure is non-fatal — the unrefined site is still
            // usable and has already been streamed to the client.
            const { message, hint } = classifyError(err);
            writer.send("error", {
              fatal: false,
              message: `Critique loop skipped: ${message}`,
              hint: `${hint} The unrefined site is still usable.`,
            });
          }
        }

        // ── PHASE 5: done ──
        writer.send("phase", {
          phase: "done",
          message: "Build complete.",
        });
        const durationMs = Date.now() - startedAt;
        writer.send("done", {
          // Client listens for `event.files` on the done event — it sets
          // receivedFiles = true and updates Sandpack's source. The previous
          // name `finalFiles` silently skipped both, leaving the preview on
          // the last progressive partial (usually fine) but also preventing
          // the post-build file replacement in premium critique mode.
          files: finalFiles,
          score: finalScore,
          durationMs,
          failedSections,
          ...(supabaseResult ? { supabase: supabaseResult } : {}),
        });

        // ── FLYWHEEL: record this build for future context ──
        try {
          const { saveBuild } = await import("@/lib/flywheel");
          await saveBuild({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            prompt,
            siteName: brandName || inferBrandName(prompt),
            model: mode === "premium" ? MODEL_SONNET : MODEL_HAIKU,
            durationMs,
            createdAt: Date.now(),
          });
        } catch (flywheelErr) {
          // Flywheel save is non-critical — log and move on
          console.warn("[react-stream] Flywheel build save skipped:", flywheelErr);
        }

        writer.close();
      } catch (err) {
        try {
          const { message, hint } = classifyError(err);
          writer.send("error", { message, hint });
        } catch (classifyErr) {
          console.error("[react-stream] Error classification failed:", classifyErr);
          try {
            writer.send("error", {
              message: err instanceof Error ? err.message : "Unknown error",
              hint: "Please try again",
            });
          } catch { /* writer may already be closed */ }
        } finally {
          try { writer.close(); } catch { /* already closed */ }
        }
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
