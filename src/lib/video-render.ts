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

export type VideoProvider = "replicate" | "runway" | "luma" | "pika" | "kling";

export interface RenderScene {
  sceneNumber: number;
  duration: string;           // e.g., "5s"
  visualDescription: string;
  textOverlay: string;
  colorPalette: string[];
  cameraMovement: string;
  imageUrl?: string;          // Optional input image for image-to-video
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
  progress?: number;          // 0-100 render progress
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
  const token = process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY || process.env.REPLICATE_TOKEN || process.env.REPLICATE_KEY;
  if (!token) throw new Error("REPLICATE_API_TOKEN not configured");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/**
 * Start a video generation job on Replicate using MiniMax Video-01-Live.
 * Previously used SVD XT which was deprecated. Video-01-Live is fast (~30s)
 * and produces high-quality 720p video from text prompts.
 */
async function startReplicateJob(scene: RenderScene, style: string, provider?: VideoProvider): Promise<{ predictionId: string }> {
  const prompt = buildVideoPrompt(scene, style, provider || "replicate");

  const res = await fetch(`${REPLICATE_API}/models/minimax/video-01-live/predictions`, {
    method: "POST",
    headers: await replicateHeaders(),
    body: JSON.stringify({
      input: {
        prompt,
        prompt_optimizer: true,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Replicate API error: ${res.status} — ${err}`);
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
  if (!key) throw new Error("Video rendering service unavailable.");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    "X-Runway-Version": "2024-11-06",
  };
}

async function startRunwayJob(scene: RenderScene, style: string, provider?: VideoProvider): Promise<{ taskId: string }> {
  const prompt = buildVideoPrompt(scene, style, provider || "runway");
  const rawDuration = parseDurationSeconds(scene.duration);
  // Runway only accepts duration of 5 or 10 seconds
  const duration = rawDuration <= 7 ? 5 : 10;

  // Runway image_to_video REQUIRES a promptImage (publicly accessible URL)
  const hasImage = scene.imageUrl && scene.imageUrl.startsWith("http");

  if (!hasImage) {
    throw new Error(
      "Runway Gen-3 requires a scene image. Generate images first, then render video."
    );
  }

  const res = await fetch("https://api.dev.runwayml.com/v1/image_to_video", {
    method: "POST",
    headers: await runwayHeaders(),
    body: JSON.stringify({
      model: "gen3a_turbo",
      promptImage: scene.imageUrl,
      promptText: prompt,
      duration,
      watermark: false,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[Runway] Scene ${scene.sceneNumber} failed:`, res.status, err);
    throw new Error(`Runway API error: ${res.status} — ${err}`);
  }

  const data = await res.json();
  console.log(`[Runway] Scene ${scene.sceneNumber} started: task ${data.id}`);
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
  if (!key) throw new Error("Video rendering service unavailable.");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

async function startLumaJob(scene: RenderScene, style: string, provider?: VideoProvider): Promise<{ generationId: string }> {
  const prompt = buildVideoPrompt(scene, style, provider || "luma");

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

// --- Pika Integration ---

async function pikaHeaders(): Promise<Record<string, string>> {
  const key = process.env.PIKA_API_KEY;
  if (!key) throw new Error("Video rendering service unavailable.");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

async function startPikaJob(scene: RenderScene, style: string, provider?: VideoProvider): Promise<{ generationId: string }> {
  const prompt = buildVideoPrompt(scene, style, provider || "pika");

  const body: Record<string, unknown> = {
    promptText: prompt,
    style: "realistic",
    options: {
      frameRate: 24,
      camera: { pan: scene.cameraMovement.includes("pan") ? "right" : "none" },
      parameters: { guidanceScale: 12, motion: 2, negativePrompt: "blurry, low quality, distorted" },
    },
  };

  // If scene has a reference image, use image-to-video
  if (scene.imageUrl) {
    body.image = scene.imageUrl;
  }

  const res = await fetch("https://api.pika.art/v1/generate", {
    method: "POST",
    headers: await pikaHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Pika API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return { generationId: data.id || data.generation_id };
}

async function checkPikaJob(generationId: string): Promise<RenderJob> {
  const res = await fetch(`https://api.pika.art/v1/generate/${generationId}`, {
    headers: await pikaHeaders(),
  });

  if (!res.ok) {
    return {
      id: generationId,
      provider: "pika",
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
    pending: "pending",
    processing: "processing",
    finished: "succeeded",
    complete: "succeeded",
    failed: "failed",
    error: "failed",
  };

  return {
    id: generationId,
    provider: "pika",
    sceneNumber: 0,
    status: statusMap[data.status] || "processing",
    videoUrl: data.status === "finished" || data.status === "complete" ? (data.video?.url || data.resultUrl || null) : null,
    thumbnailUrl: data.thumbnail || null,
    error: data.error || null,
    createdAt: data.createdAt || new Date().toISOString(),
    completedAt: data.status === "finished" || data.status === "failed" ? new Date().toISOString() : null,
    progress: data.progress || undefined,
  };
}

// --- Kling Integration ---

async function klingHeaders(): Promise<Record<string, string>> {
  const key = process.env.KLING_API_KEY;
  if (!key) throw new Error("Video rendering service unavailable.");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

async function startKlingJob(scene: RenderScene, style: string, provider?: VideoProvider): Promise<{ taskId: string }> {
  const prompt = buildVideoPrompt(scene, style, provider || "kling");
  const durationSec = Math.min(10, parseDurationSeconds(scene.duration));

  const body: Record<string, unknown> = {
    prompt,
    negative_prompt: "blurry, low quality, distorted, watermark",
    duration: durationSec <= 5 ? "5" : "10",
    model_name: "kling-v3", // Kling 3.0 — latest model
    mode: "std", // "std" for standard, "pro" for higher quality
    cfg_scale: 0.5,
    aspect_ratio: "16:9",
  };

  if (scene.imageUrl) {
    body.image = scene.imageUrl;
  }

  const res = await fetch("https://api.klingai.com/v1/videos/text2video", {
    method: "POST",
    headers: await klingHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Kling API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return { taskId: data.data?.task_id || data.task_id };
}

async function checkKlingJob(taskId: string): Promise<RenderJob> {
  const res = await fetch(`https://api.klingai.com/v1/videos/text2video/${taskId}`, {
    headers: await klingHeaders(),
  });

  if (!res.ok) {
    return {
      id: taskId,
      provider: "kling",
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
  const taskData = data.data || data;
  const statusMap: Record<string, RenderJob["status"]> = {
    submitted: "pending",
    processing: "processing",
    succeed: "succeeded",
    completed: "succeeded",
    failed: "failed",
  };

  const videos = taskData.task_result?.videos || [];
  const videoUrl = videos.length > 0 ? videos[0].url : null;

  return {
    id: taskId,
    provider: "kling",
    sceneNumber: 0,
    status: statusMap[taskData.task_status] || "processing",
    videoUrl: videoUrl,
    thumbnailUrl: videos.length > 0 ? (videos[0].thumbnail || null) : null,
    error: taskData.task_status_msg || null,
    createdAt: taskData.created_at || new Date().toISOString(),
    completedAt: taskData.task_status === "succeed" || taskData.task_status === "failed" ? new Date().toISOString() : null,
    progress: taskData.progress || undefined,
  };
}

// --- Provider Prompt Limits ---

const PROVIDER_PROMPT_LIMITS: Record<VideoProvider, number> = {
  runway: 512,
  kling: 2000,
  replicate: 1000,
  luma: 1000,
  pika: 800,
};

// --- Smart Provider Selection ---

/**
 * Select the best provider for a given scene based on content analysis.
 *
 * Logic:
 *   - Runway: Best for cinematic, professional, narrative content + camera work
 *   - Kling: Best for photorealistic humans, social media, cost-effective
 *   - Replicate: Good general purpose, fastest turnaround
 *   - Luma/Pika: Fallback chain
 *
 * Falls back through available providers if the ideal one isn't configured.
 */
export function selectBestProvider(scene: RenderScene): VideoProvider {
  const desc = (scene.visualDescription || "").toLowerCase();
  const camera = (scene.cameraMovement || "").toLowerCase();

  // Runway: Best for cinematic, professional, narrative content with camera work
  const isCinematic = camera.includes("dolly") || camera.includes("crane") ||
    camera.includes("tracking") || camera.includes("slow motion") ||
    /cinematic|film|dramatic|slow\s?mo|epic|aerial|sweeping/i.test(desc);
  if (isCinematic && process.env.RUNWAY_API_KEY) {
    return "runway";
  }

  // Kling: Best for photorealistic humans, social media, portraits
  const isPeopleFocused = /person|people|face|portrait|social|tiktok|influencer|testimonial|team|headshot|interview|presenter/i.test(desc);
  if (isPeopleFocused && process.env.KLING_API_KEY) {
    return "kling";
  }

  // Kling: Also good for longer scenes (supports 10s natively, cost-effective)
  const duration = parseDurationSeconds(scene.duration);
  if (duration >= 8 && process.env.KLING_API_KEY) {
    return "kling";
  }

  // Replicate: Good general purpose, fastest turnaround
  if (process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY || process.env.REPLICATE_TOKEN || process.env.REPLICATE_KEY) {
    return "replicate";
  }

  // Fallback chain: try each configured provider in quality order
  if (process.env.RUNWAY_API_KEY) return "runway";
  if (process.env.KLING_API_KEY) return "kling";
  if (process.env.LUMA_API_KEY) return "luma";
  if (process.env.PIKA_API_KEY) return "pika";

  return getAvailableProvider() || "replicate";
}

// --- Quality Scoring ---

export interface RenderQualityLog {
  sceneNumber: number;
  provider: VideoProvider;
  status: "succeeded" | "failed";
  durationMs: number;
  promptLength: number;
  sceneType: string;
  timestamp: string;
}

/**
 * Classify a scene into a type for quality tracking.
 */
function classifySceneType(scene: RenderScene): string {
  const desc = (scene.visualDescription || "").toLowerCase();
  if (/person|people|face|portrait|team/i.test(desc)) return "people";
  if (/cinematic|film|dramatic|epic/i.test(desc)) return "cinematic";
  if (/product|item|showcase|detail/i.test(desc)) return "product";
  if (/landscape|nature|aerial|sky/i.test(desc)) return "landscape";
  if (/text|logo|brand|title/i.test(desc)) return "text-overlay";
  if (/social|tiktok|reel|story/i.test(desc)) return "social-media";
  return "general";
}

/**
 * Log render quality data for provider intelligence.
 * This data feeds into the Market Intelligence system to optimize future selections.
 */
export function logRenderQuality(
  scene: RenderScene,
  provider: VideoProvider,
  status: "succeeded" | "failed",
  startTime: number
): RenderQualityLog {
  const log: RenderQualityLog = {
    sceneNumber: scene.sceneNumber,
    provider,
    status,
    durationMs: Date.now() - startTime,
    promptLength: (scene.visualDescription || "").length,
    sceneType: classifySceneType(scene),
    timestamp: new Date().toISOString(),
  };

  console.log(`[video-render] Quality log: provider=${log.provider} scene=${log.sceneNumber} type=${log.sceneType} status=${log.status} duration=${log.durationMs}ms`);

  return log;
}

// --- Unified API ---

/**
 * Detect which video provider is configured.
 */
export function getAvailableProvider(): VideoProvider | null {
  // Runway first — best quality for video generation (Gen-3 Alpha Turbo)
  if (process.env.RUNWAY_API_KEY) return "runway";
  // Then dedicated video providers
  if (process.env.LUMA_API_KEY) return "luma";
  if (process.env.PIKA_API_KEY) return "pika";
  if (process.env.KLING_API_KEY) return "kling";
  // Replicate last — primarily an image provider, video models rotate frequently
  if (process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY || process.env.REPLICATE_TOKEN || process.env.REPLICATE_KEY) return "replicate";
  return null;
}

/**
 * Get all configured providers.
 */
export function getAllConfiguredProviders(): { provider: VideoProvider; configured: boolean; models: string[] }[] {
  return [
    { provider: "replicate", configured: !!(process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY || process.env.REPLICATE_TOKEN || process.env.REPLICATE_KEY), models: ["MiniMax Video-01-Live", "FLUX"] },
    { provider: "runway", configured: !!process.env.RUNWAY_API_KEY, models: ["Gen-3 Alpha Turbo"] },
    { provider: "luma", configured: !!process.env.LUMA_API_KEY, models: ["Dream Machine"] },
    { provider: "pika", configured: !!process.env.PIKA_API_KEY, models: ["Pika 1.5"] },
    { provider: "kling", configured: !!process.env.KLING_API_KEY, models: ["Kling 3.0"] },
  ];
}

/**
 * Start rendering all scenes for a storyboard.
 * Each scene is routed to the best provider based on content analysis.
 * If request.provider is set, it overrides smart selection for ALL scenes.
 * Returns job IDs that can be polled for completion.
 */
export async function startRender(request: RenderRequest): Promise<RenderResult> {
  // If no provider override and no providers configured at all, fail fast
  if (!request.provider && !getAvailableProvider()) {
    throw new Error(
      "No video rendering provider configured. Set REPLICATE_API_TOKEN, RUNWAY_API_KEY, KLING_API_KEY, or LUMA_API_KEY in your environment."
    );
  }

  const masterJobId = `render_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const jobs: RenderJob[] = [];
  const qualityLogs: RenderQualityLog[] = [];

  for (const scene of request.scenes) {
    // Smart provider selection: use override if provided, otherwise pick best per scene
    const provider = request.provider || selectBestProvider(scene);
    const startTime = Date.now();

    try {
      // Strip base64 data URIs — they're too large for video APIs and cause payload errors
      // Providers that need images will get a text-to-video prompt instead
      if (scene.imageUrl && (scene.imageUrl.startsWith("data:") || scene.imageUrl.length > 10000)) {
        console.warn(`[video-render] Scene ${scene.sceneNumber}: stripping oversized imageUrl (${scene.imageUrl.length} chars)`);
        scene.imageUrl = undefined;
      }

      console.log(`[video-render] Scene ${scene.sceneNumber}: selected provider=${provider} (type=${classifySceneType(scene)})`);

      let jobId: string;

      switch (provider) {
        case "replicate": {
          const result = await startReplicateJob(scene, request.style, provider);
          jobId = result.predictionId;
          break;
        }
        case "runway": {
          const result = await startRunwayJob(scene, request.style, provider);
          jobId = result.taskId;
          break;
        }
        case "luma": {
          const result = await startLumaJob(scene, request.style, provider);
          jobId = result.generationId;
          break;
        }
        case "pika": {
          const result = await startPikaJob(scene, request.style, provider);
          jobId = result.generationId;
          break;
        }
        case "kling": {
          const result = await startKlingJob(scene, request.style, provider);
          jobId = result.taskId;
          break;
        }
        default:
          throw new Error(`[video-render] Unsupported provider: ${provider}`);
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

      qualityLogs.push(logRenderQuality(scene, provider, "succeeded", startTime));
    } catch (err) {
      qualityLogs.push(logRenderQuality(scene, provider, "failed", startTime));

      jobs.push({
        id: `error_${scene.sceneNumber}`,
        provider,
        sceneNumber: scene.sceneNumber,
        status: "failed",
        videoUrl: null,
        thumbnailUrl: null,
        error: err instanceof Error ? sanitizeRenderError(err.message) : "Render failed for this scene",
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
        case "pika":
          result = await checkPikaJob(job.id);
          break;
        case "kling":
          result = await checkKlingJob(job.id);
          break;
        default:
          throw new Error(`[video-render] Unsupported provider for status check: ${job.provider}`);
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

// Style → video-specific motion and cinematography directives
const VIDEO_STYLE_DIRECTIONS: Record<string, string> = {
  "modern-minimalist": "Slow, deliberate camera movements. Smooth dolly or tracking shots. Minimal motion in frame. Clean, controlled pace.",
  "bold-dynamic": "Fast, energetic camera work. Quick cuts, dynamic zooms, kinetic motion. Objects move with purpose and speed. High energy throughout.",
  "elegant-luxury": "Ultra-slow motion at 120fps. Silky smooth dolly moves. Gentle floating particles. Premium textures catching light. Serene, aspirational.",
  "fun-playful": "Bouncy, lively camera. Playful tilts and pans. Confetti or particle bursts. Upbeat timing with quick, cheerful movements.",
  "corporate-professional": "Steady, confident camera. Smooth slider or gimbal shots. Professional pacing — not rushed, not slow. Clean reveals.",
  "cinematic": "Dramatic slow dolly push-in. Atmospheric volumetric light rays. Subtle lens flares. Film-like motion cadence. Shallow DOF shifts.",
};

/** Sanitize render errors — never expose API internals to users */
function sanitizeRenderError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("validation of body failed") || lower.includes("too_big") || lower.includes("too large"))
    return "Video render request was too large. Try shorter scenes.";
  if (lower.includes("rate limit") || lower.includes("429"))
    return "Render service is busy. Try again in a moment.";
  if (lower.includes("requires a scene image") || lower.includes("generate images first"))
    return "Generate scene images before rendering video.";
  if (lower.includes("unauthorized") || lower.includes("invalid") || lower.includes("auth"))
    return "Render service configuration issue. Please try again.";
  if (lower.includes("api error"))
    return "Render service temporarily unavailable.";
  // If message is already short and doesn't contain sensitive info, allow it
  if (raw.length < 80 && !lower.includes("key") && !lower.includes("token") && !lower.includes("env"))
    return raw;
  return "Video rendering failed for this scene.";
}

/**
 * Build a video prompt optimized for the target provider's capabilities.
 *
 * Prompt limits vary by provider:
 *   - Runway: 512 chars (concise, focused)
 *   - Kling: 2000 chars (can include rich detail, scene composition, lighting)
 *   - Replicate: 1000 chars (moderate detail)
 *   - Luma: 1000 chars
 *   - Pika: 800 chars
 */
function buildVideoPrompt(scene: RenderScene, style: string, provider?: VideoProvider): string {
  const maxLength = provider ? PROVIDER_PROMPT_LIMITS[provider] : 500;
  const motionDir = VIDEO_STYLE_DIRECTIONS[style] || VIDEO_STYLE_DIRECTIONS["cinematic"];
  const colorDir = scene.colorPalette.length > 0
    ? `Colors: ${scene.colorPalette.slice(0, 3).join(", ")}.`
    : "";

  // Scale description length based on provider's prompt limit
  const descMaxLength = Math.floor(maxLength * 0.6);
  const desc = (scene.visualDescription || "").slice(0, descMaxLength);
  const camera = scene.cameraMovement ? `Camera: ${scene.cameraMovement}.` : "";

  const parts = [desc, camera, motionDir, colorDir, "Cinematic quality. Photorealistic."];

  // For providers with larger limits (Kling 2000 chars), add extra detail
  if (maxLength >= 1500) {
    parts.push(`Scene ${scene.sceneNumber}. Duration: ${scene.duration}.`);
    if (scene.textOverlay) {
      parts.push(`On-screen text: "${scene.textOverlay}".`);
    }
    parts.push("High resolution, professional lighting, smooth motion, no artifacts.");
  }

  const prompt = parts
    .filter(Boolean)
    .join(" ")
    .slice(0, maxLength);

  return prompt;
}

function parseDurationSeconds(duration: string): number {
  const match = duration.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 5;
}
