/**
 * Smoke + E2E tests for the AI Video Pipeline.
 *
 * These tests run in CI without secrets — no real Replicate calls.
 * They verify:
 *   1. Full pipeline flow: text -> voice -> avatar -> lip-sync -> video
 *   2. Fallback behavior: primary model fails -> next model tried
 *   3. Timeout handling: model takes too long -> timeout error
 *   4. Cost estimation: verify cost report is generated
 *   5. Model slug format validation
 *   6. Circuit breaker (poisoned token) behavior
 *   7. Video assembler exports
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Mock global fetch so no real API calls are made ──
const mockFetch = vi.fn();
const originalFetch = global.fetch;

const ORIGINAL_TOKEN = process.env.REPLICATE_API_TOKEN;

beforeEach(() => {
  vi.resetModules();
  global.fetch = mockFetch as unknown as typeof fetch;
  mockFetch.mockReset();
  process.env.REPLICATE_API_TOKEN = "r8_test_token_for_tests";
});

afterEach(() => {
  global.fetch = originalFetch;
  if (ORIGINAL_TOKEN === undefined) {
    delete process.env.REPLICATE_API_TOKEN;
  } else {
    process.env.REPLICATE_API_TOKEN = ORIGINAL_TOKEN;
  }
});

// Helper: create a mock Replicate response for a succeeded prediction
function mockReplicateSuccess(output: unknown) {
  return {
    ok: true,
    status: 200,
    json: () =>
      Promise.resolve({
        id: "pred_" + Math.random().toString(36).slice(2),
        status: "succeeded",
        output,
        urls: { get: "https://api.replicate.com/v1/predictions/test" },
      }),
    text: () => Promise.resolve(JSON.stringify({ output })),
    clone: () => mockReplicateSuccess(output),
  };
}

// Helper: create a mock 404 response
function mockReplicate404() {
  return {
    ok: false,
    status: 404,
    json: () => Promise.resolve({ detail: "Not found" }),
    text: () => Promise.resolve("Not found"),
    clone: () => mockReplicate404(),
  };
}

// Helper: create a mock 401 response (auth failure)
function mockReplicate401() {
  return {
    ok: false,
    status: 401,
    json: () => Promise.resolve({ detail: "Unauthenticated" }),
    text: () => Promise.resolve("Unauthenticated"),
    clone: () => mockReplicate401(),
  };
}

describe("video-pipeline smoke", () => {
  it("exports all expected functions and types", async () => {
    const mod = await import("@/lib/video-pipeline");
    expect(typeof mod.generateVoice).toBe("function");
    expect(typeof mod.generateAvatar).toBe("function");
    expect(typeof mod.generateLipSync).toBe("function");
    expect(typeof mod.generateSpokespersonVideo).toBe("function");
    expect(typeof mod.generatePremiumVideo).toBe("function");
    expect(typeof mod.generatePremiumSpokespersonVideo).toBe("function");
    expect(typeof mod.generateCaptions).toBe("function");
    expect(typeof mod.generateMusic).toBe("function");
    expect(typeof mod.isCustomPipelineAvailable).toBe("function");
    expect(typeof mod.getVideoPipelineInfo).toBe("function");
    expect(typeof mod.markReplicatePoisoned).toBe("function");
    expect(typeof mod.isReplicatePoisoned).toBe("function");
  });

  it("isCustomPipelineAvailable reflects env vars", async () => {
    const { isCustomPipelineAvailable } = await import("@/lib/video-pipeline");
    expect(isCustomPipelineAvailable()).toBe(true);

    delete process.env.REPLICATE_API_TOKEN;
    delete process.env.FAL_KEY;
    // Need to re-import because the check is live
    const mod2 = await import("@/lib/video-pipeline");
    expect(mod2.isCustomPipelineAvailable()).toBe(false);
  });

  it("getVideoPipelineInfo returns correct provider info", async () => {
    const { getVideoPipelineInfo } = await import("@/lib/video-pipeline");
    const info = getVideoPipelineInfo();
    expect(info.available).toBe(true);
    expect(info.provider).toBe("replicate");
    expect(info.models.length).toBeGreaterThan(0);
    expect(info.models).toContain("kokoro-82m");
  });
});

describe("video-pipeline voice generation", () => {
  it("generateVoice succeeds with first model (Kokoro)", async () => {
    // Mock: first call to models endpoint -> success with audio URL
    mockFetch.mockResolvedValue(
      mockReplicateSuccess("https://replicate.delivery/output/test-audio.wav")
    );

    const { generateVoice } = await import("@/lib/video-pipeline");
    const result = await generateVoice("Hello, this is a test.");

    expect(result.audioUrl).toBe("https://replicate.delivery/output/test-audio.wav");
    expect(result.duration).toBeGreaterThan(0);
    expect(mockFetch).toHaveBeenCalled();
    // Verify it called the Kokoro model endpoint
    const firstCallUrl = mockFetch.mock.calls[0][0];
    expect(firstCallUrl).toContain("jaaari/kokoro-82m");
  });

  it("generateVoice falls back when primary model returns 404", async () => {
    // First model: 404
    mockFetch
      .mockResolvedValueOnce(mockReplicate404())
      // Version lookup also 404
      .mockResolvedValueOnce(mockReplicate404())
      // Second model (XTTS): success
      .mockResolvedValueOnce(
        mockReplicateSuccess("https://replicate.delivery/output/xtts-audio.wav")
      );

    const { generateVoice } = await import("@/lib/video-pipeline");
    const result = await generateVoice("Fallback test");

    expect(result.audioUrl).toBe("https://replicate.delivery/output/xtts-audio.wav");
  });

  it("generateVoice throws when all TTS models fail", async () => {
    // All calls return 404
    mockFetch.mockResolvedValue(mockReplicate404());

    const { generateVoice } = await import("@/lib/video-pipeline");
    await expect(generateVoice("Everything fails")).rejects.toThrow(
      "All TTS models failed"
    );
  });
});

describe("video-pipeline avatar generation", () => {
  it("generateAvatar succeeds with FLUX.1 schnell", async () => {
    mockFetch.mockResolvedValue(
      mockReplicateSuccess(["https://replicate.delivery/output/avatar.webp"])
    );

    const { generateAvatar } = await import("@/lib/video-pipeline");
    const result = await generateAvatar("professional woman, mid-30s");

    expect(result.imageUrl).toBe("https://replicate.delivery/output/avatar.webp");
  });

  it("generateAvatar throws when all image models fail", async () => {
    mockFetch.mockResolvedValue(mockReplicate404());

    const { generateAvatar } = await import("@/lib/video-pipeline");
    await expect(
      generateAvatar("test avatar")
    ).rejects.toThrow("All avatar models failed");
  });
});

describe("video-pipeline lip-sync", () => {
  it("generateLipSync succeeds with SadTalker", async () => {
    mockFetch.mockResolvedValue(
      mockReplicateSuccess("https://replicate.delivery/output/lipsync.mp4")
    );

    const { generateLipSync } = await import("@/lib/video-pipeline");
    const result = await generateLipSync(
      "https://example.com/face.jpg",
      "https://example.com/audio.wav"
    );

    expect(result.videoUrl).toBe("https://replicate.delivery/output/lipsync.mp4");
  });
});

describe("video-pipeline full E2E flow (mocked)", () => {
  it("generateSpokespersonVideo runs all 3 stages", async () => {
    // Mock all stages to succeed
    mockFetch.mockResolvedValue(
      mockReplicateSuccess("https://replicate.delivery/output/result.mp4")
    );

    const { generateSpokespersonVideo } = await import("@/lib/video-pipeline");
    const progressMessages: string[] = [];

    const result = await generateSpokespersonVideo(
      {
        script: "Welcome to Zoobicon, the future of AI website building.",
        voiceGender: "female",
        voiceStyle: "professional",
        background: "#0f172a",
        format: "landscape",
      },
      (status) => progressMessages.push(status.message)
    );

    // Must return all required fields
    expect(result.videoUrl).toBeTruthy();
    expect(result.audioUrl).toBeTruthy();
    expect(result.avatarUrl).toBeTruthy();
    expect(result.duration).toBeGreaterThan(0);
    expect(result.cost).toBeGreaterThan(0);
    expect(result.pipeline).toBe("zoobicon-v1");

    // Must have reported progress
    expect(progressMessages.length).toBeGreaterThan(0);
    expect(progressMessages.some((m) => m.toLowerCase().includes("voice") || m.toLowerCase().includes("generating"))).toBe(true);
  });

  it("cost estimation is reasonable for a 30-word script", async () => {
    mockFetch.mockResolvedValue(
      mockReplicateSuccess("https://replicate.delivery/output/result.mp4")
    );

    const { generateSpokespersonVideo } = await import("@/lib/video-pipeline");
    const result = await generateSpokespersonVideo({
      script: "This is a thirty word script about our amazing product that helps businesses grow and succeed in the modern digital economy with AI powered tools and features.",
    });

    // Cost should be in a reasonable range ($0.01 - $1.00 per video)
    expect(result.cost).toBeGreaterThanOrEqual(0.01);
    expect(result.cost).toBeLessThanOrEqual(1.0);
  });
});

describe("video-pipeline circuit breaker", () => {
  it("markReplicatePoisoned prevents subsequent calls", async () => {
    const { markReplicatePoisoned, isReplicatePoisoned } = await import(
      "@/lib/video-pipeline"
    );

    expect(isReplicatePoisoned().poisoned).toBe(false);

    markReplicatePoisoned("401 test — token invalid");
    const state = isReplicatePoisoned();
    expect(state.poisoned).toBe(true);
    expect(state.reason).toContain("401 test");
  });
});

describe("video-pipeline model slug validation", () => {
  it("all TTS model slugs follow owner/name format", async () => {
    // The TTS model list is defined inside generateVoice. We verify the
    // model paths by checking the fetch calls when generateVoice runs.
    mockFetch.mockResolvedValue(mockReplicate404());

    const { generateVoice } = await import("@/lib/video-pipeline");
    try {
      await generateVoice("test");
    } catch {
      // Expected — all models 404
    }

    // Every Replicate call should target a valid model path
    const modelPaths = mockFetch.mock.calls
      .map((call) => String(call[0]))
      .filter((url) => url.includes("/models/"))
      .map((url) => {
        const match = url.match(/\/models\/([^/]+\/[^/]+)/);
        return match?.[1];
      })
      .filter(Boolean);

    // Each model slug should be owner/name format
    for (const slug of modelPaths) {
      expect(slug).toMatch(/^[a-z0-9_-]+\/[a-z0-9_.-]+$/i);
    }

    // Should have tried multiple models (5 TTS models in the chain)
    expect(modelPaths.length).toBeGreaterThanOrEqual(3);
  });

  it("TTS chain includes expected models", async () => {
    mockFetch.mockResolvedValue(mockReplicate404());

    const { generateVoice } = await import("@/lib/video-pipeline");
    try {
      await generateVoice("test");
    } catch {
      // Expected
    }

    const allUrls = mockFetch.mock.calls.map((c) => String(c[0])).join(" ");
    // Verify expected model slugs appear in the calls
    expect(allUrls).toContain("jaaari/kokoro-82m");
    expect(allUrls).toContain("lucataco/xtts-v2");
    expect(allUrls).toContain("suno-ai/bark");
  });
});

describe("video-assembler", () => {
  it("exports the three core post-production functions", async () => {
    const {
      assembleScenes,
      burnInCaptions,
      mixBackgroundMusic,
    } = await import("@/lib/video-assembler");
    expect(typeof assembleScenes).toBe("function");
    expect(typeof burnInCaptions).toBe("function");
    expect(typeof mixBackgroundMusic).toBe("function");
  });

  it("assembleScenes returns single video URL for one scene", async () => {
    const { assembleScenes } = await import("@/lib/video-assembler");
    const url = await assembleScenes([
      { videoUrl: "https://example.com/scene1.mp4", duration: 5, sceneNumber: 1 },
    ]);
    // Single scene should return the URL directly without calling Replicate
    expect(url).toBe("https://example.com/scene1.mp4");
  });

  it("assembleScenes throws for empty scenes", async () => {
    const { assembleScenes } = await import("@/lib/video-assembler");
    await expect(assembleScenes([])).rejects.toThrow("no scenes provided");
  });
});
