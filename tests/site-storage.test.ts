/**
 * Tests for site-storage module (Vercel Blob integration).
 *
 * Mocks @vercel/blob to avoid real API calls.
 * Verifies upload, get, delete, and fallback behavior.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Mock @vercel/blob ──
const mockPut = vi.fn();
const mockDel = vi.fn();
const mockList = vi.fn();

vi.mock("@vercel/blob", () => ({
  put: (...args: unknown[]) => mockPut(...args),
  del: (...args: unknown[]) => mockDel(...args),
  list: (...args: unknown[]) => mockList(...args),
}));

// Save original env
const ORIGINAL_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

describe("site-storage", () => {
  beforeEach(() => {
    vi.resetModules();
    mockPut.mockReset();
    mockDel.mockReset();
    mockList.mockReset();
    process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_test_token";
  });

  afterEach(() => {
    if (ORIGINAL_TOKEN === undefined) {
      delete process.env.BLOB_READ_WRITE_TOKEN;
    } else {
      process.env.BLOB_READ_WRITE_TOKEN = ORIGINAL_TOKEN;
    }
  });

  it("isBlobConfigured returns true when token is set", async () => {
    const { isBlobConfigured } = await import("@/lib/site-storage");
    expect(isBlobConfigured()).toBe(true);
  });

  it("isBlobConfigured returns false when token is missing", async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    const { isBlobConfigured } = await import("@/lib/site-storage");
    expect(isBlobConfigured()).toBe(false);
  });

  it("uploadSite stores HTML and returns CDN URL", async () => {
    mockPut.mockResolvedValue({ url: "https://blob.vercel-storage.com/sites/my-site/index.html" });

    const { uploadSite } = await import("@/lib/site-storage");
    const result = await uploadSite("my-site", {
      html: "<html><body>Hello</body></html>",
    });

    expect(result.htmlUrl).toBe("https://blob.vercel-storage.com/sites/my-site/index.html");
    expect(result.html).toBe("<html><body>Hello</body></html>");
    expect(mockPut).toHaveBeenCalledTimes(1);
    expect(mockPut.mock.calls[0][0]).toBe("sites/my-site/index.html");
  });

  it("uploadSite stores HTML + CSS + JS when all provided", async () => {
    mockPut
      .mockResolvedValueOnce({ url: "https://blob.example.com/sites/test/index.html" })
      .mockResolvedValueOnce({ url: "https://blob.example.com/sites/test/styles.css" })
      .mockResolvedValueOnce({ url: "https://blob.example.com/sites/test/main.js" });

    const { uploadSite } = await import("@/lib/site-storage");
    const result = await uploadSite("test", {
      html: "<html></html>",
      css: "body { color: red; }",
      js: "console.log('hi');",
    });

    expect(result.htmlUrl).toContain("index.html");
    expect(result.cssUrl).toContain("styles.css");
    expect(result.jsUrl).toContain("main.js");
    expect(mockPut).toHaveBeenCalledTimes(3);
  });

  it("uploadSite throws when Blob is not configured", async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    const { uploadSite } = await import("@/lib/site-storage");

    await expect(
      uploadSite("test", { html: "<html></html>" })
    ).rejects.toThrow("Vercel Blob not configured");
  });

  it("getSite returns null when Blob is not configured", async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    const { getSite } = await import("@/lib/site-storage");
    const result = await getSite("test");
    expect(result).toBeNull();
  });

  it("getSite returns null when no blobs found for slug", async () => {
    mockList.mockResolvedValue({ blobs: [] });

    const { getSite } = await import("@/lib/site-storage");
    const result = await getSite("nonexistent");
    expect(result).toBeNull();
  });

  it("getSite fetches HTML from Blob URL", async () => {
    const htmlUrl = "https://blob.example.com/sites/test/index.html";
    mockList.mockResolvedValue({
      blobs: [{ pathname: "sites/test/index.html", url: htmlUrl }],
    });

    // Mock global fetch for the HTML content
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("<html><body>Test Site</body></html>"),
    }) as unknown as typeof fetch;

    try {
      const { getSite } = await import("@/lib/site-storage");
      const result = await getSite("test");

      expect(result).not.toBeNull();
      expect(result!.html).toBe("<html><body>Test Site</body></html>");
      expect(result!.htmlUrl).toBe(htmlUrl);
    } finally {
      global.fetch = originalFetch;
    }
  });

  it("deleteSite removes all blobs for a slug", async () => {
    mockList.mockResolvedValue({
      blobs: [
        { url: "https://blob.example.com/sites/test/index.html" },
        { url: "https://blob.example.com/sites/test/styles.css" },
      ],
    });
    mockDel.mockResolvedValue(undefined);

    const { deleteSite } = await import("@/lib/site-storage");
    await deleteSite("test");

    expect(mockDel).toHaveBeenCalledTimes(2);
  });

  it("deleteSite is a no-op when Blob is not configured", async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    const { deleteSite } = await import("@/lib/site-storage");
    await deleteSite("test");
    expect(mockDel).not.toHaveBeenCalled();
  });
});
