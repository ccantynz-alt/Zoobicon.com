/**
 * Multi-LLM Provider Abstraction
 *
 * Supports Claude (Anthropic), GPT (OpenAI), and Gemini (Google)
 * with a unified interface. Each provider can be configured per-agent
 * in the pipeline for maximum flexibility.
 */

export type LLMProvider = "claude" | "openai" | "gemini";

export interface LLMModel {
  provider: LLMProvider;
  id: string;
  label: string;
  maxTokens: number;
  tier: "fast" | "balanced" | "premium";
}

export const AVAILABLE_MODELS: LLMModel[] = [
  // Claude (Anthropic)
  { provider: "claude", id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", maxTokens: 64000, tier: "balanced" },
  { provider: "claude", id: "claude-opus-4-7", label: "Claude Opus 4.7", maxTokens: 64000, tier: "premium" },
  { provider: "claude", id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5", maxTokens: 8192, tier: "fast" },
  // OpenAI
  { provider: "openai", id: "gpt-4o", label: "GPT-4o", maxTokens: 16384, tier: "balanced" },
  { provider: "openai", id: "gpt-4o-mini", label: "GPT-4o Mini", maxTokens: 16384, tier: "fast" },
  { provider: "openai", id: "o3", label: "o3", maxTokens: 100000, tier: "premium" },
  // Gemini (Google)
  { provider: "gemini", id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", maxTokens: 65536, tier: "premium" },
  { provider: "gemini", id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", maxTokens: 65536, tier: "fast" },
];

export interface LLMRequest {
  model: string;
  system: string;
  userMessage: string;
  maxTokens?: number;
}

export interface LLMResponse {
  text: string;
  model: string;
  provider: LLMProvider;
  inputTokens?: number;
  outputTokens?: number;
}

function getProviderForModel(modelId: string): LLMProvider {
  const model = AVAILABLE_MODELS.find((m) => m.id === modelId);
  if (model) return model.provider;
  if (modelId.startsWith("claude")) return "claude";
  if (modelId.startsWith("gpt") || modelId.startsWith("o3") || modelId.startsWith("o1")) return "openai";
  if (modelId.startsWith("gemini")) return "gemini";
  return "claude"; // default
}

// ─────────────────────────────────────────────────────────────────────────────
// Transient error classification + retry
//
// Root cause of the "Failed to fix X: write EPROTO ... SSL alert number 80"
// storm: a flaky TLS connection between us and the upstream LLM. A single
// ssl3_read_bytes internal_error (alert 80) kills one provider attempt, the
// failover layer previously did not class EPROTO/SSL as retryable, so every
// file in a Gate Test batch inherited the same upstream hiccup and the user
// saw the raw openssl stack. The fix: tight per-call retry with jitter +
// clean classification of what's retryable vs fatal.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Classify an error as transient (worth retrying) vs fatal (e.g. bad key).
 * Covers Anthropic SDK failures, node-fetch/undici network errors, DNS,
 * socket hangups, and raw OpenSSL alert 80 (internal_error) EPROTO faults.
 */
export function isTransientLLMError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /rate.?limit|overloaded|529|too.many|5\d\d|timeout|timed?\s*out|abort|ECONNRESET|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|EPIPE|EPROTO|socket\s*hang.?up|fetch failed|network.*error|ssl.*alert|tlsv1|handshake|internal.error/i.test(msg);
}

/**
 * Convert any upstream error into a short, human-safe sentence.
 * Never leaks openssl file paths, alert numbers, or TLS internals to users.
 */
export function describeLLMError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/EPROTO|ssl.*alert|tlsv1|handshake/i.test(msg)) return "upstream TLS connection dropped";
  if (/rate.?limit|too.many|429/i.test(msg)) return "rate limited";
  if (/overloaded|529/i.test(msg)) return "provider overloaded";
  if (/timeout|timed?\s*out|abort/i.test(msg)) return "request timed out";
  if (/ECONNRESET|socket\s*hang.?up|EPIPE/i.test(msg)) return "connection reset";
  if (/ECONNREFUSED/i.test(msg)) return "connection refused";
  if (/ENOTFOUND|EAI_AGAIN/i.test(msg)) return "DNS lookup failed";
  if (/5\d\d/i.test(msg)) return "provider 5xx error";
  if (/401|unauthorized|invalid.api.key/i.test(msg)) return "invalid API key";
  if (/400|invalid.request/i.test(msg)) return "bad request";
  // Last resort: first sentence only, capped at 120 chars. Never the stack.
  const first = msg.split(/[\n.]/)[0].trim();
  return first.length > 120 ? first.slice(0, 117) + "..." : first;
}

/**
 * Retry a zero-arg async operation with exponential backoff + jitter.
 * Only retries transient errors (see isTransientLLMError). Fatal errors
 * (auth, 400, malformed payload) throw immediately so we don't waste time.
 */
async function retryTransient<T>(
  fn: () => Promise<T>,
  opts: { attempts?: number; baseMs?: number; label: string } = { label: "llm" }
): Promise<T> {
  const attempts = opts.attempts ?? 3;
  const baseMs = opts.baseMs ?? 400;
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isTransientLLMError(err) || i === attempts - 1) throw err;
      const delay = baseMs * Math.pow(2, i) + Math.floor(Math.random() * 250);
      console.warn(`[llm-retry:${opts.label}] attempt ${i + 1}/${attempts} failed (${describeLLMError(err)}), retrying in ${delay}ms`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

async function callClaude(req: LLMRequest): Promise<LLMResponse> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("AI service is temporarily unavailable.");

  // SDK has its own maxRetries, but it doesn't retry EPROTO/SSL — wrap it.
  const client = new Anthropic({ apiKey, timeout: 60000, maxRetries: 0 });
  const res = await retryTransient(
    () =>
      client.messages.create({
        model: req.model,
        max_tokens: req.maxTokens || 64000,
        system: req.system,
        messages: [{ role: "user", content: req.userMessage }],
      }),
    { label: `claude:${req.model}` }
  );

  const text = res.content.find((b) => b.type === "text")?.text || "";
  return {
    text,
    model: req.model,
    provider: "claude",
    inputTokens: res.usage?.input_tokens,
    outputTokens: res.usage?.output_tokens,
  };
}

async function callOpenAI(req: LLMRequest): Promise<LLMResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("AI service is temporarily unavailable.");

  const data = await retryTransient(
    async () => {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: req.model,
          max_completion_tokens: req.maxTokens || 16384,
          messages: [
            { role: "system", content: req.system },
            { role: "user", content: req.userMessage },
          ],
        }),
        signal: AbortSignal.timeout(60000),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`OpenAI ${res.status}: ${err?.error?.message || res.statusText}`);
      }
      return (await res.json()) as {
        choices?: { message?: { content?: string } }[];
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };
    },
    { label: `openai:${req.model}` }
  );

  const text = data.choices?.[0]?.message?.content || "";
  return {
    text,
    model: req.model,
    provider: "openai",
    inputTokens: data.usage?.prompt_tokens,
    outputTokens: data.usage?.completion_tokens,
  };
}

async function callGemini(req: LLMRequest): Promise<LLMResponse> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error("AI service is temporarily unavailable.");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${req.model}:generateContent?key=${apiKey}`;

  const data = await retryTransient(
    async () => {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: req.system }] },
          contents: [{ parts: [{ text: req.userMessage }] }],
          generationConfig: {
            maxOutputTokens: req.maxTokens || 65536,
          },
        }),
        signal: AbortSignal.timeout(60000),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`Gemini ${res.status}: ${err?.error?.message || res.statusText}`);
      }
      return (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
        usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
      };
    },
    { label: `gemini:${req.model}` }
  );

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return {
    text,
    model: req.model,
    provider: "gemini",
    inputTokens: data.usageMetadata?.promptTokenCount,
    outputTokens: data.usageMetadata?.candidatesTokenCount,
  };
}

/**
 * Unified LLM call — automatically routes to the right provider
 */
export async function callLLM(req: LLMRequest): Promise<LLMResponse> {
  const provider = getProviderForModel(req.model);

  switch (provider) {
    case "claude":
      return callClaude(req);
    case "openai":
      return callOpenAI(req);
    case "gemini":
      return callGemini(req);
    default:
      return callClaude(req);
  }
}

/**
 * Unified LLM call with automatic cross-provider failover.
 * Tries the requested model first, then falls back through available providers
 * when rate-limited or overloaded. Preferred fallback order: OpenAI → Gemini → Claude.
 */
export async function callLLMWithFailover(
  req: LLMRequest,
  onFallback?: (provider: LLMProvider, model: string) => void
): Promise<LLMResponse> {
  const primaryProvider = getProviderForModel(req.model);

  // Check that at least one provider is configured
  const available = getAvailableProviders();
  if (available.length === 0) {
    throw new Error(
      "No AI providers configured. Set at least one of: ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_AI_API_KEY"
    );
  }

  // Try primary model first. callLLM now has its own intra-provider retry
  // for transient TLS/network flakes, so if it still throws, we either
  // exhausted retries (genuine outage) or hit a fatal error (auth, 400).
  try {
    return await callLLM(req);
  } catch (err) {
    if (!isTransientLLMError(err)) throw err; // Auth / bad request — don't failover
    console.warn(`[LLM Failover] ${req.model} unavailable: ${describeLLMError(err)}`);
  }

  // Build fallback order: try other providers with their best available model
  const fallbacks: { provider: LLMProvider; model: string; maxTokens: number }[] = [];
  const otherProviders = getAvailableProviders().filter((p) => p !== primaryProvider);

  for (const provider of otherProviders) {
    const models = getModelsForProvider(provider);
    // Prefer balanced tier, then premium, then fast
    const best = models.find((m) => m.tier === "balanced")
      || models.find((m) => m.tier === "premium")
      || models[0];
    if (best) fallbacks.push({ provider, model: best.id, maxTokens: best.maxTokens });
  }

  // Also try other models from the same provider (e.g., Sonnet if Opus failed)
  if (primaryProvider === "claude") {
    const sonnet = AVAILABLE_MODELS.find((m) => m.id === "claude-sonnet-4-6");
    if (sonnet && req.model !== sonnet.id) {
      fallbacks.unshift({ provider: "claude", model: sonnet.id, maxTokens: sonnet.maxTokens });
    }
  }

  for (const fb of fallbacks) {
    try {
      console.log(`[LLM Failover] Trying ${fb.model} (${fb.provider})`);
      onFallback?.(fb.provider, fb.model);
      return await callLLM({
        ...req,
        model: fb.model,
        maxTokens: Math.min(req.maxTokens || fb.maxTokens, fb.maxTokens),
      });
    } catch (fbErr) {
      console.warn(`[LLM Failover] ${fb.model} also failed: ${describeLLMError(fbErr)}`);
    }
  }

  throw new Error("All AI providers are currently unavailable. Please try again later.");
}

/**
 * Check which providers are available based on env vars
 */
export function getAvailableProviders(): LLMProvider[] {
  const providers: LLMProvider[] = [];
  if (process.env.ANTHROPIC_API_KEY) providers.push("claude");
  if (process.env.OPENAI_API_KEY) providers.push("openai");
  if (process.env.GOOGLE_AI_API_KEY) providers.push("gemini");
  return providers;
}

/**
 * Get models available for a specific provider
 */
export function getModelsForProvider(provider: LLMProvider): LLMModel[] {
  return AVAILABLE_MODELS.filter((m) => m.provider === provider);
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider health check — logs available providers at startup / on demand
// ��────────────────────────────────────────────────────���───────────────────────

export interface ProviderHealth {
  provider: LLMProvider;
  available: boolean;
  envVar: string;
}

/**
 * Check which AI providers are configured and return a health report.
 * Logs the result so operators can see at a glance which providers are live.
 *
 * If NO providers are available, throws with a clear error message listing
 * the required env vars.
 */
export function checkProviderHealth(options?: { log?: boolean; throwIfNone?: boolean }): ProviderHealth[] {
  const health: ProviderHealth[] = [
    { provider: "claude", available: Boolean(process.env.ANTHROPIC_API_KEY), envVar: "ANTHROPIC_API_KEY" },
    { provider: "openai", available: Boolean(process.env.OPENAI_API_KEY), envVar: "OPENAI_API_KEY" },
    { provider: "gemini", available: Boolean(process.env.GOOGLE_AI_API_KEY), envVar: "GOOGLE_AI_API_KEY" },
  ];

  const shouldLog = options?.log ?? true;
  const shouldThrow = options?.throwIfNone ?? false;

  if (shouldLog) {
    const available = health.filter((h) => h.available);
    const missing = health.filter((h) => !h.available);
    if (available.length > 0) {
      console.log(
        `[LLM Health] ${available.length}/3 providers available: ${available.map((h) => h.provider).join(", ")}`
      );
    }
    if (missing.length > 0) {
      console.warn(
        `[LLM Health] ${missing.length}/3 providers missing: ${missing.map((h) => `${h.provider} (${h.envVar})`).join(", ")}`
      );
    }
  }

  if (shouldThrow && health.every((h) => !h.available)) {
    throw new Error(
      `No AI providers configured. Set at least one of: ${health.map((h) => h.envVar).join(", ")} in your environment variables.`
    );
  }

  return health;
}
