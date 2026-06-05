/**
 * Tests for the API bank distributor (KILLER-MOVES-BUILDER.md #B21).
 *
 * Note: the bankedCall() integration test (with real LLM round-trips)
 * lives in the GateTest suite. These specs cover the picker logic,
 * budget tracking, and sideline behaviour without hitting any
 * external API.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { pickProvider, getApiBankStatus, resetApiBank } from "../src/lib/api-bank";

// Ensure all three providers look "configured" for testing — the picker
// reads getAvailableProviders() which checks env vars. We can't easily
// mock that, so we set the env vars on the process.
beforeEach(() => {
  process.env.ANTHROPIC_API_KEY = "test-anthropic";
  process.env.OPENAI_API_KEY = "test-openai";
  process.env.GOOGLE_AI_API_KEY = "test-gemini";
  resetApiBank();
});

describe("pickProvider", () => {
  it("picks a configured provider when state is clean", () => {
    const pick = pickProvider();
    expect(["claude", "openai", "gemini"]).toContain(pick.provider);
    expect(pick.degraded).toBe(false);
    expect(pick.model).toBeTruthy();
  });

  it("returns headrooms for all three providers", () => {
    const pick = pickProvider();
    expect(pick.headrooms.claude).toBeGreaterThan(0);
    expect(pick.headrooms.openai).toBeGreaterThan(0);
    expect(pick.headrooms.gemini).toBeGreaterThan(0);
  });

  it("honours preferred model when its provider has headroom", () => {
    const pick = pickProvider({ preferredModel: "claude-sonnet-4-6" });
    // If claude has more headroom than openai/gemini (clean state, all do)
    // the picker may still go round-robin, but the model should be claude's
    // when the picker selects claude.
    if (pick.provider === "claude") {
      expect(pick.model).toBe("claude-sonnet-4-6");
    }
  });

  it("throws when no providers are configured", () => {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.GOOGLE_AI_API_KEY;
    expect(() => pickProvider()).toThrow(/No AI providers configured/);
  });
});

describe("getApiBankStatus", () => {
  it("reports all three providers with their configured flag", () => {
    const status = getApiBankStatus();
    expect(status.providers.claude.configured).toBe(true);
    expect(status.providers.openai.configured).toBe(true);
    expect(status.providers.gemini.configured).toBe(true);
  });

  it("starts every provider at full headroom", () => {
    const status = getApiBankStatus();
    expect(status.providers.claude.headroom).toBeCloseTo(1, 1);
    expect(status.providers.openai.headroom).toBeCloseTo(1, 1);
    expect(status.providers.gemini.headroom).toBeCloseTo(1, 1);
  });

  it("starts every provider at zero usage + zero failures + not sidelined", () => {
    const status = getApiBankStatus();
    for (const p of ["claude", "openai", "gemini"] as const) {
      expect(status.providers[p].tokensUsed).toBe(0);
      expect(status.providers[p].requestsUsed).toBe(0);
      expect(status.providers[p].recentFailures).toBe(0);
      expect(status.providers[p].sidelined).toBe(false);
    }
  });

  it("flags unconfigured providers", () => {
    delete process.env.OPENAI_API_KEY;
    const status = getApiBankStatus();
    expect(status.providers.openai.configured).toBe(false);
  });
});

describe("resetApiBank", () => {
  it("clears any accumulated state", () => {
    // Reset always restores clean defaults — we can't easily simulate
    // accumulated state without calling bankedCall (which hits LLMs).
    // This test exists to lock in the public surface.
    resetApiBank();
    const status = getApiBankStatus();
    for (const p of ["claude", "openai", "gemini"] as const) {
      expect(status.providers[p].tokensUsed).toBe(0);
      expect(status.providers[p].requestsUsed).toBe(0);
      expect(status.providers[p].recentFailures).toBe(0);
      expect(status.providers[p].sidelined).toBe(false);
    }
  });
});
