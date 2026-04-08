/**
 * Smoke tests for the AI Video Pipeline.
 * These tests must run in CI without secrets — no real Replicate calls.
 */

import { describe, it, expect, afterEach } from "vitest";
import {
  generateFullVideo,
  isCustomPipelineAvailable,
  type VideoGenerationRequest,
  type StoryboardScene,
} from "@/lib/video-pipeline";
import {
  assembleScenes,
  burnInCaptions,
  mixBackgroundMusic,
} from "@/lib/video-assembler";

const ORIGINAL_TOKEN = process.env.REPLICATE_API_TOKEN;

afterEach(() => {
  if (ORIGINAL_TOKEN === undefined) {
    delete process.env.REPLICATE_API_TOKEN;
  } else {
    process.env.REPLICATE_API_TOKEN = ORIGINAL_TOKEN;
  }
});

describe("video-pipeline smoke", () => {
  it("types resolve and storyboard contract is honored", () => {
    const storyboard: StoryboardScene[] = [
      {
        scene: 1,
        start: 0,
        end: 3,
        shot: "tight headshot",
        mood: "confident",
        broll: "none",
        onScreenText: "Hi!",
      },
      {
        scene: 2,
        start: 3,
        end: 7,
        shot: "medium of hands",
        mood: "warm",
        broll: "product UI close-up",
      },
      {
        scene: 3,
        start: 7,
        end: 10,
        shot: "wide outro",
        mood: "urgent",
        broll: "customer logos",
        onScreenText: "Try free",
      },
    ];

    const request: VideoGenerationRequest & { captions?: boolean; music?: string } = {
      script: "Hi! I'm Sarah from Zoobicon.",
      voiceStyle: "warm",
      voiceGender: "female",
      background: "#0f172a",
      format: "portrait",
      captions: true,
      music: "upbeat-corporate",
      storyboard,
    };

    expect(typeof generateFullVideo).toBe("function");
    expect(request.storyboard).toBeDefined();
    expect(request.storyboard?.length).toBe(3);
    expect(request.storyboard?.[0].shot).toBe("tight headshot");
  });

  it("isCustomPipelineAvailable reflects env", () => {
    process.env.REPLICATE_API_TOKEN = "r8_test_token";
    expect(isCustomPipelineAvailable()).toBe(true);
    delete process.env.REPLICATE_API_TOKEN;
    expect(isCustomPipelineAvailable()).toBe(false);
  });

  it("video-assembler exports the three core functions", () => {
    expect(typeof assembleScenes).toBe("function");
    expect(typeof burnInCaptions).toBe("function");
    expect(typeof mixBackgroundMusic).toBe("function");
  });
});
