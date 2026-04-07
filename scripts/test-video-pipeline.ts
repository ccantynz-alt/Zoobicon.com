/**
 * End-to-end smoke test for the Zoobicon AI Video Pipeline.
 *
 * Usage:
 *   npx tsx scripts/test-video-pipeline.ts            # real Replicate run
 *   npx tsx scripts/test-video-pipeline.ts --dry-run  # imports + types only
 */

import {
  generateFullVideo,
  isCustomPipelineAvailable,
  type StoryboardScene,
  type VideoGenerationRequest,
  type PipelineStatus,
} from "../src/lib/video-pipeline";

const DRY_RUN = process.argv.includes("--dry-run");

const HARD_TIMEOUT_MS = 10 * 60 * 1000;
const timeoutHandle = setTimeout(() => {
  console.error("✗ Timeout: pipeline exceeded 10 minute hard limit");
  process.exit(2);
}, HARD_TIMEOUT_MS);

async function main(): Promise<void> {
  console.log(`▶ Zoobicon video pipeline smoke test (dry-run=${DRY_RUN})`);

  if (!DRY_RUN && !process.env.REPLICATE_API_TOKEN) {
    console.error(
      "✗ REPLICATE_API_TOKEN is not set. Set it in your env or pass --dry-run."
    );
    process.exit(1);
  }

  const storyboard: StoryboardScene[] = [
    {
      scene: 1,
      start: 0,
      end: 3,
      shot: "tight headshot",
      mood: "confident",
      broll: "none",
      onScreenText: "Hi! I'm Sarah",
    },
    {
      scene: 2,
      start: 3,
      end: 7,
      shot: "medium of hands on keyboard",
      mood: "warm",
      broll: "product UI close-up",
    },
    {
      scene: 3,
      start: 7,
      end: 12,
      shot: "wide outro CTA",
      mood: "urgent",
      broll: "customer logos",
      onScreenText: "Try it free today",
    },
  ];

  const request: VideoGenerationRequest & { captions?: boolean; music?: string } = {
    script:
      "Hi! I'm Sarah from Zoobicon. We help you build and ship websites in under 60 seconds. Try it free today.",
    voiceStyle: "warm",
    voiceGender: "female",
    background: "#0f172a",
    format: "portrait",
    captions: true,
    music: "upbeat-corporate",
    storyboard,
  };

  if (DRY_RUN) {
    console.log("✓ Imports resolved");
    console.log(`✓ Pipeline available: ${isCustomPipelineAvailable()}`);
    console.log(`✓ Request constructed (storyboard scenes: ${storyboard.length})`);
    console.log(`✓ generateFullVideo type: ${typeof generateFullVideo}`);
    clearTimeout(timeoutHandle);
    process.exit(0);
  }

  const onProgress = (status: PipelineStatus): void => {
    console.log(`[${status.step}] ${status.message} (${status.progress}%)`);
  };

  try {
    const result = await generateFullVideo(request, onProgress);
    console.log("\n✓ Video generated");
    console.log(`  videoUrl:             ${result.videoUrl}`);
    console.log(`  audioUrl:             ${result.audioUrl}`);
    console.log(`  duration:             ${result.duration}s`);
    console.log(`  cost:                 $${result.cost}`);
    console.log(`  pipeline:             ${result.pipeline}`);
    console.log(`  assembledFromScenes:  ${result.assembledFromScenes ?? false}`);
    console.log(`  finalVideoUrl:        ${result.finalVideoUrl ?? "(none)"}`);
    clearTimeout(timeoutHandle);
    process.exit(0);
  } catch (err) {
    const error = err as Error;
    console.error("\n✗ Pipeline failed");
    console.error(error.stack ?? error.message);
    clearTimeout(timeoutHandle);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("✗ Unhandled error:", err);
  clearTimeout(timeoutHandle);
  process.exit(1);
});
