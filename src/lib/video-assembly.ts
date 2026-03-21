// ---------------------------------------------------------------------------
// Video Assembly Pipeline
//
// Orchestrates the full video creation flow:
//   1. Storyboard generation (already exists)
//   2. Scene image generation
//   3. Video rendering per scene
//   4. Voiceover generation
//   5. Subtitle generation
//   6. Final assembly metadata (client-side MediaRecorder or FFmpeg.wasm)
//
// This module coordinates all the pieces and produces a complete video
// project manifest that the client can use for playback or assembly.
// ---------------------------------------------------------------------------

import type { RenderScene, RenderJob, VideoProvider } from "./video-render";
import type { SceneImageResult } from "./scene-image-gen";
import type { VoiceResult, VoiceConfig } from "./voiceover";
import type { SubtitleResult, CaptionStyle } from "./subtitle-gen";

// --- Types ---

export interface VideoProject {
  id: string;
  status: "planning" | "generating-images" | "rendering-video" | "generating-voice" | "assembling" | "completed" | "failed";
  progress: number;             // 0-100
  createdAt: string;

  // Input config
  config: {
    projectType: string;
    style: string;
    platform: string;
    duration: number;
    music: string;
    brandColors: string[];
    brandFont: string;
    voiceConfig?: VoiceConfig;
    captionStyle?: CaptionStyle;
    videoProvider?: VideoProvider;
  };

  // Pipeline outputs
  storyboard: StoryboardData | null;
  sceneImages: SceneImageResult[];
  renderJobs: RenderJob[];
  voiceover: VoiceResult | null;
  sceneVoiceovers: { sceneNumber: number; audio: VoiceResult }[];
  subtitles: SubtitleResult | null;

  // Final output
  outputUrls: {
    videoClips: { sceneNumber: number; url: string }[];
    audioUrl: string | null;
    subtitleSrt: string | null;
    subtitleVtt: string | null;
    thumbnailUrl: string | null;
  };

  // Error tracking
  errors: { stage: string; message: string; timestamp: string }[];
}

export interface StoryboardData {
  storyboard: {
    sceneNumber: number;
    duration: string;
    visualDescription: string;
    textOverlay: string;
    transition: string;
    cameraMovement: string;
    colorPalette: string[];
  }[];
  totalDuration: string;
  estimatedRenderTime: string;
  script: string;
  musicCues: string[];
}

// --- Project creation ---

export function createVideoProject(config: VideoProject["config"]): VideoProject {
  return {
    id: `vp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    status: "planning",
    progress: 0,
    createdAt: new Date().toISOString(),
    config,
    storyboard: null,
    sceneImages: [],
    renderJobs: [],
    voiceover: null,
    sceneVoiceovers: [],
    subtitles: null,
    outputUrls: {
      videoClips: [],
      audioUrl: null,
      subtitleSrt: null,
      subtitleVtt: null,
      thumbnailUrl: null,
    },
    errors: [],
  };
}

// --- Progress calculation ---

export function calculateProgress(project: VideoProject): number {
  const stages = [
    { name: "storyboard", weight: 10, done: !!project.storyboard },
    { name: "images", weight: 20, done: project.sceneImages.length > 0 },
    { name: "video", weight: 40, done: project.renderJobs.every((j) => j.status === "succeeded" || j.status === "failed") && project.renderJobs.length > 0 },
    { name: "voice", weight: 15, done: !!project.voiceover || project.sceneVoiceovers.length > 0 },
    { name: "subtitles", weight: 5, done: !!project.subtitles },
    { name: "assembly", weight: 10, done: project.outputUrls.videoClips.length > 0 },
  ];

  // Calculate partial progress for video rendering
  let videoPartial = 0;
  if (project.renderJobs.length > 0) {
    const completed = project.renderJobs.filter((j) => j.status === "succeeded").length;
    videoPartial = (completed / project.renderJobs.length) * stages[2].weight;
  }

  let progress = 0;
  for (const stage of stages) {
    if (stage.name === "video") {
      progress += stage.done ? stage.weight : videoPartial;
    } else {
      progress += stage.done ? stage.weight : 0;
    }
  }

  return Math.min(100, Math.round(progress));
}

// --- Scene-to-RenderScene converter ---

export function storyboardToRenderScenes(
  storyboard: StoryboardData,
  sceneImages?: SceneImageResult[]
): RenderScene[] {
  const imageMap = new Map(sceneImages?.map((img) => [img.sceneNumber, img.imageUrl]) || []);

  return storyboard.storyboard.map((scene) => ({
    sceneNumber: scene.sceneNumber,
    duration: scene.duration,
    visualDescription: scene.visualDescription,
    textOverlay: scene.textOverlay,
    colorPalette: scene.colorPalette,
    cameraMovement: scene.cameraMovement,
    imageUrl: imageMap.get(scene.sceneNumber),
  }));
}

// --- Assembly manifest for client-side stitching ---

export interface AssemblyManifest {
  projectId: string;
  platform: string;
  totalDuration: number;
  scenes: {
    sceneNumber: number;
    duration: number;
    videoUrl: string | null;
    imageUrl: string | null;
    audioUrl: string | null;
    transition: string;
    textOverlay: string;
  }[];
  voiceoverUrl: string | null;
  subtitleVtt: string | null;
  musicPreference: string;
}

/**
 * Build a manifest that the client can use to assemble the final video
 * using MediaRecorder, FFmpeg.wasm, or a canvas-based renderer.
 */
export function buildAssemblyManifest(project: VideoProject): AssemblyManifest {
  const renderJobMap = new Map(
    project.renderJobs
      .filter((j) => j.status === "succeeded")
      .map((j) => [j.sceneNumber, j.videoUrl])
  );
  const imageMap = new Map(
    project.sceneImages.map((img) => [img.sceneNumber, img.imageUrl])
  );
  const voiceMap = new Map(
    project.sceneVoiceovers.map((v) => [v.sceneNumber, v.audio.audioUrl])
  );

  const scenes = (project.storyboard?.storyboard || []).map((scene) => ({
    sceneNumber: scene.sceneNumber,
    duration: parseDuration(scene.duration),
    videoUrl: renderJobMap.get(scene.sceneNumber) || null,
    imageUrl: imageMap.get(scene.sceneNumber) || null,
    audioUrl: voiceMap.get(scene.sceneNumber) || null,
    transition: scene.transition,
    textOverlay: scene.textOverlay,
  }));

  return {
    projectId: project.id,
    platform: project.config.platform,
    totalDuration: project.config.duration,
    scenes,
    voiceoverUrl: project.voiceover?.audioUrl || null,
    subtitleVtt: project.subtitles?.vtt || null,
    musicPreference: project.config.music,
  };
}

function parseDuration(d: string): number {
  const match = d.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 5;
}
