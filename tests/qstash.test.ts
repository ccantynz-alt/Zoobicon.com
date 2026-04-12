/**
 * Tests for the QStash integration — client, schedules, init.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @upstash/qstash
vi.mock("@upstash/qstash", () => ({
  Client: vi.fn().mockImplementation(() => ({
    schedules: {
      create: vi.fn().mockResolvedValue({ scheduleId: "sched_123" }),
    },
    publishJSON: vi.fn().mockResolvedValue({ messageId: "msg_123" }),
  })),
}));

describe("QStash", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("isQStashConfigured returns false when token not set", async () => {
    delete process.env.QSTASH_TOKEN;
    const mod = await import("@/lib/qstash");
    expect(mod.isQStashConfigured()).toBe(false);
  });

  it("isQStashConfigured returns true when token is set", async () => {
    process.env.QSTASH_TOKEN = "test-token";
    const mod = await import("@/lib/qstash");
    expect(mod.isQStashConfigured()).toBe(true);
    delete process.env.QSTASH_TOKEN;
  });

  it("getQStashClient returns null when token not set", async () => {
    delete process.env.QSTASH_TOKEN;
    const mod = await import("@/lib/qstash");
    expect(mod.getQStashClient()).toBeNull();
  });

  it("CRON_SCHEDULES covers all vercel.json cron paths", async () => {
    const mod = await import("@/lib/qstash");
    const paths = mod.CRON_SCHEDULES.map((s) => s.destination);

    // Check that critical cron paths are covered
    expect(paths).toContain("/api/cron/warmup");
    expect(paths).toContain("/api/cron/daily-comeback");
    expect(paths).toContain("/api/cron/warm-replicate");
    expect(paths).toContain("/api/cron/warm-sandpack");
    expect(paths).toContain("/api/cron/warmup-video");
    expect(paths).toContain("/api/intel/health");
  });

  it("all schedules have retries configured", async () => {
    const mod = await import("@/lib/qstash");
    for (const schedule of mod.CRON_SCHEDULES) {
      expect(schedule.retries).toBeGreaterThanOrEqual(1);
      expect(schedule.cron).toBeTruthy();
      expect(schedule.destination).toMatch(/^\/api\//);
    }
  });

  it("ensureSchedule returns null when token not set", async () => {
    delete process.env.QSTASH_TOKEN;
    const mod = await import("@/lib/qstash");
    const result = await mod.ensureSchedule({
      destination: "https://example.com/api/test",
      cron: "*/5 * * * *",
    });
    expect(result).toBeNull();
  });

  it("publishJob returns null when token not set", async () => {
    delete process.env.QSTASH_TOKEN;
    const mod = await import("@/lib/qstash");
    const result = await mod.publishJob({ url: "https://example.com/api/test" });
    expect(result).toBeNull();
  });

  it("initAllSchedules returns skipped when token not set", async () => {
    delete process.env.QSTASH_TOKEN;
    const mod = await import("@/lib/qstash");
    const result = await mod.initAllSchedules("https://zoobicon.com");
    expect(result.skipped).toBe(true);
    expect(result.created).toBe(0);
  });
});
