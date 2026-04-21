/**
 * Anthropic Messages API wrapper with prompt caching.
 * Raw fetch only — no SDK dependency.
 * https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
 */

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const ANTHROPIC_BETA = "prompt-caching-2024-07-31";

export type ClaudeRole = "user" | "assistant";

export interface ClaudeMessage {
  role: ClaudeRole;
  content: string;
}

export interface CallClaudeOptions {
  model: string;
  system: string;
  /** Optional large, stable prefix that should be cached. */
  systemCacheable?: string;
  messages: ClaudeMessage[];
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface ClaudeUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

export interface ClaudeResponse {
  id: string;
  type: string;
  role: string;
  model: string;
  content: Array<{ type: string; text?: string }>;
  stop_reason: string | null;
  stop_sequence: string | null;
  usage: ClaudeUsage;
}

interface SystemBlock {
  type: "text";
  text: string;
  cache_control?: { type: "ephemeral" };
}

interface RequestBody {
  model: string;
  max_tokens: number;
  temperature: number;
  system: string | SystemBlock[];
  messages: ClaudeMessage[];
  stream?: boolean;
}

/** ~4 chars per token heuristic. */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function requireApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    const err = new Error(
      "ANTHROPIC_API_KEY environment variable is not set",
    ) as Error & { status: number };
    err.status = 503;
    throw err;
  }
  return key;
}

function buildSystem(
  system: string,
  systemCacheable?: string,
): string | SystemBlock[] {
  if (systemCacheable && systemCacheable.length > 0) {
    const blocks: SystemBlock[] = [
      {
        type: "text",
        text: systemCacheable,
        cache_control: { type: "ephemeral" },
      },
    ];
    if (system && system.length > 0) {
      blocks.push({ type: "text", text: system });
    }
    return blocks;
  }

  if (estimateTokens(system) > 1024) {
    return [
      {
        type: "text",
        text: system,
        cache_control: { type: "ephemeral" },
      },
    ];
  }

  return system;
}

function buildBody(opts: CallClaudeOptions): RequestBody {
  return {
    model: opts.model,
    max_tokens: opts.maxTokens ?? 4096,
    temperature: opts.temperature ?? 0.7,
    system: buildSystem(opts.system, opts.systemCacheable),
    messages: opts.messages,
    stream: opts.stream,
  };
}

function headers(): Record<string, string> {
  return {
    "content-type": "application/json",
    "x-api-key": requireApiKey(),
    "anthropic-version": ANTHROPIC_VERSION,
    "anthropic-beta": ANTHROPIC_BETA,
  };
}

export async function callClaude(
  opts: CallClaudeOptions,
): Promise<ClaudeResponse> {
  const body = buildBody({ ...opts, stream: false });

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    const err = new Error(
      `Anthropic API error ${res.status}: ${text}`,
    ) as Error & { status: number };
    err.status = res.status;
    throw err;
  }

  return (await res.json()) as ClaudeResponse;
}

export interface StreamDelta {
  type: "text" | "done" | "error";
  text?: string;
  usage?: ClaudeUsage;
  error?: string;
}

interface SSEContentBlockDelta {
  type: "content_block_delta";
  index: number;
  delta: { type: string; text?: string };
}

interface SSEMessageDelta {
  type: "message_delta";
  delta: { stop_reason: string | null };
  usage?: ClaudeUsage;
}

interface SSEMessageStop {
  type: "message_stop";
}

type SSEEvent = SSEContentBlockDelta | SSEMessageDelta | SSEMessageStop | { type: string };

export async function* streamClaude(
  opts: CallClaudeOptions,
): AsyncGenerator<StreamDelta, void, unknown> {
  const body = buildBody({ ...opts, stream: true });

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    const text = res.body ? await res.text() : "no body";
    const err = new Error(
      `Anthropic API stream error ${res.status}: ${text}`,
    ) as Error & { status: number };
    err.status = res.status;
    throw err;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]" || payload.length === 0) continue;

        try {
          const event = JSON.parse(payload) as SSEEvent;
          if (event.type === "content_block_delta") {
            const e = event as SSEContentBlockDelta;
            if (e.delta.type === "text_delta" && e.delta.text) {
              yield { type: "text", text: e.delta.text };
            }
          } else if (event.type === "message_delta") {
            const e = event as SSEMessageDelta;
            if (e.usage) {
              yield { type: "done", usage: e.usage };
            }
          }
        } catch (parseErr) {
          yield {
            type: "error",
            error: `parse error: ${(parseErr as Error).message}`,
          };
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export interface CostInput {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens?: number;
}

export interface CostBreakdown {
  inputCost: number;
  outputCost: number;
  cachedCost: number;
  total: number;
  currency: "USD";
}

interface ModelPricing {
  /** USD per 1M input tokens */
  input: number;
  /** USD per 1M output tokens */
  output: number;
  /** USD per 1M cached input tokens (read) */
  cached: number;
}

const PRICING: Record<string, ModelPricing> = {
  // Claude Opus 4.7
  "claude-opus-4-7": { input: 15, output: 75, cached: 1.5 },
  "claude-opus-4-7-20250101": { input: 15, output: 75, cached: 1.5 },
  // Claude Sonnet 4.6
  "claude-sonnet-4-6": { input: 3, output: 15, cached: 0.3 },
  "claude-sonnet-4-6-20250101": { input: 3, output: 15, cached: 0.3 },
  // Claude Haiku 4.5
  "claude-haiku-4-5": { input: 0.8, output: 4, cached: 0.08 },
  "claude-haiku-4-5-20250101": { input: 0.8, output: 4, cached: 0.08 },
};

function pricingFor(model: string): ModelPricing {
  if (PRICING[model]) return PRICING[model];
  const lower = model.toLowerCase();
  if (lower.includes("opus")) return PRICING["claude-opus-4-7"];
  if (lower.includes("haiku")) return PRICING["claude-haiku-4-5"];
  return PRICING["claude-sonnet-4-6"];
}

export function estimateCost(input: CostInput): CostBreakdown {
  const p = pricingFor(input.model);
  const cached = input.cachedTokens ?? 0;
  const billableInput = Math.max(0, input.inputTokens - cached);

  const inputCost = (billableInput / 1_000_000) * p.input;
  const cachedCost = (cached / 1_000_000) * p.cached;
  const outputCost = (input.outputTokens / 1_000_000) * p.output;

  return {
    inputCost,
    outputCost,
    cachedCost,
    total: inputCost + outputCost + cachedCost,
    currency: "USD",
  };
}
