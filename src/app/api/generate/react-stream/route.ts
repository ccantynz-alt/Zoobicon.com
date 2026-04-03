/**
 * Streaming React Generation via Component Registry
 *
 * Phase 1: Instant assembly from the 100-component registry (<1 second)
 * Phase 2: AI customizes ONLY content (company name, headlines, copy, colors)
 * Phase 3: Each customized component streamed as a separate SSE event
 *
 * Total time: <15 seconds vs ~3 minutes for full AI generation.
 */

import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  authenticateRequest,
  checkUsageQuota,
  trackUsage,
} from "@/lib/auth-guard";

export const maxDuration = 300;

// Lazy-load the component registry to avoid circular initialization at build time.
// The registry files use side-effect imports (registerComponent calls) that need
// the REGISTRY array to exist first — dynamic import ensures correct ordering.
async function getRegistry() {
  const mod = await import("@/lib/component-registry");
  return mod;
}

export async function POST(req: NextRequest) {
  // Auth
  const auth = await authenticateRequest(req, {
    requireAuth: true,
    requireVerified: true,
  });
  if (auth.error) return auth.error;

  const quota = await checkUsageQuota(
    auth.user!.email,
    auth.user!.plan,
    "generation"
  );
  if (quota.error) return quota.error;

  let body: { prompt?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { prompt } = body;
  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    return Response.json({ error: "Prompt required" }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // ── Phase 1: Instant Assembly from Registry (<1 second) ──
        const registry = await getRegistry();
        const { files: assembledFiles, components } = registry.buildFromPrompt(
          prompt.trim()
        );

        send({
          type: "scaffold",
          files: assembledFiles,
          componentCount: components.length,
          registrySize: registry.REGISTRY.length,
        });

        send({
          type: "status",
          message: `Assembled ${components.length} components from registry — AI customizing content...`,
        });

        // ── Phase 2: AI Customizes Content Only ──
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          send({
            type: "error",
            message:
              "AI service unavailable — ANTHROPIC_API_KEY is not configured. Please contact support.",
          });
          controller.close();
          return;
        }

        const client = new Anthropic({ apiKey, timeout: 240000 });

        // Build a summary of what sections exist so the AI knows what to customize
        const sectionSummary = components
          .map(
            (c: { category: string; variant: string; description: string }) =>
              `- ${c.category} (${c.variant}): ${c.description}`
          )
          .join("\n");

        const customizationPrompt = `You are a website content customizer for a professional site builder. Given a user's business description, generate customized content to replace the placeholder text in their website.

The website already has these sections assembled:
${sectionSummary}

You ONLY need to customize the TEXT CONTENT and COLORS — the layout and structure are already built.

Generate a JSON object with this exact structure:
{
  "brandName": "The company/brand name",
  "tagline": "Short tagline (under 10 words)",
  "headline": "Main hero headline (powerful, benefit-driven)",
  "subheadline": "Supporting text (1-2 sentences explaining the value proposition)",
  "features": [
    { "title": "Feature Name", "description": "One sentence description of the benefit" },
    { "title": "Feature Name", "description": "One sentence description of the benefit" },
    { "title": "Feature Name", "description": "One sentence description of the benefit" },
    { "title": "Feature Name", "description": "One sentence description of the benefit" },
    { "title": "Feature Name", "description": "One sentence description of the benefit" },
    { "title": "Feature Name", "description": "One sentence description of the benefit" }
  ],
  "about": {
    "headline": "About section headline",
    "description": "2-3 sentences about the company mission and values"
  },
  "testimonials": [
    { "name": "Full Name", "role": "Job Title", "company": "Company Name", "quote": "Specific testimonial mentioning a real metric or outcome (1-2 sentences)" },
    { "name": "Full Name", "role": "Job Title", "company": "Company Name", "quote": "Specific testimonial mentioning a real metric or outcome (1-2 sentences)" },
    { "name": "Full Name", "role": "Job Title", "company": "Company Name", "quote": "Specific testimonial mentioning a real metric or outcome (1-2 sentences)" }
  ],
  "stats": [
    { "value": "10K+", "label": "Descriptive Label" },
    { "value": "99%", "label": "Descriptive Label" },
    { "value": "150+", "label": "Descriptive Label" },
    { "value": "24/7", "label": "Descriptive Label" }
  ],
  "faq": [
    { "question": "Common question?", "answer": "Clear, helpful answer (1-2 sentences)" },
    { "question": "Common question?", "answer": "Clear, helpful answer (1-2 sentences)" },
    { "question": "Common question?", "answer": "Clear, helpful answer (1-2 sentences)" }
  ],
  "cta": {
    "headline": "Call-to-action headline",
    "description": "Supporting text for the CTA",
    "primaryButton": "Primary button text",
    "secondaryButton": "Secondary button text"
  },
  "navLinks": ["Home", "Features", "About", "Pricing", "Contact"],
  "footerDescription": "One sentence company description for the footer",
  "colors": {
    "primary": "#hex (brand primary color)",
    "secondary": "#hex (brand accent color)",
    "bg": "#hex (background color, usually #ffffff or #f9fafb)",
    "text": "#hex (text color, usually #111827 or #1f2937)"
  }
}

Rules:
- Content must be specific to the business described, NOT generic placeholder text
- Testimonials must sound real with specific metrics ("increased revenue by 40%", "saved 12 hours/week")
- Stats must be realistic and relevant to the industry
- Colors should match the industry (tech = blue/indigo, health = green/teal, food = warm/amber, etc.)
- Output ONLY the JSON — no markdown fences, no explanation, no commentary`;

        const response = await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 4096,
          system: customizationPrompt,
          messages: [
            {
              role: "user",
              content: `Business description: ${prompt.trim()}`,
            },
          ],
        });

        const text =
          response.content.find(
            (b: Anthropic.ContentBlock) => b.type === "text"
          )?.text || "";

        // Parse the customization JSON
        try {
          const firstBrace = text.indexOf("{");
          const lastBrace = text.lastIndexOf("}");
          if (firstBrace === -1 || lastBrace <= firstBrace) {
            throw new Error("No JSON object found in AI response");
          }

          const customization = JSON.parse(
            text.slice(firstBrace, lastBrace + 1)
          );

          // Send customization data so the frontend can apply it to the scaffold
          send({ type: "customization", data: customization });

          // Also send updated files with colors applied if provided
          if (customization.colors?.primary || customization.colors?.bg) {
            const updatedFiles = registry.buildFromPrompt(prompt.trim(), {
              brandName: customization.brandName,
              primaryColor: customization.colors?.primary,
              bgColor: customization.colors?.bg,
            });
            send({
              type: "scaffold-update",
              files: updatedFiles.files,
            });
          }

          send({
            type: "status",
            message: "Content customized — site ready",
          });
        } catch (customizeErr) {
          // Customization failed — scaffold still works but tell the user honestly
          const errMsg = customizeErr instanceof Error ? customizeErr.message : "Unknown error";
          console.error("[react-stream] AI customization failed:", errMsg);
          send({
            type: "status",
            message:
              `AI customization encountered an issue (${errMsg.slice(0, 80)}). Scaffold loaded — you can customize manually via the editor.`,
          });
        }

        // Track usage
        trackUsage(auth.user!.email, "generation").catch(() => {});
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Generation failed";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", message })}\n\n`
          )
        );
      }

      // Always close cleanly
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
      );
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
