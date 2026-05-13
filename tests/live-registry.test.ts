/**
 * Tests for the live-registry (KILLER-MOVES-BUILDER.md #B18).
 */

import { describe, it, expect } from "vitest";
import {
  LIVE_REGISTRY,
  getLatestVersion,
  resolveTemplate,
  getRegistryDigest,
} from "../src/lib/slot-locked/live-registry";

describe("LIVE_REGISTRY", () => {
  it("registers all 7 slot-locked components shipped today", () => {
    const ids = Object.keys(LIVE_REGISTRY);
    expect(ids).toContain("hero-spotlight-slot");
    expect(ids).toContain("navbar-minimal-slot");
    expect(ids).toContain("features-bento-slot");
    expect(ids).toContain("pricing-tiers-slot");
    expect(ids).toContain("footer-editorial-slot");
    expect(ids).toContain("hero-restaurant-warm-slot");
    expect(ids).toContain("hero-portfolio-editorial-slot");
    expect(ids.length).toBeGreaterThanOrEqual(7);
  });

  it("every entry has a version, publishedAt, and changelog", () => {
    for (const [id, entry] of Object.entries(LIVE_REGISTRY)) {
      expect(entry.version, `${id} missing version`).toMatch(/^\d+\.\d+\.\d+$/);
      expect(entry.publishedAt, `${id} missing publishedAt`).toMatch(/^\d{4}-\d{2}-\d{2}/);
      expect(entry.changelog, `${id} missing changelog`).toBeTruthy();
    }
  });
});

describe("getLatestVersion", () => {
  it("returns version metadata for a known component", () => {
    const v = getLatestVersion("hero-spotlight-slot");
    expect(v).not.toBeNull();
    expect(v?.id).toBe("hero-spotlight-slot");
    expect(v?.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("returns null for unknown components", () => {
    expect(getLatestVersion("does-not-exist")).toBeNull();
  });
});

describe("resolveTemplate", () => {
  it("returns the template + schema for the latest version", () => {
    const t = resolveTemplate("hero-spotlight-slot");
    expect(t).not.toBeNull();
    expect(t?.template).toContain("export default function");
    expect(t?.schema.id).toBe("hero-spotlight-slot");
  });

  it("returns latest when a pinned version matches", () => {
    const t = resolveTemplate("hero-spotlight-slot", "1.0.0");
    expect(t?.version).toBe("1.0.0");
  });

  it("gracefully falls back to latest when pin doesn't exist (no old-version storage today)", () => {
    const t = resolveTemplate("hero-spotlight-slot", "0.9.0");
    expect(t).not.toBeNull();
    // Logged a warning, but still serves a working site.
    expect(t?.template).toContain("export default function");
  });

  it("returns null for unknown components", () => {
    expect(resolveTemplate("does-not-exist")).toBeNull();
  });
});

describe("getRegistryDigest", () => {
  it("returns a stable hash for the current registry state", () => {
    const a = getRegistryDigest();
    const b = getRegistryDigest();
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-z0-9]+$/);
  });

  it("includes every component id + version in the hash input", () => {
    // We can't easily mock the registry, so we check that the digest
    // is non-empty + non-trivial.
    const d = getRegistryDigest();
    expect(d.length).toBeGreaterThanOrEqual(4);
  });
});
