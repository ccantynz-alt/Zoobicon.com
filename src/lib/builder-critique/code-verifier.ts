/**
 * Code verification loop — KILLER-MOVES-BUILDER.md #B2.
 *
 * For the legacy free-form code-generation path (react-stream rather
 * than slot-stream), runs the AI's output through a lightweight
 * in-process compile + boot check. If verification fails, sends the
 * error message + offending code back to Haiku for ONE repair pass,
 * then re-verifies. Caps repair retries at 2 to bound cost.
 *
 * Slot-stream sites SKIP this — the assembler guarantees structural
 * correctness so there's nothing to verify. This module is purely for
 * the non-slot-locked path that still ships free-form React code.
 *
 * Why bother if Slot-Locked is the future:
 *   - Slot-Locked covers ~80% of generated components today (5 of 7
 *     are slot-locked; the rest of the 118-component registry is not
 *     yet migrated)
 *   - For the 20% remaining (specialty components, custom one-offs),
 *     this loop catches broken JSX before Sandpack renders blank
 *   - Matches Bolt V2's "auto-error-fixing agent" pattern for those
 *     specific cases
 *
 * The verifier checks (in order, all in-process — no Sandpack iframe):
 *   1. Brace balance ({/}, (/), [/])
 *   2. JSX angle-bracket sanity (every <Tag has a closing </Tag> or />)
 *   3. Import allow-list (no fs, no child_process, no Node-only modules)
 *   4. Default export exists
 *   5. No obvious refusals or English-paragraph-instead-of-code
 *
 * Compile via SWC/Babel happens later — this in-process pass catches
 * the 90% of failures cheaply.
 */

import { validateGeneratedComponent } from "@/lib/llm-output-validator";

export interface VerificationResult {
  ok: boolean;
  /** When !ok: human-readable list of issues for the repair prompt. */
  issues: string[];
  /** Pass-through code on success; possibly-patched code on retry. */
  code: string;
}

/**
 * Lightweight in-process verification. Reuses the validator from
 * Phase 1 (refusal detection, balanced delimiters, banned imports,
 * default export check) and layers in JSX tag-balance heuristics.
 */
export function verifyGeneratedCode(code: string): VerificationResult {
  const baseValidation = validateGeneratedComponent(code);
  const issues: string[] = [];

  if (!baseValidation.ok) {
    issues.push(baseValidation.reason || "validation failed");
    return { ok: false, issues, code };
  }
  // Warnings from the validator are also worth flagging in the repair
  // prompt — e.g., unknown packages or stripped markdown fences.
  for (const w of baseValidation.warnings) issues.push(w);

  // JSX tag-balance heuristic. Count opening + closing tags by name;
  // they should agree (except for self-closing). This is a coarse
  // check — a real parser would be better but slower; for catching the
  // most common truncation pattern (model cuts off mid-JSX), this is
  // sufficient.
  const tagBalance = checkJsxTagBalance(code);
  if (!tagBalance.balanced) {
    issues.push(
      `JSX tags appear unbalanced: ${tagBalance.detail}. The model likely truncated mid-element.`,
    );
  }

  return { ok: issues.length === 0, issues, code };
}

interface JsxTagBalanceResult {
  balanced: boolean;
  detail: string;
}

function checkJsxTagBalance(code: string): JsxTagBalanceResult {
  // Match <Tag …>, </Tag>, and <Tag … />.
  // Custom-component names start with uppercase; HTML tags with lower.
  // Both forms are counted. Self-closing tags don't count toward
  // either bucket.
  const opens = new Map<string, number>();
  const closes = new Map<string, number>();
  const tagRe = /<\/?([A-Za-z][A-Za-z0-9_.]*)\b[^>]*?(\/)?>/g;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(code)) !== null) {
    const isClose = m[0].startsWith("</");
    const isSelfClose = m[2] === "/";
    const name = m[1];
    if (isSelfClose) continue;
    if (isClose) {
      closes.set(name, (closes.get(name) || 0) + 1);
    } else {
      opens.set(name, (opens.get(name) || 0) + 1);
    }
  }
  const drift: string[] = [];
  const allNames = new Set([...opens.keys(), ...closes.keys()]);
  for (const name of allNames) {
    const o = opens.get(name) || 0;
    const c = closes.get(name) || 0;
    if (o !== c) drift.push(`<${name}>: ${o} open, ${c} close`);
  }
  if (drift.length === 0) return { balanced: true, detail: "" };
  // Allow a small drift (e.g. a tag inside a string literal might
  // confuse the regex). Only fail when 2+ tags drift OR drift exceeds 1.
  const totalDrift = drift.reduce((sum, d) => {
    const match = d.match(/(\d+) open, (\d+) close/);
    if (!match) return sum;
    return sum + Math.abs(Number(match[1]) - Number(match[2]));
  }, 0);
  if (totalDrift <= 1) return { balanced: true, detail: "minor drift, within tolerance" };
  return { balanced: false, detail: drift.slice(0, 3).join("; ") };
}

/**
 * Build the repair prompt that gets sent back to the customiser when
 * verification fails. The model sees the original code + a numbered
 * list of issues. It returns the patched file.
 */
export function buildRepairPrompt(originalCode: string, issues: string[]): string {
  return [
    "The component you generated failed verification. Specific issues:",
    "",
    ...issues.map((issue, i) => `${i + 1}. ${issue}`),
    "",
    "Return the FULL corrected TypeScript file. Fix all the issues listed",
    "above. Do not add explanations or markdown fences — output ONLY the",
    "corrected component code.",
    "",
    "Original (broken) file:",
    "```tsx",
    originalCode,
    "```",
  ].join("\n");
}
