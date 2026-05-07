import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fixedFilePath = join(__dirname, "../packages/agents/examples/content-moderator.ts");

test("content-moderator.ts does not contain console.log/debug/info calls", () => {
  const source = readFileSync(fixedFilePath, "utf-8");

  // These patterns would match the buggy code
  const consoleLogPattern = /console\.log\s*\(/;
  const consoleDebugPattern = /console\.debug\s*\(/;
  const consoleInfoPattern = /console\.info\s*\(/;

  assert.equal(
    consoleLogPattern.test(source),
    false,
    "File must not contain console.log() calls"
  );

  assert.equal(
    consoleDebugPattern.test(source),
    false,
    "File must not contain console.debug() calls"
  );

  assert.equal(
    consoleInfoPattern.test(source),
    false,
    "File must not contain console.info() calls"
  );
});

test("content-moderator.ts uses process.stdout.write instead of console.log", () => {
  const source = readFileSync(fixedFilePath, "utf-8");

  const processStdoutPattern = /process\.stdout\.write\s*\(/;

  assert.equal(
    processStdoutPattern.test(source),
    true,
    "File must use process.stdout.write() for output"
  );
});