import { NextRequest, NextResponse } from "next/server";

/**
 * Substrate health probe — GET /api/admin/substrate-health
 *
 * The substrate is our self-hosted LLM fallback (Hetzner GPU bank
 * running vLLM/Ollama on an OpenAI-compatible API). When it's
 * configured via SELFHOSTED_LLM_URL the failover chain in
 * src/lib/llm-provider.ts already routes to it as the last resort.
 * This endpoint gives the admin a way to verify it's actually up
 * before relying on it — env-var presence alone doesn't tell you
 * whether the box is reachable or whether the model is loaded.
 *
 * Returns:
 *  { configured: false }                               — no env var
 *  { configured: true, reachable: false, error: "…" }  — env set but offline
 *  { configured: true, reachable: true, models: […], latencyMs: 87 }
 *
 * Gated by x-admin-email = ADMIN_EMAIL, same as env-status.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const callerEmail = req.headers.get("x-admin-email")?.trim().toLowerCase();
  if (!adminEmail || !callerEmail || callerEmail !== adminEmail.toLowerCase()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const baseUrl = process.env.SELFHOSTED_LLM_URL;
  if (!baseUrl) {
    return NextResponse.json({
      configured: false,
      message: "Set SELFHOSTED_LLM_URL to a vLLM/Ollama OpenAI-compatible endpoint (e.g. https://substrate.zoobicon.io).",
    });
  }

  const apiKey = process.env.SELFHOSTED_LLM_KEY;
  const url = `${baseUrl.replace(/\/$/, "")}/v1/models`;

  const started = Date.now();
  try {
    const res = await fetch(url, {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
      signal: AbortSignal.timeout(8000),
    });
    const latencyMs = Date.now() - started;

    if (!res.ok) {
      return NextResponse.json({
        configured: true,
        reachable: false,
        latencyMs,
        error: `HTTP ${res.status} from ${url}`,
      });
    }

    const data = (await res.json()) as { data?: { id?: string }[] };
    const models = (data.data || [])
      .map((m) => m.id)
      .filter((id): id is string => typeof id === "string");

    return NextResponse.json({
      configured: true,
      reachable: true,
      latencyMs,
      models,
      hint: models.length === 0 ? "Endpoint reachable but no models served — did vLLM/Ollama finish loading?" : undefined,
    });
  } catch (err) {
    return NextResponse.json({
      configured: true,
      reachable: false,
      latencyMs: Date.now() - started,
      error: err instanceof Error ? err.message : "Probe failed",
    });
  }
}
