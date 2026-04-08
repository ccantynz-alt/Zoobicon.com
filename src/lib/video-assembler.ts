/**
 * Zoobicon Video Assembler
 *
 * Self-contained post-production pipeline for the Zoobicon video stack:
 *   - assembleScenes()    — concatenate multiple scene clips into one MP4
 *   - burnInCaptions()    — burn SRT subtitles into a video (broadcast style)
 *   - mixBackgroundMusic()— duck a music track under existing audio
 *
 * All operations run on Replicate via raw fetch (no SDK, no extra deps).
 * Each operation uses a fallback chain because Replicate models are volatile
 * (CLAUDE.md rule 32). No imports from video-pipeline.ts or video-render.ts —
 * this module is intentionally standalone to avoid circular deps.
 */

const REPLICATE_API = "https://api.replicate.com/v1";

export interface AssembledScene {
  videoUrl: string;
  duration: number;
  sceneNumber: number;
}

function getReplicateToken(): string {
  const token =
    process.env.REPLICATE_API_TOKEN ||
    process.env.REPLICATE_API_KEY ||
    process.env.REPLICATE_TOKEN ||
    process.env.REPLICATE_KEY;
  if (!token) {
    throw new Error(
      "REPLICATE_API_TOKEN is not set — video assembly requires Replicate access."
    );
  }
  return token;
}

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function extractOutputUrl(data: Record<string, unknown>): string | null {
  const out = data.output;
  if (typeof out === "string") return out;
  if (Array.isArray(out)) {
    const first = out[0];
    return typeof first === "string" ? first : null;
  }
  if (out && typeof out === "object") {
    const o = out as Record<string, unknown>;
    for (const k of ["video", "output", "url", "file"]) {
      const v = o[k];
      if (typeof v === "string") return v;
    }
  }
  return null;
}

/**
 * Poll a Replicate prediction until it succeeds, fails, or times out.
 * Default: 2s interval, 5min timeout (150 attempts).
 */
async function pollPrediction(
  getUrl: string,
  token: string,
  maxAttempts = 150,
  intervalMs = 2000
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));
    const res = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) continue;
    const data = (await res.json()) as Record<string, unknown>;
    const status = data.status as string | undefined;
    if (status === "succeeded") {
      const url = extractOutputUrl(data);
      if (!url) throw new Error("Replicate succeeded but returned no output URL.");
      return url;
    }
    if (status === "failed" || status === "canceled") {
      const err = (data.error as string) || "Replicate prediction failed.";
      throw new Error(err);
    }
  }
  throw new Error("Replicate prediction timed out after 5 minutes.");
}

/**
 * Create a prediction on Replicate with model-endpoint → version-endpoint fallback.
 */
async function createPrediction(
  modelPath: string,
  input: Record<string, unknown>,
  token: string
): Promise<{ getUrl: string }> {
  const headers = authHeaders(token);

  let res = await fetch(
    `${REPLICATE_API}/models/${modelPath}/predictions`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ input }),
    }
  );

  if (res.status === 404 || res.status === 422) {
    const info = await fetch(`${REPLICATE_API}/models/${modelPath}`, { headers });
    if (info.ok) {
      const meta = (await info.json()) as Record<string, unknown>;
      const latest = meta.latest_version as { id?: string } | undefined;
      const version = latest?.id;
      if (version) {
        res = await fetch(`${REPLICATE_API}/predictions`, {
          method: "POST",
          headers,
          body: JSON.stringify({ version, input }),
        });
      }
    }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Replicate ${modelPath} ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as Record<string, unknown>;
  const urls = data.urls as { get?: string } | undefined;
  if (!urls?.get) throw new Error(`Replicate ${modelPath} returned no polling URL.`);
  return { getUrl: urls.get };
}

/**
 * Try a chain of models in order. First success wins.
 */
async function runWithFallback(
  models: Array<{ name: string; modelPath: string; input: Record<string, unknown> }>,
  token: string
): Promise<string> {
  let lastError = "";
  for (const m of models) {
    try {
      console.log(`[video-assembler] Trying ${m.name} (${m.modelPath})...`);
      const { getUrl } = await createPrediction(m.modelPath, m.input, token);
      const url = await pollPrediction(getUrl, token);
      console.log(`[video-assembler] ${m.name} succeeded.`);
      return url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[video-assembler] ${m.name} failed: ${msg}`);
      lastError = `${m.name}: ${msg}`;
    }
  }
  throw new Error(`All models failed. Last error: ${lastError}`);
}

/**
 * Concatenate ordered scene clips into a single MP4.
 * Fallback chain: ffmpeg-concat → video-merger → meta ffmpeg → fofr toolkit.
 */
export async function assembleScenes(scenes: AssembledScene[]): Promise<string> {
  if (!scenes || scenes.length === 0) {
    throw new Error("assembleScenes: no scenes provided.");
  }
  if (scenes.length === 1) return scenes[0].videoUrl;

  const token = getReplicateToken();
  const ordered = [...scenes].sort((a, b) => a.sceneNumber - b.sceneNumber);
  const urls = ordered.map((s) => s.videoUrl);

  return runWithFallback(
    [
      {
        name: "lucataco/ffmpeg-concat",
        modelPath: "lucataco/ffmpeg-concat",
        input: { videos: urls },
      },
      {
        name: "fofr/video-merger",
        modelPath: "fofr/video-merger",
        input: { videos: urls },
      },
      {
        name: "meta/ffmpeg",
        modelPath: "meta/ffmpeg",
        input: {
          inputs: urls,
          command: `-f concat -safe 0 -i concat.txt -c copy output.mp4`,
        },
      },
      {
        name: "fofr/toolkit",
        modelPath: "fofr/toolkit",
        input: { task: "concat-videos", videos: urls },
      },
    ],
    token
  );
}

/**
 * Burn SRT captions into a video. White text, 4px black outline, sans-serif,
 * bottom-center with 5% margin.
 */
export async function burnInCaptions(videoUrl: string, srt: string): Promise<string> {
  if (!srt || srt.trim().length === 0) return videoUrl;
  const token = getReplicateToken();

  const subtitleStyle =
    "FontName=Arial,FontSize=22,PrimaryColour=&HFFFFFF&,OutlineColour=&H000000&," +
    "BorderStyle=1,Outline=4,Shadow=0,Alignment=2,MarginV=40";

  return runWithFallback(
    [
      {
        name: "fictions-ai/autocaption",
        modelPath: "fictions-ai/autocaption",
        input: {
          video_file_input: videoUrl,
          subtitles: srt,
          font: "Arial",
          color: "white",
          stroke_color: "black",
          stroke_width: 4,
          position: "bottom",
        },
      },
      {
        name: "meta/ffmpeg",
        modelPath: "meta/ffmpeg",
        input: {
          inputs: [videoUrl],
          subtitles: srt,
          command: `-i input.mp4 -vf "subtitles=subs.srt:force_style='${subtitleStyle}'" -c:a copy output.mp4`,
        },
      },
      {
        name: "fofr/toolkit",
        modelPath: "fofr/toolkit",
        input: {
          task: "burn-subtitles",
          video: videoUrl,
          srt,
          style: subtitleStyle,
        },
      },
      {
        name: "lucataco/ffmpeg-concat",
        modelPath: "lucataco/ffmpeg-concat",
        input: {
          videos: [videoUrl],
          subtitles: srt,
        },
      },
    ],
    token
  );
}

/**
 * Mix a background music track under the existing video audio.
 * @param musicVolume linear volume for the music (default 0.18 ≈ -15dB).
 */
export async function mixBackgroundMusic(
  videoUrl: string,
  musicUrl: string,
  musicVolume = 0.18
): Promise<string> {
  if (!musicUrl) return videoUrl;
  const token = getReplicateToken();

  const filterGraph =
    `[1:a]volume=${musicVolume}[m];` +
    `[0:a][m]amix=inputs=2:duration=first:dropout_transition=2[aout]`;

  return runWithFallback(
    [
      {
        name: "meta/ffmpeg",
        modelPath: "meta/ffmpeg",
        input: {
          inputs: [videoUrl, musicUrl],
          command:
            `-i input0.mp4 -i input1.mp3 -filter_complex "${filterGraph}" ` +
            `-map 0:v -map "[aout]" -c:v copy -shortest output.mp4`,
        },
      },
      {
        name: "fofr/toolkit",
        modelPath: "fofr/toolkit",
        input: {
          task: "mix-audio",
          video: videoUrl,
          audio: musicUrl,
          music_volume: musicVolume,
        },
      },
      {
        name: "lucataco/ffmpeg-concat",
        modelPath: "lucataco/ffmpeg-concat",
        input: {
          videos: [videoUrl],
          audio: musicUrl,
          music_volume: musicVolume,
        },
      },
    ],
    token
  );
}
