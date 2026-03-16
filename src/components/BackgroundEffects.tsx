"use client";

/**
 * BackgroundEffects — dramatic fog background layer for pages.
 *
 * Two layers:
 *   1. Background layer (z-0): mesh gradient, grid — behind content
 *   2. Fog overlay (z-10): bold drifting fog — in front of content, below nav (z-50)
 *
 * Presets:
 *   - "default"     : mesh gradient + bold white fog
 *   - "energetic"   : mesh gradient + bold white fog (thicker)
 *   - "calm"        : cool mesh gradient + white fog + vignette
 *   - "technical"   : grid pulse + white fog
 *   - "premium"     : purple mesh gradient + gold fog
 *   - "minimal"     : mesh gradient + light white fog + vignette
 */

type Preset = "default" | "energetic" | "calm" | "technical" | "premium" | "minimal";

interface BackgroundEffectsProps {
  preset?: Preset;
  className?: string;
}

function FogOverlay({ variant = "white", intensity = "bold" }: { variant?: "white" | "gold"; intensity?: "bold" | "medium" | "light" }) {
  const intensityClass = `fog-${intensity}`;
  return (
    <div className={`fog-overlay fog-${variant} ${intensityClass}`}>
      <div className="fog-cloud fog-cloud-1" />
      <div className="fog-cloud fog-cloud-2" />
      <div className="fog-cloud fog-cloud-3" />
      <div className="fog-cloud fog-cloud-4" />
      <div className="fog-cloud fog-cloud-5" />
    </div>
  );
}

export default function BackgroundEffects({
  preset = "default",
  className = "",
}: BackgroundEffectsProps) {
  // Determine fog settings per preset
  const fogVariant = preset === "premium" ? "gold" : "white";
  const fogIntensity =
    preset === "energetic" ? "bold" :
    preset === "minimal" ? "light" :
    preset === "calm" ? "medium" :
    "bold";

  return (
    <>
      {/* Background layer — behind content */}
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

      {/* Fog overlay — IN FRONT of content, below nav */}
      <div
        className="fixed inset-0 pointer-events-none z-10 overflow-hidden"
        aria-hidden="true"
      >
        <FogOverlay variant={fogVariant} intensity={fogIntensity} />
      </div>

      {/* Vignette */}
      {(preset === "calm" || preset === "minimal") && (
        <div className="fixed inset-0 pointer-events-none z-[11] vignette" aria-hidden="true" />
      )}
    </>
  );
}
