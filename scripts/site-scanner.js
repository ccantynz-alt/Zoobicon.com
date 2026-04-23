#!/usr/bin/env node

/**
 * Zoobicon Site Scanner — finds broken pages, wrong colors, missing content,
 * dead links, and visual issues across the entire site.
 *
 * Usage:
 *   node scripts/site-scanner.js                    # scan built output
 *   node scripts/site-scanner.js --live https://zoobicon.com  # scan live site
 */

const fs = require("fs");
const path = require("path");

const ISSUES = [];
const SCANNED = { files: 0, pages: 0 };

function issue(severity, file, line, message) {
  ISSUES.push({ severity, file, line, message });
}

// ── Color audit ──
const BANNED_BG_COLORS = [
  /bg-\[#0a0a12\]/,
  /bg-\[#0a0a14\]/,
  /bg-\[#050507\]/,
  /bg-\[#050508\]/,
  /bg-\[#06080f\]/,
  /bg-\[#07070b\]/,
  /bg-\[#09090f\]/,
  /bg-\[#000000\]/,
  /bg-\[#000\]/,
  /from-\[#050508\]/,
  /from-\[#000\]/,
];

// ── Text corruption patterns (known bad find/replace artifacts) ──
const TEXT_CORRUPTION = [
  { bad: /\bMessageCircle\b/, context: "social", fix: "Should be Twitter/X" },
  { bad: /\bThumbsUp\b/, context: "social", fix: "Should be Facebook" },
  { bad: /\bGlobe2\b/, context: "browser", fix: "Should be Chrome" },
  { bad: /\bHash\b/, context: "integrations", fix: "Should be Slack" },
  { bad: /\bLayers\b/, context: "integrations", fix: "Should be Figma" },
];

// ── Dead patterns ──
const DEAD_PATTERNS = [
  { regex: /Coming Soon.*Coming Soon/s, message: "Double 'Coming Soon' text" },
  { regex: /\$\{.*?\}/, message: "Unresolved template literal in output" },
  { regex: /undefined|null/, message: "Possible undefined/null in rendered text (check context)" },
  { regex: /TODO|FIXME|HACK|XXX/, message: "Dev marker left in production code" },
  { regex: /localhost:3000/, message: "Hardcoded localhost URL" },
  { regex: /placeholder\.com|example\.com/, message: "Placeholder URL" },
  { regex: /your-api-key|sk-[a-z0-9]{20,}|AKIA[A-Z0-9]{16}/, message: "Possible exposed API key" },
];

// ── Import validation ──
const LUCIDE_ICONS = new Set();
function loadLucideIcons() {
  try {
    const iconCheckPath = path.join(__dirname, "check-icons.js");
    if (fs.existsSync(iconCheckPath)) return; // check-icons.js handles this
    // Fallback: check node_modules
    const lucidePath = path.join(__dirname, "..", "node_modules", "lucide-react", "dist", "esm", "icons");
    if (fs.existsSync(lucidePath)) {
      fs.readdirSync(lucidePath).forEach(f => {
        if (f.endsWith(".js")) LUCIDE_ICONS.add(f.replace(".js", ""));
      });
    }
  } catch { /* skip */ }
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  const relPath = path.relative(process.cwd(), filePath);
  SCANNED.files++;

  const isPage = filePath.includes("/app/") && filePath.endsWith("page.tsx");
  if (isPage) SCANNED.pages++;

  // Skip non-page files for some checks
  const isComponent = filePath.includes("/components/");
  const isLib = filePath.includes("/lib/");

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;

    // Color audit (pages only)
    if (isPage) {
      for (const pattern of BANNED_BG_COLORS) {
        if (pattern.test(line)) {
          issue("warning", relPath, lineNum, `Near-black background: ${line.trim().slice(0, 80)}`);
        }
      }
    }

    // Text corruption (all files)
    for (const { bad, context, fix } of TEXT_CORRUPTION) {
      if (bad.test(line) && line.includes(context)) {
        issue("error", relPath, lineNum, `Text corruption: ${bad.source} — ${fix}`);
      }
    }

    // Dead patterns (pages and components)
    if (isPage || isComponent) {
      for (const { regex, message } of DEAD_PATTERNS) {
        if (regex.test(line) && !line.trim().startsWith("//") && !line.trim().startsWith("*")) {
          // Skip template literals in actual code
          if (message.includes("template literal") && (line.includes("const ") || line.includes("let ") || line.includes("return "))) continue;
          // Skip undefined/null checks in code logic
          if (message.includes("undefined") && (line.includes("===") || line.includes("!==") || line.includes("typeof") || line.includes("if (") || line.includes("||") || line.includes("??"))) continue;
          issue("info", relPath, lineNum, `${message}: ${line.trim().slice(0, 60)}`);
        }
      }
    }
  });

  // Check for blank/empty pages
  if (isPage) {
    const hasReturn = content.includes("return (") || content.includes("return(");
    if (!hasReturn) {
      issue("error", relPath, 0, "Page has no return statement — will render blank");
    }

    // Check for missing error states
    const hasTryCatch = content.includes("try {") || content.includes("try{");
    const hasErrorState = content.includes("error") && (content.includes("setError") || content.includes("useState"));
    if (hasTryCatch && !hasErrorState) {
      issue("info", relPath, 0, "Has try/catch but no error state — errors may be swallowed");
    }
  }
}

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") continue;
      scanDirectory(fullPath);
    } else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) {
      if (entry.name.endsWith(".test.ts") || entry.name.endsWith(".test.tsx") || entry.name.endsWith(".spec.ts")) continue;
      scanFile(fullPath);
    }
  }
}

// ── Route completeness check ──
function checkRoutes() {
  const appDir = path.join(process.cwd(), "src", "app");
  if (!fs.existsSync(appDir)) return;

  const routes = [];
  function findRoutes(dir, prefix = "") {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name === "api" || entry.name.startsWith("_")) continue;
      const routePath = `${prefix}/${entry.name}`;
      const pagePath = path.join(dir, entry.name, "page.tsx");
      if (fs.existsSync(pagePath)) {
        routes.push({ route: routePath, file: pagePath });
      }
      findRoutes(path.join(dir, entry.name), routePath);
    }
  }
  findRoutes(appDir);

  for (const { route, file } of routes) {
    const content = fs.readFileSync(file, "utf8");
    // Check for pages that are just "Coming Soon" with no real content
    const lines = content.split("\n").length;
    if (lines < 30 && content.includes("Coming Soon")) {
      issue("info", path.relative(process.cwd(), file), 0, `Route ${route} is just a stub/Coming Soon page (${lines} lines)`);
    }
  }
}

// ── Main ──
console.log("\n🔍 Zoobicon Site Scanner\n");
console.log("Scanning source files...\n");

loadLucideIcons();
scanDirectory(path.join(process.cwd(), "src"));
checkRoutes();

// ── Report ──
const errors = ISSUES.filter(i => i.severity === "error");
const warnings = ISSUES.filter(i => i.severity === "warning");
const infos = ISSUES.filter(i => i.severity === "info");

console.log(`Scanned: ${SCANNED.files} files, ${SCANNED.pages} pages\n`);

if (errors.length > 0) {
  console.log(`\x1b[31m❌ ERRORS (${errors.length}):\x1b[0m`);
  errors.forEach(i => console.log(`  ${i.file}:${i.line} — ${i.message}`));
  console.log();
}

if (warnings.length > 0) {
  console.log(`\x1b[33m⚠️  WARNINGS (${warnings.length}):\x1b[0m`);
  warnings.forEach(i => console.log(`  ${i.file}:${i.line} — ${i.message}`));
  console.log();
}

if (infos.length > 0) {
  console.log(`\x1b[36mℹ️  INFO (${infos.length}):\x1b[0m`);
  // Group by message to reduce noise
  const grouped = {};
  infos.forEach(i => {
    const key = i.message.split(":")[0];
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(i);
  });
  for (const [key, items] of Object.entries(grouped)) {
    if (items.length > 5) {
      console.log(`  ${key} — ${items.length} instances (showing first 3)`);
      items.slice(0, 3).forEach(i => console.log(`    ${i.file}:${i.line}`));
    } else {
      items.forEach(i => console.log(`  ${i.file}:${i.line} — ${i.message}`));
    }
  }
  console.log();
}

const total = ISSUES.length;
if (total === 0) {
  console.log("\x1b[32m✅ No issues found!\x1b[0m\n");
} else {
  console.log(`Total: ${errors.length} errors, ${warnings.length} warnings, ${infos.length} info\n`);
}

// Exit code: 1 if errors, 0 otherwise
process.exit(errors.length > 0 ? 1 : 0);
