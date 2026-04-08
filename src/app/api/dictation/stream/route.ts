import { transcribeAudio, isDeepgramAvailable } from "@/lib/deepgram";

export const runtime = "edge";

const MAX_BYTES = 25 * 1024 * 1024;

function sse(data: Record<string, unknown>): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: Request): Promise<Response> {
  if (!isDeepgramAvailable()) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "AI Dictation streaming is not configured. DEEPGRAM_API_KEY env var is missing.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  const mime = (req.headers.get("content-type") ?? "audio/webm").split(";")[0].trim().toLowerCase();
  const body = req.body;
  if (!body) {
    return new Response(JSON.stringify({ ok: false, error: "No request body." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (obj: Record<string, unknown>) => controller.enqueue(encoder.encode(sse(obj)));

      try {
        send({ type: "start" });

        const reader = body.getReader();
        const chunks: Uint8Array[] = [];
        let total = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            total += value.byteLength;
            if (total > MAX_BYTES) {
              send({ type: "error", error: "Audio exceeds 25MB limit." });
              controller.close();
              return;
            }
            chunks.push(value);
            send({ type: "interim", bytes: total });
          }
        }

        const merged = new Uint8Array(total);
        let offset = 0;
        for (const c of chunks) {
          merged.set(c, offset);
          offset += c.byteLength;
        }

        const result = await transcribeAudio(merged, mime);
        send({ type: "final", text: result.text, confidence: result.confidence, duration: result.duration });
        send({ type: "done" });
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Streaming transcription failed";
        controller.enqueue(new TextEncoder().encode(sse({ type: "error", error: message })));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
