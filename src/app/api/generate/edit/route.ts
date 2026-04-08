import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { authenticateRequest } from "@/lib/auth-guard";

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
  const auth = await authenticateRequest(req, { requireAuth: true, requireVerified: true });
  if (auth.error) return auth.error;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "AI service unavailable — API key not configured" }, { status: 503 });
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

  const client = new Anthropic({ apiKey, timeout: 60000 });

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
- Start your response with { and end with }`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        send({ type: "status", message: "Applying changes..." });

        // Try up to 2 attempts — retry once if JSON parsing fails
        let parsed: { files?: Record<string, string> } | null = null;
        let lastError = "";

        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const response = await client.messages.create({
              model: "claude-haiku-4-5-20251001",
              max_tokens: 16384,
              system: systemPrompt,
              messages: [{
                role: "user",
                content: `INSTRUCTION: ${instruction}\n\nEXISTING FILES:\n${fileContext}\n\nOutput only the changed files as JSON. Start with { and end with }.`,
              }],
            });

            const text = response.content.find(b => b.type === "text")?.text || "";

            // Robust JSON extraction — handles markdown fences, preamble text, etc.
            parsed = extractJSON(text);

            if (parsed?.files && Object.keys(parsed.files).length > 0) {
              // Validate returned files — each must contain valid-looking code
              const validFiles: Record<string, string> = {};
              for (const [path, code] of Object.entries(parsed.files)) {
                if (typeof code === "string" && code.trim().length > 10) {
                  validFiles[path] = code;
                }
              }

              if (Object.keys(validFiles).length > 0) {
                send({
                  type: "done",
                  files: validFiles,
                  changedCount: Object.keys(validFiles).length,
                });
                controller.close();
                return;
              }
              lastError = "AI returned empty or invalid file contents";
            } else if (parsed && !parsed.files) {
              lastError = "AI response missing 'files' key";
            } else {
              lastError = "No changes detected";
            }
          } catch (err) {
            lastError = err instanceof Error ? err.message : "Unknown error";
          }

          // Before retry, add context about the failure
          if (attempt === 0) {
            send({ type: "status", message: "Retrying edit..." });
          }
        }

        // Both attempts failed
        send({
          type: "error",
          message: `Edit failed: ${lastError}. Try rephrasing your instruction or being more specific about which file to change.`,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        send({ type: "error", message: `Edit failed: ${msg}. Please try again.` });
      }

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
