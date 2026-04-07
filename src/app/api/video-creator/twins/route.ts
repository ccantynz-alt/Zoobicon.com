import { NextRequest } from "next/server";

export const maxDuration = 300;
export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/*  4-model fallback chains (Law 9 — Replicate models are volatile)   */
/* ------------------------------------------------------------------ */

const VOICE_MODELS = [
  "jaaari/kokoro-82m",
  "lucataco/xtts-v2",
  "chenxwh/openvoice",
  "cjwbw/seamless_communication",
];

const FACE_ANIMATION_MODELS = [
  "cjwbw/sadtalker",
  "lucataco/sadtalker",
  "cudanexus/wav2lip",
  "devxpy/cog-wav2lip",
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getReplicateToken(): string | null {
  return (
    process.env.REPLICATE_API_TOKEN ||
    process.env.REPLICATE_API_KEY ||
    process.env.REPLICATE_TOKEN ||
    process.env.REPLICATE_KEY ||
    null
  );
}

interface TwinsRequest {
  image: string;     // base64 data URL
  script: string;
  voiceStyle: string;
}

function validate(
  body: unknown
): { ok: true; req: TwinsRequest } | { ok: false; error: string } {
  if (!body || typeof body !== "object")
    return { ok: false, error: "Body must be a JSON object" };

  const b = body as Record<string, unknown>;

  if (typeof b.image !== "string" || !b.image)
    return { ok: false, error: "image is required (base64 data URL)" };

  if (typeof b.script !== "string" || b.script.trim().length < 1)
    return { ok: false, error: "script is required (1-500 characters)" };

  if (b.script.length > 500)
    return { ok: false, error: "script must be 500 characters or fewer" };

  return {
    ok: true,
    req: {
      image: b.image,
      script: b.script.trim(),
      voiceStyle: typeof b.voiceStyle === "string" ? b.voiceStyle : "professional",
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Replicate call with fallback chain                                 */
/* ------------------------------------------------------------------ */

async function callReplicateWithFallback(
  models: string[],
  input: Record<string, unknown>,
  token: string
): Promise<{ output: unknown; model: string }> {
  for (const model of models) {
    try {
      const createRes = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ version: model, input }),
      });

      if (!createRes.ok) {
        const errBody = await createRes.text().catch(() => "");
        console.warn(`Replicate model ${model} failed (${createRes.status}): ${errBody}`);
        continue;
      }

      const prediction = (await createRes.json()) as {
        id: string;
        status: string;
        output?: unknown;
        error?: string;
      };

      // Poll for completion (max 120 seconds)
      const deadline = Date.now() + 120_000;
      let current = prediction;
      while (
        current.status !== "succeeded" &&
        current.status !== "failed" &&
        Date.now() < deadline
      ) {
        await new Promise((r) => setTimeout(r, 2000));
        const pollRes = await fetch(
          `https://api.replicate.com/v1/predictions/${current.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (pollRes.ok) {
          current = (await pollRes.json()) as typeof prediction;
        }
      }

      if (current.status === "succeeded" && current.output) {
        return { output: current.output, model };
      }

      console.warn(`Replicate model ${model} result: ${current.status} — ${current.error || "timeout"}`);
    } catch (err) {
      console.warn(`Replicate model ${model} exception:`, err);
    }
  }

  throw new Error("All models in the fallback chain failed. Please try again later.");
}

/* ------------------------------------------------------------------ */
/*  POST handler                                                       */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const v = validate(body);
  if (!v.ok) {
    return Response.json({ ok: false, error: v.error }, { status: 400 });
  }

  const token = getReplicateToken();

  // If no Replicate token, return simulated response (dev/preview mode)
  if (!token) {
    await new Promise((r) => setTimeout(r, 2000));
    return Response.json({
      ok: true,
      videoUrl: "/placeholder-twin-video.mp4",
      status: "simulated",
      message:
        "REPLICATE_API_TOKEN not configured. This is a simulated response. Set the token in Vercel environment variables for real AI Twin generation.",
      pipeline: "simulated",
      voiceModel: "none",
      faceModel: "none",
    });
  }

  try {
    // Step 1: Generate voice audio from script
    const voiceResult = await callReplicateWithFallback(
      VOICE_MODELS,
      {
        text: v.req.script,
        speaker: v.req.voiceStyle === "energetic" ? "en_speaker_6" : "en_speaker_0",
      },
      token
    );

    const audioUrl =
      typeof voiceResult.output === "string"
        ? voiceResult.output
        : Array.isArray(voiceResult.output)
        ? (voiceResult.output[0] as string)
        : null;

    if (!audioUrl) {
      throw new Error("Voice generation returned no audio URL");
    }

    // Step 2: Lip-sync face animation with the audio
    const faceResult = await callReplicateWithFallback(
      FACE_ANIMATION_MODELS,
      {
        source_image: v.req.image,
        driven_audio: audioUrl,
        still: true,
        preprocess: "crop",
      },
      token
    );

    const videoUrl =
      typeof faceResult.output === "string"
        ? faceResult.output
        : Array.isArray(faceResult.output)
        ? (faceResult.output[0] as string)
        : null;

    if (!videoUrl) {
      throw new Error("Face animation returned no video URL");
    }

    return Response.json({
      ok: true,
      videoUrl,
      status: "completed",
      pipeline: "fish-speech-sadtalker",
      voiceModel: voiceResult.model,
      faceModel: faceResult.model,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  GET — health check                                                 */
/* ------------------------------------------------------------------ */

export async function GET() {
  return Response.json({
    ok: true,
    available: !!getReplicateToken(),
    models: {
      voice: VOICE_MODELS,
      faceAnimation: FACE_ANIMATION_MODELS,
    },
    pricing: {
      perVideo: "$0.50",
      freeCredits: 3,
    },
  });
}
