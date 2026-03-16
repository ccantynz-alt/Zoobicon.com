"use client";

/**
 * BackgroundEffects — dramatic fog background layer for pages.
 *
 * Presets:
 *   - "default"     : mesh gradient + bold white fog
 *   - "energetic"   : mesh gradient + bold white fog (thicker)
 *   - "calm"        : cool mesh gradient + white fog + vignette
 *   - "technical"   : grid pulse + white fog
 *   - "premium"     : purple mesh gradient + gold fog
 *   - "minimal"     : mesh gradient + light white fog + vignette
 *   - "contrast"    : mesh gradient + black & white fog
 *   - "blackfog"    : pure black background + thick dark smoke clouds
 */

type Preset = "default" | "energetic" | "calm" | "technical" | "premium" | "minimal" | "contrast" | "blackfog";

interface BackgroundEffectsProps {
  preset?: Preset;
  className?: string;
}

function FogOverlay({ variant = "white", intensity = "bold" }: { variant?: "white" | "gold" | "contrast" | "black"; intensity?: "bold" | "medium" | "light" }) {
  const intensityClass = `fog-${intensity}`;
  return (
    <div className={`fog-overlay fog-${variant} ${intensityClass}`}>
      <div className="fog-cloud fog-cloud-1" />
      <div className="fog-cloud fog-cloud-2" />
      <div className="fog-cloud fog-cloud-3" />
      <div className="fog-cloud fog-cloud-4" />
      <div className="fog-cloud fog-cloud-5" />
      {(variant === "contrast" || variant === "black") && (
        <>
          <div className="fog-cloud-6" />
          <div className="fog-cloud-7" />
        </>
      )}
    </div>
  );
}

export default function BackgroundEffects({
  preset = "default",
  className = "",
}: BackgroundEffectsProps) {
  const fogVariant =
    preset === "premium" ? "gold" :
    preset === "contrast" ? "contrast" :
    preset === "blackfog" ? "black" :
    "white";

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
        {(preset === "default" || preset === "energetic") && (
          <div className="mesh-gradient" />
        )}
        {preset === "calm" && <div className="mesh-gradient mesh-gradient-cool" />}
        {preset === "technical" && <div className="mesh-gradient mesh-gradient-cool" style={{ opacity: 0.5 }} />}
        {preset === "premium" && <div className="mesh-gradient mesh-gradient-purple" />}
        {preset === "minimal" && <div className="mesh-gradient" />}
        {preset === "contrast" && <div className="mesh-gradient mesh-gradient-contrast" />}
        {/* blackfog = no mesh gradient, pure black bg handled by bg-void class on body/container */}

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
      {(preset === "calm" || preset === "minimal" || preset === "contrast" || preset === "blackfog") && (
        <div className="fixed inset-0 pointer-events-none z-[11] vignette" aria-hidden="true" />
      )}
    </>
  );
}
