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
  { provider: "claude", id: "claude-opus-4-6", label: "Claude Opus 4.6", maxTokens: 64000, tier: "premium" },
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

async function callClaude(req: LLMRequest): Promise<LLMResponse> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const client = new Anthropic({ apiKey });
  const res = await client.messages.create({
    model: req.model,
    max_tokens: req.maxTokens || 64000,
    system: req.system,
    messages: [{ role: "user", content: req.userMessage }],
  });

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
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured — add it to .env to use GPT models");

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
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`OpenAI API error: ${err?.error?.message || res.statusText}`);
  }

  const data = await res.json();
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
  if (!apiKey) throw new Error("GOOGLE_AI_API_KEY not configured — add it to .env to use Gemini models");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${req.model}:generateContent?key=${apiKey}`;

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
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Gemini API error: ${err?.error?.message || res.statusText}`);
  }

  const data = await res.json();
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
