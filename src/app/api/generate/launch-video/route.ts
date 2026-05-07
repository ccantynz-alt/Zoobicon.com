/**
 * POST /api/generate/launch-video
 *
 * Generates a 30-second hero launch video for a freshly-built site.
 * The cross-product moat: same prompt → site + auto-embeddable launch video.
 *
 * Pipeline:
 *   1. Build a 30-second voiceover script via Claude Haiku (claude-haiku-4-5)
 *      from the site's tagline + value proposition + brand name.
 *   2. Hand the script to generatePremiumSpokespersonVideo() which runs the
 *      Fish/ElevenLabs voice → FLUX avatar → SadTalker lip-sync chain.
 *   3. Stream progress as Server-Sent Events. The site keeps rendering even
 *      if video fails — Bible Law 8.
 *
 * Request body (JSON):
 *   {
 *     siteId?: string;
 *     tagline: string;
 *     valueProp: string;
 *     brandName?: string;
 *     brandColor?: string;
 *     voiceGender?: "female" | "male";
 *     stream?: boolean;  // default true. when false, returns single JSON.
 *   }
 *
 * SSE events emitted:
 *   step    { message }                       — narration of current phase
 *   script  { script, wordCount, durationEstimateSec, modelUsed }
 *   video   { videoUrl, durationSec, audioUrl, avatarUrl, cost, pipeline[] }
 *   done    { videoUrl, durationSec, script, siteId? }
 *   error   { message, reason, recoverable }
 *
 * Non-streaming response (when stream=false):
 *   { videoUrl, durationSec, script, audioUrl, avatarUrl, cost, pipeline[] }
 */

import type { NextRequest } from "next/server";
import {
  buildLaunchVideoScript,
  LaunchVideoScriptError,
} from "@/lib/launch-video-script";
import {
  generatePremiumSpokespersonVideo,
  isCustomPipelineAvailable,
  isReplicatePoisoned,
} from "@/lib/video-pipeline";
import type {
  PipelineStatus,
  SpokespersonVideoResult,
  VideoGenerationRequest,
} from "@/lib/video-pipeline";

export const runtime = "nodejs";
export const maxDuration = 300;

interface RequestBody {
  siteId?: string;
  tagline?: string;
  valueProp?: string;
  brandName?: string;
  brandColor?: string;
  voiceGender?: "female" | "male";
  stream?: boolean;
}

interface SSEWriter {
  send: (event: string, data: unknown) => void;
  close: () => void;
}

function makeWriter(
  controller: ReadableStreamDefaultController<Uint8Array>,
): SSEWriter {
  const encoder = new TextEncoder();
  let closed = false;
  return {
    send(event, data) {
      if (closed) return;
      const obj =
        data && typeof data === "object" && !Array.isArray(data)
          ? (data as Record<string, unknown>)
          : { data };
      const payload = { type: event, ...obj };
      try {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
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

function validateBody(raw: unknown): { ok: true; body: RequestBody } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Request body must be a JSON object" };
  }
  const body = raw as RequestBody;
  const tagline = (body.tagline || "").trim();
  const valueProp = (body.valueProp || "").trim();
  if (!tagline && !valueProp) {
    return {
      ok: false,
      error: "Either 'tagline' or 'valueProp' is required to write the launch video script",
    };
  }
  return { ok: true, body };
}

function inferBrandFromInputs(body: RequestBody): string {
  const explicit = (body.brandName || "").trim();
  if (explicit) return explicit;
  // Best-effort: take the first capitalised word of the tagline.
  const t = (body.tagline || "").trim();
  if (t) {
    const m = t.match(/[A-Z][A-Za-z0-9]{1,30}/);
    if (m) return m[0];
  }
  return "Your brand";
}

/**
 * Run the full pipeline and feed progress through `onStep`.
 * Throws on fatal errors — caller decides how to surface them.
 */
async function runPipeline(
  body: RequestBody,
  onStep: (msg: string) => void,
  onScript: (s: { script: string; wordCount: number; durationEstimateSec: number; modelUsed: string }) => void,
): Promise<{
  videoUrl: string;
  durationSec: number;
  script: string;
  audioUrl: string;
  avatarUrl: string;
  cost: number;
  pipeline: string[];
  modelUsed: string;
}> {
  // Pre-flight: Replicate must be reachable.
  if (!isCustomPipelineAvailable()) {
    throw new LaunchVideoScriptError(
      "Video pipeline is not configured. Set REPLICATE_API_TOKEN or FAL_KEY in Vercel.",
      "no_provider",
    );
  }
  const poisoned = isReplicatePoisoned();
  if (poisoned.poisoned) {
    throw new Error(
      `Video provider unavailable: ${poisoned.reason}. Rotate REPLICATE_API_TOKEN.`,
    );
  }

  const brandName = inferBrandFromInputs(body);

  onStep("Writing 30-second voiceover script…");
  const scriptResult = await buildLaunchVideoScript({
    tagline: (body.tagline || "").trim(),
    valueProp: (body.valueProp || "").trim(),
    brandName,
    brandColor: body.brandColor,
  });
  onScript(scriptResult);

  onStep("Synthesising voice and rendering spokesperson…");
  const videoReq: VideoGenerationRequest = {
    script: scriptResult.script,
    voiceGender: body.voiceGender || "female",
    voiceStyle: "professional",
    format: "landscape",
  };

  const result: SpokespersonVideoResult = await generatePremiumSpokespersonVideo(
    videoReq,
    (status: PipelineStatus) => {
      const msg = status.message?.trim();
      if (msg) onStep(msg);
    },
  );

  if (!result.videoUrl) {
    throw new Error("Video pipeline completed without producing a video URL");
  }

  return {
    videoUrl: result.videoUrl,
    durationSec: result.duration || scriptResult.durationEstimateSec,
    script: scriptResult.script,
    audioUrl: result.audioUrl,
    avatarUrl: result.avatarUrl,
    cost: result.cost,
    pipeline: result.pipeline,
    modelUsed: scriptResult.modelUsed,
  };
}

function describeError(err: unknown): { message: string; reason: string; recoverable: boolean } {
  if (err instanceof LaunchVideoScriptError) {
    return {
      message: err.message,
      reason: err.reason,
      recoverable: err.reason !== "no_provider" && err.reason !== "missing_input",
    };
  }
  if (err instanceof Error) {
    return { message: err.message, reason: "pipeline_failed", recoverable: true };
  }
  return { message: String(err), reason: "unknown", recoverable: true };
}

export async function POST(request: NextRequest): Promise<Response> {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return Response.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const validation = validateBody(body);
  if (!validation.ok) {
    return Response.json({ error: validation.error }, { status: 400 });
  }
  const wantStream = body.stream !== false;

  // ── Non-streaming branch: single JSON response ──
  if (!wantStream) {
    try {
      const out = await runPipeline(
        body,
        () => {},
        () => {},
      );
      return Response.json({
        videoUrl: out.videoUrl,
        durationSec: out.durationSec,
        script: out.script,
        audioUrl: out.audioUrl,
        avatarUrl: out.avatarUrl,
        cost: out.cost,
        pipeline: out.pipeline,
        siteId: body.siteId,
      });
    } catch (err) {
      const e = describeError(err);
      return Response.json(
        { error: e.message, reason: e.reason, recoverable: e.recoverable },
        { status: e.reason === "missing_input" ? 400 : 502 },
      );
    }
  }

  // ── Streaming branch: SSE ──
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const writer = makeWriter(controller);
      try {
        writer.send("step", { message: "Starting launch video pipeline…" });
        const out = await runPipeline(
          body,
          (msg) => writer.send("step", { message: msg }),
          (s) => writer.send("script", s),
        );
        writer.send("video", {
          videoUrl: out.videoUrl,
          durationSec: out.durationSec,
          audioUrl: out.audioUrl,
          avatarUrl: out.avatarUrl,
          cost: out.cost,
          pipeline: out.pipeline,
        });
        writer.send("done", {
          videoUrl: out.videoUrl,
          durationSec: out.durationSec,
          script: out.script,
          siteId: body.siteId,
        });
      } catch (err) {
        const e = describeError(err);
        writer.send("error", e);
      } finally {
        writer.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
