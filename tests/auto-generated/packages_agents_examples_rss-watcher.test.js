import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const filePath = join(__dirname, "../packages/agents/examples/rss-watcher.ts");

test("rss-watcher.ts does not contain console.log/debug/info calls", () => {
  let source;
  try {
    source = readFileSync(filePath, "utf8");
  } catch {
    // Try relative path from cwd
    source = readFileSync("packages/agents/examples/rss-watcher.ts", "utf8");
  }

  // These assertions would FAIL against the original buggy code
  // which had console.log calls in the .then() callback
  assert.doesNotMatch(
    source,
    /console\.log\s*\(/,
    "File must not contain console.log() calls"
  );
  assert.doesNotMatch(
    source,
    /console\.debug\s*\(/,
    "File must not contain console.debug() calls"
  );
  assert.doesNotMatch(
    source,
    /console\.info\s*\(/,
    "File must not contain console.info() calls"
  );

  // Also verify the fix is present: process.stdout.write should be used instead
  assert.match(
    source,
    /process\.stdout\.write\s*\(/,
    "File should use process.stdout.write() instead of console.log()"
  );
});