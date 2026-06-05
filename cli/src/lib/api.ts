import { apiBase, USER_AGENT } from "./config.js";
import { loadApiKey } from "./auth.js";

/**
 * Thin HTTP client around the Zoobicon API. Handles auth headers,
 * timeouts, and consistent error mapping so command files stay clean.
 *
 * Auth model: `Authorization: Bearer zbk_live_...`. The token can come
 * from the credentials file (default) or from ZOOBICON_API_KEY env var.
 */

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  timeoutMs?: number;
  // Some endpoints (e.g. /api/domains/search) don't require auth — let the
  // caller skip the header rather than failing if no key is present.
  skipAuth?: boolean;
  // For SSE streaming endpoints — the caller handles the response body.
  raw?: boolean;
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export async function api<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const url = path.startsWith("http") ? path : `${apiBase()}${path}`;
  const headers: Record<string, string> = {
    "User-Agent": USER_AGENT,
    Accept: "application/json",
  };
  if (!opts.skipAuth) {
    const key = loadApiKey();
    if (key) headers.Authorization = `Bearer ${key}`;
  }
  if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method: opts.method || "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: AbortSignal.timeout(opts.timeoutMs ?? 30000),
  });

  if (opts.raw) {
    // Caller handles the body itself (e.g. SSE stream consumer).
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new ApiError(`HTTP ${res.status} ${res.statusText}`, res.status, text);
    }
    return res as unknown as T;
  }

  if (!res.ok) {
    let body: unknown = null;
    try { body = await res.json(); } catch { body = await res.text().catch(() => ""); }
    const detail = (body && typeof body === "object" && "error" in body && typeof (body as { error: unknown }).error === "string")
      ? (body as { error: string }).error
      : `HTTP ${res.status} ${res.statusText}`;
    throw new ApiError(detail, res.status, body);
  }

  return (await res.json()) as T;
}

/**
 * Generate-stream endpoint helper. Reads the SSE stream and invokes
 * onEvent for every parsed event. Resolves once the [DONE] sentinel
 * arrives or the stream closes.
 */
export async function streamGenerate(
  prompt: string,
  onEvent: (type: string, data: unknown) => void,
): Promise<void> {
  const res = (await api<Response>("/api/generate/react-stream", {
    method: "POST",
    body: { prompt, mode: "fast" },
    raw: true,
    timeoutMs: 180000,
  })) as Response;

  const reader = res.body?.getReader();
  if (!reader) throw new ApiError("No response body from generation endpoint.", 500, null);

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const events = buffer.split("\n\n");
    buffer = events.pop() || "";
    for (const evt of events) {
      const lines = evt.split("\n");
      let type = "message";
      let dataStr = "";
      for (const line of lines) {
        if (line.startsWith("event:")) type = line.slice(6).trim();
        if (line.startsWith("data:")) dataStr += line.slice(5).trim();
      }
      if (!dataStr) continue;
      try {
        onEvent(type, JSON.parse(dataStr));
      } catch {
        onEvent(type, dataStr);
      }
    }
  }
}
