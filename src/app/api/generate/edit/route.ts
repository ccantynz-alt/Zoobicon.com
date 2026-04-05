import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 120;

/**
 * POST /api/generate/edit
 *
 * Diff-based editing: change ONE thing without regenerating the whole site.
 * This is what makes Bolt.new fast — they send diffs, not full regenerations.
 *
 * Body: {
 *   instruction: string,       // "change the header color to blue"
 *   files: Record<string,string>, // current file contents
 *   targetFile?: string,       // optional: which file to edit
 * }
 *
 * Returns: { files: Record<string,string> } — only the CHANGED files
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "AI service unavailable" }, { status: 503 });
  }

  const body = await req.json();
  const { instruction, files, targetFile } = body;

  if (!instruction || !files) {
    return Response.json({ error: "Instruction and files required" }, { status: 400 });
  }

  const client = new Anthropic({ apiKey, timeout: 60000 });

  // Build context: show the AI which files exist and their content
  const fileList = Object.keys(files);
  const fileContext = targetFile && files[targetFile]
    ? `TARGET FILE (${targetFile}):\n\`\`\`\n${files[targetFile]}\n\`\`\``
    : fileList.map(f => `FILE: ${f}\n\`\`\`\n${files[f]}\n\`\`\``).join("\n\n");

  const systemPrompt = `You are a code editor. You receive existing React/TypeScript files and an instruction to modify them.

RULES:
- Output ONLY a JSON object with the CHANGED files: { "files": { "path": "new content" } }
- Only include files that CHANGED — do not output unchanged files
- Preserve all existing functionality — only change what was asked
- Keep the same coding style, imports, and structure
- If the change affects multiple files (e.g. adding a new section), include all affected files
- Start with { and end with } — no markdown, no explanation`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        send({ type: "status", message: "Applying changes..." });

        const response = await client.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 8192,
          system: systemPrompt,
          messages: [{
            role: "user",
            content: `INSTRUCTION: ${instruction}\n\nEXISTING FILES:\n${fileContext}\n\nOutput only the changed files as JSON.`,
          }],
        });

        const text = response.content.find(b => b.type === "text")?.text || "";
        const jsonStart = text.indexOf("{");
        const jsonEnd = text.lastIndexOf("}");

        if (jsonStart === -1 || jsonEnd <= jsonStart) {
          send({ type: "error", message: "Failed to apply changes. Please try again." });
          controller.close();
          return;
        }

        const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));

        if (parsed.files && Object.keys(parsed.files).length > 0) {
          send({
            type: "done",
            files: parsed.files,
            changedCount: Object.keys(parsed.files).length,
          });
        } else {
          send({ type: "error", message: "No changes were needed for that instruction." });
        }
      } catch (err) {
        send({ type: "error", message: "Failed to apply changes. Please try again." });
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
