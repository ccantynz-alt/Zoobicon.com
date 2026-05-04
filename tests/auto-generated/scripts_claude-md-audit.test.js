import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptPath = resolve(__dirname, "../scripts/claude-md-audit.js");
const scriptSource = readFileSync(scriptPath, "utf8");

test("no bare console.log/debug/info calls in script", () => {
  // The buggy code used console.log(...) in the main() function.
  // The fix replaced it with process.stdout.write(...).
  // We look for console.log / console.debug / console.info usage.
  const bareConsoleCallPattern = /console\.(log|debug|info)\s*\(/g;
  const matches = scriptSource.match(bareConsoleCallPattern);
  assert.equal(
    matches,
    null,
    `Script must not contain console.log/debug/info calls, found: ${JSON.stringify(matches)}`
  );
});

test("parseInt calls always include radix 10", () => {
  // The buggy code had parseInt(...) without a radix in checkNpmMajors.
  // The fix added the explicit radix 10: parseInt(..., 10).
  // Find all parseInt( occurrences and verify each has a radix.
  const parseIntNoRadixPattern = /parseInt\s*\([^)]*\)/g;
  const allCalls = [...scriptSource.matchAll(parseIntNoRadixPattern)];

  assert.ok(allCalls.length > 0, "Expected at least one parseInt call in the script");

  for (const match of allCalls) {
    const call = match[0];
    // A call with a radix will have a comma inside, e.g. parseInt(..., 10)
    assert.match(
      call,
      /parseInt\s*\([^,)]+,\s*10\s*\)/,
      `parseInt call missing radix 10: ${call}`
    );
  }
});

test("process.stdout.write is used instead of console.log in main output paths", () => {
  // Verify the fixed code uses process.stdout.write for output
  assert.ok(
    scriptSource.includes("process.stdout.write"),
    "Fixed code should use process.stdout.write for output"
  );
});