/**
 * LLM output validator
 *
 * Rule 3.4 + audit 2026-05-13: the AI builder was treating any non-empty
 * response as success. That meant model refusals ("I can't help with
 * that"), truncated outputs, and broken JSX shipped to users as valid
 * components — Sandpack then rendered a blank preview and the user
 * thought the whole build failed.
 *
 * This module sits between the LLM transport (`callLLM` /
 * `callLLMWithFailover` in `src/lib/llm-provider.ts`) and the
 * application logic. Validators here return a `{ ok, reason }` tuple
 * so call-sites can:
 *   1. Trigger the next fallback provider when validation fails
 *   2. Emit a precise warning event to the SSE stream so the UI shows
 *      the user WHY a section had to be regenerated
 *
 * Keep this module dependency-free. Tested by unit specs.
 */

// ───────────────────────────────────────────────────────────────────────
// Refusal detection
//
// Models occasionally return apologetic refusals as plain text instead
// of throwing an API error. These propagate through the pipeline and
// land in the user's Sandpack iframe as "I can't help with that" copy
// inside a navbar component. Catch them before the user sees them.
// ───────────────────────────────────────────────────────────────────────

const REFUSAL_PATTERNS: RegExp[] = [
  /\bi (?:can(?:not|'?t)|am (?:unable|not able)|won'?t) (?:help|assist|create|generate|provide|do)\b/i,
  /\bi'?m sorry,?\s*(?:but|i)\b/i,
  /\bas an ai (?:language )?(?:model|assistant)\b/i,
  /\bi don'?t (?:feel comfortable|think it'?s appropriate)\b/i,
  /\bunfortunately,?\s*i (?:can(?:not|'?t)|am unable)\b/i,
  /\bthis (?:goes )?against (?:my|the) (?:guidelines|policies)\b/i,
];

export function detectRefusal(text: string): { refused: boolean; reason?: string } {
  if (!text) return { refused: false };
  const head = text.slice(0, 400);
  for (const pat of REFUSAL_PATTERNS) {
    const m = head.match(pat);
    if (m) return { refused: true, reason: `AI refusal: "${m[0]}"` };
  }
  return { refused: false };
}

// ───────────────────────────────────────────────────────────────────────
// Generic text validation
// ───────────────────────────────────────────────────────────────────────

export interface TextValidation {
  ok: boolean;
  reason?: string;
}

export function validateGeneratedText(text: string | undefined | null, minLength = 60): TextValidation {
  if (!text) return { ok: false, reason: "empty response" };
  const trimmed = text.trim();
  if (trimmed.length < minLength) return { ok: false, reason: `short response (${trimmed.length} chars)` };
  const refusal = detectRefusal(trimmed);
  if (refusal.refused) return { ok: false, reason: refusal.reason };
  return { ok: true };
}

// ───────────────────────────────────────────────────────────────────────
// Component-code validation
//
// The AI builder customises pre-built React components per build. The
// LLM's job is to return a complete, valid TypeScript file. Common
// failure modes seen in the wild:
//
//   1. Truncation — model hits max_tokens mid-file. JSX braces unbalanced.
//   2. Refusal/apology — model returns an English paragraph instead of code.
//   3. Banned imports — model invents `import { stuff } from "some-pkg"`
//      that Sandpack can't resolve.
//   4. Missing default export — Sandpack can't render the component.
//   5. Markdown fences — code wrapped in ```tsx blocks. Caller should
//      have stripped these (stripFencesAndWrap) but check just in case.
// ───────────────────────────────────────────────────────────────────────

// Imports that are Node-only / server-only and will crash in Sandpack's
// browser sandbox. The AI sometimes hallucinates these into React code.
const BANNED_IMPORTS = new Set([
  "fs", "fs/promises", "child_process", "net", "tls", "os", "path",
  "crypto", "stream", "http", "https", "dns", "url", "util",
  "next/server", "next/headers", "next/cookies", "next/cache",
]);

// Sandpack-resolvable packages. Anything outside this list will fail
// to bundle. Components imported from the customer site itself are fine
// (they get inlined). Everything else must be a runtime dep declared
// in buildPackageJson() in react-stream/route.ts.
const ALLOWED_PACKAGES = new Set([
  "react", "react-dom",
  "lucide-react",
  "framer-motion",
  "clsx", "tailwind-merge",
]);

export interface ComponentValidation {
  ok: boolean;
  reason?: string;
  warnings: string[];
}

export function validateGeneratedComponent(code: string): ComponentValidation {
  const warnings: string[] = [];
  const trimmed = (code || "").trim();

  // 1. Non-empty + minimum size (a real component is at least ~150 chars
  //    including imports and a default export).
  if (trimmed.length < 120) {
    return { ok: false, reason: `too short (${trimmed.length} chars)`, warnings };
  }

  // 2. Refusal check — model returned English instead of code.
  const refusal = detectRefusal(trimmed);
  if (refusal.refused) return { ok: false, reason: refusal.reason, warnings };

  // 3. Markdown fence leakage — should have been stripped upstream.
  if (/^\s*```/.test(trimmed) || /```\s*$/.test(trimmed)) {
    warnings.push("markdown fences not stripped");
  }

  // 4. Default export — Sandpack needs this to render the component.
  if (!/\bexport\s+default\b/.test(trimmed)) {
    return { ok: false, reason: "no default export found", warnings };
  }

  // 5. Balanced delimiters. A real component has matched {}, (), and [].
  //    This is a coarse check (doesn't account for strings/comments/regex)
  //    so we allow a small drift — only fail on egregious imbalance.
  const counts = countDelimiters(trimmed);
  if (Math.abs(counts.curly) > 2) {
    return { ok: false, reason: `unbalanced braces (${counts.curly > 0 ? "+" : ""}${counts.curly})`, warnings };
  }
  if (Math.abs(counts.paren) > 2) {
    return { ok: false, reason: `unbalanced parens (${counts.paren > 0 ? "+" : ""}${counts.paren})`, warnings };
  }
  if (Math.abs(counts.bracket) > 2) {
    return { ok: false, reason: `unbalanced brackets (${counts.bracket > 0 ? "+" : ""}${counts.bracket})`, warnings };
  }

  // 6. Banned imports — Node-only modules that crash in Sandpack.
  const importMatches = trimmed.matchAll(/\bimport\s+(?:[\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g);
  for (const m of importMatches) {
    const pkg = m[1];
    // Local imports (./Foo, ../Bar, @/components/Baz) are fine — Sandpack
    // resolves them against the file map.
    if (pkg.startsWith(".") || pkg.startsWith("@/")) continue;
    if (BANNED_IMPORTS.has(pkg)) {
      return { ok: false, reason: `banned import "${pkg}" (Node-only, won't bundle)`, warnings };
    }
    // Bare package imports must be in the allow-list. Tolerate
    // sub-paths like `lucide-react/dist/something` by checking root.
    const root = pkg.split("/")[0].replace(/^@/, "@");
    const rootForCheck = pkg.startsWith("@") ? pkg.split("/").slice(0, 2).join("/") : root;
    if (!ALLOWED_PACKAGES.has(rootForCheck) && !ALLOWED_PACKAGES.has(root)) {
      warnings.push(`unknown package "${pkg}" — Sandpack may fail to resolve`);
    }
  }

  // 7. Truncation heuristic. If the file ends in the middle of a JSX
  //    expression or import statement, the model was cut off.
  const tail = trimmed.slice(-40);
  if (/[,({[<]\s*$/.test(tail) || /\b(import|from|export|const|return)\s*$/.test(tail)) {
    return { ok: false, reason: "output appears truncated (mid-statement)", warnings };
  }

  return { ok: true, warnings };
}

function countDelimiters(s: string): { curly: number; paren: number; bracket: number } {
  let curly = 0, paren = 0, bracket = 0;
  let inSingle = false, inDouble = false, inBacktick = false, inLineComment = false, inBlockComment = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    const next = s[i + 1];
    if (inLineComment) {
      if (c === "\n") inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (c === "*" && next === "/") { inBlockComment = false; i++; }
      continue;
    }
    if (inSingle) { if (c === "\\") { i++; continue; } if (c === "'") inSingle = false; continue; }
    if (inDouble) { if (c === "\\") { i++; continue; } if (c === '"') inDouble = false; continue; }
    if (inBacktick) { if (c === "\\") { i++; continue; } if (c === "`") inBacktick = false; continue; }
    if (c === "/" && next === "/") { inLineComment = true; i++; continue; }
    if (c === "/" && next === "*") { inBlockComment = true; i++; continue; }
    if (c === "'") { inSingle = true; continue; }
    if (c === '"') { inDouble = true; continue; }
    if (c === "`") { inBacktick = true; continue; }
    if (c === "{") curly++;
    else if (c === "}") curly--;
    else if (c === "(") paren++;
    else if (c === ")") paren--;
    else if (c === "[") bracket++;
    else if (c === "]") bracket--;
  }
  return { curly, paren, bracket };
}

// ───────────────────────────────────────────────────────────────────────
// JSON validation (used by the edit endpoint)
// ───────────────────────────────────────────────────────────────────────

export interface JsonValidation<T = unknown> {
  ok: boolean;
  reason?: string;
  data?: T;
}

export function validateEditJson(text: string | undefined | null): JsonValidation<{ files: Record<string, string> }> {
  if (!text) return { ok: false, reason: "empty response" };
  const refusal = detectRefusal(text);
  if (refusal.refused) return { ok: false, reason: refusal.reason };

  // Strip markdown fences if the model wrapped the JSON.
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json|tsx|ts)?\s*\n?/i, "").replace(/\n?```\s*$/i, "");

  // Find the first { and last } — the model often prefixes/suffixes
  // explanatory text around the JSON.
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return { ok: false, reason: "no JSON object found in response" };
  }
  cleaned = cleaned.slice(start, end + 1);

  try {
    const data = JSON.parse(cleaned) as { files?: Record<string, string> };
    if (!data || typeof data !== "object") return { ok: false, reason: "parsed JSON is not an object" };
    if (!data.files || typeof data.files !== "object") {
      return { ok: false, reason: "missing `files` key in response" };
    }
    const fileKeys = Object.keys(data.files);
    if (fileKeys.length === 0) return { ok: false, reason: "`files` object is empty" };
    for (const key of fileKeys) {
      if (typeof data.files[key] !== "string") {
        return { ok: false, reason: `file "${key}" is not a string` };
      }
      if (data.files[key].length < 10) {
        return { ok: false, reason: `file "${key}" is suspiciously short (${data.files[key].length} chars)` };
      }
    }
    return { ok: true, data: { files: data.files } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, reason: `JSON parse error: ${msg.slice(0, 100)}` };
  }
}
