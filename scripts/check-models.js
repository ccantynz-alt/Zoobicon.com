#!/usr/bin/env node
/**
 * Flywheel guard: enforces rule 4 — "Opus for builds, non-negotiable."
 *
 * This script scans the generation paths for any reference to a Haiku model
 * inside a developer-agent context. If it finds one, the build fails with a
 * pointer back to CLAUDE.md.
 *
 * Why this exists: the audit on 2026-04-26 found that the active builder
 * pipeline (/api/generate/react-stream) was using Haiku for component
 * customisation despite rule 4 mandating Opus 4.7. The rule had been a
 * value (ignorable), not a procedure (enforceable). This script makes it
 * a procedure — every CI run, every commit hook, every `npm run build`.
 *
 * What's allowed:
 *   - Haiku as the PLANNER (JSON classification only — fine, fast, cheap)
 *   - Haiku in non-generation paths (search, classification, intent, audit)
 *   - Sonnet for diff edits (surgical patches — speed > Opus quality)
 *
 * What's forbidden:
 *   - Haiku as the customiser / developer / build agent in any
 *     /api/generate/* route that emits a full site or full component tree
 *
 * Run as part of `npm run build` and CI.
 */

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");

// Routes that emit user-facing site code. Haiku is forbidden as the
// customiser / developer model in these paths. Add to this list when a
// new generation route is created.
const DEVELOPER_PATHS = [
  "src/app/api/generate/react-stream/route.ts",
  "src/app/api/generate/react/route.ts",
  "src/app/api/generate/pipeline/route.ts",
  "src/app/api/generate/multipage/route.ts",
  "src/app/api/generate/fullstack/route.ts",
  "src/app/api/generate/variants/route.ts",
];

// Variables / constants whose value is the developer model. If any of
// these resolves to a Haiku id, the build fails. The check is name-based
// because the actual string may be stored in a const or env var.
const DEVELOPER_VARIABLE_NAMES = [
  "MODEL_DEVELOPER",
  "MODEL_CUSTOMISER",
  "MODEL_CUSTOMIZER",
  "MODEL_BUILD",
  "MODEL_PREMIUM",
  "MODEL_BALANCED",
  "developerModel",
  "customiserModel",
  "customizerModel",
  "buildModel",
];

const HAIKU_PATTERN = /["']claude-haiku[^"']*["']/g;

const issues = [];

function check(filePath) {
  const abs = path.join(REPO_ROOT, filePath);
  if (!fs.existsSync(abs)) return;

  const content = fs.readFileSync(abs, "utf8");
  const lines = content.split("\n");

  // 1. Any line that assigns a Haiku id to a developer variable name.
  lines.forEach((line, idx) => {
    for (const name of DEVELOPER_VARIABLE_NAMES) {
      const re = new RegExp(`\\b${name}\\b\\s*[=:]\\s*["']claude-haiku`);
      if (re.test(line)) {
        issues.push({
          file: filePath,
          line: idx + 1,
          text: line.trim(),
          reason: `${name} resolves to Haiku — rule 4 mandates Opus 4.7 for the developer agent.`,
        });
      }
    }
  });

  // 2. The conditional pattern `mode === "premium" ? X : MODEL_HAIKU`
  //    or `isPremium ? "claude-opus..." : "claude-haiku..."`. This was
  //    the exact pattern that hid the regression on react-stream.
  const conditionalRe = /(?:isPremium|mode\s*===?\s*["']premium["'])[\s\S]{0,80}?["']claude-haiku[^"']*["']/g;
  let match;
  while ((match = conditionalRe.exec(content)) !== null) {
    const lineNum = content.slice(0, match.index).split("\n").length;
    issues.push({
      file: filePath,
      line: lineNum,
      text: match[0].replace(/\s+/g, " ").trim().slice(0, 120),
      reason: "Tier-conditional fallback to Haiku — non-premium tier must still use Opus for the developer agent.",
    });
  }

  // 3. Any direct anthropic.messages.create({ model: "claude-haiku..." })
  //    inside a developer-path file. The planner uses callLLMWithFailover
  //    with an explicit MODEL_PLANNER constant, so a raw .messages.create
  //    with Haiku in this path is almost certainly the developer agent.
  const sdkCallRe = /messages\.create\s*\(\s*\{[\s\S]{0,200}?model:\s*["']claude-haiku[^"']*["']/g;
  while ((match = sdkCallRe.exec(content)) !== null) {
    const lineNum = content.slice(0, match.index).split("\n").length;
    issues.push({
      file: filePath,
      line: lineNum,
      text: match[0].replace(/\s+/g, " ").trim().slice(0, 120),
      reason: "Direct Anthropic SDK call uses Haiku in a developer-path file. Use Sonnet (diffs) or Opus 4.7 (builds).",
    });
  }
}

DEVELOPER_PATHS.forEach(check);

if (issues.length > 0) {
  console.error("\n[model-check] FAIL — Haiku detected in developer-agent path");
  console.error("[model-check] CLAUDE.md rule 4: \"Developer agent MUST use claude-opus-4-7. NEVER downgrade.\"\n");
  for (const issue of issues) {
    console.error(`  ${issue.file}:${issue.line}`);
    console.error(`    ${issue.text}`);
    console.error(`    → ${issue.reason}\n`);
  }
  console.error(`[model-check] ${issues.length} violation${issues.length === 1 ? "" : "s"} found.`);
  console.error("[model-check] Fix: replace claude-haiku-* with claude-opus-4-7 (builds) or claude-sonnet-4-6 (diffs).");
  console.error("[model-check] If Haiku is genuinely correct here (e.g. JSON classification), name the variable MODEL_PLANNER and the check will allow it.\n");
  process.exit(1);
}

console.log("[model-check] OK — no Haiku in developer-agent paths.");
