// ---------------------------------------------------------------------------
// Video Rendering Integration
//
// Multi-provider video generation via external APIs:
//   - Replicate (Stable Video Diffusion, AnimateDiff)
//   - Runway Gen-3 Alpha
//   - Luma Dream Machine
//
// Architecture:
//   1. Storyboard scenes → individual render jobs (one per scene)
//   2. Each job generates a short video clip (2-10s)
//   3. Jobs poll for completion
//   4. Final assembly concatenates clips (client-side via MediaRecorder or FFmpeg.wasm)
//
// Env vars:
//   REPLICATE_API_TOKEN  — Replicate API token
//   RUNWAY_API_KEY       — Runway Gen-3 API key
//   LUMA_API_KEY         — Luma Dream Machine API key
// ---------------------------------------------------------------------------

export type VideoProvider = "replicate" | "runway" | "luma";

export interface RenderScene {
  sceneNumber: number;
  duration: string;           // e.g., "5s"
  visualDescription: string;
  textOverlay: string;
  colorPalette: string[];
  cameraMovement: string;
}

export interface RenderJob {
  id: string;
  provider: VideoProvider;
  sceneNumber: number;
  status: "pending" | "processing" | "succeeded" | "failed";
  videoUrl: string | null;
  thumbnailUrl: string | null;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface RenderRequest {
  scenes: RenderScene[];
  style: string;
  platform: string;
  provider?: VideoProvider;
}

export interface RenderResult {
  jobId: string;
  jobs: RenderJob[];
  status: "queued" | "processing" | "completed" | "failed";
  totalScenes: number;
  completedScenes: number;
}

// --- Replicate Integration ---

interface ReplicatePrediction {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string | string[];
  error?: string;
}

const REPLICATE_API = "https://api.replicate.com/v1";

async function replicateHeaders(): Promise<Record<string, string>> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("REPLICATE_API_TOKEN not configured");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/**
 * Start a video generation job on Replicate using Stable Video Diffusion.
 */
async function startReplicateJob(scene: RenderScene, style: string): Promise<{ predictionId: string }> {
  const prompt = buildVideoPrompt(scene, style);

  const res = await fetch(`${REPLICATE_API}/predictions`, {
    method: "POST",
    headers: await replicateHeaders(),
    body: JSON.stringify({
      // Stable Video Diffusion XT model
      version: "3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438",
      input: {
        prompt,
        negative_prompt: "blurry, low quality, distorted, watermark, text artifacts",
        num_frames: parseDurationSeconds(scene.duration) * 8, // 8fps
        fps: 8,
        width: 1024,
        height: 576,
        guidance_scale: 7.5,
        num_inference_steps: 25,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Replicate API error: ${res.status} ${err}`);
  }

  const prediction: ReplicatePrediction = await res.json();
  return { predictionId: prediction.id };
}

/**
 * Check the status of a Replicate prediction.
 */
async function checkReplicateJob(predictionId: string): Promise<RenderJob> {
  const res = await fetch(`${REPLICATE_API}/predictions/${predictionId}`, {
    headers: await replicateHeaders(),
  });

  if (!res.ok) {
    return {
      id: predictionId,
      provider: "replicate",
      sceneNumber: 0,
      status: "failed",
      videoUrl: null,
      thumbnailUrl: null,
      error: `API error: ${res.status}`,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
  }

  const prediction: ReplicatePrediction = await res.json();

  const statusMap: Record<string, RenderJob["status"]> = {
    starting: "processing",
    processing: "processing",
    succeeded: "succeeded",
    failed: "failed",
    canceled: "failed",
  };

  const output = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;

  return {
    id: predictionId,
    provider: "replicate",
    sceneNumber: 0,
    status: statusMap[prediction.status] || "processing",
    videoUrl: prediction.status === "succeeded" ? (output || null) : null,
    thumbnailUrl: null,
    error: prediction.error || null,
    createdAt: new Date().toISOString(),
    completedAt: prediction.status === "succeeded" || prediction.status === "failed"
      ? new Date().toISOString()
      : null,
  };
}

// --- Runway Integration ---

async function runwayHeaders(): Promise<Record<string, string>> {
  const key = process.env.RUNWAY_API_KEY;
  if (!key) throw new Error("RUNWAY_API_KEY not configured");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    "X-Runway-Version": "2024-11-06",
  };
}

async function startRunwayJob(scene: RenderScene, style: string): Promise<{ taskId: string }> {
  const prompt = buildVideoPrompt(scene, style);

  const res = await fetch("https://api.dev.runwayml.com/v1/image_to_video", {
    method: "POST",
    headers: await runwayHeaders(),
    body: JSON.stringify({
      model: "gen3a_turbo",
      promptText: prompt,
      duration: Math.min(10, parseDurationSeconds(scene.duration)),
      watermark: false,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Runway API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return { taskId: data.id };
}

async function checkRunwayJob(taskId: string): Promise<RenderJob> {
  const res = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
    headers: await runwayHeaders(),
  });

  if (!res.ok) {
    return {
      id: taskId,
      provider: "runway",
      sceneNumber: 0,
      status: "failed",
      videoUrl: null,
      thumbnailUrl: null,
      error: `API error: ${res.status}`,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
  }

  const data = await res.json();
  const statusMap: Record<string, RenderJob["status"]> = {
    PENDING: "pending",
    THROTTLED: "pending",
    RUNNING: "processing",
    SUCCEEDED: "succeeded",
    FAILED: "failed",
  };

  return {
    id: taskId,
    provider: "runway",
    sceneNumber: 0,
    status: statusMap[data.status] || "processing",
    videoUrl: data.status === "SUCCEEDED" ? (data.output?.[0] || null) : null,
    thumbnailUrl: null,
    error: data.failure || null,
    createdAt: data.createdAt || new Date().toISOString(),
    completedAt: data.status === "SUCCEEDED" || data.status === "FAILED"
      ? new Date().toISOString()
      : null,
  };
}

// --- Luma Dream Machine Integration ---

async function lumaHeaders(): Promise<Record<string, string>> {
  const key = process.env.LUMA_API_KEY;
  if (!key) throw new Error("LUMA_API_KEY not configured");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

async function startLumaJob(scene: RenderScene, style: string): Promise<{ generationId: string }> {
  const prompt = buildVideoPrompt(scene, style);

  const res = await fetch("https://api.lumalabs.ai/dream-machine/v1/generations", {
    method: "POST",
    headers: await lumaHeaders(),
    body: JSON.stringify({
      prompt,
      aspect_ratio: "16:9",
      loop: false,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Luma API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return { generationId: data.id };
}

async function checkLumaJob(generationId: string): Promise<RenderJob> {
  const res = await fetch(`https://api.lumalabs.ai/dream-machine/v1/generations/${generationId}`, {
    headers: await lumaHeaders(),
  });

  if (!res.ok) {
    return {
      id: generationId,
      provider: "luma",
      sceneNumber: 0,
      status: "failed",
      videoUrl: null,
      thumbnailUrl: null,
      error: `API error: ${res.status}`,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
  }

  const data = await res.json();
  const statusMap: Record<string, RenderJob["status"]> = {
    queued: "pending",
    dreaming: "processing",
    completed: "succeeded",
    failed: "failed",
  };

  return {
    id: generationId,
    provider: "luma",
    sceneNumber: 0,
    status: statusMap[data.state] || "processing",
    videoUrl: data.state === "completed" ? (data.video?.url || null) : null,
    thumbnailUrl: data.video?.thumbnail || null,
    error: data.failure_reason || null,
    createdAt: data.created_at || new Date().toISOString(),
    completedAt: data.state === "completed" || data.state === "failed"
      ? new Date().toISOString()
      : null,
  };
}

// --- Unified API ---

/**
 * Detect which video provider is configured.
 */
export function getAvailableProvider(): VideoProvider | null {
  if (process.env.REPLICATE_API_TOKEN) return "replicate";
  if (process.env.RUNWAY_API_KEY) return "runway";
  if (process.env.LUMA_API_KEY) return "luma";
  return null;
}

/**
 * Start rendering all scenes for a storyboard.
 * Returns job IDs that can be polled for completion.
 */
export async function startRender(request: RenderRequest): Promise<RenderResult> {
  const provider = request.provider || getAvailableProvider();
  if (!provider) {
    throw new Error(
      "No video rendering provider configured. Set REPLICATE_API_TOKEN, RUNWAY_API_KEY, or LUMA_API_KEY in your environment."
    );
  }

  const masterJobId = `render_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const jobs: RenderJob[] = [];

  for (const scene of request.scenes) {
    try {
      let jobId: string;

      switch (provider) {
        case "replicate": {
          const result = await startReplicateJob(scene, request.style);
          jobId = result.predictionId;
          break;
        }
        case "runway": {
          const result = await startRunwayJob(scene, request.style);
          jobId = result.taskId;
          break;
        }
        case "luma": {
          const result = await startLumaJob(scene, request.style);
          jobId = result.generationId;
          break;
        }
      }

      jobs.push({
        id: jobId,
        provider,
        sceneNumber: scene.sceneNumber,
        status: "pending",
        videoUrl: null,
        thumbnailUrl: null,
        error: null,
        createdAt: new Date().toISOString(),
        completedAt: null,
      });
    } catch (err) {
      jobs.push({
        id: `error_${scene.sceneNumber}`,
        provider,
        sceneNumber: scene.sceneNumber,
        status: "failed",
        videoUrl: null,
        thumbnailUrl: null,
        error: err instanceof Error ? err.message : "Unknown error",
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      });
    }
  }

  return {
    jobId: masterJobId,
    jobs,
    status: "queued",
    totalScenes: request.scenes.length,
    completedScenes: 0,
  };
}

/**
 * Check the status of all render jobs.
 */
export async function checkRenderStatus(jobs: RenderJob[]): Promise<RenderJob[]> {
  const updated: RenderJob[] = [];

  for (const job of jobs) {
    // Skip already completed/failed jobs
    if (job.status === "succeeded" || job.status === "failed") {
      updated.push(job);
      continue;
    }

    try {
      let result: RenderJob;

      switch (job.provider) {
        case "replicate":
          result = await checkReplicateJob(job.id);
          break;
        case "runway":
          result = await checkRunwayJob(job.id);
          break;
        case "luma":
          result = await checkLumaJob(job.id);
          break;
      }

      result.sceneNumber = job.sceneNumber;
      updated.push(result);
    } catch {
      updated.push(job); // Keep existing state on check failure
    }
  }

  return updated;
}

// --- Helpers ---

function buildVideoPrompt(scene: RenderScene, style: string): string {
  const parts = [
    scene.visualDescription,
    `Camera: ${scene.cameraMovement}`,
    `Style: ${style.replace(/-/g, " ")}`,
    scene.colorPalette.length > 0 ? `Color palette: ${scene.colorPalette.join(", ")}` : "",
  ].filter(Boolean);

  return parts.join(". ") + ".";
}

function parseDurationSeconds(duration: string): number {
  const match = duration.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 5;
}
