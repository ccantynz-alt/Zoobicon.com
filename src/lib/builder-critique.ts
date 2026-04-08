/**
 * builder-critique.ts
 *
 * Self-critique + refine pass for the Zoobicon AI builder pipeline.
 *
 * The builder generates a site, then this module:
 *   1. Asks Claude Sonnet 4.5 to critique the generated files against a strict
 *      quality rubric (accessibility, performance, design, correctness, SEO,
 *      responsive, fake/slop content).
 *   2. Asks Claude Sonnet 4.5 to refine the files, fixing all blocker + high
 *      severity issues. Uses Anthropic prompt caching on the static system
 *      prompt for huge wins on repeated builds.
 *   3. Loops critique + refine until score >= 90 OR maxPasses reached.
 *
 * Uses dynamic import of "@/lib/anthropic-cached" so this module compiles even
 * if the sibling cached-Anthropic helper has not yet landed in the repo. The
 * helper is expected to expose:
 *   - createCachedMessage({ system, messages, model, maxTokens }) returning
 *     a promise of `{ text: string }` (or compatible content blocks).
 *
 * If ANTHROPIC_API_KEY is missing, the underlying anthropic-cached module is
 * expected to throw a 503 — we let that propagate untouched.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export type CritiqueSeverity = "blocker" | "high" | "medium" | "low";

export type CritiqueCategory =
  | "accessibility"
  | "performance"
  | "design"
  | "correctness"
  | "seo"
  | "responsive";

/** A single issue produced by the critic. */
export interface CritiqueIssue {
  /** Filename inside the generated project (e.g. "src/App.tsx"). */
  file: string;
  /** Optional 1-indexed line number where the issue starts. */
  line?: number;
  /** Severity bucket — blockers and highs are auto-fixed by refine. */
  severity: CritiqueSeverity;
  /** Quality category. */
  category: CritiqueCategory;
  /** Human readable description of the problem. */
  description: string;
  /** Concrete actionable fix the refiner should apply. */
  suggestion: string;
}

/** Result from {@link critiqueGeneratedSite}. */
export interface CritiqueResult {
  issues: CritiqueIssue[];
  /** Overall quality score 0-100. 90+ ships. */
  scoreOutOf100: number;
  /** One-paragraph executive summary of the critique. */
  summary: string;
}

/** Result from {@link runQualityLoop}. */
export interface QualityLoopResult {
  finalFiles: Record<string, string>;
  passes: number;
  finalScore: number;
  history: CritiqueResult[];
}

/** Cached-Anthropic helper interface — kept loose so it works pre-landing. */
interface CachedAnthropicLike {
  createCachedMessage: (args: {
    system: Array<{ type: "text"; text: string; cache_control?: { type: "ephemeral" } }> | string;
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    model: string;
    maxTokens: number;
  }) => Promise<{ text: string }>;
}

/** Sonnet 4.5 model id. */
const MODEL_SONNET_45 = "claude-sonnet-4-5";

/**
 * Dynamically load the cached anthropic helper. Done at call time so this
 * module type-checks before the sibling helper lands.
 */
async function loadCached(): Promise<CachedAnthropicLike> {
  // @ts-expect-error - sibling module may not exist at compile time
  const mod: any = await import("@/lib/anthropic-cached");
  const helper = (mod?.default ?? mod) as CachedAnthropicLike;
  if (!helper || typeof helper.createCachedMessage !== "function") {
    throw new Error("anthropic-cached: createCachedMessage export missing");
  }
  return helper;
}

/** Compact a files map into a single bounded string for the prompt. */
function serializeFiles(files: Record<string, string>, maxCharsPerFile = 8000): string {
  const parts: string[] = [];
  for (const [name, body] of Object.entries(files)) {
    const trimmed = body.length > maxCharsPerFile
      ? `${body.slice(0, maxCharsPerFile)}\n/* ...truncated ${body.length - maxCharsPerFile} chars... */`
      : body;
    parts.push(`===== FILE: ${name} =====\n${trimmed}`);
  }
  return parts.join("\n\n");
}

/** Strip markdown code fences from a model response so JSON.parse works. */
function stripFences(raw: string): string {
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  return (fence ? fence[1] : raw).trim();
}

/** Safely parse JSON, returning null on failure. */
function safeJson<T>(raw: string): T | null {
  try {
    return JSON.parse(stripFences(raw)) as T;
  } catch {
    return null;
  }
}

/** ---------------------------------------------------------------------- */
/*  CRITIC                                                                  */
/** ---------------------------------------------------------------------- */

const CRITIC_SYSTEM_PROMPT = `You are an elite senior staff engineer + design critic auditing AI-generated React/Next.js websites for Zoobicon, a $100K-agency-quality AI website builder.

Your job: ruthlessly critique the supplied files against the Zoobicon quality bar. The bar is "indistinguishable from a $100K agency build". Anything less is a failure.

You MUST check, for every file, every one of these categories:

1. HARDCODED FAKE DATA — placeholder Lorem ipsum, "John Doe", "Acme Inc", "user@example.com", made-up testimonials, fake metrics ("10,000+ users" with no source), fabricated company logos. Real or remove.
2. BROKEN LINKS — href="#", href="", to nowhere, missing routes, anchor links to ids that don't exist, external links without target/rel.
3. MISSING ALT TEXT — every <img>, <Image>, background image with semantic meaning needs descriptive alt. Decorative gets alt="".
4. NON-FUNCTIONAL BUTTONS — <button> with no onClick, no type, no form association. Submit buttons inside forms with no handler. CTAs that go nowhere.
5. MISSING MOBILE BREAKPOINTS — any layout using only desktop classes (no sm:/md:/lg:), fixed widths, horizontal scroll on mobile, text too small on phone.
6. ACCESSIBILITY VIOLATIONS — missing aria-label on icon buttons, no focus styles, color contrast failures, missing semantic landmarks (header/main/footer/nav), heading hierarchy skips (h1 → h3), form inputs without labels, modals without focus traps.
7. GENERIC AI SLOP WORDING — banned: "revolutionary", "unleash", "empower", "synergy", "next-generation", "game-changer", "leverage", "elevate", "seamless", "cutting-edge", "transform your business", "take it to the next level", "in today's fast-paced world".
8. PERFORMANCE — unbounded loops, missing keys on lists, inline functions in hot paths, missing React.memo on heavy components, huge inline SVGs that should be assets.
9. DESIGN — cramped spacing, washed-out colors, no animation, static hero, missing visual hierarchy, generic stock layout, no premium markers (gradient text, hover states, scroll triggers).
10. SEO — missing <title>, <meta description>, OG tags, structured data, semantic HTML.
11. CORRECTNESS — TypeScript errors visible, undefined variables, unused imports, dead code, broken JSX.

You MUST respond with ONLY valid JSON, no prose, no markdown fences, matching exactly this schema:

{
  "scoreOutOf100": <number 0-100>,
  "summary": "<one paragraph executive summary>",
  "issues": [
    {
      "file": "<filename>",
      "line": <optional 1-indexed line number>,
      "severity": "blocker" | "high" | "medium" | "low",
      "category": "accessibility" | "performance" | "design" | "correctness" | "seo" | "responsive",
      "description": "<what is wrong>",
      "suggestion": "<concrete fix instruction the refiner can apply>"
    }
  ]
}

Severity rubric:
- blocker: site is broken, illegal (a11y), or contains fake/slop content. MUST fix.
- high: clearly violates the $100K bar, will be noticed by a reviewer. MUST fix.
- medium: polish item, would improve quality.
- low: nice-to-have.

Score rubric:
- 90-100: ships. Indistinguishable from agency work.
- 75-89: needs another pass.
- 60-74: significant rework.
- <60: regenerate.

Be honest. Be brutal. Do not give bonus points for effort.`;

/**
 * Critique a generated site against the Zoobicon $100K quality bar.
 *
 * @param args.files          The generated project files (path -> source).
 * @param args.originalPrompt The user's original prompt that drove generation.
 * @returns A {@link CritiqueResult} with issues, score, and summary.
 */
export async function critiqueGeneratedSite(args: {
  files: Record<string, string>;
  originalPrompt: string;
}): Promise<CritiqueResult> {
  const { files, originalPrompt } = args;
  const cached = await loadCached();

  const userMsg = `ORIGINAL USER PROMPT:\n${originalPrompt}\n\nGENERATED FILES:\n\n${serializeFiles(files)}`;

  const res = await cached.createCachedMessage({
    system: [
      { type: "text", text: CRITIC_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
    ],
    messages: [{ role: "user", content: userMsg }],
    model: MODEL_SONNET_45,
    maxTokens: 8000,
  });

  const parsed = safeJson<CritiqueResult>(res.text);
  if (!parsed || typeof parsed.scoreOutOf100 !== "number" || !Array.isArray(parsed.issues)) {
    return {
      scoreOutOf100: 0,
      summary: "Critique failed to parse — model returned non-JSON output.",
      issues: [],
    };
  }
  return parsed;
}

/** ---------------------------------------------------------------------- */
/*  REFINER                                                                 */
/** ---------------------------------------------------------------------- */

const REFINER_SYSTEM_PROMPT = `You are an elite senior staff engineer fixing AI-generated React/Next.js websites for Zoobicon's $100K-agency builder.

You will receive:
- The original user prompt
- The current generated files
- A critique containing a list of issues

Your job: fix EVERY issue with severity "blocker" or "high". You MAY also fix "medium" issues if it does not risk regression. Ignore "low".

Hard rules:
- Output ONLY a JSON object mapping filename -> full updated file contents. No prose. No markdown fences.
- Only include files you actually changed. Unchanged files MUST be omitted.
- Output the COMPLETE file body for each changed file, not a diff or partial snippet.
- Do not invent new files unless absolutely required to fix a blocker.
- Preserve existing imports, TypeScript types, and code style.
- Replace any AI slop wording with concrete, specific copy.
- Replace any fake/placeholder data with realistic, specific, consistent content (real-sounding names, plausible metrics, specific industry copy).
- Add aria-labels, alt text, semantic landmarks, focus styles, mobile breakpoints, and onClick handlers as needed.
- Never break the build. The output must compile cleanly.

JSON schema for your response:
{
  "<filename>": "<full updated file contents>",
  ...
}`;

/**
 * Refine a generated site by applying fixes for all blocker + high severity
 * issues from a critique. Uses Anthropic prompt caching on the system prompt.
 *
 * @param args.files          The current files.
 * @param args.critique       The critique result driving the fixes.
 * @param args.originalPrompt The user's original prompt.
 * @returns A map of ONLY the changed files (path -> new contents).
 */
export async function refineWithCritique(args: {
  files: Record<string, string>;
  critique: CritiqueResult;
  originalPrompt: string;
}): Promise<Record<string, string>> {
  const { files, critique, originalPrompt } = args;
  const cached = await loadCached();

  const fixable = critique.issues.filter(
    (i) => i.severity === "blocker" || i.severity === "high",
  );
  if (fixable.length === 0) return {};

  const userMsg =
    `ORIGINAL USER PROMPT:\n${originalPrompt}\n\n` +
    `CURRENT FILES:\n\n${serializeFiles(files)}\n\n` +
    `CRITIQUE (fix all blocker + high issues):\n${JSON.stringify(
      { ...critique, issues: fixable },
      null,
      2,
    )}`;

  const res = await cached.createCachedMessage({
    system: [
      { type: "text", text: REFINER_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
    ],
    messages: [{ role: "user", content: userMsg }],
    model: MODEL_SONNET_45,
    maxTokens: 16000,
  });

  const parsed = safeJson<Record<string, string>>(res.text);
  if (!parsed || typeof parsed !== "object") return {};

  // Strip any non-string entries to keep types tight.
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(parsed)) {
    if (typeof v === "string" && k.length > 0) out[k] = v;
  }
  return out;
}

/** ---------------------------------------------------------------------- */
/*  QUALITY LOOP                                                            */
/** ---------------------------------------------------------------------- */

/**
 * Run the critique + refine loop until score >= 90 or maxPasses reached.
 *
 * @param args.files          Initial generated files.
 * @param args.originalPrompt Original user prompt.
 * @param args.maxPasses      Maximum critique/refine cycles. Default 2.
 * @returns Final files, number of passes performed, final score, and full
 *          history of critiques (one per pass).
 */
export async function runQualityLoop(args: {
  files: Record<string, string>;
  originalPrompt: string;
  maxPasses?: number;
}): Promise<QualityLoopResult> {
  const { originalPrompt } = args;
  const maxPasses = args.maxPasses ?? 2;
  let files: Record<string, string> = { ...args.files };
  const history: CritiqueResult[] = [];
  let passes = 0;
  let lastScore = 0;

  while (passes < maxPasses) {
    passes += 1;
    const critique = await critiqueGeneratedSite({ files, originalPrompt });
    history.push(critique);
    lastScore = critique.scoreOutOf100;

    if (lastScore >= 90) break;

    const updates = await refineWithCritique({ files, critique, originalPrompt });
    if (Object.keys(updates).length === 0) break;

    files = { ...files, ...updates };
  }

  return {
    finalFiles: files,
    passes,
    finalScore: lastScore,
    history,
  };
}
