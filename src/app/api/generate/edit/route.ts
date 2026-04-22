import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { authenticateRequest } from "@/lib/auth-guard";
import { callLLMWithFailover, getAvailableProviders } from "@/lib/llm-provider";

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

  let body: { instruction?: string; files?: Record<string, string>; targetFile?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { instruction, files, targetFile } = body;

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
  const client = new Anthropic({ apiKey: apiKey || "missing", timeout: 60000 });

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
- Start your response with { and end with }${flywheelContext}`;

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

        // Pass 1 — Anthropic Haiku via direct SDK (fastest, cheapest)
        if (apiKey) {
          try {
            const response = await client.messages.create({
              model: "claude-haiku-4-5-20251001",
              max_tokens: 16384,
              system: systemPrompt,
              messages: [{ role: "user", content: userMessage }],
            });
            const text = response.content.find((b: Anthropic.ContentBlock) => b.type === "text")?.text || "";
            const result = validate(text);
            if (result.ok) {
              send({
                type: "done",
                files: result.files,
                changedCount: Object.keys(result.files).length,
                modelUsed: "claude-haiku-4-5",
              });
              await recordEditInFlywheel("claude-haiku-4-5");
              controller.close();
              return;
            }
            errors.push(`Haiku: ${result.reason}`);
            send({ type: "status", message: "Retrying with stronger model..." });
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Unknown error";
            errors.push(`Haiku: ${msg}`);
            console.warn(`[edit] Haiku call failed: ${msg}`);
            send({ type: "status", message: "Retrying with fallback provider..." });
          }
        }

        // Pass 2 — Anthropic Sonnet (smarter model, retry path)
        if (apiKey) {
          try {
            const response = await client.messages.create({
              model: "claude-sonnet-4-6",
              max_tokens: 16384,
              system: systemPrompt,
              messages: [{ role: "user", content: userMessage }],
            });
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
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Unknown error";
            errors.push(`Sonnet: ${msg}`);
            console.warn(`[edit] Sonnet call failed: ${msg}`);
          }
        }

        // Pass 3 — cross-provider failover (OpenAI, Gemini)
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
          const msg = err instanceof Error ? err.message : "Unknown error";
          errors.push(`Failover: ${msg}`);
          console.error(`[edit] Cross-provider failover failed: ${msg}`);
        }

        // Every attempt failed — surface the truth, with the actual reasons
        const summary = errors.length > 0 ? errors.join(" | ") : "No changes detected";
        send({
          type: "error",
          fatal: true,
          message: `Edit failed across all providers. ${summary}. Try rephrasing your instruction or being more specific about which file to change.`,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        console.error(`[edit] Stream handler crashed: ${msg}`);
        try {
          send({ type: "error", fatal: true, message: `Edit failed: ${msg}. Please try again.` });
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
