import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { authenticateRequest } from "@/lib/auth-guard";
import {
  callLLMWithFailover,
  describeLLMError,
  getAvailableProviders,
  isTransientLLMError,
} from "@/lib/llm-provider";

export const maxDuration = 120;

/**
 * POST /api/generate/edit
 *
 * Diff-based editing: change ONE thing without regenerating the whole site.
 * Sends current files + instruction → AI returns only CHANGED files.
 *
 * Body: {
 *   instruction: string,
 *   files: Record<string,string>,
 *   targetFile?: string,
 * }
 *
 * Returns SSE: { files: Record<string,string> } — only the CHANGED files
 */
export async function POST(req: NextRequest) {
  const editStartedAt = Date.now();
  const auth = await authenticateRequest(req, { requireAuth: true, requireVerified: true });
  if (auth.error) return auth.error;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const availableProviders = getAvailableProviders();
  if (!apiKey && availableProviders.length === 0) {
    return Response.json(
      {
        error:
          "AI service unavailable — set ANTHROPIC_API_KEY (or OPENAI_API_KEY / GOOGLE_AI_API_KEY) in your Vercel environment variables.",
      },
      { status: 503 }
    );
  }

  let body: { instruction?: string; files?: Record<string, string>; targetFile?: string; conversationContext?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { instruction, files, targetFile, conversationContext } = body;

  if (!instruction || !files || Object.keys(files).length === 0) {
    return Response.json({ error: "Instruction and files required" }, { status: 400 });
  }

  // ── FLYWHEEL: load accumulated context from previous builds ──
  let flywheelContext = "";
  try {
    const { getMemories } = await import("@/lib/flywheel");
    const memories = await getMemories();
    const relevant = memories
      .filter((m) => m.type === "preference" || m.type === "brand" || m.type === "context")
      .slice(0, 10);
    if (relevant.length > 0) {
      const lines = relevant.map((m) => `- [${m.type}] ${m.content}`);
      let joined = lines.join("\n");
      if (joined.length > 500) {
        joined = joined.slice(0, 497) + "...";
      }
      flywheelContext = `\n\nContext from previous builds:\n${joined}\n`;
    }
  } catch (flywheelErr) {
    console.warn("[edit] Flywheel context load skipped:", flywheelErr);
  }

  // The Anthropic SDK is the primary path. The failover layer
  // (callLLMWithFailover) handles OpenAI/Gemini if Anthropic is down.
  // maxRetries:0 because we do our own classified retry below so we can
  // distinguish transient TLS flakes from fatal errors and surface them
  // cleanly (no raw openssl stack traces to Gate Test consumers).
  const client = new Anthropic({ apiKey: apiKey || "missing", timeout: 60000, maxRetries: 0 });

  // Retry a single SDK call 3x with jitter for transient network/TLS faults.
  // Non-transient (auth, 400) bubbles up on the first try.
  const callWithRetry = async <T>(fn: () => Promise<T>, label: string): Promise<T> => {
    let lastErr: unknown;
    for (let i = 0; i < 3; i++) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        if (!isTransientLLMError(err) || i === 2) throw err;
        const delay = 400 * Math.pow(2, i) + Math.floor(Math.random() * 250);
        console.warn(`[edit:${label}] attempt ${i + 1}/3 failed (${describeLLMError(err)}), retrying in ${delay}ms`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    throw lastErr;
  };

  // Build context: show the AI which files exist and their content
  const fileList = Object.keys(files);

  // Smart context: if targetFile specified, show it fully + summaries for others
  // If no target, show all files but truncate very large ones
  let fileContext: string;
  if (targetFile && files[targetFile]) {
    const otherFiles = fileList.filter(f => f !== targetFile);
    const otherSummaries = otherFiles.map(f => {
      const content = files[f];
      // Show first 500 chars of other files for context
      const preview = content.length > 500 ? content.slice(0, 500) + "\n// ... truncated" : content;
      return `FILE: ${f}\n\`\`\`\n${preview}\n\`\`\``;
    }).join("\n\n");
    fileContext = `TARGET FILE (${targetFile}):\n\`\`\`\n${files[targetFile]}\n\`\`\`\n\n${otherSummaries ? `OTHER FILES:\n${otherSummaries}` : `Other files: ${otherFiles.join(", ")}`}`;
  } else {
    const MAX_FILE_CHARS = 4000;
    fileContext = fileList.map(f => {
      const content = files[f];
      const truncated = content.length > MAX_FILE_CHARS
        ? content.slice(0, MAX_FILE_CHARS) + `\n// ... (${content.length - MAX_FILE_CHARS} more chars truncated)`
        : content;
      return `FILE: ${f}\n\`\`\`\n${truncated}\n\`\`\``;
    }).join("\n\n");
  }

  const systemPrompt = `You are a code editor. You receive existing React/TypeScript files and an instruction to modify them.

RULES:
- Output ONLY a JSON object with the CHANGED files: { "files": { "path": "new content" } }
- Only include files that CHANGED — do not output unchanged files
- Preserve all existing functionality — only change what was asked
- Keep the same coding style, imports, and structure
- If the change affects multiple files (e.g. adding a new section), include all affected files
- Output the COMPLETE file content for each changed file (not a diff/patch)
- Do NOT wrap the JSON in markdown code fences
- Do NOT include any text before or after the JSON object
- Start your response with { and end with }${flywheelContext}${conversationContext ? `\n\nPrevious edits in this session (use this to understand context and maintain consistency):\n${conversationContext}` : ""}`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Helper: record a successful edit in the flywheel (non-blocking, non-fatal)
      const recordEditInFlywheel = async (modelUsed: string) => {
        try {
          const { saveBuild } = await import("@/lib/flywheel");
          await saveBuild({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            prompt: `[edit] ${instruction}`,
            siteName: targetFile || "Untitled",
            model: modelUsed,
            durationMs: Date.now() - editStartedAt,
            createdAt: Date.now(),
          });
        } catch (flywheelErr) {
          console.warn("[edit] Flywheel build save skipped:", flywheelErr);
        }
      };

      try {
        send({ type: "status", message: "Applying changes..." });

        const userMessage = `INSTRUCTION: ${instruction}\n\nEXISTING FILES:\n${fileContext}\n\nOutput only the changed files as JSON. Start with { and end with }.`;

        // Validate parsed AI output. Returns the validated file map or
        // { reason } when the response is missing/empty/invalid.
        const validate = (
          text: string
        ):
          | { ok: true; files: Record<string, string> }
          | { ok: false; reason: string } => {
          if (!text || !text.trim()) {
            return { ok: false, reason: "AI returned empty response" };
          }
          const parsed = extractJSON(text);
          if (!parsed) {
            return { ok: false, reason: "AI response was not valid JSON" };
          }
          if (!parsed.files) {
            return { ok: false, reason: "AI response missing 'files' key" };
          }
          const validFiles: Record<string, string> = {};
          for (const [path, code] of Object.entries(parsed.files)) {
            if (typeof code === "string" && code.trim().length > 10) {
              validFiles[path] = code;
            }
          }
          if (Object.keys(validFiles).length === 0) {
            return { ok: false, reason: "AI returned empty or invalid file contents" };
          }
          return { ok: true, files: validFiles };
        };

        const errors: string[] = [];

        // Pass 1 — Sonnet 4.6 (default for diff edits — fast enough for 2-5s
        // tweaks, smart enough to keep the file structure intact). Rule 4
        // mandates Opus for the developer agent (full builds); diff edits are
        // surgical patches where Sonnet is the right tool. Haiku is forbidden
        // here — it routinely produced broken JSX on multi-section edits.
        if (apiKey) {
          try {
            const response = await callWithRetry(
              () =>
                client.messages.create({
                  model: "claude-sonnet-4-6",
                  max_tokens: 16384,
                  system: systemPrompt,
                  messages: [{ role: "user", content: userMessage }],
                }),
              "sonnet"
            );
            const text = response.content.find((b: Anthropic.ContentBlock) => b.type === "text")?.text || "";
            const result = validate(text);
            if (result.ok) {
              send({
                type: "done",
                files: result.files,
                changedCount: Object.keys(result.files).length,
                modelUsed: "claude-sonnet-4-6",
              });
              await recordEditInFlywheel("claude-sonnet-4-6");
              controller.close();
              return;
            }
            errors.push(`Sonnet: ${result.reason}`);
            send({ type: "status", message: "Retrying with Opus 4.7..." });
          } catch (err) {
            const clean = describeLLMError(err);
            errors.push(`Sonnet: ${clean}`);
            console.warn(`[edit] Sonnet call failed: ${clean}`);
            send({ type: "status", message: "Retrying with Opus 4.7..." });
          }
        }

        // Pass 2 — Opus 4.7 (developer agent — same model used for full builds).
        // Slower but unmatched on complex multi-file edits.
        if (apiKey) {
          try {
            const response = await callWithRetry(
              () =>
                client.messages.create({
                  model: "claude-opus-4-7",
                  max_tokens: 16384,
                  system: systemPrompt,
                  messages: [{ role: "user", content: userMessage }],
                }),
              "opus"
            );
            const text = response.content.find((b: Anthropic.ContentBlock) => b.type === "text")?.text || "";
            const result = validate(text);
            if (result.ok) {
              send({
                type: "done",
                files: result.files,
                changedCount: Object.keys(result.files).length,
                modelUsed: "claude-opus-4-7",
              });
              await recordEditInFlywheel("claude-opus-4-7");
              controller.close();
              return;
            }
            errors.push(`Opus: ${result.reason}`);
          } catch (err) {
            const clean = describeLLMError(err);
            errors.push(`Opus: ${clean}`);
            console.warn(`[edit] Opus call failed: ${clean}`);
          }
        }

        // Pass 3 — cross-provider failover (OpenAI, Gemini). The failover
        // layer now wraps each provider call in its own transient-retry.
        try {
          send({ type: "status", message: "Trying alternate AI provider..." });
          const fb = await callLLMWithFailover({
            model: "claude-sonnet-4-6",
            system: systemPrompt,
            userMessage,
            maxTokens: 16384,
          });
          const result = validate(fb.text);
          if (result.ok) {
            send({
              type: "done",
              files: result.files,
              changedCount: Object.keys(result.files).length,
              modelUsed: fb.model,
            });
            await recordEditInFlywheel(fb.model || "unknown");
            controller.close();
            return;
          }
          errors.push(`${fb.model}: ${result.reason}`);
        } catch (err) {
          const clean = describeLLMError(err);
          errors.push(`Failover: ${clean}`);
          console.error(`[edit] Cross-provider failover failed: ${clean}`);
        }

        // Every attempt failed — surface a clean, actionable message.
        // Consumers like Craig's Gate Test tool echo this verbatim, so it
        // must NEVER contain raw openssl stack traces or provider internals.
        const summary = errors.length > 0 ? errors.join(" | ") : "No changes detected";
        const allTransient = errors.length > 0 && errors.every((e) =>
          /TLS|timed out|reset|overloaded|rate limited|5xx|DNS/i.test(e)
        );
        const guidance = allTransient
          ? "Upstream AI provider is temporarily unavailable. Wait 30-60s and retry — this is a network hiccup, not a problem with the request."
          : "Try rephrasing your instruction or being more specific about which file to change.";
        send({
          type: "error",
          fatal: true,
          retryable: allTransient,
          message: `Edit failed across all providers. ${summary}. ${guidance}`,
        });
      } catch (err) {
        const clean = describeLLMError(err);
        console.error(`[edit] Stream handler crashed: ${clean}`);
        try {
          send({
            type: "error",
            fatal: true,
            retryable: isTransientLLMError(err),
            message: `Edit failed: ${clean}. Please try again.`,
          });
        } catch { /* controller may already be closed */ }
      } finally {
        try { controller.close(); } catch { /* already closed */ }
      }
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

/**
 * Robust JSON extraction from AI responses.
 * Handles: raw JSON, markdown-fenced JSON, JSON with preamble text,
 * and nested braces.
 */
function extractJSON(text: string): { files?: Record<string, string> } | null {
  if (!text || !text.trim()) return null;

  let cleaned = text.trim();

  // Strip markdown code fences if present
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?\s*```\s*$/, "");
  cleaned = cleaned.trim();

  // Try direct parse first (best case — AI returned clean JSON)
  try {
    return JSON.parse(cleaned);
  } catch {
    // Fall through to more aggressive extraction
  }

  // Find the first { and match braces to find the complete JSON object
  const startIdx = cleaned.indexOf("{");
  if (startIdx === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;
  let endIdx = -1;

  for (let i = startIdx; i < cleaned.length; i++) {
    const ch = cleaned[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (ch === "\\") {
      escape = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        endIdx = i;
        break;
      }
    }
  }

  if (endIdx === -1) return null;

  try {
    return JSON.parse(cleaned.slice(startIdx, endIdx + 1));
  } catch {
    return null;
  }
}
