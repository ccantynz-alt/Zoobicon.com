import { NextRequest } from "next/server";
import { generateTwinVideo, type TwinRequest } from "@/lib/ai-twins";

export const maxDuration = 300;
export const runtime = "nodejs";

const VOICE_MODELS = [
  "lucataco/xtts-v2",
  "cjwbw/seamless_communication",
  "chenxwh/openvoice",
  "jaaari/kokoro-82m",
];
const LIPSYNC_MODELS = [
  "cjwbw/sadtalker",
  "lucataco/sadtalker",
  "cudanexus/wav2lip",
  "devxpy/cog-wav2lip",
];

export async function GET() {
  return new Response(
    JSON.stringify({
      ok: true,
      available: !!(
        process.env.REPLICATE_API_TOKEN ||
        process.env.REPLICATE_API_KEY ||
        process.env.REPLICATE_TOKEN ||
        process.env.REPLICATE_KEY
      ),
      models: { voice: VOICE_MODELS, lipsync: LIPSYNC_MODELS },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

function validate(body: unknown): { ok: true; req: TwinRequest } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Body must be a JSON object" };
  const b = body as Record<string, unknown>;
  const faceImageUrl = b.faceImageUrl;
  const script = b.script;
  if (typeof faceImageUrl !== "string" || !faceImageUrl.trim()) {
    return { ok: false, error: "faceImageUrl is required (string)" };
  }
  if (!/^(https?:\/\/|data:)/i.test(faceImageUrl)) {
    return { ok: false, error: "faceImageUrl must be an http(s) URL or data: URL" };
  }
  if (typeof script !== "string" || script.trim().length < 1 || script.length > 2000) {
    return { ok: false, error: "script is required (1-2000 characters)" };
  }
  const req: TwinRequest = {
    faceImageUrl,
    script,
    voiceCloneAudioUrl: typeof b.voiceCloneAudioUrl === "string" ? b.voiceCloneAudioUrl : undefined,
    voiceStyle:
      b.voiceStyle === "professional" ||
      b.voiceStyle === "warm" ||
      b.voiceStyle === "energetic" ||
      b.voiceStyle === "calm"
        ? b.voiceStyle
        : undefined,
    background: typeof b.background === "string" ? b.background : undefined,
    format:
      b.format === "portrait" || b.format === "landscape" || b.format === "square"
        ? b.format
        : "portrait",
  };
  return { ok: true, req };
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const v = validate(body);
  if (!v.ok) {
    return new Response(JSON.stringify({ error: v.error }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const wantsSSE = (request.headers.get("accept") || "").includes("text/event-stream");

  if (wantsSSE) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (obj: unknown) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        };
        try {
          const result = await generateTwinVideo(v.req, (s) =>
            send({ type: "progress", ...s })
          );
          send({ type: "done", ok: true, ...result });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          send({ type: "error", ok: false, error: msg });
        } finally {
          controller.close();
        }
      },
    });
    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  try {
    const result = await generateTwinVideo(v.req);
    return new Response(JSON.stringify({ ok: true, ...result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
