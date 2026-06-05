#!/usr/bin/env node
/**
 * critical-code-guard.js — the CI gate that catches the bugs that
 * actually crash production, WITHOUT failing on the large backlog of
 * low-severity type-strictness warnings.
 *
 * Why this exists (Craig, 2026-06-05): the builder kept shipping broken
 * code because next.config.js has `ignoreBuildErrors: true`, so a green
 * `next build` hid broken imports and runtime footguns. Real incidents
 * this caused:
 *   - /api/scaffold, /api/generate/react, /api/generate/pipeline imported
 *     functions that had been deleted → "X is not a function" at runtime.
 *   - The preview hashed files with crypto.subtle, which throws inside
 *     srcdoc iframes on iOS Safari → blank "Preview failed" every build.
 *
 * This guard fails CI (exit 1) on exactly those classes and nothing else,
 * so it can be a hard gate today without first paying down the whole TS
 * debt. As the backlog shrinks we can tighten it.
 *
 * CRITICAL (fail CI):
 *   1. TS2305 / TS2307 in src/  — imports a name/module that doesn't exist.
 *      These resolve to `undefined` and crash the moment the route runs.
 *   2. crypto.subtle in a client component — unavailable in srcdoc /
 *      opaque-origin iframes on iOS Safari; throws and blanks the preview.
 *
 * Usage:  node scripts/critical-code-guard.js
 */
"use strict";

const { execSync } = require("child_process");
const { readdirSync, readFileSync, statSync } = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
let failures = 0;

function fail(title, lines) {
  console.error(`\n[31m✗ CRITICAL: ${title}[0m`);
  for (const l of lines) console.error(`    ${l}`);
  failures++;
}
function ok(msg) {
  console.log(`[32m✓ ${msg}[0m`);
}

// ── Check 1: broken imports in src/ (TS2305 = no exported member,
//    TS2307 = cannot find module) ──────────────────────────────────────
console.log("[guard] typechecking for broken imports in src/ …");
let tscOut = "";
try {
  // --noEmit only; we parse stdout. tsc exits non-zero on any error,
  // which is expected — we filter for the critical classes ourselves.
  execSync("npx tsc --noEmit", { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
} catch (err) {
  tscOut = `${err.stdout || ""}${err.stderr || ""}`;
}
const brokenImports = tscOut
  .split("\n")
  .filter((l) => /^src\//.test(l) && /error TS(2305|2307)\b/.test(l));
if (brokenImports.length > 0) {
  fail(
    `${brokenImports.length} broken import(s) in src/ — these crash at runtime`,
    brokenImports
  );
} else {
  ok("no broken imports (TS2305/TS2307) in src/");
}

// ── Check 2: crypto.subtle in client components (iOS Safari preview crash) ──
console.log("[guard] scanning client components for crypto.subtle …");
function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else if (/\.(tsx?|jsx?)$/.test(name)) out.push(full);
  }
  return out;
}
const cryptoHits = [];
for (const file of walk(path.join(ROOT, "src", "components"))) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    if (!/crypto\.subtle/.test(line)) return;
    // Ignore comment lines that merely document the rule.
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) return;
    cryptoHits.push(`${path.relative(ROOT, file)}:${i + 1}: ${trimmed.slice(0, 100)}`);
  });
}
if (cryptoHits.length > 0) {
  fail(
    "crypto.subtle used in a client component (throws in srcdoc iframes on iOS Safari)",
    cryptoHits
  );
} else {
  ok("no crypto.subtle in client components");
}

// ── Verdict ──
if (failures > 0) {
  console.error(
    `\n[31m[guard] ${failures} critical issue group(s) — blocking. Fix before merge.[0m`
  );
  console.error(
    "        (Run `npm run audit:code` locally for the full report incl. warnings.)\n"
  );
  process.exit(1);
}
console.log("\n[32m[guard] no critical issues — clear to merge.[0m\n");
process.exit(0);
