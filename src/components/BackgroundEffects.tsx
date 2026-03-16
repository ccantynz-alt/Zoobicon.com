"use client";

/**
 * BackgroundEffects — subtle background layer for pages.
 *
 * Presets control the mesh gradient and grid pulse behind content.
 */

type Preset = "default" | "energetic" | "calm" | "technical" | "premium" | "minimal";

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
    >
      {/* Mesh gradient */}
      {(preset === "default" || preset === "energetic") && (
        <div className="mesh-gradient" />
      )}
      {preset === "calm" && <div className="mesh-gradient mesh-gradient-cool" />}
      {preset === "technical" && <div className="mesh-gradient mesh-gradient-cool" style={{ opacity: 0.5 }} />}
      {preset === "premium" && <div className="mesh-gradient mesh-gradient-purple" />}
      {preset === "minimal" && <div className="mesh-gradient" />}

      {/* Grid pulse */}
      {(preset === "default" || preset === "technical") && (
        <div className="grid-pulse" />
      )}
    </div>
  );
}
