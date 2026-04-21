import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-middleware";
import { getGeneratorSystemSupplement } from "@/lib/generator-prompts";
import { sql } from "@/lib/db";

export const maxDuration = 300;

/**
 * POST /api/v1/generate — Programmatic website generation
 *
 * Headers:
 *   Authorization: Bearer zbk_live_...
 *
 * Body:
 *   {
 *     prompt: string,           // Required: what to build
 *     generator?: string,       // Optional: generator type (e.g., "landing", "saas", "restaurant")
 *     tier?: "standard"|"premium", // Optional: quality tier (default: based on plan)
 *     model?: string,           // Optional: model override (e.g., "gpt-4o", "gemini-2.5-pro")
 *     style?: string,           // Optional: style description
 *     webhook_url?: string,     // Optional: POST callback when generation completes
 *     deploy?: boolean,         // Optional: auto-deploy to zoobicon.sh (default: false)
 *     deploy_name?: string,     // Optional: site name for deployment
 *     agency_brand?: {          // Optional: white-label branding
 *       agencyName: string,
 *       primaryColor?: string,
 *       secondaryColor?: string,
 *       logoUrl?: string
 *     }
 *   }
 *
 * Response:
 *   {
 *     data: {
 *       id: string,
 *       html: string,
 *       generator: string|null,
 *       model: string,
 *       tokens_used: number,
 *       generation_time_ms: number,
 *       deployed?: { url: string, slug: string }
 *     }
 *   }
 */
export async function POST(req: NextRequest) {
  // Authenticate
  const auth = await authenticateApiKey(req);
  if (auth instanceof Response) return auth;

  try {
    const body = await req.json();
    const { prompt, generator, tier, model, style, webhook_url, deploy, deploy_name, agency_brand } = body;

    if (!prompt || typeof prompt !== "string") {
      return apiError(400, "missing_prompt", "A prompt string is required");
    }

    if (prompt.length > 5000) {
      return apiError(400, "prompt_too_long", "Prompt must be under 5000 characters");
    }

    const startTime = Date.now();
    const selectedTier = tier || (auth.plan === "free" ? "standard" : "premium");

    // Build system prompt
    const SYSTEM = `You are Zoobicon, an elite AI website generator. Output a single, complete HTML file with all CSS and JS inlined. No external dependencies. Images via picsum.photos with descriptive seeds.

RULES:
- Complete <!DOCTYPE html> with <html>, <head>, <body>
- All CSS in <style> tags, all JS in <script> tags
- Responsive design with mobile-first approach
- Professional, modern, visually striking output
- Use semantic HTML5 elements
- Include meta viewport tag for mobile
${selectedTier === "premium" ? "- Premium quality: extra polish, animations, micro-interactions, rich content" : ""}`;

    let systemPrompt = SYSTEM;

    // Add generator supplement
    if (generator && typeof generator === "string") {
      const supplement = getGeneratorSystemSupplement(generator);
      if (supplement) {
        systemPrompt += "\n\n" + supplement;
      }
    }

    // Add agency branding
    if (agency_brand?.agencyName) {
      systemPrompt += `\n\n## WHITE-LABEL BRANDING
- Brand name: "${agency_brand.agencyName}" — use everywhere instead of any generic name
- Primary color: ${agency_brand.primaryColor || "#3b82f6"}
- Secondary color: ${agency_brand.secondaryColor || "#8b5cf6"}
${agency_brand.logoUrl ? `- Logo URL: ${agency_brand.logoUrl}` : ""}`;
    }

    const userPrompt = style ? `Style: ${style}\n\n${prompt}` : prompt;

    const modelId = model || "claude-opus-4-7";
    const maxTokens = selectedTier === "premium" ? 32000 : 16000;
    const isClaudeModel = !modelId || modelId.startsWith("claude");

    let html: string;
    let tokensUsedRaw = 0;

    if (isClaudeModel) {
      // Use Anthropic API directly for Claude models
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return apiError(503, "api_not_configured", "Generation API is not configured");
      }
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const client = new Anthropic({ apiKey, timeout: 120_000 });

      const response = await client.messages.create({
        model: modelId,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });

      html = response.content
        .filter((block): block is { type: "text"; text: string } => block.type === "text")
        .map((block) => block.text)
        .join("");
      tokensUsedRaw = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);
    } else {
      // Route non-Claude models through the multi-LLM provider
      const { callLLM } = await import("@/lib/llm-provider");
      const result = await callLLM({
        model: modelId,
        system: systemPrompt,
        userMessage: userPrompt,
        maxTokens,
      });
      html = result.text;
      tokensUsedRaw = (result.inputTokens || 0) + (result.outputTokens || 0);
    }

    const tokensUsed = tokensUsedRaw;
    const generationTimeMs = Date.now() - startTime;

    // Generate a unique ID for this generation
    const generationId = crypto.randomUUID();

    // Auto-deploy if requested
    let deployed: { url: string; slug: string } | undefined;
    if (deploy && html.length > 100) {
      try {
        const slug = (deploy_name || `api-${generationId.slice(0, 8)}`)
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, "-")
          .replace(/-+/g, "-")
          .slice(0, 50);

        const [site] = await sql`
          INSERT INTO sites (name, slug, email, plan, status)
          VALUES (${deploy_name || "API Generated Site"}, ${slug}, ${`api_${auth.sub}@zoobicon.com`}, ${"api"}, ${"active"})
          ON CONFLICT (slug) DO UPDATE SET updated_at = NOW()
          RETURNING id, slug
        `;

        if (site) {
          await sql`
            INSERT INTO deployments (site_id, environment, status, code, url, size, commit_message)
            VALUES (${site.id}, ${"production"}, ${"active"}, ${html}, ${`https://${slug}.zoobicon.sh`}, ${html.length}, ${"API deployment"})
          `;
          deployed = { url: `https://${slug}.zoobicon.sh`, slug };
        }
      } catch (deployErr) {
        console.error("Auto-deploy failed:", deployErr);
        // Don't fail the whole request if deploy fails
      }
    }

    // Fire webhook if provided (async, don't block response)
    if (webhook_url && typeof webhook_url === "string") {
      fetch(webhook_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "generation.complete",
          id: generationId,
          html_length: html.length,
          tokens_used: tokensUsed,
          generation_time_ms: generationTimeMs,
          deployed,
        }),
      }).catch(() => {});
    }

    // Record generation for tracking
    try {
      await sql`
        INSERT INTO projects (user_email, name, prompt, code)
        VALUES (${`api_${auth.sub}@zoobicon.com`}, ${`API: ${prompt.slice(0, 50)}`}, ${prompt}, ${html})
      `;
    } catch { /* best effort */ }

    return apiResponse({
      id: generationId,
      html,
      generator: generator || null,
      model: modelId,
      tokens_used: tokensUsed,
      generation_time_ms: generationTimeMs,
      ...(deployed ? { deployed } : {}),
    });
  } catch (err) {
    console.error("v1/generate error:", err);
    return apiError(500, "generation_failed", "Website generation failed. Please try again.");
  }
}
