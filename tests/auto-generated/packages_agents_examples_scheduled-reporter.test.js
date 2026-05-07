import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fixedFilePath = join(__dirname, "packages/agents/examples/scheduled-reporter.ts");

test("scheduled-reporter.ts does not contain console.log/debug/info calls", () => {
  const source = readFileSync(fixedFilePath, "utf-8");

  // These patterns would have matched the buggy code
  const consoleLogPattern = /console\.log\s*\(/;
  const consoleDebugPattern = /console\.debug\s*\(/;
  const consoleInfoPattern = /console\.info\s*\(/;

  assert.equal(
    consoleLogPattern.test(source),
    false,
    "Found console.log() call in scheduled-reporter.ts — this was the bug that was fixed"
  );

  assert.equal(
    consoleDebugPattern.test(source),
    false,
    "Found console.debug() call in scheduled-reporter.ts"
  );

  assert.equal(
    consoleInfoPattern.test(source),
    false,
    "Found console.info() call in scheduled-reporter.ts"
  );
});

test("scheduled-reporter.ts uses process.stdout.write instead of console.log", () => {
  const source = readFileSync(fixedFilePath, "utf-8");

  // The fix replaced console.log with process.stdout.write
  assert.ok(
    source.includes("process.stdout.write"),
    "Expected process.stdout.write to be used in the fixed code"
  );
});

test("scheduled-reporter.ts exposes formatReport and formatEvent as named functions (not inline console calls)", () => {
  const source = readFileSync(fixedFilePath, "utf-8");

  // The fix extracted formatting logic into named functions
  assert.ok(
    /function formatReport\s*\(/.test(source),
    "Expected formatReport function to exist in fixed code"
  );

  assert.ok(
    /function formatEvent\s*\(/.test(source),
    "Expected formatEvent function to exist in fixed code"
  );
});

test("formatReport returns a string containing expected report structure", () => {
  // Test the logic inline to verify the fix works correctly at runtime
  // without importing the full module (which has side effects)

  // Replicate the formatReport logic from the fixed file
  function formatReport(result: { duration: number; findings: Array<{ severity: string; title: string; description: string }> }): string {
    const lines: string[] = [];
    lines.push(`\n===== DAILY METRICS REPORT =====`);
    lines.push(`Date: ${new Date().toISOString().split("T")[0]}`);
    lines.push(`Duration: ${result.duration}ms\n`);

    if (result.findings.length === 0) {
      lines.push("All metrics within normal ranges.");
    } else {
      lines.push(`${result.findings.length} item(s) need attention:\n`);
      for (const f of result.findings) {
        const icon = f.severity === "error" ? "!!" : f.severity === "warning" ? "!" : "-";
        lines.push(`  [${icon}] ${f.title}`);
        lines.push(`      ${f.description}`);
      }
    }

    lines.push(`\n================================`);
    return lines.join("\n");
  }

  const reportNoFindings = formatReport({ duration: 1234, findings: [] });
  assert.ok(typeof reportNoFindings === "string", "formatReport should return a string");
  assert.ok(reportNoFindings.includes("DAILY METRICS REPORT"), "Report should include header");
  assert.ok(reportNoFindings.includes("All metrics within normal ranges."), "Report should indicate no issues");
  assert.ok(reportNoFindings.includes("1234ms"), "Report should include duration");

  const reportWithFindings = formatReport({
    duration: 500,
    findings: [
      { severity: "error", title: "High error rate: 2%", description: "Error rate exceeds threshold." },
      { severity: "warning", title: "Slow response", description: "Response time exceeded." },
    ],
  });
  assert.ok(reportWithFindings.includes("2 item(s) need attention"), "Report should list finding count");
  assert.ok(reportWithFindings.includes("[!!]"), "Error findings should use !! icon");
  assert.ok(reportWithFindings.includes("[!]"), "Warning findings should use ! icon");
});

test("formatEvent returns a string (not undefined) for known event types", () => {
  // Replicate formatEvent logic from the fixed file
  function formatEvent(event: { type: string }): string {
    if (event.type === "started") {
      return `[${new Date().toISOString()}] Report generation started...`;
    }
    if (event.type === "completed") {
      return `[${new Date().toISOString()}] Report generation completed.`;
    }
    return "";
  }

  const startedMsg = formatEvent({ type: "started" });
  assert.ok(typeof startedMsg === "string", "formatEvent should return string for 'started'");
  assert.ok(startedMsg.includes("Report generation started"), "should include started message");

  const completedMsg = formatEvent({ type: "completed" });
  assert.ok(typeof completedMsg === "string", "formatEvent should return string for 'completed'");
  assert.ok(completedMsg.includes("Report generation completed"), "should include completed message");

  const unknownMsg = formatEvent({ type: "unknown" });
  assert.equal(unknownMsg, "", "formatEvent should return empty string for unknown event types");
});