/**
 * MCP Bearer-token auth.
 *
 * Reuses the existing public API key system (zbk_live_* / zbk_test_*) via
 * dynamic import so this module stays decoupled and safe to import from
 * edge-ish contexts. If no Authorization header is present we fall back
 * to anonymous / public mode — callers can then restrict to read-only
 * tools.
 */

import type { NextRequest } from "next/server";

export interface McpAuthResult {
  ok: boolean;
  userId?: string;
  scope: "authenticated" | "public";
  plan?: string;
  error?: string;
}

interface ApiKeysModule {
  verifyApiKey: (plaintext: string) => Promise<{
    id: string;
    ownerEmail?: string;
    plan?: string;
    active?: boolean;
  } | null>;
}

function extractBearer(req: NextRequest): string | null {
  const header = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const token = match[1].trim();
  return token.length > 0 ? token : null;
}

export async function verifyMcpRequest(req: NextRequest): Promise<McpAuthResult> {
  const token = extractBearer(req);

  if (!token) {
    return { ok: true, scope: "public" };
  }

  try {
    const mod = (await import("@/lib/api-keys")) as unknown as ApiKeysModule;
    if (typeof mod.verifyApiKey !== "function") {
      return { ok: true, scope: "public", error: "api-keys module missing verifyApiKey" };
    }
    const row = await mod.verifyApiKey(token);
    if (!row || row.active === false) {
      return { ok: false, scope: "public", error: "Invalid or inactive API key" };
    }
    return {
      ok: true,
      scope: "authenticated",
      userId: row.ownerEmail ?? row.id,
      plan: row.plan,
    };
  } catch (err) {
    return {
      ok: false,
      scope: "public",
      error: err instanceof Error ? err.message : "Auth verification failed",
    };
  }
}

/** Tool names that are safe to expose to unauthenticated (public) callers. */
export const PUBLIC_TOOL_ALLOWLIST: ReadonlySet<string> = new Set<string>([
  "search_domains",
  "generate_business_names",
  "list_products",
  "list_tools",
  "ping",
  "health",
]);

export function isToolAllowedForScope(
  toolName: string,
  scope: McpAuthResult["scope"],
): boolean {
  if (scope === "authenticated") return true;
  return PUBLIC_TOOL_ALLOWLIST.has(toolName);
}
