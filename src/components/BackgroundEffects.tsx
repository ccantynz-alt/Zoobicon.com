"use client";

/**
 * BackgroundEffects — reusable animated background layer for pages.
 *
 * Usage:
 *   <BackgroundEffects preset="default" />
 *
 * Presets control which combination of effects render:
 *   - "default"     : mesh gradient + particles + grid pulse
 *   - "energetic"   : mesh gradient + particles + spotlight + ambient lines
 *   - "calm"        : cool mesh gradient + radial pulses + vignette
 *   - "technical"   : grid pulse + constellation dots + ambient lines
 *   - "premium"     : purple mesh gradient + particles + radial pulses + spotlight
 *   - "minimal"     : mesh gradient + vignette (lightest weight)
 */

type Preset = "default" | "energetic" | "calm" | "technical" | "premium" | "minimal";

interface BackgroundEffectsProps {
  preset?: Preset;
  className?: string;
}

function Particles() {
  return (
    <div className="particles">
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} className="particle" />
      ))}
    </div>
  );
}

function ConstellationDots() {
  const dots = [
    { top: "8%", left: "12%" },
    { top: "15%", left: "45%" },
    { top: "22%", left: "78%" },
    { top: "35%", left: "28%" },
    { top: "42%", left: "62%" },
    { top: "48%", left: "88%" },
    { top: "55%", left: "8%" },
    { top: "60%", left: "52%" },
    { top: "68%", left: "35%" },
    { top: "72%", left: "72%" },
    { top: "78%", left: "18%" },
    { top: "82%", left: "58%" },
    { top: "88%", left: "42%" },
    { top: "92%", left: "82%" },
    { top: "30%", left: "92%" },
    { top: "65%", left: "5%" },
  ];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {dots.map((pos, i) => (
        <div
          key={i}
          className="constellation-dot"
          style={{ top: pos.top, left: pos.left }}
        />
      ))}
    </div>
  );
}

function AmbientLines() {
  return (
    <div className="ambient-lines">
      <div className="ambient-line" />
      <div className="ambient-line" />
      <div className="ambient-line" />
    </div>
  );
}

function RadialPulses() {
  return (
    <>
      <div className="radial-pulse radial-pulse-1" />
      <div className="radial-pulse radial-pulse-2" />
      <div className="radial-pulse radial-pulse-3" />
    </>
  );
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
      {/* Mesh gradient — most presets use one */}
      {(preset === "default" || preset === "energetic") && (
        <div className="mesh-gradient" />
      )}
      {preset === "calm" && <div className="mesh-gradient mesh-gradient-cool" />}
      {preset === "technical" && <div className="mesh-gradient mesh-gradient-cool" style={{ opacity: 0.5 }} />}
      {preset === "premium" && <div className="mesh-gradient mesh-gradient-purple" />}
      {preset === "minimal" && <div className="mesh-gradient" />}

      {/* Particles — floating dots */}
      {(preset === "default" || preset === "energetic" || preset === "premium") && (
        <Particles />
      )}

      {/* Grid pulse — breathing grid */}
      {(preset === "default" || preset === "technical") && (
        <div className="grid-pulse" />
      )}

      {/* Spotlight sweep */}
      {(preset === "energetic" || preset === "premium") && (
        <div className="spotlight" />
      )}

      {/* Radial pulses — soft glowing orbs */}
      {(preset === "calm" || preset === "premium") && <RadialPulses />}

      {/* Constellation dots */}
      {preset === "technical" && <ConstellationDots />}

      {/* Ambient lines */}
      {(preset === "energetic" || preset === "technical") && <AmbientLines />}

      {/* Vignette — darkened edges */}
      {(preset === "calm" || preset === "minimal") && <div className="vignette" />}
    </div>
  );
}
