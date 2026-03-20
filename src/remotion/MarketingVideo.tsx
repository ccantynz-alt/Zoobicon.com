import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
  Sequence,
  AbsoluteFill,
} from "remotion";

/* ─── types ─── */
export interface VideoShot {
  shotNumber: number;
  duration: number;
  visual: string;
  textOverlay: string;
  voiceover: string;
  transition: string;
  mood: string;
}

export interface MarketingVideoProps {
  shots: VideoShot[];
  brandColor?: string;
  accentColor?: string;
  aspectRatio?: "9:16" | "16:9" | "1:1";
  businessName?: string;
  ctaText?: string;
  musicStyle?: string;
}

/* ─── mood → gradient map ─── */
const MOOD_GRADIENTS: Record<string, [string, string]> = {
  energetic: ["#7c3aed", "#06b6d4"],
  calm: ["#1e3a5f", "#0ea5e9"],
  dramatic: ["#1a1a2e", "#e94560"],
  satisfying: ["#065f46", "#34d399"],
  confident: ["#312e81", "#8b5cf6"],
  playful: ["#be185d", "#f59e0b"],
  urgent: ["#7f1d1d", "#ef4444"],
  inspirational: ["#1e1b4b", "#a78bfa"],
  default: ["#0f0a1e", "#6d28d9"],
};

/* ─── single shot component ─── */
const Shot: React.FC<{
  shot: VideoShot;
  brandColor: string;
  accentColor: string;
  aspectRatio: string;
}> = ({ shot, brandColor, accentColor, aspectRatio }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const totalFrames = shot.duration * fps;

  const [gradStart, gradEnd] = MOOD_GRADIENTS[shot.mood] || MOOD_GRADIENTS.default;

  // Entrance animation (first 12 frames)
  const enterOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const enterY = interpolate(frame, [0, 12], [40, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Exit animation (last 8 frames)
  const exitOpacity = interpolate(frame, [totalFrames - 8, totalFrames], [1, 0], {
    extrapolateLeft: "clamp",
  });

  // Text overlay spring animation
  const textScale = spring({ frame: frame - 6, fps, config: { damping: 12, stiffness: 200 } });

  // Subtle zoom on background
  const bgScale = interpolate(frame, [0, totalFrames], [1, 1.05], { extrapolateRight: "clamp" });

  // Voiceover text fade (appears after main text)
  const voiceOpacity = interpolate(frame, [18, 28], [0, 0.7], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const isVertical = aspectRatio === "9:16";

  return (
    <AbsoluteFill
      style={{
        opacity: enterOpacity * exitOpacity,
        backgroundColor: "#000",
      }}
    >
      {/* Gradient background with zoom */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(135deg, ${gradStart}, ${gradEnd})`,
          transform: `scale(${bgScale})`,
        }}
      />

      {/* Animated mesh overlay */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 30% 20%, ${brandColor}33 0%, transparent 50%),
                        radial-gradient(ellipse at 70% 80%, ${accentColor}22 0%, transparent 50%)`,
          opacity: interpolate(frame, [0, totalFrames], [0.5, 0.8]),
        }}
      />

      {/* Content container */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: isVertical ? "60px 32px" : "40px 80px",
          transform: `translateY(${enterY}px)`,
        }}
      >
        {/* Shot number indicator */}
        <div
          style={{
            position: "absolute",
            top: isVertical ? 80 : 40,
            left: isVertical ? 32 : 60,
            display: "flex",
            alignItems: "center",
            gap: 8,
            opacity: 0.4,
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 800,
              color: "#fff",
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            {shot.shotNumber}
          </div>
          <span
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.5)",
              fontFamily: "system-ui, -apple-system, sans-serif",
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            {shot.duration}s · {shot.transition}
          </span>
        </div>

        {/* Main text overlay — the big bold text */}
        <div
          style={{
            transform: `scale(${textScale})`,
            textAlign: "center",
            maxWidth: isVertical ? "90%" : "70%",
          }}
        >
          <h1
            style={{
              fontSize: isVertical ? 56 : 72,
              fontWeight: 900,
              color: "#fff",
              lineHeight: 1.1,
              textShadow: "0 4px 30px rgba(0,0,0,0.4)",
              fontFamily: "system-ui, -apple-system, sans-serif",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            {shot.textOverlay}
          </h1>
        </div>

        {/* Visual description (smaller, below) */}
        <p
          style={{
            fontSize: isVertical ? 18 : 22,
            color: "rgba(255,255,255,0.6)",
            textAlign: "center",
            maxWidth: isVertical ? "85%" : "60%",
            lineHeight: 1.5,
            marginTop: 24,
            fontFamily: "system-ui, -apple-system, sans-serif",
            opacity: voiceOpacity,
          }}
        >
          {shot.visual}
        </p>

        {/* Voiceover caption bar at bottom */}
        {shot.voiceover && (
          <div
            style={{
              position: "absolute",
              bottom: isVertical ? 100 : 60,
              left: "50%",
              transform: "translateX(-50%)",
              maxWidth: isVertical ? "85%" : "70%",
              padding: "12px 24px",
              borderRadius: 12,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(10px)",
              opacity: voiceOpacity,
            }}
          >
            <p
              style={{
                fontSize: isVertical ? 16 : 18,
                color: "rgba(255,255,255,0.85)",
                textAlign: "center",
                fontStyle: "italic",
                margin: 0,
                fontFamily: "system-ui, -apple-system, sans-serif",
                lineHeight: 1.4,
              }}
            >
              &ldquo;{shot.voiceover}&rdquo;
            </p>
          </div>
        )}
      </AbsoluteFill>

      {/* Corner accent line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: interpolate(frame, [0, 15], [0, isVertical ? 120 : 200], {
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          }),
          height: 3,
          background: `linear-gradient(90deg, ${brandColor}, transparent)`,
        }}
      />
    </AbsoluteFill>
  );
};

/* ─── main composition ─── */
export const MarketingVideo: React.FC<MarketingVideoProps> = ({
  shots,
  brandColor = "#8b5cf6",
  accentColor = "#06b6d4",
  aspectRatio = "9:16",
}) => {
  const { fps } = useVideoConfig();

  let cumulativeFrames = 0;
  const shotSequences = shots.map((shot) => {
    const startFrame = cumulativeFrames;
    const durationFrames = shot.duration * fps;
    cumulativeFrames += durationFrames;
    return { shot, startFrame, durationFrames };
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {shotSequences.map(({ shot, startFrame, durationFrames }) => (
        <Sequence
          key={shot.shotNumber}
          from={startFrame}
          durationInFrames={durationFrames}
        >
          <Shot
            shot={shot}
            brandColor={brandColor}
            accentColor={accentColor}
            aspectRatio={aspectRatio}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
