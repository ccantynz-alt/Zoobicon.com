#!/usr/bin/env node
/**
 * Critical-deps guard — prevents auto-fix bots (GateTest etc) from silently
 * removing dependencies the build genuinely needs.
 *
 * Background:
 *   GateTest's auto-fix tool has twice attempted to remove
 *   @typescript-eslint/eslint-plugin and @typescript-eslint/parser from
 *   devDependencies. These are required by next/eslint-config to recognise
 *   the @typescript-eslint/no-explicit-any rule the codebase actually uses.
 *   Without them, `npm run lint` fails with "rule definition not found"
 *   errors and CI breaks.
 *
 *   This script enumerates every dep the project genuinely cannot run
 *   without (build-time, lint-time, or test-time) and fails CI if any
 *   are missing. Any auto-fix PR that removes one will get caught here
 *   before it can merge.
 *
 * Add new entries to CRITICAL_DEPS only after confirming the project
 * actually breaks without them.
 */

const fs = require("node:fs");
const path = require("node:path");

const CRITICAL_DEPS = [
  // Lint plugins required by next/eslint-config for the @typescript-eslint/* rules.
  // Removing these makes `npm run lint` throw "rule definition not found".
  { name: "@typescript-eslint/eslint-plugin", scope: "devDependencies" },
  { name: "@typescript-eslint/parser",        scope: "devDependencies" },
  // Core stack — these getting removed would be catastrophic but worth a
  // tripwire just in case an auto-fix tool decides "these aren't used".
  { name: "next",       scope: "dependencies" },
  { name: "react",      scope: "dependencies" },
  { name: "react-dom",  scope: "dependencies" },
  { name: "@anthropic-ai/sdk",        scope: "dependencies" },
  { name: "@neondatabase/serverless", scope: "dependencies" },
  { name: "stripe",     scope: "dependencies" },
  { name: "tailwindcss", scope: "devDependencies" },
  { name: "typescript", scope: "devDependencies" },
  { name: "vitest",     scope: "devDependencies" },
];

const pkgPath = path.resolve(__dirname, "..", "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

const missing = [];
for (const { name, scope } of CRITICAL_DEPS) {
  const tree = pkg[scope] || {};
  if (!tree[name]) {
    missing.push({ name, scope });
  }
}

if (missing.length > 0) {
  console.error("\n❌ critical-deps-guard FAILED");
  console.error("    Missing dependencies the project cannot run without:\n");
  for (const m of missing) {
    console.error(`      • ${m.name}  (${m.scope})`);
  }
  console.error("\n  These were likely removed by an auto-fix tool. Restore them:");
  console.error(`      npm install --save-dev ${missing.filter((m) => m.scope === "devDependencies").map((m) => m.name).join(" ") || "(none)"}`);
  console.error(`      npm install --save     ${missing.filter((m) => m.scope === "dependencies").map((m) => m.name).join(" ") || "(none)"}`);
  console.error("");
  process.exit(1);
}

console.log(`✓ critical-deps guard: all ${CRITICAL_DEPS.length} required dependencies present`);
