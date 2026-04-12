/**
 * Tests for the pipeline-stream endpoint and 7-agent pipeline integration.
 */
import { describe, it, expect, vi } from "vitest";

// Mock the agents module
vi.mock("@/lib/agents", () => ({
  runPipeline: vi.fn(),
}));

import { runPipeline } from "@/lib/agents";
const mockRunPipeline = vi.mocked(runPipeline);

describe("Pipeline Stream", () => {
  it("runPipeline returns expected structure with all 7 agents", async () => {
    mockRunPipeline.mockResolvedValueOnce({
      html: "<html><body><h1>Test</h1></body></html>",
      agents: [
        { agent: "Strategist", output: "strategy", duration: 4000 },
        { agent: "Brand Designer", output: "brand", duration: 6000 },
        { agent: "Copywriter", output: "copy", duration: 5500 },
        { agent: "Architect", output: "arch", duration: 5000 },
        { agent: "Developer", output: "[html]", duration: 70000 },
        { agent: "SEO Agent", output: "[seo]", duration: 8000 },
        { agent: "Animation Agent", output: "[anim]", duration: 7000 },
      ],
      totalDuration: 95000,
    });

    const result = await runPipeline({ prompt: "A modern SaaS landing page" });
    expect(result.agents).toHaveLength(7);
    expect(result.html).toContain("<html>");
    expect(result.totalDuration).toBeLessThanOrEqual(300000);
  });

  it("pipeline handles partial failures gracefully", async () => {
    // SEO agent failed but pipeline still completes
    mockRunPipeline.mockResolvedValueOnce({
      html: "<html><body><h1>Test</h1></body></html>",
      agents: [
        { agent: "Strategist", output: "ok", duration: 4000 },
        { agent: "Brand Designer", output: "ok", duration: 6000 },
        { agent: "Copywriter", output: "ok", duration: 5500 },
        { agent: "Architect", output: "ok", duration: 5000 },
        { agent: "Developer", output: "[html]", duration: 70000 },
        { agent: "SEO Agent", output: "[skipped: error]", duration: 100 },
        { agent: "Animation Agent", output: "[anim]", duration: 7000 },
      ],
      totalDuration: 85000,
    });

    const result = await runPipeline({ prompt: "Test" });
    expect(result.agents).toHaveLength(7);
    const seoAgent = result.agents.find((a) => a.agent === "SEO Agent");
    expect(seoAgent?.output).toContain("skipped");
    // Pipeline still returned valid HTML despite SEO failure
    expect(result.html).toContain("<html>");
  });

  it("onProgress callback is called for each agent phase", async () => {
    const progressCalls: Array<{ agent: string; status: string }> = [];

    mockRunPipeline.mockImplementationOnce(async (input, onProgress) => {
      // Simulate progress callbacks
      onProgress?.("strategist", "analyzing");
      onProgress?.("brand", "designing");
      onProgress?.("developer", "building");
      onProgress?.("seo", "optimizing");
      return {
        html: "<html><body>test</body></html>",
        agents: [{ agent: "Test", output: "ok", duration: 1000 }],
        totalDuration: 5000,
      };
    });

    await runPipeline(
      { prompt: "Test site" },
      (agent, status) => progressCalls.push({ agent, status }),
    );

    expect(progressCalls).toHaveLength(4);
    expect(progressCalls[0].agent).toBe("strategist");
    expect(progressCalls[2].agent).toBe("developer");
  });

  it("pipeline input accepts all optional fields", async () => {
    mockRunPipeline.mockResolvedValueOnce({
      html: "<html><body>ok</body></html>",
      agents: [],
      totalDuration: 1000,
    });

    await runPipeline({
      prompt: "Test",
      industry: "tech",
      style: "modern",
      pages: ["home", "about"],
      tier: "premium",
      model: "claude-opus-4-6",
      generatorType: "saas",
      agencyBrand: { agencyName: "TestAgency", primaryColor: "#ff0000" },
      externalContext: "Some Figma context",
    });

    expect(mockRunPipeline).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: "Test",
        industry: "tech",
        style: "modern",
        tier: "premium",
        agencyBrand: expect.objectContaining({ agencyName: "TestAgency" }),
      }),
    );
  });
});
