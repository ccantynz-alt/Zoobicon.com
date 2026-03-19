import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Zoobicon — AI Website Builder";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #050508 0%, #0a0a18 40%, #12082a 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow orbs */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            left: "100px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(124, 90, 255, 0.25), transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-50px",
            right: "150px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59, 130, 246, 0.2), transparent 70%)",
            filter: "blur(60px)",
          }}
        />

        {/* Logo + badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #6d3bff, #7c5aff)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              color: "white",
              fontWeight: 900,
            }}
          >
            Z
          </div>
          <span
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: "white",
              letterSpacing: "-0.02em",
            }}
          >
            Zoobicon
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              fontSize: "72px",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              background: "linear-gradient(135deg, #7c5aff, #3b82f6, #22d3ee)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Describe it.
          </span>
          <span
            style={{
              fontSize: "72px",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              color: "rgba(255, 255, 255, 0.9)",
            }}
          >
            We build it.
          </span>
        </div>

        {/* Subline */}
        <span
          style={{
            fontSize: "24px",
            color: "rgba(255, 255, 255, 0.5)",
            marginTop: "24px",
            fontWeight: 400,
          }}
        >
          7 AI Agents • 60 Seconds • Production-Ready
        </span>

        {/* Bottom tag */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            display: "flex",
            gap: "24px",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "16px", color: "rgba(255, 255, 255, 0.35)" }}>
            zoobicon.com
          </span>
          <span style={{ fontSize: "16px", color: "rgba(255, 255, 255, 0.15)" }}>•</span>
          <span style={{ fontSize: "16px", color: "rgba(255, 255, 255, 0.35)" }}>
            zoobicon.ai
          </span>
          <span style={{ fontSize: "16px", color: "rgba(255, 255, 255, 0.15)" }}>•</span>
          <span style={{ fontSize: "16px", color: "rgba(255, 255, 255, 0.35)" }}>
            zoobicon.sh
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
