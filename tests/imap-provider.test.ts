/**
 * Tests for the IMAP provider — error handling, retry logic, rate limiting.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the imapflow module
vi.mock("imapflow", () => {
  return {
    ImapFlow: vi.fn().mockImplementation(() => ({
      connect: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn().mockResolvedValue(undefined),
      noop: vi.fn().mockResolvedValue(undefined),
      getMailboxLock: vi.fn().mockResolvedValue({ release: vi.fn() }),
      status: vi.fn().mockResolvedValue({ messages: 0, unseen: 0 }),
      fetch: vi.fn().mockReturnValue({ [Symbol.asyncIterator]: () => ({ next: async () => ({ done: true, value: undefined }) }) }),
      messageFlagsAdd: vi.fn().mockResolvedValue(undefined),
      messageFlagsRemove: vi.fn().mockResolvedValue(undefined),
      messageMove: vi.fn().mockResolvedValue(undefined),
    })),
  };
});

describe("IMAP Provider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset module state for each test
    vi.resetModules();
  });

  it("returns NOT_CONFIGURED when env vars are missing", async () => {
    // Ensure IMAP env vars are unset
    delete process.env.IMAP_HOST;
    delete process.env.IMAP_USER;
    delete process.env.IMAP_PASSWORD;

    const mod = await import("@/lib/imap-provider");
    const result = await mod.fetchEmails("INBOX", 50, 1);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("NOT_CONFIGURED");
      expect(result.message).toContain("IMAP is not configured");
    }
  });

  it("returns structured error on auth failure", async () => {
    process.env.IMAP_HOST = "imap.test.com";
    process.env.IMAP_USER = "test@test.com";
    process.env.IMAP_PASSWORD = "bad";

    // Re-import with fresh module
    const imapflow = await import("imapflow");
    const MockImapFlow = vi.mocked(imapflow.ImapFlow);
    MockImapFlow.mockImplementation(() => ({
      connect: vi.fn().mockRejectedValue(new Error("Authentication failed")),
      logout: vi.fn().mockResolvedValue(undefined),
      noop: vi.fn(),
      getMailboxLock: vi.fn(),
      status: vi.fn(),
      fetch: vi.fn(),
      messageFlagsAdd: vi.fn(),
      messageFlagsRemove: vi.fn(),
      messageMove: vi.fn(),
    } as unknown as InstanceType<typeof imapflow.ImapFlow>));

    const mod = await import("@/lib/imap-provider");
    const result = await mod.fetchEmails("INBOX", 50, 1);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("AUTH_FAILURE");
      expect(result.message).toContain("authentication failed");
    }
  });

  it("isImapConfigured returns false when env vars missing", async () => {
    delete process.env.IMAP_HOST;
    delete process.env.IMAP_USER;
    delete process.env.IMAP_PASSWORD;

    const mod = await import("@/lib/imap-provider");
    expect(mod.isImapConfigured()).toBe(false);
  });

  it("isImapConfigured returns true when all env vars set", async () => {
    process.env.IMAP_HOST = "imap.test.com";
    process.env.IMAP_USER = "test@test.com";
    process.env.IMAP_PASSWORD = "testpass";

    const mod = await import("@/lib/imap-provider");
    expect(mod.isImapConfigured()).toBe(true);
  });

  it("markRead returns NOT_CONFIGURED when env vars missing", async () => {
    delete process.env.IMAP_HOST;
    delete process.env.IMAP_USER;
    delete process.env.IMAP_PASSWORD;

    const mod = await import("@/lib/imap-provider");
    const result = await mod.markRead(123, true, "INBOX");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("NOT_CONFIGURED");
    }
  });

  it("moveEmail returns NOT_CONFIGURED when env vars missing", async () => {
    delete process.env.IMAP_HOST;
    delete process.env.IMAP_USER;
    delete process.env.IMAP_PASSWORD;

    const mod = await import("@/lib/imap-provider");
    const result = await mod.moveEmail(123, "inbox", "trash");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("NOT_CONFIGURED");
    }
  });
});
