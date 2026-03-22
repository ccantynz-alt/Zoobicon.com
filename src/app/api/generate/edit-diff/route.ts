import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { callLLM } from "@/lib/llm-provider";
import { authenticateRequest, checkUsageQuota, trackUsage } from "@/lib/auth-guard";

/**
 * Diff-Based Edit API — Fast edits via search/replace blocks
 *
 * POST /api/generate/edit-diff
 *
 * Instead of rewriting 500+ lines of HTML for a small change,
 * the AI returns structured SEARCH/REPLACE blocks. The client
 * applies them instantly. This makes edits 5-10x faster.
 *
 * Returns SSE stream with:
 * - { type: "diff", search: "...", replace: "..." }  — a single search/replace
 * - { type: "done", diffCount: N }
 * - { type: "fallback", html: "..." }  — full HTML if diff approach fails
 * - { type: "error", message: "..." }
 */

export const maxDuration = 120;

const DIFF_EDIT_SYSTEM = `You are an expert website editor. Given existing HTML and an edit instruction, output ONLY the minimal changes needed as SEARCH/REPLACE blocks.

## FORMAT — Follow EXACTLY

For each change, output a block like this:

<<<SEARCH
exact text from the original HTML that needs to change
===
replacement text
>>>

## RULES
1. The SEARCH text must be an EXACT match from the original HTML — copy it character-for-character including whitespace and newlines.
2. Each SEARCH block should be the MINIMUM needed to make the change. Don't include surrounding unchanged code.
3. Include enough context in SEARCH to be unique (avoid matching multiple locations).
4. Output ONLY SEARCH/REPLACE blocks. No explanation, no commentary, no markdown.
5. If changing multiple parts of the page, output multiple blocks — one per change.
6. If changing a CSS variable, search for just that line in :root.
7. For adding new sections, search for the insertion point (e.g., the closing tag of the section before it) and replace with the original closing tag + the new section.
8. Keep replacements clean — maintain the existing indentation style.
9. If removing something, the replacement can be empty (just a blank line between === and >>>).

## EXAMPLE

User says: "Change the hero headline to 'Build Something Amazing'"

<<<SEARCH
<h1>Transform Your Digital Presence</h1>
===
<h1>Build Something Amazing</h1>
>>>

## EXAMPLE — Multiple changes

User says: "Make the primary color blue and update the CTA text"

<<<SEARCH
--color-primary: #e63946;
===
--color-primary: #2563eb;
>>>

<<<SEARCH
<a href="#contact" class="btn btn-primary">Get Started Today</a>
===
<a href="#contact" class="btn btn-primary">Start Building Now</a>
>>>

## IMPORTANT
- Output NOTHING except SEARCH/REPLACE blocks
- Each SEARCH text MUST exist verbatim in the original HTML
- Prefer small, surgical changes over large block replacements`;

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  function sendEvent(controller: ReadableStreamDefaultController, data: Record<string, unknown>) {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  }

  try {
    const { prompt, existingCode, model: requestedModel } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "Edit instruction required" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }

    if (!existingCode || typeof existingCode !== "string") {
      return new Response(JSON.stringify({ error: "Existing code required for diff edit" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }

    // Auth + usage enforcement
    const auth = await authenticateRequest(req);
    if (auth.error) return auth.error;
    const quota = await checkUsageQuota(auth.user.email, auth.user.plan, "edit");
    if (quota.error) return quota.error;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured" }), {
        status: 500, headers: { "Content-Type": "application/json" },
      });
    }

    const model = requestedModel || "claude-sonnet-4-6"; // Sonnet for fast edits
    const useMultiLLM = requestedModel && !requestedModel.startsWith("claude");

    const userMessage = `Here is the current website HTML:\n\n${existingCode}\n\n---\n\nApply this edit using SEARCH/REPLACE blocks: ${prompt}`;

    const readable = new ReadableStream({
      async start(controller) {
        try {
          let fullResponse = "";

          if (useMultiLLM) {
            const res = await callLLM({
              model,
              system: DIFF_EDIT_SYSTEM,
              userMessage,
              maxTokens: 16000,
            });
            fullResponse = res.text;
          } else {
            const client = new Anthropic({ apiKey, timeout: 60_000 });
            const stream = client.messages.stream({
              model,
              max_tokens: 16000,
              system: DIFF_EDIT_SYSTEM,
              messages: [{ role: "user", content: userMessage }],
            });

            for await (const event of stream) {
              if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
                fullResponse += event.delta.text;
              }
            }
          }

          // Parse SEARCH/REPLACE blocks
          const diffRegex = /<<<SEARCH\n([\s\S]*?)\n===\n([\s\S]*?)\n>>>/g;
          const diffs: { search: string; replace: string }[] = [];
          let match;

          while ((match = diffRegex.exec(fullResponse)) !== null) {
            diffs.push({ search: match[1], replace: match[2] });
          }

          if (diffs.length === 0) {
            // AI didn't return valid diff blocks — fall back to full rewrite
            console.warn("[Edit-Diff] No valid diff blocks found, falling back to full rewrite");

            // Try to get a full HTML rewrite instead
            const fallbackSystem = `You are an AI website editor. Apply the requested changes and return the complete, updated HTML file. Output ONLY the complete updated HTML. No markdown, no explanation, no code fences. Preserve the existing design language unless asked to change it.`;

            let fallbackHtml = "";
            if (useMultiLLM) {
              const res = await callLLM({
                model,
                system: fallbackSystem,
                userMessage: `Here is the current website HTML:\n\n${existingCode}\n\n---\n\nApply this edit: ${prompt}\n\nOutput the COMPLETE updated HTML from <!DOCTYPE html> to </html>.`,
                maxTokens: 32000,
              });
              fallbackHtml = res.text;
            } else {
              const client = new Anthropic({ apiKey, timeout: 120_000 });
              const fbStream = client.messages.stream({
                model,
                max_tokens: 32000,
                system: fallbackSystem,
                messages: [{
                  role: "user",
                  content: `Here is the current website HTML:\n\n${existingCode}\n\n---\n\nApply this edit: ${prompt}\n\nOutput the COMPLETE updated HTML from <!DOCTYPE html> to </html>.`,
                }],
              });

              for await (const event of fbStream) {
                if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
                  fallbackHtml += event.delta.text;
                }
              }
            }

            // Clean the fallback HTML
            let clean = fallbackHtml.trim();
            clean = clean.replace(/^```(?:html|HTML)?\s*\n?/, "").replace(/\n?\s*```\s*$/, "");
            const ds = clean.search(/<!doctype\s+html|<html/i);
            if (ds > 0) clean = clean.slice(ds);
            const he = clean.lastIndexOf("</html>");
            if (he !== -1) clean = clean.slice(0, he + "</html>".length);

            sendEvent(controller, { type: "fallback", html: clean });
            sendEvent(controller, { type: "done", diffCount: 0, fallback: true });
            controller.close();
            return;
          }

          // Validate and send each diff
          let applied = 0;
          for (const diff of diffs) {
            if (existingCode.includes(diff.search)) {
              sendEvent(controller, { type: "diff", search: diff.search, replace: diff.replace });
              applied++;
            } else {
              // Try fuzzy match — trim whitespace and try again
              const trimmedSearch = diff.search.trim();
              if (trimmedSearch && existingCode.includes(trimmedSearch)) {
                sendEvent(controller, { type: "diff", search: trimmedSearch, replace: diff.replace.trim() });
                applied++;
              } else {
                console.warn(`[Edit-Diff] Search text not found in HTML: "${diff.search.substring(0, 80)}..."`);
                sendEvent(controller, { type: "warning", message: `Could not find: "${diff.search.substring(0, 60)}..."` });
              }
            }
          }

          if (applied === 0) {
            // None of the diffs matched — fall back to full rewrite
            console.warn("[Edit-Diff] No diffs matched, falling back");
            sendEvent(controller, { type: "status", message: "Diffs didn't match, applying full edit..." });

            const client = new Anthropic({ apiKey, timeout: 120_000 });
            let fallbackHtml = "";
            const fbStream = client.messages.stream({
              model,
              max_tokens: 32000,
              system: `You are an AI website editor. Apply the requested changes and return the complete, updated HTML file. Output ONLY the complete updated HTML. No markdown, no code fences.`,
              messages: [{
                role: "user",
                content: `Here is the current website HTML:\n\n${existingCode}\n\n---\n\nApply this edit: ${prompt}\n\nOutput COMPLETE updated HTML.`,
              }],
            });

            for await (const event of fbStream) {
              if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
                fallbackHtml += event.delta.text;
              }
            }

            let clean = fallbackHtml.trim();
            clean = clean.replace(/^```(?:html|HTML)?\s*\n?/, "").replace(/\n?\s*```\s*$/, "");
            const ds = clean.search(/<!doctype\s+html|<html/i);
            if (ds > 0) clean = clean.slice(ds);
            const he = clean.lastIndexOf("</html>");
            if (he !== -1) clean = clean.slice(0, he + "</html>".length);

            sendEvent(controller, { type: "fallback", html: clean });
            sendEvent(controller, { type: "done", diffCount: 0, fallback: true });
            trackUsage(auth.user.email, "edit").catch((err) => console.error("[Usage] Failed to track:", err));
          } else {
            sendEvent(controller, { type: "done", diffCount: applied });
            trackUsage(auth.user.email, "edit").catch((err) => console.error("[Usage] Failed to track:", err));
          }

          controller.close();
        } catch (err) {
          const message = err instanceof Error ? err.message : "Edit error";
          sendEvent(controller, { type: "error", message });
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("Edit-diff error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
}
