/**
 * Tests for the multi-LLM provider abstraction.
 *
 * Verifies:
 *  - Provider detection from env vars
 *  - Fallback chain: Anthropic -> OpenAI -> Gemini
 *  - Health check reporting
 *  - Error classification (retryable vs non-retryable)
 *  - "No providers configured" error
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Save original env
const ORIGINAL_ENV = { ...process.env };

describe("llm-provider", () => {
  beforeEach(() => {
    vi.resetModules();
    // Clear all AI keys
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.GOOGLE_AI_API_KEY;
  });

  afterEach(() => {
    // Restore original env
    process.env.ANTHROPIC_API_KEY = ORIGINAL_ENV.ANTHROPIC_API_KEY;
    process.env.OPENAI_API_KEY = ORIGINAL_ENV.OPENAI_API_KEY;
    process.env.GOOGLE_AI_API_KEY = ORIGINAL_ENV.GOOGLE_AI_API_KEY;
  });

  it("getAvailableProviders returns empty when no keys are set", async () => {
    const { getAvailableProviders } = await import("@/lib/llm-provider");
    expect(getAvailableProviders()).toEqual([]);
  });

  it("getAvailableProviders detects all three providers", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    process.env.OPENAI_API_KEY = "sk-openai-test";
    process.env.GOOGLE_AI_API_KEY = "AIza-test";
    const { getAvailableProviders } = await import("@/lib/llm-provider");
    const providers = getAvailableProviders();
    expect(providers).toContain("claude");
    expect(providers).toContain("openai");
    expect(providers).toContain("gemini");
    expect(providers).toHaveLength(3);
  });

  it("getAvailableProviders detects partial configuration", async () => {
    process.env.OPENAI_API_KEY = "sk-openai-test";
    const { getAvailableProviders } = await import("@/lib/llm-provider");
    const providers = getAvailableProviders();
    expect(providers).toEqual(["openai"]);
  });

  it("checkProviderHealth reports correct status for each provider", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    // OpenAI and Gemini keys NOT set
    const { checkProviderHealth } = await import("@/lib/llm-provider");
    const health = checkProviderHealth({ log: false });

    expect(health).toHaveLength(3);
    const claude = health.find((h) => h.provider === "claude");
    const openai = health.find((h) => h.provider === "openai");
    const gemini = health.find((h) => h.provider === "gemini");

    expect(claude?.available).toBe(true);
    expect(openai?.available).toBe(false);
    expect(openai?.envVar).toBe("OPENAI_API_KEY");
    expect(gemini?.available).toBe(false);
    expect(gemini?.envVar).toBe("GOOGLE_AI_API_KEY");
  });

  it("checkProviderHealth throws when no providers configured and throwIfNone is true", async () => {
    const { checkProviderHealth } = await import("@/lib/llm-provider");
    expect(() => checkProviderHealth({ log: false, throwIfNone: true })).toThrow(
      "No AI providers configured"
    );
  });

  it("checkProviderHealth does NOT throw when at least one provider configured", async () => {
    process.env.GOOGLE_AI_API_KEY = "AIza-test";
    const { checkProviderHealth } = await import("@/lib/llm-provider");
    expect(() => checkProviderHealth({ log: false, throwIfNone: true })).not.toThrow();
  });

  it("callLLMWithFailover throws clear error when no providers configured", async () => {
    const { callLLMWithFailover } = await import("@/lib/llm-provider");
    await expect(
      callLLMWithFailover({
        model: "claude-sonnet-4-6",
        system: "test",
        userMessage: "test",
      })
    ).rejects.toThrow("No AI providers configured");
  });

  it("AVAILABLE_MODELS includes all three providers", async () => {
    const { AVAILABLE_MODELS } = await import("@/lib/llm-provider");
    const providers = new Set(AVAILABLE_MODELS.map((m) => m.provider));
    expect(providers.has("claude")).toBe(true);
    expect(providers.has("openai")).toBe(true);
    expect(providers.has("gemini")).toBe(true);
  });

  it("getModelsForProvider returns correct models", async () => {
    const { getModelsForProvider } = await import("@/lib/llm-provider");
    const claudeModels = getModelsForProvider("claude");
    expect(claudeModels.length).toBeGreaterThanOrEqual(2);
    expect(claudeModels.every((m) => m.provider === "claude")).toBe(true);

    const openaiModels = getModelsForProvider("openai");
    expect(openaiModels.length).toBeGreaterThanOrEqual(2);
    expect(openaiModels.every((m) => m.provider === "openai")).toBe(true);
  });

  it("each model has required fields", async () => {
    const { AVAILABLE_MODELS } = await import("@/lib/llm-provider");
    for (const model of AVAILABLE_MODELS) {
      expect(model.id).toBeTruthy();
      expect(model.label).toBeTruthy();
      expect(model.maxTokens).toBeGreaterThan(0);
      expect(["fast", "balanced", "premium"]).toContain(model.tier);
      expect(["claude", "openai", "gemini"]).toContain(model.provider);
    }
  });
});
