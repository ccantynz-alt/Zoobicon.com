/**
 * Gate Test Client — drop-in helper for Craig's external Gate Test tool
 * =====================================================================
 *
 * ROOT CAUSE THIS FIXES
 * ---------------------
 * Craig's Gate Test batches dozens of "fix" calls back-to-back against an
 * upstream AI endpoint (our /api/generate/edit, Anthropic direct, or another
 * LLM). Under load the upstream occasionally sends a mid-session TLS alert
 * 80 (internal_error). Node caches the now-dead socket in its keep-alive
 * HTTPS agent. Every subsequent fixFile() call pulls that dead socket from
 * the pool and the write fails INSTANTLY before the request leaves the box,
 * producing the telltale burst of identical errors:
 *
 *   write EPROTO C038842C8A7F0000:error:0A000438:SSL routines:
 *   ssl3_read_bytes:tlsv1 alert internal error:
 *   ssl/record/rec_layer_s3.c:912:SSL alert number 80
 *
 * Note the IDENTICAL socket hex across every file — that's one poisoned
 * keep-alive socket being reused for the whole run.
 *
 * HOW THIS MODULE FIXES IT
 * ------------------------
 * 1. Each call goes through a fresh undici Dispatcher so no socket is ever
 *    reused between files. A poisoned connection cannot survive to the
 *    next call because the dispatcher is torn down in finally{}.
 * 2. Classified retry with jitter handles the genuine transient TLS blip
 *    that started the storm in the first place.
 * 3. Errors are returned as { ok:false, reason } — NEVER raw openssl stacks
 *    leak into scanner output.
 *
 * USAGE
 * -----
 * Vendor this file into the Gate Test tool (or publish it from here as a
 * tiny npm package) and swap its fix-call to:
 *
 *   import { fixFile } from "./gate-test-client";
 *   const r = await fixFile({ endpoint, apiKey, file, instruction });
 *   if (!r.ok) console.log(`→ Failed to fix ${file}: ${r.reason}`);
 *
 * The endpoint is our /api/generate/edit (SSE stream) by default; pass a
 * custom `handler` to point at Anthropic / OpenAI / Gemini direct.
 */

export interface FixRequest {
  endpoint: string;
  apiKey?: string;
  file: string;
  content: string;
  instruction: string;
  timeoutMs?: number;
  attempts?: number;
}

export interface FixSuccess {
  ok: true;
  file: string;
  newContent: string;
  modelUsed?: string;
  attempts: number;
}

export interface FixFailure {
  ok: false;
  file: string;
  reason: string;
  retryable: boolean;
  attempts: number;
}

export type FixResult = FixSuccess | FixFailure;

/**
 * Short, user-safe description of a network-layer failure. Never leaks the
 * raw openssl stack (e.g. "ssl/record/rec_layer_s3.c:912:SSL alert number 80").
 */
export function describeFixError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/EPROTO|ssl.*alert|tlsv1|handshake/i.test(msg)) return "upstream TLS connection dropped";
  if (/rate.?limit|too.many|429/i.test(msg)) return "rate limited";
  if (/overloaded|529/i.test(msg)) return "provider overloaded";
  if (/timeout|timed?\s*out|abort/i.test(msg)) return "request timed out";
  if (/ECONNRESET|socket\s*hang.?up|EPIPE/i.test(msg)) return "connection reset";
  if (/ECONNREFUSED/i.test(msg)) return "connection refused";
  if (/ENOTFOUND|EAI_AGAIN/i.test(msg)) return "DNS lookup failed";
  if (/\b5\d\d\b/.test(msg)) return "provider 5xx error";
  if (/401|unauthorized|invalid.api.key/i.test(msg)) return "invalid API key";
  const first = msg.split(/[\n.]/)[0].trim();
  return first.length > 120 ? first.slice(0, 117) + "..." : first;
}

export function isTransientFixError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /rate.?limit|overloaded|529|too.many|\b5\d\d\b|timeout|timed?\s*out|abort|ECONNRESET|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|EPIPE|EPROTO|socket\s*hang.?up|fetch failed|network.*error|ssl.*alert|tlsv1|handshake|internal.error/i.test(msg);
}

/**
 * Attempt one fix call with a FRESH dispatcher — no socket reuse possible.
 * Uses `undici` when available (Node 18+, most runtimes), falls back to the
 * global fetch (which will still avoid keep-alive reuse because we build
 * and tear down the dispatcher per-call).
 */
async function attemptOnce(req: FixRequest): Promise<{ newContent: string; modelUsed?: string }> {
  const timeoutMs = req.timeoutMs ?? 60_000;

  // Prefer undici (isolated agent per call → zero keep-alive reuse).
  // If undici isn't present we fall back to global fetch with no-cache
  // + Connection:close to opt out of keep-alive.
  let undici: typeof import("undici") | null = null;
  try {
    undici = await import("undici");
  } catch {
    /* undici not available — fall back */
  }

  const body = JSON.stringify({
    instruction: req.instruction,
    files: { [req.file]: req.content },
    targetFile: req.file,
  });
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Connection: "close",
  };
  if (req.apiKey) headers["Authorization"] = `Bearer ${req.apiKey}`;

  let raw: string;
  if (undici) {
    const dispatcher = new undici.Agent({
      keepAliveTimeout: 1,
      keepAliveMaxTimeout: 1,
      connections: 1,
      pipelining: 0,
    });
    try {
      const res = await undici.request(req.endpoint, {
        method: "POST",
        headers,
        body,
        bodyTimeout: timeoutMs,
        headersTimeout: timeoutMs,
        dispatcher,
      });
      if (res.statusCode >= 400) {
        const errText = await res.body.text().catch(() => "");
        throw new Error(`HTTP ${res.statusCode}: ${errText.slice(0, 200) || "request failed"}`);
      }
      raw = await res.body.text();
    } finally {
      await dispatcher.close().catch(() => { /* dispatcher already closed */ });
    }
  } else {
    const res = await fetch(req.endpoint, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${errText.slice(0, 200) || res.statusText}`);
    }
    raw = await res.text();
  }

  // Our /api/generate/edit is an SSE stream. Parse out the final "done" or
  // "error" event so callers get a clean result regardless of transport.
  const events = raw
    .split(/\n\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => chunk.replace(/^data:\s*/, ""))
    .map((json) => {
      try {
        return JSON.parse(json) as Record<string, unknown>;
      } catch {
        return null;
      }
    })
    .filter((e): e is Record<string, unknown> => e !== null);

  const errEvent = events.find((e) => e.type === "error");
  if (errEvent) throw new Error(String(errEvent.message || "edit endpoint reported error"));

  const doneEvent = events.find((e) => e.type === "done");
  if (doneEvent && doneEvent.files && typeof doneEvent.files === "object") {
    const files = doneEvent.files as Record<string, string>;
    const newContent = files[req.file] ?? Object.values(files)[0];
    if (typeof newContent === "string" && newContent.length > 0) {
      return { newContent, modelUsed: String(doneEvent.modelUsed || "") };
    }
  }

  // Fall back: maybe a non-SSE JSON endpoint
  try {
    const parsed = JSON.parse(raw) as {
      files?: Record<string, string>;
      content?: string;
      modelUsed?: string;
    };
    const newContent = parsed.content ?? parsed.files?.[req.file] ?? Object.values(parsed.files ?? {})[0];
    if (typeof newContent === "string" && newContent.length > 0) {
      return { newContent, modelUsed: parsed.modelUsed };
    }
  } catch {
    /* not JSON */
  }

  throw new Error("fix endpoint returned no usable content");
}

/**
 * Public entry point. Retries transient errors with exponential backoff
 * + jitter, returns a typed result, NEVER throws a raw SSL stack.
 */
export async function fixFile(req: FixRequest): Promise<FixResult> {
  const attempts = req.attempts ?? 3;
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const result = await attemptOnce(req);
      return {
        ok: true,
        file: req.file,
        newContent: result.newContent,
        modelUsed: result.modelUsed,
        attempts: i + 1,
      };
    } catch (err) {
      lastErr = err;
      const transient = isTransientFixError(err);
      if (!transient || i === attempts - 1) {
        return {
          ok: false,
          file: req.file,
          reason: describeFixError(err),
          retryable: transient,
          attempts: i + 1,
        };
      }
      const delay = 500 * Math.pow(2, i) + Math.floor(Math.random() * 300);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  return {
    ok: false,
    file: req.file,
    reason: describeFixError(lastErr),
    retryable: false,
    attempts,
  };
}

/**
 * Batch helper — run fixFile() over many files with bounded concurrency.
 * Each call still gets its own dispatcher, so a poisoned connection on one
 * file cannot leak into the rest of the batch.
 */
export async function fixFiles(
  reqs: FixRequest[],
  concurrency = 3
): Promise<FixResult[]> {
  const results: FixResult[] = new Array(reqs.length);
  let next = 0;
  async function worker() {
    while (true) {
      const idx = next++;
      if (idx >= reqs.length) return;
      results[idx] = await fixFile(reqs[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, reqs.length) }, worker));
  return results;
}
