"use client";

/**
 * BackgroundEffects — subtle background layer for pages.
 *
 * Presets control the mesh gradient and grid pulse behind content.
 */

type Preset = "default" | "energetic" | "calm" | "technical" | "premium" | "minimal" | "contrast" | "blackfog" | "dashboard" | "admin";

interface BackgroundEffectsProps {
  preset?: Preset;
  className?: string;
}

export default function BackgroundEffects({
  preset = "default",
  className = "",
}: BackgroundEffectsProps) {
  return (
    <div
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden ${className}`}
      aria-hidden="true"
      style={{ WebkitBackfaceVisibility: "hidden", willChange: "auto" }}
    >
      {/* Mesh gradient */}
      {(preset === "default" || preset === "energetic") && (
        <div className="mesh-gradient" />
      )}
      {preset === "calm" && <div className="mesh-gradient mesh-gradient-cool" />}
      {preset === "technical" && <div className="mesh-gradient mesh-gradient-cool" style={{ opacity: 0.5 }} />}
      {preset === "premium" && <div className="mesh-gradient mesh-gradient-purple" />}
      {preset === "minimal" && <div className="mesh-gradient" />}
      {preset === "contrast" && <div className="mesh-gradient" style={{ opacity: 0.7, filter: "hue-rotate(20deg) saturate(1.3)" }} />}
      {preset === "blackfog" && <div className="mesh-gradient" style={{ opacity: 0.4, filter: "saturate(0.6) brightness(0.7)" }} />}
      {preset === "dashboard" && <div className="mesh-gradient mesh-gradient-cool" style={{ opacity: 0.9, filter: "brightness(1.3) saturate(1.2)" }} />}
      {preset === "admin" && <div className="mesh-gradient mesh-gradient-admin" style={{ opacity: 1 }} />}

      {/* Grid pulse */}
      {(preset === "default" || preset === "technical" || preset === "contrast") && (
        <div className="grid-pulse" />
      )}
    </div>
  );
}
