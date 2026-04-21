#!/usr/bin/env node
/**
 * CLAUDE.md FRESHNESS AUDIT — runs at the start of every coding session.
 *
 * CLAUDE.md is a snapshot. Snapshots rot. This script traffic-lights the
 * rot so Claude sees it BEFORE writing code — then updates the bible
 * against reality instead of anchoring on a stale version.
 *
 * Checks:
 *   1. Model IDs referenced in CLAUDE.md vs the canonical current set.
 *   2. "Last updated: YYYY-MM-DD" stamps — flag anything > 7 days old.
 *   3. Critical npm deps — majors behind stable (with --deep flag only).
 *
 * This script is ADVISORY. It never exits non-zero. The point is
 * visibility, not a failing gate. Claude decides what to do with each
 * finding based on context.
 *
 * Run: node scripts/claude-md-audit.js              (fast, no network)
 *      node scripts/claude-md-audit.js --deep       (adds npm outdated)
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const CLAUDE_MD = path.join(ROOT, "CLAUDE.md");

// ──────────────────────────────────────────────────────────────
// CANONICAL CURRENT STATE (update when Anthropic ships new models)
// ──────────────────────────────────────────────────────────────
const CANONICAL_MODELS = {
  opus: "claude-opus-4-7",
  sonnet: "claude-sonnet-4-6",
  haiku: "claude-haiku-4-5-20251001",
};

// Critical deps whose major-version lag blocks advancement.
const CRITICAL_DEPS = [
  "next",
  "react",
  "react-dom",
  "@anthropic-ai/sdk",
  "typescript",
  "tailwindcss",
  "framer-motion",
];

// ──────────────────────────────────────────────────────────────
function readClaudeMd() {
  try {
    return fs.readFileSync(CLAUDE_MD, "utf8");
  } catch {
    return null;
  }
}

function checkModels(content) {
  const findings = [];
  const canonical = new Set(Object.values(CANONICAL_MODELS));
  // Match any claude-{opus|sonnet|haiku}-X[-Y][-YYYYMMDD] token.
  const found = content.match(/claude-(opus|sonnet|haiku)-[\w-]+/gi) || [];
  const unique = [...new Set(found.map((m) => m.toLowerCase()))];
  const stale = unique.filter((m) => !canonical.has(m));
  if (stale.length) {
    findings.push({
      severity: "medium",
      category: "MODEL",
      message:
        `CLAUDE.md references non-canonical model IDs: ${stale.join(", ")}`,
      action:
        `verify each is historical context, not an active pin. canonical: ${Object.values(CANONICAL_MODELS).join(" / ")}`,
    });
  }
  return findings;
}

function checkStamps(content) {
  const findings = [];
  const today = new Date();
  const re = /Last updated:\s*(\d{4})-(\d{2})-(\d{2})/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const date = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00Z`);
    const ageDays = Math.floor((today - date) / 86400000);
    if (ageDays < 0) continue; // future date (Claude is running in sim-time)
    const line = content.slice(0, m.index).split("\n").length;
    const stamp = `${m[1]}-${m[2]}-${m[3]}`;
    if (ageDays > 14) {
      findings.push({
        severity: "high",
        category: "STAMP",
        message: `CLAUDE.md:${line} "Last updated: ${stamp}" is ${ageDays} days old`,
        action: "refresh the section or the top-of-file timestamp",
      });
    } else if (ageDays > 7) {
      findings.push({
        severity: "medium",
        category: "STAMP",
        message: `CLAUDE.md:${line} "Last updated: ${stamp}" is ${ageDays} days old`,
        action: "consider refreshing this session",
      });
    }
  }
  return findings;
}

function checkCompetitorSection(content) {
  const findings = [];
  // Look for "April 2026" / "March 2026" style date labels — flag the
  // most recent one per section, since competitor data goes stale in days.
  const monthMatches = content.match(
    /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+20\d{2}/g,
  );
  if (!monthMatches || monthMatches.length === 0) return findings;
  const today = new Date();
  const latestRef = monthMatches.reduce((latest, label) => {
    const d = new Date(`${label} 01`);
    return !isNaN(d) && (!latest || d > latest.date)
      ? { date: d, label }
      : latest;
  }, null);
  if (!latestRef) return findings;
  const ageDays = Math.floor((today - latestRef.date) / 86400000);
  if (ageDays > 30) {
    findings.push({
      severity: "high",
      category: "COMPETITORS",
      message: `newest competitor-section date label is "${latestRef.label}" (~${ageDays} days old)`,
      action:
        "run the §6 PROACTIVE COMPETITIVE SCAN — ship new rows, then update the label",
    });
  }
  return findings;
}

function checkNpmMajors() {
  const findings = [];
  let raw;
  try {
    raw = execSync("npm outdated --json", {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 20000,
    });
  } catch (e) {
    // `npm outdated` exits 1 when anything is outdated — capture stdout anyway.
    raw = (e && e.stdout) || "";
  }
  let data;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    return findings;
  }
  for (const name of CRITICAL_DEPS) {
    const info = data[name];
    if (!info) continue;
    const curMajor = parseInt(String(info.current || "0").split(".")[0], 10);
    const latestMajor = parseInt(String(info.latest || "0").split(".")[0], 10);
    if (Number.isFinite(curMajor) && Number.isFinite(latestMajor) && latestMajor > curMajor) {
      const gap = latestMajor - curMajor;
      findings.push({
        severity: gap >= 2 ? "high" : "medium",
        category: "NPM",
        message: `${name}: v${info.current} installed, v${info.latest} stable (${gap} major${gap > 1 ? "s" : ""} behind)`,
        action: gap >= 2 ? "upgrade this session" : "schedule upgrade",
      });
    }
  }
  return findings;
}

// ──────────────────────────────────────────────────────────────
const LIGHT = { high: "\u{1F534}", medium: "\u{1F7E0}", low: "\u{1F7E1}" };

function formatReport(findings) {
  const head = [
    "",
    "┏━━━ CLAUDE.md FRESHNESS REPORT ━━━",
    `┃ canonical models: ${CANONICAL_MODELS.opus} / ${CANONICAL_MODELS.sonnet} / ${CANONICAL_MODELS.haiku}`,
  ];
  if (!findings.length) {
    head.push("┃ \u{1F7E2} all clear — CLAUDE.md is aligned with reality");
    head.push("┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    return head.join("\n");
  }
  const byCat = findings.reduce((acc, f) => {
    (acc[f.category] = acc[f.category] || []).push(f);
    return acc;
  }, {});
  for (const cat of Object.keys(byCat)) {
    head.push(`┃`);
    head.push(`┃ [${cat}]`);
    for (const f of byCat[cat]) {
      head.push(`┃   ${LIGHT[f.severity] || "•"} ${f.message}`);
      if (f.action) head.push(`┃      ↳ ${f.action}`);
    }
  }
  head.push("┃");
  head.push(
    "┃ CLAUDE.md is a snapshot, not a ceiling. If a finding is real,",
  );
  head.push("┃ update the bible THIS SESSION before writing new code.");
  head.push("┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  return head.join("\n");
}

function main() {
  const content = readClaudeMd();
  if (content === null) {
    console.log("[claude-md-audit] CLAUDE.md not found at repo root — skipping");
    process.exit(0);
  }
  const deep = process.argv.includes("--deep");
  const findings = [
    ...checkModels(content),
    ...checkStamps(content),
    ...checkCompetitorSection(content),
    ...(deep ? checkNpmMajors() : []),
  ];
  console.log(formatReport(findings));
  process.exit(0);
}

main();
