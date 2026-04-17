/**
 * POST /api/generate/pipeline-stream
 *
 * Streams the 7-agent pipeline via SSE so the builder UI can show
 * which agent is running and approximate progress.
 *
 * Event types:
 *   status   { message, agent?, phase?, progress? }
 *   done     { html, agents, totalDuration, pipeline: true }
 *   error    { message, hint }
 *
 * Partial failure handling: if an enhancement agent (SEO, Animation) fails,
 * the pipeline continues with the remaining agents. Only a Developer agent
 * failure is fatal.
 */

import { NextRequest } from "next/server";
import { runPipeline, type PipelineInput } from "@/lib/agents";

export const maxDuration = 300;

interface SSEWriter {
  send: (event: string, data: unknown) => void;
  close: () => void;
}

function makeWriter(controller: ReadableStreamDefaultController<Uint8Array>): SSEWriter {
  const encoder = new TextEncoder();
  let closed = false;
  return {
    send(_event, data) {
      if (closed) return;
      const payload =
        data && typeof data === "object" && !Array.isArray(data)
          ? (data as Record<string, unknown>)
          : { data };
      const sse = `data: ${JSON.stringify(payload)}\n\n`;
      try {
        controller.enqueue(encoder.encode(sse));
      } catch {
        closed = true;
      }
    },
    close() {
      if (closed) return;
      closed = true;
      try {
        controller.close();
      } catch {
        /* already closed */
      }
    },
  };
}

const AGENT_WEIGHTS: Record<string, { start: number; end: number }> = {
  strategist: { start: 0, end: 5 },
  brand: { start: 5, end: 15 },
  copywriter: { start: 5, end: 15 },
  architect: { start: 5, end: 15 },
  developer: { start: 15, end: 80 },
  seo: { start: 80, end: 95 },
  animation: { start: 80, end: 95 },
};

export async function POST(req: NextRequest): Promise<Response> {
  let body: { prompt?: string; style?: string; tier?: string; model?: string; generatorType?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }

  const prompt = (body.prompt ?? "").trim();
  if (!prompt) {
    return new Response(
      JSON.stringify({ error: "prompt is required" }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const writer = makeWriter(controller);
      try {
        const pipelineInput: PipelineInput = {
          prompt,
          style: (body.style as PipelineInput["style"]) || undefined,
          tier: (body.tier as PipelineInput["tier"]) || "standard",
          model: body.model || undefined,
          generatorType: body.generatorType || undefined,
        };

        const result = await runPipeline(pipelineInput, (agent, status) => {
          const weights = AGENT_WEIGHTS[agent] || { start: 50, end: 60 };
          const progress = Math.round((weights.start + weights.end) / 2);
          writer.send("status", {
            type: "status",
            message: `${agent}: ${status}`,
            agent,
            phase: agent,
            progress,
          });
        });

        writer.send("status", {
          type: "status",
          message: "Pipeline complete",
          progress: 100,
        });

        writer.send("done", {
          type: "done",
          html: result.html,
          agents: result.agents.map((a) => ({
            name: a.agent,
            duration: a.duration,
          })),
          totalDuration: result.totalDuration,
          pipeline: true,
          agentCount: result.agents.length,
          ...(result.reactComponents ? { reactComponents: result.reactComponents } : {}),
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        let hint = "Check server logs for details.";
        if (message.includes("API_KEY") || message.includes("api key")) {
          hint = "Set ANTHROPIC_API_KEY in Vercel environment variables.";
        } else if (message.includes("rate") || message.includes("429")) {
          hint = "Rate limit hit. Wait 30s and try again.";
        } else if (message.includes("timeout")) {
          hint = "Pipeline timed out. Retry — the model may be overloaded.";
        }
        writer.send("error", { type: "error", message, hint });
      } finally {
        writer.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-store",
      connection: "keep-alive",
    },
  });
}
