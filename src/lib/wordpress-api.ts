/**
 * WordPress Plugin API — Server-side handler for Zoobicon AI WordPress plugin
 *
 * Handles authentication, usage tracking, and rate limiting for the WordPress plugin.
 * Free: 50 ops/month. Pro: unlimited.
 *
 * Revenue model: Every WordPress Pro user pays $19/month to call OUR API.
 * That's recurring revenue from 43% of the internet (WordPress market share).
 */

import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "./api-middleware";

export interface WordPressApiContext {
  plan: string;
  keyPrefix: string;
  sub: string;
  siteName?: string;
  siteUrl?: string;
}

/**
 * Authenticate a WordPress plugin request and track usage.
 */
export async function authenticateWordPressRequest(
  req: NextRequest
): Promise<WordPressApiContext | Response> {
  const auth = await authenticateApiKey(req);
  if (auth instanceof Response) return auth;

  return {
    plan: auth.plan,
    keyPrefix: auth.keyPrefix,
    sub: auth.sub,
    siteUrl: req.headers.get("x-site-url") || undefined,
  };
}

/**
 * Call Claude to generate content for WordPress operations.
 */
export async function callAI(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 2000
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content.find(b => b.type === "text")?.text;
  if (!text) throw new Error("No response from AI");
  return text;
}

export { apiResponse, apiError };
