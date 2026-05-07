/**
 * Hedra Character-3 — Primary lip-sync provider
 *
 * Hedra Character-3 is sub-100ms real-time avatar generation at $0.05/min,
 * 15× cheaper than HeyGen and currently #1 on quality benchmarks for
 * spokesperson-style talking-head video. The API is in private beta as of
 * April 2026; the REST endpoint at `https://api.hedra.com/web-app/public/v1`
 * accepts a Bearer token and returns a video URL.
 *
 * Bible Law 8: NO silent mocks. If `HEDRA_API_KEY` is unset OR the upstream
 * call fails for any reason, this module returns null + a clear error string
 * so callers can fall through to the Replicate chain. Callers MUST surface the
 * reason — never replace it with "video unavailable."
 *
 * Bible Law 19: This is part of OUR pipeline. We use Hedra at the cheapest
 * professional tier; we do NOT depend on it. The 5-model Replicate chain in
 * video-pipeline.ts remains the backstop and ships without HEDRA_API_KEY.
 *
 * Pricing reference (April 2026):
 *   Hedra Character-3:    $0.05 / min  (sub-100ms TTFB, up to 10-min videos)
 *   Hedra Character-2:    $0.07 / min  (legacy)
 *   HeyGen Avatar IV:     ~$0.75 / min  (15× more expensive)
 *
 * Sign up: https://www.hedra.com/api  (request private-beta access)
 */

const HEDRA_BASE = "https://api.hedra.com/web-app/public/v1";

// Hedra accepts these output resolutions on Character-3.
export type HedraResolution = "540p" | "720p" | "1080p";

export interface HedraGenerateOpts {
  audioUrl: string;
  imageUrl: string;
  resolution?: HedraResolution;
  // Optional aspect ratio override (default: 16:9). Hedra supports
  // 1:1, 9:16, 16:9 on Character-3.
  aspectRatio?: "1:1" | "9:16" | "16:9";
}

export interface HedraGenerateResult {
  videoUrl: string;
  durationSec: number;
}

// Hedra returns one of these two payload shapes during the lifecycle of a job.
interface HedraJobResponse {
  id?: string;
  job_id?: string;
  status?: "queued" | "processing" | "completed" | "failed" | "error" | string;
  video_url?: string;
  output_url?: string;
  url?: string;
  duration?: number;
  duration_seconds?: number;
  error?: string;
  message?: string;
}

/**
 * Generate a talking-head video on Hedra Character-3.
 *
 * Returns:
 *   { videoUrl, durationSec } on success, OR
 *   null when HEDRA_API_KEY is unset or any upstream step fails. The reason
 *   is logged via console.warn AND attached to the returned error string for
 *   callers that opt into the second-return-value variant below.
 *
 * Total timeout: 180s (covers Hedra's 10-minute generation cap for typical
 * 30-90s spokesperson clips while preventing the route from hanging forever).
 */
export async function generateHedraCharacter3(
  opts: HedraGenerateOpts
): Promise<HedraGenerateResult | null> {
  const apiKey = process.env.HEDRA_API_KEY;
  if (!apiKey) {
    console.warn(
      "[hedra] HEDRA_API_KEY not set — skipping Hedra Character-3 (will fall back to Replicate lip-sync chain). Sign up at https://www.hedra.com/api."
    );
    return null;
  }

  const resolution = opts.resolution ?? "720p";
  const aspectRatio = opts.aspectRatio ?? "16:9";

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  // Step 1 — submit the generation job.
  let createRes: Response;
  try {
    createRes = await fetch(`${HEDRA_BASE}/generations`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "character-3",
        avatar_image: opts.imageUrl,
        audio_source: opts.audioUrl,
        resolution,
        aspect_ratio: aspectRatio,
      }),
      signal: AbortSignal.timeout(180_000),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[hedra] generation submit failed: ${msg}`);
    return null;
  }

  if (!createRes.ok) {
    const body = await createRes.text().catch(() => "");
    console.warn(
      `[hedra] generation submit HTTP ${createRes.status} ${createRes.statusText}: ${body.slice(0, 300)}`
    );
    return null;
  }

  let createdJob: HedraJobResponse;
  try {
    createdJob = (await createRes.json()) as HedraJobResponse;
  } catch (err) {
    console.warn(
      `[hedra] generation submit returned non-JSON: ${err instanceof Error ? err.message : err}`
    );
    return null;
  }

  // Some Hedra endpoints return the finished video synchronously; honour that.
  const eagerUrl =
    createdJob.video_url || createdJob.output_url || createdJob.url || "";
  if (
    eagerUrl &&
    (createdJob.status === "completed" || !createdJob.status)
  ) {
    return {
      videoUrl: eagerUrl,
      durationSec:
        Number(createdJob.duration ?? createdJob.duration_seconds ?? 0) || 0,
    };
  }

  const jobId = createdJob.id || createdJob.job_id;
  if (!jobId) {
    console.warn(
      `[hedra] generation submit returned no job id: ${JSON.stringify(createdJob).slice(0, 300)}`
    );
    return null;
  }

  // Step 2 — poll the job until completion or 180s overall ceiling.
  const startedAt = Date.now();
  const ceilingMs = 180_000;
  const intervalMs = 2_500;

  while (Date.now() - startedAt < ceilingMs) {
    await new Promise((r) => setTimeout(r, intervalMs));

    let statusRes: Response;
    try {
      statusRes = await fetch(`${HEDRA_BASE}/generations/${jobId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(15_000),
      });
    } catch (err) {
      // Transient network blip — keep polling until the ceiling.
      console.warn(
        `[hedra] poll error (will retry): ${err instanceof Error ? err.message : err}`
      );
      continue;
    }

    if (!statusRes.ok) {
      // 404/5xx between polls is usually transient with Hedra's queue.
      continue;
    }

    let job: HedraJobResponse;
    try {
      job = (await statusRes.json()) as HedraJobResponse;
    } catch {
      continue;
    }

    const videoUrl = job.video_url || job.output_url || job.url || "";

    if (job.status === "completed" || (videoUrl && !job.status)) {
      if (!videoUrl) {
        console.warn(
          "[hedra] job reported completed but returned no video URL"
        );
        return null;
      }
      return {
        videoUrl,
        durationSec:
          Number(job.duration ?? job.duration_seconds ?? 0) || 0,
      };
    }

    if (job.status === "failed" || job.status === "error") {
      console.warn(
        `[hedra] job ${jobId} failed: ${job.error || job.message || "unknown error"}`
      );
      return null;
    }
    // Otherwise: queued / processing — keep polling.
  }

  console.warn(`[hedra] job ${jobId} timed out after ${ceilingMs / 1000}s`);
  return null;
}

/**
 * Quick env-presence check for diagnostics.
 */
export function hasHedraKey(): boolean {
  return Boolean(process.env.HEDRA_API_KEY);
}
