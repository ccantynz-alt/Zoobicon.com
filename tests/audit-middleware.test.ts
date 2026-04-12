/**
 * Tests for the audit middleware (withAudit / auditLog).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the audit-log module
vi.mock("@/lib/audit-log", () => ({
  logEvent: vi.fn().mockResolvedValue({ id: 1, action: "test" }),
  ensureAuditTables: vi.fn().mockResolvedValue(undefined),
}));

import { logEvent } from "@/lib/audit-log";
import { withAudit, auditLog } from "@/lib/audit-middleware";

const mockLogEvent = vi.mocked(logEvent);

describe("Audit Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("withAudit logs success and returns result", async () => {
    const result = await withAudit(
      {
        action: "login",
        actor: "test@example.com",
        resourceType: "auth",
      },
      async () => {
        return { user: "test@example.com" };
      },
    );

    expect(result).toEqual({ user: "test@example.com" });

    // Give the fire-and-forget log time to fire
    await new Promise((r) => setTimeout(r, 10));

    expect(mockLogEvent).toHaveBeenCalledTimes(1);
    expect(mockLogEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "login",
        actorEmail: "test@example.com",
        resourceType: "auth",
        metadata: expect.objectContaining({ result: "success" }),
      }),
    );
  });

  it("withAudit logs failure and re-throws error", async () => {
    await expect(
      withAudit(
        {
          action: "deploy.publish",
          actor: "deploy@example.com",
          resourceType: "deploy",
        },
        async () => {
          throw new Error("Deploy failed: code too short");
        },
      ),
    ).rejects.toThrow("Deploy failed: code too short");

    await new Promise((r) => setTimeout(r, 10));

    expect(mockLogEvent).toHaveBeenCalledTimes(1);
    expect(mockLogEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "deploy.publish",
        metadata: expect.objectContaining({
          result: "failure",
          error: "Deploy failed: code too short",
        }),
      }),
    );
  });

  it("withAudit includes IP, userAgent, and custom metadata", async () => {
    await withAudit(
      {
        action: "stripe.checkout",
        actor: "customer@example.com",
        resourceType: "billing",
        resourceId: "sess_123",
        ip: "1.2.3.4",
        userAgent: "Mozilla/5.0",
        metadata: { plan: "pro", amount: 12900 },
      },
      async () => "ok",
    );

    await new Promise((r) => setTimeout(r, 10));

    expect(mockLogEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        ip: "1.2.3.4",
        userAgent: "Mozilla/5.0",
        metadata: expect.objectContaining({
          plan: "pro",
          amount: 12900,
          result: "success",
        }),
      }),
    );
  });

  it("auditLog fires without wrapping a function", () => {
    auditLog({
      action: "admin_access",
      actor: "admin@zoobicon.com",
      resourceType: "admin",
      result: "success",
      detail: "Accessed admin panel",
    });

    // Give fire-and-forget time
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(mockLogEvent).toHaveBeenCalledTimes(1);
        expect(mockLogEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            action: "admin_access",
            actorEmail: "admin@zoobicon.com",
            resourceType: "admin",
            metadata: expect.objectContaining({
              result: "success",
              detail: "Accessed admin panel",
            }),
          }),
        );
        resolve();
      }, 10);
    });
  });

  it("withAudit does not throw when logEvent fails", async () => {
    mockLogEvent.mockRejectedValueOnce(new Error("DB down"));

    // Should not throw even though logEvent fails
    const result = await withAudit(
      { action: "test", actor: "a@b.com", resourceType: "test" },
      async () => 42,
    );

    expect(result).toBe(42);
  });
});
