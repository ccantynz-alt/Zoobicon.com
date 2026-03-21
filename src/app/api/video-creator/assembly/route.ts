import { NextRequest } from "next/server";
import {
  createVideoProject,
  calculateProgress,
  buildAssemblyManifest,
  storyboardToRenderScenes,
  type VideoProject,
  type StoryboardData,
} from "@/lib/video-assembly";
import { getAvailableProvider, getAllConfiguredProviders } from "@/lib/video-render";
import { getAvailableVoiceProvider } from "@/lib/voiceover";
import { getAvailableImageProvider } from "@/lib/scene-image-gen";

export const maxDuration = 300;

/**
 * POST /api/video-creator/assembly — Create a video project and get assembly manifest
 *
 * This endpoint creates a VideoProject, generates the assembly manifest,
 * and returns the full project state. The client drives the pipeline by
 * calling individual endpoints (images, render, voiceover, subtitles)
 * and updating the project state locally.
 *
 * Body: {
 *   storyboard: StoryboardData,
 *   config: VideoProject["config"],
 *   sceneImages?: SceneImageResult[],   // If already generated
 *   renderJobs?: RenderJob[],           // If already started
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storyboard, config, sceneImages, renderJobs } = body;

    if (!storyboard || !config) {
      return Response.json(
        { error: "storyboard and config are required" },
        { status: 400 }
      );
    }

    // Create the project
    const project = createVideoProject(config);
    project.storyboard = storyboard as StoryboardData;

    if (sceneImages) project.sceneImages = sceneImages;
    if (renderJobs) project.renderJobs = renderJobs;

    // Calculate render scenes (with image URLs if available)
    const renderScenes = storyboardToRenderScenes(
      storyboard as StoryboardData,
      sceneImages
    );

    // Build assembly manifest
    const manifest = buildAssemblyManifest(project);
    const progress = calculateProgress(project);

    return Response.json({
      project: {
        ...project,
        progress,
      },
      manifest,
      renderScenes,
      capabilities: {
        videoRender: {
          available: !!getAvailableProvider(),
          providers: getAllConfiguredProviders(),
        },
        voiceover: {
          available: !!getAvailableVoiceProvider(),
          provider: getAvailableVoiceProvider(),
          premium: getAvailableVoiceProvider() !== "browser",
        },
        imageGen: {
          available: !!getAvailableImageProvider(),
        },
      },
    });
  } catch (err) {
    console.error("[video-creator/assembly] Error:", err);
    const message = err instanceof Error ? err.message : "Assembly failed";
    return Response.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT /api/video-creator/assembly — Update project state and recalculate progress
 *
 * Body: Partial<VideoProject>
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const project = body as VideoProject;

    if (!project.id) {
      return Response.json({ error: "Project ID required" }, { status: 400 });
    }

    const progress = calculateProgress(project);
    const manifest = buildAssemblyManifest(project);

    // Determine status based on progress
    let status = project.status;
    if (progress >= 100) status = "completed";
    else if (project.errors.length > 0 && progress === 0) status = "failed";

    return Response.json({
      project: {
        ...project,
        progress,
        status,
      },
      manifest,
    });
  } catch (err) {
    console.error("[video-creator/assembly] Update error:", err);
    return Response.json({ error: "Update failed" }, { status: 500 });
  }
}

/**
 * GET /api/video-creator/assembly — Get pipeline capabilities
 */
export async function GET() {
  return Response.json({
    capabilities: {
      videoRender: {
        available: !!getAvailableProvider(),
        providers: getAllConfiguredProviders(),
      },
      voiceover: {
        available: !!getAvailableVoiceProvider(),
        provider: getAvailableVoiceProvider(),
        premium: getAvailableVoiceProvider() !== "browser",
      },
      imageGen: {
        available: !!getAvailableImageProvider(),
      },
    },
    stages: [
      { name: "storyboard", label: "Storyboard Generation", weight: 10 },
      { name: "images", label: "Scene Image Generation", weight: 20 },
      { name: "video", label: "Video Rendering", weight: 40 },
      { name: "voice", label: "Voiceover Generation", weight: 15 },
      { name: "subtitles", label: "Subtitle Generation", weight: 5 },
      { name: "assembly", label: "Final Assembly", weight: 10 },
    ],
  });
}
