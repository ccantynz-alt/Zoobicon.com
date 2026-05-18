/**
 * Tests for the multi-key pool (KILLER-MOVES-BUILDER.md #B22 extended).
 *
 * Verifies env-var key discovery, picking logic, sideline behaviour,
 * and capacity reporting.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  pickKey,
  recordKeyUsage,
  getPoolSnapshot,
  getProviderCapacity,
  reloadPool,
  resetPool,
} from "../src/lib/api-bank-pool";

function clearProviderEnvs(): void {
  for (const v of ["ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GOOGLE_AI_API_KEY"]) {
    delete process.env[v];
  }
  for (let i = 2; i <= 20; i++) {
    delete process.env[`ANTHROPIC_API_KEY_${i}`];
    delete process.env[`OPENAI_API_KEY_${i}`];
    delete process.env[`GOOGLE_AI_API_KEY_${i}`];
  }
}

beforeEach(() => {
  clearProviderEnvs();
  reloadPool();
});

describe("env-var key discovery", () => {
  it("loads only the primary keys when no alternates set", () => {
    process.env.ANTHROPIC_API_KEY = "key-a";
    process.env.OPENAI_API_KEY = "key-b";
    reloadPool();
    const snap = getPoolSnapshot();
    expect(snap).toHaveLength(2);
    expect(snap.find((k) => k.name === "claude:primary")).toBeDefined();
    expect(snap.find((k) => k.name === "openai:primary")).toBeDefined();
  });

  it("discovers numbered Anthropic alternates", () => {
    process.env.ANTHROPIC_API_KEY = "k1";
    process.env.ANTHROPIC_API_KEY_2 = "k2";
    process.env.ANTHROPIC_API_KEY_3 = "k3";
    process.env.ANTHROPIC_API_KEY_5 = "k5";
    reloadPool();
    const claude = getPoolSnapshot().filter((k) => k.provider === "claude");
    expect(claude.map((k) => k.name).sort()).toEqual([
      "claude:org-2",
      "claude:org-3",
      "claude:org-5",
      "claude:primary",
    ]);
  });

  it("treats missing numbered slots as gaps not errors", () => {
    process.env.ANTHROPIC_API_KEY = "k1";
    process.env.ANTHROPIC_API_KEY_4 = "k4"; // gap: 2 + 3 missing
    reloadPool();
    const claude = getPoolSnapshot().filter((k) => k.provider === "claude");
    expect(claude).toHaveLength(2);
    expect(claude.map((k) => k.name).sort()).toEqual(["claude:org-4", "claude:primary"]);
  });

  it("respects OpenAI + Gemini numbered alternates equally", () => {
    process.env.OPENAI_API_KEY = "oa1";
    process.env.OPENAI_API_KEY_2 = "oa2";
    process.env.GOOGLE_AI_API_KEY = "g1";
    process.env.GOOGLE_AI_API_KEY_2 = "g2";
    process.env.GOOGLE_AI_API_KEY_3 = "g3";
    reloadPool();
    const snap = getPoolSnapshot();
    expect(snap.filter((k) => k.provider === "openai")).toHaveLength(2);
    expect(snap.filter((k) => k.provider === "gemini")).toHaveLength(3);
  });
});

describe("pickKey", () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = "k1";
    process.env.ANTHROPIC_API_KEY_2 = "k2";
    process.env.ANTHROPIC_API_KEY_3 = "k3";
    reloadPool();
  });

  it("picks a key for a configured provider", () => {
    const pick = pickKey("claude");
    expect(pick).not.toBeNull();
    expect(pick!.provider).toBe("claude");
    expect(["k1", "k2", "k3"]).toContain(pick!.apiKey);
    expect(pick!.degraded).toBe(false);
  });

  it("returns null for an unconfigured provider", () => {
    expect(pickKey("openai")).toBeNull();
  });

  it("picks the key with most headroom when one has been used", () => {
    // Burn budget on the first pick.
    const first = pickKey("claude")!;
    recordKeyUsage(first.name, 350_000, true); // close to 400k limit
    const second = pickKey("claude")!;
    expect(second.name).not.toBe(first.name);
  });

  it("returns degraded=true when all keys are sidelined", () => {
    // Force-sideline all three keys by recording 3 failures each.
    const snap = getPoolSnapshot();
    for (const k of snap) {
      recordKeyUsage(k.name, 0, false);
      recordKeyUsage(k.name, 0, false);
      recordKeyUsage(k.name, 0, false);
    }
    const pick = pickKey("claude")!;
    expect(pick.degraded).toBe(true);
  });
});

describe("recordKeyUsage", () => {
  it("ok=true increments token + request counts", () => {
    process.env.ANTHROPIC_API_KEY = "k1";
    reloadPool();
    recordKeyUsage("claude:primary", 1000, true);
    const snap = getPoolSnapshot();
    expect(snap[0].tokensUsed).toBe(1000);
    expect(snap[0].requestsUsed).toBe(1);
  });

  it("ok=false bumps failure count without using budget", () => {
    process.env.ANTHROPIC_API_KEY = "k1";
    reloadPool();
    recordKeyUsage("claude:primary", 0, false);
    const snap = getPoolSnapshot();
    expect(snap[0].recentFailures).toBe(1);
    expect(snap[0].tokensUsed).toBe(0);
  });

  it("3 consecutive failures sidelines the key", () => {
    process.env.ANTHROPIC_API_KEY = "k1";
    reloadPool();
    recordKeyUsage("claude:primary", 0, false);
    recordKeyUsage("claude:primary", 0, false);
    recordKeyUsage("claude:primary", 0, false);
    const snap = getPoolSnapshot();
    expect(snap[0].sidelined).toBe(true);
  });
});

describe("getProviderCapacity", () => {
  it("returns zero when no keys configured", () => {
    expect(getProviderCapacity("claude")).toEqual({
      tokensPerMin: 0,
      requestsPerMin: 0,
      keyCount: 0,
    });
  });

  it("multiplies the per-key budget by the key count", () => {
    process.env.ANTHROPIC_API_KEY = "k1";
    process.env.ANTHROPIC_API_KEY_2 = "k2";
    process.env.ANTHROPIC_API_KEY_3 = "k3";
    process.env.ANTHROPIC_API_KEY_4 = "k4";
    process.env.ANTHROPIC_API_KEY_5 = "k5";
    reloadPool();
    const cap = getProviderCapacity("claude");
    expect(cap.keyCount).toBe(5);
    expect(cap.tokensPerMin).toBe(2_000_000); // 5 × 400k
    expect(cap.requestsPerMin).toBe(20_000); // 5 × 4k
  });
});

describe("resetPool", () => {
  it("clears accumulated state but keeps the keys", () => {
    process.env.ANTHROPIC_API_KEY = "k1";
    reloadPool();
    recordKeyUsage("claude:primary", 50_000, true);
    let snap = getPoolSnapshot();
    expect(snap[0].tokensUsed).toBe(50_000);
    resetPool();
    snap = getPoolSnapshot();
    expect(snap).toHaveLength(1);
    expect(snap[0].tokensUsed).toBe(0);
  });
});
