"use client";

import React, { useMemo } from "react";
import { Player } from "@remotion/player";
import { MarketingVideo, MarketingVideoProps } from "@/remotion/MarketingVideo";

interface VideoPlayerProps {
  shots: MarketingVideoProps["shots"];
  brandColor?: string;
  accentColor?: string;
  aspectRatio?: "9:16" | "16:9" | "1:1";
  businessName?: string;
  ctaText?: string;
}

const ASPECT_DIMENSIONS: Record<string, { width: number; height: number }> = {
  "9:16": { width: 1080, height: 1920 },
  "16:9": { width: 1920, height: 1080 },
  "1:1": { width: 1080, height: 1080 },
};

const FPS = 30;

export default function VideoPlayer({
  shots,
  brandColor = "#8b5cf6",
  accentColor = "#06b6d4",
  aspectRatio = "9:16",
  businessName,
  ctaText,
}: VideoPlayerProps) {
  const totalDurationFrames = useMemo(
    () => shots.reduce((sum, shot) => sum + shot.duration * FPS, 0),
    [shots]
  );

  const { width, height } = ASPECT_DIMENSIONS[aspectRatio] || ASPECT_DIMENSIONS["9:16"];

  const inputProps: MarketingVideoProps = useMemo(
    () => ({
      shots,
      brandColor,
      accentColor,
      aspectRatio,
      businessName,
      ctaText,
    }),
    [shots, brandColor, accentColor, aspectRatio, businessName, ctaText]
  );

  if (!shots.length || totalDurationFrames === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl bg-white/[0.02] border border-white/[0.06] aspect-[9/16] max-h-[500px]">
        <p className="text-xs text-white/20">No shots to preview</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden bg-black shadow-2xl shadow-violet-500/10">
      <Player
        component={MarketingVideo}
        inputProps={inputProps}
        durationInFrames={totalDurationFrames}
        compositionWidth={width}
        compositionHeight={height}
        fps={FPS}
        style={{
          width: "100%",
          ...(aspectRatio === "9:16"
            ? { maxHeight: 500, aspectRatio: "9/16" }
            : aspectRatio === "1:1"
              ? { maxHeight: 500, aspectRatio: "1/1" }
              : { aspectRatio: "16/9" }),
        }}
        controls
        autoPlay={false}
        clickToPlay
        spaceKeyToPlayOrPause
        loop
      />
    </div>
  );
}
