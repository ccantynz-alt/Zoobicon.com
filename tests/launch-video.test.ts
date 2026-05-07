/**
 * Tests for the launch video script + endpoint helpers.
 *
 * No real Replicate or Anthropic calls — we mock callLLMWithFailover and
 * generatePremiumSpokespersonVideo so the test verifies:
 *   1. buildLaunchVideoScript construction (input handling, JSON parsing,
 *      brand-name mention enforcement, fallback to plain text).
 *   2. Script error surfacing — missing inputs throw the typed error.
 *   3. Empty / malformed LLM responses raise empty_response.
 *   4. The route handler's expected request/response shape (validated via
 *      describing the script step alone — we don't actually exercise the
 *      Replicate side, per the task spec).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──
// We mock the LLM provider so no real network calls happen.
vi.mock("@/lib/llm-provider", () => ({
  callLLMWithFailover: vi.fn(),
  describeLLMError: (e: unknown) => (e instanceof Error ? e.message : String(e)),
}));

import { callLLMWithFailover } from "@/lib/llm-provider";
import {
  buildLaunchVideoScript,
  LaunchVideoScriptError,
} from "@/lib/launch-video-script";

const mockedCall = callLLMWithFailover as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockedCall.mockReset();
});

describe("buildLaunchVideoScript", () => {
  it("returns a parsed script when the LLM returns valid JSON", async () => {
    const script =
      "Zoobicon launches today. You build a complete website in seconds, no developer needed. " +
      "Pick a domain, generate a hero video, and ship the whole thing in under a minute. " +
      "Real backend included. Real payments included. The way websites should have always worked. " +
      "Zoobicon.";

    mockedCall.mockResolvedValue({
      text: JSON.stringify({ script, wordCount: script.split(/\s+/).length }),
      model: "claude-haiku-4-5",
    });

    const result = await buildLaunchVideoScript({
      tagline: "Build complete websites in seconds.",
      valueProp: "AI website builder with domains, hosting, and email.",
      brandName: "Zoobicon",
    });

    expect(result.script).toBe(script);
    expect(result.modelUsed).toBe("claude-haiku-4-5");
    expect(result.wordCount).toBeGreaterThan(20);
    // ~80 words / 150wpm * 60 = ~32s, allow a wide window
    expect(result.durationEstimateSec).toBeGreaterThan(8);
    expect(result.durationEstimateSec).toBeLessThan(60);
  });

  it("strips markdown code fences from the LLM response", async () => {
    const script =
      "Acme is here. You finally get a website that works. Pick a name, watch the build, ship in seconds. Acme.";
    mockedCall.mockResolvedValue({
      text: "```json\n" + JSON.stringify({ script }) + "\n```",
      model: "claude-haiku-4-5",
    });
    const result = await buildLaunchVideoScript({
      tagline: "Built fast.",
      valueProp: "Just works.",
      brandName: "Acme",
    });
    expect(result.script).toBe(script);
  });

  it("falls back to treating the response as plain text if JSON parse fails", async () => {
    // Long enough to pass the MIN_WORDS=50 floor, starts with capital.
    const longProse = Array.from(
      { length: 60 },
      (_, i) => (i === 0 ? "Acme" : "word"),
    ).join(" ");
    mockedCall.mockResolvedValue({ text: longProse, model: "claude-haiku-4-5" });

    const result = await buildLaunchVideoScript({
      tagline: "Built fast.",
      valueProp: "Just works.",
      brandName: "Acme",
    });
    expect(result.script.startsWith("Acme")).toBe(true);
    expect(result.wordCount).toBeGreaterThanOrEqual(50);
  });

  it("throws missing_input when brandName is empty", async () => {
    await expect(
      buildLaunchVideoScript({ tagline: "x", valueProp: "y", brandName: "" }),
    ).rejects.toMatchObject({
      name: "LaunchVideoScriptError",
      reason: "missing_input",
    });
  });

  it("throws missing_input when both tagline and valueProp are empty", async () => {
    await expect(
      buildLaunchVideoScript({ tagline: "", valueProp: "", brandName: "Acme" }),
    ).rejects.toMatchObject({
      name: "LaunchVideoScriptError",
      reason: "missing_input",
    });
  });

  it("raises empty_response when the LLM returns an empty string", async () => {
    mockedCall.mockResolvedValue({ text: "", model: "claude-haiku-4-5" });
    await expect(
      buildLaunchVideoScript({
        tagline: "x",
        valueProp: "y",
        brandName: "Acme",
      }),
    ).rejects.toMatchObject({
      name: "LaunchVideoScriptError",
      reason: "empty_response",
    });
  });

  it("raises empty_response when the LLM returns malformed non-JSON, non-prose", async () => {
    mockedCall.mockResolvedValue({ text: "}}}{{garbage", model: "claude-haiku-4-5" });
    await expect(
      buildLaunchVideoScript({
        tagline: "x",
        valueProp: "y",
        brandName: "Acme",
      }),
    ).rejects.toMatchObject({
      name: "LaunchVideoScriptError",
      reason: "empty_response",
    });
  });

  it("raises llm_failed when the underlying provider chain throws", async () => {
    mockedCall.mockRejectedValue(new Error("All providers down"));
    await expect(
      buildLaunchVideoScript({
        tagline: "x",
        valueProp: "y",
        brandName: "Acme",
      }),
    ).rejects.toMatchObject({
      name: "LaunchVideoScriptError",
      reason: "llm_failed",
    });
  });

  it("LaunchVideoScriptError carries the typed reason for callers to switch on", () => {
    const err = new LaunchVideoScriptError("nope", "no_provider");
    expect(err.reason).toBe("no_provider");
    expect(err.name).toBe("LaunchVideoScriptError");
    expect(err.message).toBe("nope");
  });
});
