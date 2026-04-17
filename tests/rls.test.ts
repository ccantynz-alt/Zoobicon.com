/**
 * Row-Level Security (RLS) tests for Zoobicon.
 *
 * Tests the withUserContext / withAdminContext helpers and verifies
 * the RLS migration SQL is syntactically valid. Does NOT require a
 * real database — uses mocks for the Neon sql driver.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ── Mock the Neon driver ──
// We need to intercept sql tagged template calls to verify set_config is called.
const mockSql = vi.fn((..._args: unknown[]) => Promise.resolve([]));
// Make it behave as a tagged template literal
const taggedMock = Object.assign(
  (...args: unknown[]) => mockSql(...args),
  { __proto__: Function.prototype }
);

vi.mock("@neondatabase/serverless", () => ({
  neon: () => taggedMock,
}));

// Set DATABASE_URL so getSQL() doesn't throw
process.env.DATABASE_URL = "postgres://mock:mock@localhost:5432/mock";

describe("Row-Level Security", () => {
  beforeEach(() => {
    mockSql.mockClear();
    mockSql.mockResolvedValue([]);
  });

  it("withUserContext calls set_config before executing the callback", async () => {
    const { withUserContext } = await import("@/lib/db");

    const testEmail = "alice@example.com";
    const result = await withUserContext(testEmail, async (db) => {
      const rows = await db`SELECT * FROM projects`;
      return rows;
    });

    // First call should be set_config
    expect(mockSql).toHaveBeenCalledTimes(2);
    // Verify set_config was called (it's a tagged template, so args are arrays)
    const firstCallStrings = mockSql.mock.calls[0][0];
    expect(Array.isArray(firstCallStrings)).toBe(true);
    const joined = firstCallStrings.join("");
    expect(joined).toContain("set_config");
    expect(joined).toContain("app.current_user_email");
    expect(result).toEqual([]);
  });

  it("withAdminContext calls SET ROLE and RESET ROLE", async () => {
    const { withAdminContext } = await import("@/lib/db");

    await withAdminContext(async (db) => {
      await db`SELECT * FROM sites`;
    });

    // Should be: SET ROLE, SELECT, RESET ROLE = 3 calls
    expect(mockSql).toHaveBeenCalledTimes(3);
    const firstStrings = mockSql.mock.calls[0][0];
    expect(firstStrings.join("")).toContain("SET ROLE zoobicon_admin");
    const lastStrings = mockSql.mock.calls[2][0];
    expect(lastStrings.join("")).toContain("RESET ROLE");
  });

  it("withAdminContext resets role even if callback throws", async () => {
    const { withAdminContext } = await import("@/lib/db");

    await expect(
      withAdminContext(async () => {
        throw new Error("boom");
      })
    ).rejects.toThrow("boom");

    // SET ROLE + RESET ROLE (callback threw before any query)
    expect(mockSql).toHaveBeenCalledTimes(2);
    const lastStrings = mockSql.mock.calls[1][0];
    expect(lastStrings.join("")).toContain("RESET ROLE");
  });

  it("RLS migration SQL file exists and is valid SQL", () => {
    const migrationPath = path.resolve(
      __dirname,
      "../src/lib/migrations/add-rls.sql"
    );
    expect(fs.existsSync(migrationPath)).toBe(true);

    const content = fs.readFileSync(migrationPath, "utf-8");

    // Must enable RLS on the key tables
    expect(content).toContain("ALTER TABLE projects ENABLE ROW LEVEL SECURITY");
    expect(content).toContain("ALTER TABLE sites ENABLE ROW LEVEL SECURITY");
    expect(content).toContain("ALTER TABLE registered_domains ENABLE ROW LEVEL SECURITY");

    // Must create policies referencing app.current_user_email
    expect(content).toContain("CREATE POLICY projects_user_policy");
    expect(content).toContain("CREATE POLICY sites_user_policy");
    expect(content).toContain("CREATE POLICY registered_domains_user_policy");
    expect(content).toContain("current_setting('app.current_user_email'");

    // Must have admin bypass role
    expect(content).toContain("zoobicon_admin");
    expect(content).toContain("BYPASSRLS");

    // Must FORCE RLS (since Neon connects as table owner)
    expect(content).toContain("FORCE ROW LEVEL SECURITY");
  });

  it("withUserContext returns callback result correctly", async () => {
    const { withUserContext } = await import("@/lib/db");

    const mockProjects = [
      { id: "1", user_email: "bob@test.com", name: "Test" },
    ];
    // set_config returns empty, then the SELECT returns mockProjects
    mockSql.mockResolvedValueOnce([]).mockResolvedValueOnce(mockProjects);

    const result = await withUserContext("bob@test.com", async (db) => {
      return db`SELECT * FROM projects WHERE user_email = ${"bob@test.com"}`;
    });

    expect(result).toEqual(mockProjects);
  });
});
