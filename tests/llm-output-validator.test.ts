/**
 * Tests for the LLM output validator that sits between the model
 * transport and the AI builder application code.
 *
 * Audit 2026-05-13 found the builder was treating ANY non-empty
 * response as success, so refusals, truncations, and broken JSX
 * shipped to users. These specs lock the new behaviour down.
 */

import { describe, it, expect } from "vitest";
import {
  detectRefusal,
  validateGeneratedText,
  validateGeneratedComponent,
  validateEditJson,
} from "../src/lib/llm-output-validator";

describe("detectRefusal", () => {
  it("flags Claude-style refusals", () => {
    expect(detectRefusal("I can't help with that.").refused).toBe(true);
    expect(detectRefusal("I cannot generate code that...").refused).toBe(true);
    expect(detectRefusal("I won't help with this request.").refused).toBe(true);
  });

  it("flags OpenAI-style apologies", () => {
    expect(detectRefusal("I'm sorry, but I cannot...").refused).toBe(true);
    expect(detectRefusal("As an AI language model, I cannot...").refused).toBe(true);
  });

  it("flags safety/policy refusals", () => {
    expect(detectRefusal("This goes against my guidelines.").refused).toBe(true);
    expect(detectRefusal("Unfortunately, I am unable to help.").refused).toBe(true);
  });

  it("ignores prose that happens to contain similar words", () => {
    expect(detectRefusal("export default function Hero() { return <h1>Cant Stop Won't Stop</h1>; }").refused).toBe(false);
    expect(detectRefusal("import React from 'react';").refused).toBe(false);
  });

  it("only inspects the first 400 chars to avoid false positives in long code", () => {
    const code = "import React from 'react';\n".repeat(20) +
      "// Later in the file, the user writes: 'I can't help' as a string literal\n" +
      "export default function X() { return null; }";
    expect(detectRefusal(code).refused).toBe(false);
  });
});

describe("validateGeneratedText", () => {
  it("rejects empty / whitespace input", () => {
    expect(validateGeneratedText("").ok).toBe(false);
    expect(validateGeneratedText("   \n  ").ok).toBe(false);
    expect(validateGeneratedText(null).ok).toBe(false);
    expect(validateGeneratedText(undefined).ok).toBe(false);
  });

  it("rejects responses shorter than the minimum", () => {
    const r = validateGeneratedText("too short", 60);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/short/);
  });

  it("rejects refusals even when long enough", () => {
    const long = "I'm sorry, but I cannot generate the requested content. " +
      "This is well over the minimum length threshold but is still a refusal that should be caught.";
    const r = validateGeneratedText(long);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/refusal/i);
  });

  it("accepts valid long text", () => {
    const r = validateGeneratedText(
      "This is a perfectly reasonable response that the model has generated for the user's request and clears the threshold.",
    );
    expect(r.ok).toBe(true);
  });
});

describe("validateGeneratedComponent", () => {
  const validComponent = `
import React from "react";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="bg-white py-20">
      <h1 className="text-4xl font-bold">Welcome</h1>
      <button className="bg-stone-900 text-white px-4 py-2">
        Get started <ArrowRight className="w-4 h-4" />
      </button>
    </section>
  );
}
`.trim();

  it("accepts a well-formed component", () => {
    const r = validateGeneratedComponent(validComponent);
    expect(r.ok).toBe(true);
  });

  it("rejects too-short output", () => {
    expect(validateGeneratedComponent("export default () => null;").ok).toBe(false);
  });

  it("rejects refusals", () => {
    const r = validateGeneratedComponent(
      "I'm sorry, but I cannot help with generating components for this brand. " +
        "Please modify your request and try again.",
    );
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/refusal/i);
  });

  it("requires a default export", () => {
    const noDefault = validComponent.replace("export default ", "export ");
    const r = validateGeneratedComponent(noDefault);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/default export/);
  });

  it("rejects unbalanced curly braces", () => {
    // Drop a closing brace from the body - JSX expression open without close
    const broken = validComponent.replace("</section>", "</section> {{{ extra");
    const r = validateGeneratedComponent(broken);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/unbalanced/);
  });

  it("rejects truncated output mid-statement", () => {
    const truncated = validComponent.slice(0, validComponent.length - 80).replace(/}\s*$/, "") + "\nconst";
    const r = validateGeneratedComponent(truncated);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/truncated|unbalanced/);
  });

  it("rejects banned Node-only imports", () => {
    const withFs = validComponent.replace(
      'import React from "react";',
      'import React from "react";\nimport fs from "fs";',
    );
    const r = validateGeneratedComponent(withFs);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/banned/);
  });

  it("rejects banned Next.js server-only imports", () => {
    const withNext = validComponent.replace(
      'import React from "react";',
      'import React from "react";\nimport { cookies } from "next/headers";',
    );
    const r = validateGeneratedComponent(withNext);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/banned/);
  });

  it("accepts local imports starting with . or @/", () => {
    const withLocals = validComponent.replace(
      'import React from "react";',
      'import React from "react";\nimport Hero from "./Hero";\nimport Nav from "@/components/Nav";',
    );
    expect(validateGeneratedComponent(withLocals).ok).toBe(true);
  });

  it("warns on unknown packages without failing", () => {
    const withUnknown = validComponent.replace(
      'import React from "react";',
      'import React from "react";\nimport { useForm } from "react-hook-form";',
    );
    const r = validateGeneratedComponent(withUnknown);
    expect(r.ok).toBe(true);
    expect(r.warnings.some((w) => /react-hook-form/.test(w))).toBe(true);
  });

  it("does not get confused by braces inside string literals", () => {
    const withBraces = `
import React from "react";

export default function Q() {
  const open = "{";
  const close = "}";
  return <span>{open}{close}{open}{close}</span>;
}`.trim();
    expect(validateGeneratedComponent(withBraces).ok).toBe(true);
  });

  it("does not get confused by braces in comments", () => {
    const withComments = `
import React from "react";
// This comment has unbalanced braces: { { { not paired
/* Block comment: } } } not paired either */
export default function Q() {
  return <span>hello</span>;
}`.trim();
    expect(validateGeneratedComponent(withComments).ok).toBe(true);
  });
});

describe("validateEditJson", () => {
  it("rejects empty input", () => {
    expect(validateEditJson("").ok).toBe(false);
    expect(validateEditJson(null).ok).toBe(false);
  });

  it("rejects refusals", () => {
    const r = validateEditJson("I'm sorry, but I cannot edit this file.");
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/refusal/i);
  });

  it("accepts a clean JSON response", () => {
    const text = JSON.stringify({
      files: {
        "App.tsx": "export default function App() { return <div>hi</div>; }",
      },
    });
    const r = validateEditJson(text);
    expect(r.ok).toBe(true);
    expect(r.data?.files["App.tsx"]).toContain("export default");
  });

  it("strips markdown fences", () => {
    const fenced = "```json\n" +
      JSON.stringify({ files: { "x.tsx": "export default function X() { return null; }" } }) +
      "\n```";
    const r = validateEditJson(fenced);
    expect(r.ok).toBe(true);
  });

  it("extracts JSON from surrounding prose", () => {
    const noisy =
      "Sure! Here's the updated file:\n" +
      JSON.stringify({ files: { "App.tsx": "export default function App() { return null; }" } }) +
      "\nLet me know if you want anything else.";
    const r = validateEditJson(noisy);
    expect(r.ok).toBe(true);
  });

  it("rejects when files key is missing", () => {
    const r = validateEditJson(JSON.stringify({ message: "ok" }));
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/files/);
  });

  it("rejects when files contains empty/short values", () => {
    const r = validateEditJson(JSON.stringify({ files: { "App.tsx": "x" } }));
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/short/);
  });

  it("rejects when files contains non-string values", () => {
    const r = validateEditJson(JSON.stringify({ files: { "App.tsx": 42 } }));
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/not a string/);
  });
});
