/**
 * Tests for pipeline helper functions and generation flow logic.
 *
 * These test the utility functions without calling the actual AI API.
 * For end-to-end generation tests, use /api/health (GET for quick, POST for deep).
 */

import { describe, it, expect } from "vitest";

// ─── extractJSON (mirrors src/lib/agents.ts) ───

function extractJSON(text: string): string {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : text;
}

describe("extractJSON", () => {
  it("extracts JSON from clean response", () => {
    const input = '{"industry": "tech", "targetAudience": "developers"}';
    expect(extractJSON(input)).toBe(input);
  });

  it("extracts JSON from response with preamble", () => {
    const input = 'Here is the analysis:\n\n{"industry": "tech"}';
    expect(extractJSON(input)).toBe('{"industry": "tech"}');
  });

  it("extracts JSON from code fences", () => {
    const input = '```json\n{"industry": "tech"}\n```';
    expect(extractJSON(input)).toBe('{"industry": "tech"}');
  });

  it("returns original text if no JSON found", () => {
    const input = "This has no JSON at all";
    expect(extractJSON(input)).toBe(input);
  });

  it("handles nested JSON", () => {
    const input = '{"outer": {"inner": "value"}}';
    const result = extractJSON(input);
    expect(JSON.parse(result)).toEqual({ outer: { inner: "value" } });
  });
});

// ─── Model routing logic (mirrors src/lib/agents.ts) ───

describe("Model routing", () => {
  function getModelRouting(userModel?: string) {
    const useMultiLLM = userModel && !userModel.startsWith("claude");
    const MODEL_PLANNER = userModel || "claude-haiku-4-5-20251001";
    const MODEL_BALANCED = userModel || "claude-sonnet-4-6";
    const MODEL_PREMIUM = userModel || "claude-opus-4-6";
    return { useMultiLLM, MODEL_PLANNER, MODEL_BALANCED, MODEL_PREMIUM };
  }

  it("defaults to Claude models when no model specified", () => {
    const r = getModelRouting();
    expect(r.useMultiLLM).toBeFalsy();
    expect(r.MODEL_PLANNER).toBe("claude-haiku-4-5-20251001");
    expect(r.MODEL_BALANCED).toBe("claude-sonnet-4-6");
    expect(r.MODEL_PREMIUM).toBe("claude-opus-4-6");
  });

  it("defaults to Claude models when empty string", () => {
    const r = getModelRouting("");
    expect(r.useMultiLLM).toBeFalsy();
    expect(r.MODEL_PLANNER).toBe("claude-haiku-4-5-20251001");
    expect(r.MODEL_PREMIUM).toBe("claude-opus-4-6");
  });

  it("routes all agents to GPT when GPT model selected", () => {
    const r = getModelRouting("gpt-4o");
    expect(r.useMultiLLM).toBe(true);
    expect(r.MODEL_PLANNER).toBe("gpt-4o");
    expect(r.MODEL_BALANCED).toBe("gpt-4o");
    expect(r.MODEL_PREMIUM).toBe("gpt-4o");
  });

  it("routes all agents to Gemini when Gemini model selected", () => {
    const r = getModelRouting("gemini-2.5-pro");
    expect(r.useMultiLLM).toBe(true);
    expect(r.MODEL_PLANNER).toBe("gemini-2.5-pro");
    expect(r.MODEL_PREMIUM).toBe("gemini-2.5-pro");
  });

  it("uses smart routing when Claude model explicitly selected", () => {
    const r = getModelRouting("claude-sonnet-4-6");
    expect(r.useMultiLLM).toBe(false);
    // All agents use the specified Claude model
    expect(r.MODEL_PLANNER).toBe("claude-sonnet-4-6");
    expect(r.MODEL_PREMIUM).toBe("claude-sonnet-4-6");
  });
});

// ─── LLM provider detection (mirrors src/lib/llm-provider.ts) ───

describe("LLM provider detection", () => {
  function getProviderForModel(modelId: string): string {
    if (modelId.startsWith("claude")) return "claude";
    if (modelId.startsWith("gpt") || modelId.startsWith("o3") || modelId.startsWith("o1")) return "openai";
    if (modelId.startsWith("gemini")) return "gemini";
    return "claude";
  }

  it("detects Claude models", () => {
    expect(getProviderForModel("claude-opus-4-6")).toBe("claude");
    expect(getProviderForModel("claude-sonnet-4-6")).toBe("claude");
    expect(getProviderForModel("claude-haiku-4-5-20251001")).toBe("claude");
  });

  it("detects OpenAI models", () => {
    expect(getProviderForModel("gpt-4o")).toBe("openai");
    expect(getProviderForModel("gpt-4o-mini")).toBe("openai");
    expect(getProviderForModel("o3")).toBe("openai");
    expect(getProviderForModel("o1")).toBe("openai");
  });

  it("detects Gemini models", () => {
    expect(getProviderForModel("gemini-2.5-pro")).toBe("gemini");
    expect(getProviderForModel("gemini-2.5-flash")).toBe("gemini");
  });

  it("defaults to Claude for unknown models", () => {
    expect(getProviderForModel("unknown-model")).toBe("claude");
  });
});

// ─── Prefill content verification ───

describe("Prefill content", () => {
  const PREFILL = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">`;

  it("starts with DOCTYPE", () => {
    expect(PREFILL.trim().startsWith("<!DOCTYPE html>")).toBe(true);
  });

  it("does NOT contain <body> (model must write that)", () => {
    expect(PREFILL).not.toContain("<body");
  });

  it("does NOT contain </head> (model must close it)", () => {
    expect(PREFILL).not.toContain("</head>");
  });

  it("is under 200 chars (minimal token usage)", () => {
    expect(PREFILL.length).toBeLessThan(200);
  });
});
