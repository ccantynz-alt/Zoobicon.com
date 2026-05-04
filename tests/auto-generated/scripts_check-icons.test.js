import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptPath = resolve(__dirname, "scripts/check-icons.js");
const scriptContent = readFileSync(scriptPath, "utf8");

test("fixed code does not contain console.log calls", () => {
  // The bug was that console.log was used instead of process.stderr.write / process.stdout.write
  // This assertion would FAIL against the original buggy code which had:
  //   console.log("[icon-check] lucide-react not installed, skipping check")
  //   console.log("✓ All lucide-react icon imports verified")
  const consoleLogMatches = scriptContent.match(/console\.log\s*\(/g);
  assert.equal(
    consoleLogMatches,
    null,
    `Found console.log() calls in fixed code: ${JSON.stringify(consoleLogMatches)}`
  );
});

test("fixed code does not contain console.debug calls", () => {
  const consoleDebugMatches = scriptContent.match(/console\.debug\s*\(/g);
  assert.equal(
    consoleDebugMatches,
    null,
    `Found console.debug() calls in fixed code: ${JSON.stringify(consoleDebugMatches)}`
  );
});

test("fixed code does not contain console.info calls", () => {
  const consoleInfoMatches = scriptContent.match(/console\.info\s*\(/g);
  assert.equal(
    consoleInfoMatches,
    null,
    `Found console.info() calls in fixed code: ${JSON.stringify(consoleInfoMatches)}`
  );
});

test("fixed code uses process.stderr.write for the lucide-react-not-installed message", () => {
  // The original bug had console.log for this message; fix should use process.stderr.write
  assert.match(
    scriptContent,
    /process\.stderr\.write\s*\(\s*["'`]\[icon-check\]/,
    "Expected process.stderr.write to be used for the 'lucide-react not installed' message"
  );
});

test("fixed code uses process.stdout.write for the success message", () => {
  // The original bug had console.log("✓ All lucide-react icon imports verified")
  // The fix should use process.stdout.write
  assert.match(
    scriptContent,
    /process\.stdout\.write\s*\(\s*["'`]✓ All lucide-react icon imports verified/,
    "Expected process.stdout.write to be used for the success message"
  );
});