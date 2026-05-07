import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptPath = join(__dirname, "scripts", "generate-icons.js");

test("generate-icons.js does not contain console.log/debug/info calls", () => {
  const source = readFileSync(scriptPath, "utf8");

  // These patterns would match the buggy console.log calls that were present
  const consoleLogPattern = /console\s*\.\s*(log|debug|info)\s*\(/;

  assert.equal(
    consoleLogPattern.test(source),
    false,
    "scripts/generate-icons.js must not contain console.log/debug/info calls"
  );
});