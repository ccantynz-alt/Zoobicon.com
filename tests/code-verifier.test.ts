/**
 * Tests for the verification loop (KILLER-MOVES-BUILDER.md #B2).
 */

import { describe, it, expect } from "vitest";
import { verifyGeneratedCode, buildRepairPrompt } from "../src/lib/builder-critique/code-verifier";

const validComponent = `
import React from "react";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="bg-white py-20">
      <h1>Welcome</h1>
      <button>
        Click <ArrowRight className="w-4 h-4" />
      </button>
    </section>
  );
}
`.trim();

describe("verifyGeneratedCode", () => {
  it("passes a well-formed component", () => {
    const r = verifyGeneratedCode(validComponent);
    expect(r.ok).toBe(true);
    expect(r.issues).toEqual([]);
  });

  it("catches missing default export (delegates to validator)", () => {
    const r = verifyGeneratedCode(validComponent.replace("export default ", "export "));
    expect(r.ok).toBe(false);
    expect(r.issues.join(" ")).toMatch(/default export/);
  });

  it("catches truncated output", () => {
    const broken = validComponent.slice(0, validComponent.length - 60).replace(/}\s*$/, "");
    const r = verifyGeneratedCode(broken + "\nconst ");
    expect(r.ok).toBe(false);
  });

  it("catches refusals", () => {
    const r = verifyGeneratedCode(
      "I'm sorry, but I cannot help with generating components for this brand. " +
        "Please modify your request and try again.",
    );
    expect(r.ok).toBe(false);
  });

  it("catches banned Node-only imports", () => {
    const r = verifyGeneratedCode(
      validComponent.replace('import React from "react";', 'import React from "react";\nimport fs from "fs";'),
    );
    expect(r.ok).toBe(false);
    expect(r.issues.join(" ")).toMatch(/banned/);
  });

  it("flags JSX tag imbalance when egregious (3+ open, 0 close)", () => {
    const tripleOpen = `
import React from "react";
export default function Broken() {
  return (
    <section>
      <div>
        <div>
          <span>
    </section>
  );
}`.trim();
    const r = verifyGeneratedCode(tripleOpen);
    expect(r.ok).toBe(false);
    expect(r.issues.join(" ").toLowerCase()).toMatch(/jsx|unbalanced|truncated/);
  });

  it("tolerates minor drift (single missing close inside a string is OK)", () => {
    const minorDrift = `
import React from "react";
export default function X() {
  const label = "this string has <div> in it";
  return <section><h1>hi</h1></section>;
}`.trim();
    const r = verifyGeneratedCode(minorDrift);
    // The regex picks up the <div> in the string but tolerance allows it.
    expect(r.ok).toBe(true);
  });
});

describe("buildRepairPrompt", () => {
  it("includes all issues + the original code", () => {
    const prompt = buildRepairPrompt("export default function X() { return <div>; }", [
      "Unbalanced JSX: <div>: 1 open, 0 close",
      "Missing default export",
    ]);
    expect(prompt).toContain("Unbalanced JSX");
    expect(prompt).toContain("Missing default export");
    expect(prompt).toContain("export default function X");
    expect(prompt).toContain("Return the FULL corrected");
  });

  it("numbers the issues for clarity", () => {
    const prompt = buildRepairPrompt("code", ["issue A", "issue B", "issue C"]);
    expect(prompt).toContain("1. issue A");
    expect(prompt).toContain("2. issue B");
    expect(prompt).toContain("3. issue C");
  });
});
