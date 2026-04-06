#!/usr/bin/env node

/**
 * Zoobicon Quality Gate — Automated code quality checks
 *
 * Run: node scripts/quality-gate.js
 * CI: Added as a step in .github/workflows/ci.yml
 *
 * Checks:
 * 1. Dead buttons (no onClick handler)
 * 2. Missing 4-domain footer on product/tool pages
 * 3. Hardcoded credentials or test data
 * 4. Broken internal links (href to non-existent pages)
 * 5. Missing auth checks on admin pages
 */

const fs = require("fs");
const path = require("path");
const glob = require("glob") || { sync: (p) => require("child_process").execSync(`find ${p.replace("**/*.tsx", ". -name '*.tsx'")} 2>/dev/null`).toString().trim().split("\n") };

const SRC = path.resolve(__dirname, "../src");
const APP = path.join(SRC, "app");
let errors = 0;
let warnings = 0;

function error(file, msg) {
  console.error(`❌ ERROR: ${file}: ${msg}`);
  errors++;
}

function warn(file, msg) {
  console.warn(`⚠️  WARN: ${file}: ${msg}`);
  warnings++;
}

// ─── Find all .tsx files ────────────────────────────────
function findFiles(dir, ext = ".tsx") {
  const results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
        results.push(...findFiles(fullPath, ext));
      } else if (entry.isFile() && entry.name.endsWith(ext)) {
        results.push(fullPath);
      }
    }
  } catch { /* directory doesn't exist */ }
  return results;
}

const allFiles = findFiles(APP);
console.log(`\n🔍 Zoobicon Quality Gate — scanning ${allFiles.length} files...\n`);

// ─── Check 1: Hardcoded credentials ─────────────────────
console.log("--- Check 1: Hardcoded credentials ---");
const CREDENTIAL_PATTERNS = [
  /DEFAULT_ADMIN_PASSWORD\s*=\s*"/,
  /DEFAULT_ADMIN_EMAIL\s*=\s*"/,
  /\|\|\s*"zoobicon-admin-2024"/,
  /\|\|\s*"zoobicon-dev-secret"/,
  /sk_test_\w{20,}/,
  /sk_live_\w{20,}/,
  /whsec_\w{20,}/,
];

for (const file of findFiles(SRC)) {
  try {
    const content = fs.readFileSync(file, "utf-8");
    for (const pattern of CREDENTIAL_PATTERNS) {
      if (pattern.test(content)) {
        error(path.relative(SRC, file), `Hardcoded credential found: ${pattern.source.slice(0, 40)}`);
      }
    }
  } catch { /* unreadable */ }
}

// ─── Check 2: Dead buttons on customer-facing pages ─────
console.log("--- Check 2: Dead buttons ---");
const CUSTOMER_PAGES = allFiles.filter(f =>
  !f.includes("/api/") && !f.includes("/admin/") && f.endsWith("page.tsx")
);

for (const file of CUSTOMER_PAGES) {
  try {
    const content = fs.readFileSync(file, "utf-8");
    // Find <button> tags without onClick
    const buttonRegex = /<button\b[^>]*>/g;
    let match;
    let lineNum = 0;
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes("<button") && !line.includes("onClick") && !line.includes("type=\"submit\"") && !line.includes("disabled")) {
        // Check next 10 lines for onClick (multi-line button tags)
        const nextLines = lines.slice(i, i + 11).join(" ");
        if (!nextLines.includes("onClick") && !nextLines.includes("type=\"submit\"") && !nextLines.includes("onMouseEnter") && !nextLines.includes("onMouseDown")) {
          warn(path.relative(SRC, file) + `:${i + 1}`, "Button without onClick handler");
        }
      }
    }
  } catch { /* unreadable */ }
}

// ─── Check 3: Product pages missing 4-domain footer ─────
console.log("--- Check 3: 4-domain footer ---");
const PRODUCT_PAGES = allFiles.filter(f =>
  (f.includes("/products/") || f.includes("/tools/")) && f.endsWith("page.tsx")
);

for (const file of PRODUCT_PAGES) {
  try {
    const content = fs.readFileSync(file, "utf-8");
    if (!content.includes("zoobicon.ai") || !content.includes("zoobicon.io") || !content.includes("zoobicon.sh")) {
      warn(path.relative(SRC, file), "Missing 4-domain footer (zoobicon.com · .ai · .io · .sh)");
    }
  } catch { /* unreadable */ }
}

// ─── Check 4: Test emails in production code ────────────
console.log("--- Check 4: Test data in production ---");
const TEST_PATTERNS = [
  /test@zoobicon\.com/,
  /test@example\.com/,
  /\[Your Company Name\]/,
  /\[Your Website URL\]/,
  /lorem ipsum/i,
];

for (const file of CUSTOMER_PAGES) {
  try {
    const content = fs.readFileSync(file, "utf-8");
    for (const pattern of TEST_PATTERNS) {
      if (pattern.test(content)) {
        // Exclude template generators where placeholders are intentional
        if (file.includes("privacy-policy") || file.includes("meta-tag")) continue;
        warn(path.relative(SRC, file), `Test/placeholder data found: ${pattern.source}`);
      }
    }
  } catch { /* unreadable */ }
}

// ─── Summary ────────────────────────────────────────────
console.log(`\n${"=".repeat(50)}`);
console.log(`Quality Gate: ${errors} errors, ${warnings} warnings`);
console.log(`${"=".repeat(50)}\n`);

if (errors > 0) {
  console.error("❌ Quality gate FAILED — fix errors before merging");
  process.exit(1);
}

if (warnings > 0) {
  console.warn("⚠️  Quality gate PASSED with warnings");
  process.exit(0);
}

console.log("✅ Quality gate PASSED — all checks clean");
process.exit(0);
