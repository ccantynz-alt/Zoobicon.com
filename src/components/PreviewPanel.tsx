"use client";

import { useMemo } from "react";

interface PreviewPanelProps {
  html: string;
  isGenerating: boolean;
}

/** Particle field — scattered glowing dots across the entire canvas */
function ParticleField({ count, speed }: { count: number; speed: number }) {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1.5 + Math.random() * 2.5,
      delay: Math.random() * 8,
      duration: (4 + Math.random() * 6) / speed,
      drift: 10 + Math.random() * 30,
      opacity: 0.15 + Math.random() * 0.4,
      hue: 200 + Math.random() * 30, // blue range
    }));
  }, [count, speed]);

  return (
    <>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: `hsl(${p.hue}, 80%, 65%)`,
            boxShadow: `0 0 ${p.size * 3}px hsla(${p.hue}, 80%, 65%, 0.6)`,
            animation: `particle-float ${p.duration}s ease-in-out ${p.delay}s infinite`,
            opacity: p.opacity,
            ["--drift" as string]: `${p.drift}px`,
          }}
        />
      ))}
    </>
  );
}

/** Full-screen atmospheric idle background */
function IdleAtmosphere() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base deep gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 120%, #0c1929 0%, #0a0a0f 60%)",
        }}
      />

      {/* Aurora band 1 — wide, slow, top area */}
      <div
        className="absolute w-[140%] h-[300px] -left-[20%] top-[10%]"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(37,99,235,0.06) 20%, rgba(14,165,233,0.08) 40%, rgba(59,130,246,0.05) 60%, rgba(0,240,255,0.04) 80%, transparent 100%)",
          filter: "blur(60px)",
          animation: "aurora-drift-1 20s ease-in-out infinite",
          transform: "rotate(-3deg)",
        }}
      />

      {/* Aurora band 2 — mid area, counter-drift */}
      <div
        className="absolute w-[130%] h-[250px] -left-[15%] top-[35%]"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(0,200,255,0.04) 25%, rgba(37,99,235,0.07) 50%, rgba(96,165,250,0.05) 75%, transparent 100%)",
          filter: "blur(70px)",
          animation: "aurora-drift-2 25s ease-in-out infinite",
          transform: "rotate(2deg)",
        }}
      />

      {/* Aurora band 3 — lower, subtle warm blue */}
      <div
        className="absolute w-[120%] h-[200px] -left-[10%] bottom-[15%]"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.05) 30%, rgba(14,165,233,0.06) 50%, rgba(37,99,235,0.04) 70%, transparent 100%)",
          filter: "blur(80px)",
          animation: "aurora-drift-3 18s ease-in-out infinite",
          transform: "rotate(-1deg)",
        }}
      />

      {/* Mesh gradient overlay — slowly shifting */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 20% 50%, rgba(37,99,235,0.04) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 30%, rgba(0,200,255,0.03) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 80%, rgba(59,130,246,0.03) 0%, transparent 50%)
          `,
          animation: "mesh-shift 30s ease-in-out infinite",
        }}
      />

      {/* Particles */}
      <ParticleField count={35} speed={1} />

      {/* Subtle horizontal light streaks */}
      <div
        className="absolute top-[25%] left-0 w-full h-[1px]"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(96,165,250,0.1) 30%, rgba(0,200,255,0.15) 50%, rgba(96,165,250,0.1) 70%, transparent 100%)",
          animation: "streak-glow 8s ease-in-out infinite",
        }}
      />
      <div
        className="absolute top-[55%] left-0 w-full h-[1px]"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(37,99,235,0.08) 20%, rgba(14,165,233,0.12) 45%, rgba(37,99,235,0.08) 80%, transparent 100%)",
          animation: "streak-glow 10s ease-in-out 3s infinite",
        }}
      />

      {/* Bottom glow — like light reflecting off water */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[40%]"
        style={{
          background: "linear-gradient(to top, rgba(37,99,235,0.04) 0%, transparent 100%)",
          animation: "bottom-breathe 12s ease-in-out infinite",
        }}
      />
    </div>
  );
}

/** Full-screen atmospheric generating background — everything intensified */
function GeneratingAtmosphere() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base deep gradient — slightly more alive */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, #0d1f3c 0%, #0a0a0f 70%)",
        }}
      />

      {/* Aurora band 1 — FASTER, BRIGHTER */}
      <div
        className="absolute w-[160%] h-[350px] -left-[30%] top-[5%]"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(37,99,235,0.12) 15%, rgba(14,165,233,0.18) 35%, rgba(0,200,255,0.14) 55%, rgba(59,130,246,0.10) 75%, transparent 100%)",
          filter: "blur(50px)",
          animation: "aurora-gen-1 8s ease-in-out infinite",
          transform: "rotate(-4deg)",
        }}
      />

      {/* Aurora band 2 — mid, pulsing */}
      <div
        className="absolute w-[150%] h-[300px] -left-[25%] top-[30%]"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(0,200,255,0.10) 20%, rgba(37,99,235,0.16) 45%, rgba(96,165,250,0.12) 65%, rgba(0,240,255,0.08) 85%, transparent 100%)",
          filter: "blur(55px)",
          animation: "aurora-gen-2 10s ease-in-out infinite",
          transform: "rotate(3deg)",
        }}
      />

      {/* Aurora band 3 — lower, waves */}
      <div
        className="absolute w-[140%] h-[280px] -left-[20%] bottom-[5%]"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.10) 25%, rgba(14,165,233,0.14) 50%, rgba(37,99,235,0.08) 75%, transparent 100%)",
          filter: "blur(60px)",
          animation: "aurora-gen-3 7s ease-in-out infinite",
          transform: "rotate(-2deg)",
        }}
      />

      {/* Active mesh gradient — shifts faster */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 30% 40%, rgba(37,99,235,0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 60%, rgba(0,200,255,0.06) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 20%, rgba(96,165,250,0.05) 0%, transparent 50%)
          `,
          animation: "mesh-shift-fast 12s ease-in-out infinite",
        }}
      />

      {/* MORE particles, FASTER */}
      <ParticleField count={60} speed={2} />

      {/* Energy wave pulses — horizontal bands that wash across */}
      <div
        className="absolute top-[20%] left-0 w-full h-[2px]"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(96,165,250,0.25) 30%, rgba(0,240,255,0.35) 50%, rgba(96,165,250,0.25) 70%, transparent 100%)",
          animation: "energy-wave 3s ease-in-out infinite",
        }}
      />
      <div
        className="absolute top-[45%] left-0 w-full h-[2px]"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(37,99,235,0.20) 25%, rgba(14,165,233,0.30) 50%, rgba(37,99,235,0.20) 75%, transparent 100%)",
          animation: "energy-wave 4s ease-in-out 1s infinite",
        }}
      />
      <div
        className="absolute top-[70%] left-0 w-full h-[2px]"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(0,200,255,0.15) 20%, rgba(59,130,246,0.25) 50%, rgba(0,200,255,0.15) 80%, transparent 100%)",
          animation: "energy-wave 3.5s ease-in-out 2s infinite",
        }}
      />

      {/* Vertical light columns — like creation beams */}
      <div
        className="absolute top-0 bottom-0 left-[25%] w-[1px]"
        style={{
          background: "linear-gradient(to bottom, transparent 0%, rgba(96,165,250,0.12) 30%, rgba(0,200,255,0.18) 50%, rgba(96,165,250,0.12) 70%, transparent 100%)",
          animation: "column-pulse 5s ease-in-out infinite",
        }}
      />
      <div
        className="absolute top-0 bottom-0 left-[50%] w-[1px]"
        style={{
          background: "linear-gradient(to bottom, transparent 0%, rgba(37,99,235,0.10) 25%, rgba(14,165,233,0.15) 50%, rgba(37,99,235,0.10) 75%, transparent 100%)",
          animation: "column-pulse 6s ease-in-out 2s infinite",
        }}
      />
      <div
        className="absolute top-0 bottom-0 left-[75%] w-[1px]"
        style={{
          background: "linear-gradient(to bottom, transparent 0%, rgba(0,200,255,0.08) 20%, rgba(59,130,246,0.14) 50%, rgba(0,200,255,0.08) 80%, transparent 100%)",
          animation: "column-pulse 4.5s ease-in-out 1s infinite",
        }}
      />

      {/* Bottom glow — intensified */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[50%]"
        style={{
          background: "linear-gradient(to top, rgba(37,99,235,0.08) 0%, rgba(14,165,233,0.03) 40%, transparent 100%)",
          animation: "bottom-breathe-fast 6s ease-in-out infinite",
        }}
      />

      {/* Central convergence glow — where creation happens */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, rgba(37,99,235,0.06) 0%, transparent 50%)",
          animation: "core-pulse 3s ease-in-out infinite",
        }}
      />
    </div>
  );
}

export default function PreviewPanel({ html, isGenerating }: PreviewPanelProps) {
  const srcDoc = useMemo(() => html || "", [html]);

  const sharedStyles = `
    @keyframes particle-float {
      0%, 100% {
        transform: translateY(0) translateX(0);
        opacity: var(--base-opacity, 0.3);
      }
      25% {
        transform: translateY(calc(var(--drift) * -1)) translateX(calc(var(--drift) * 0.5));
        opacity: 0.7;
      }
      50% {
        transform: translateY(calc(var(--drift) * -0.5)) translateX(calc(var(--drift) * -0.3));
        opacity: 0.2;
      }
      75% {
        transform: translateY(calc(var(--drift) * 0.3)) translateX(calc(var(--drift) * -0.8));
        opacity: 0.6;
      }
    }
    @keyframes aurora-drift-1 {
      0%, 100% { transform: rotate(-3deg) translateX(0); }
      50% { transform: rotate(-3deg) translateX(80px); }
    }
    @keyframes aurora-drift-2 {
      0%, 100% { transform: rotate(2deg) translateX(0); }
      50% { transform: rotate(2deg) translateX(-60px); }
    }
    @keyframes aurora-drift-3 {
      0%, 100% { transform: rotate(-1deg) translateX(0) scaleY(1); }
      50% { transform: rotate(-1deg) translateX(50px) scaleY(1.3); }
    }
    @keyframes aurora-gen-1 {
      0%, 100% { transform: rotate(-4deg) translateX(0); opacity: 0.7; }
      50% { transform: rotate(-4deg) translateX(120px); opacity: 1; }
    }
    @keyframes aurora-gen-2 {
      0%, 100% { transform: rotate(3deg) translateX(0); opacity: 0.6; }
      50% { transform: rotate(3deg) translateX(-100px); opacity: 1; }
    }
    @keyframes aurora-gen-3 {
      0%, 100% { transform: rotate(-2deg) translateX(0) scaleY(1); opacity: 0.7; }
      50% { transform: rotate(-2deg) translateX(80px) scaleY(1.4); opacity: 1; }
    }
    @keyframes mesh-shift {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
    @keyframes mesh-shift-fast {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.7; transform: scale(1.05); }
    }
    @keyframes streak-glow {
      0%, 100% { opacity: 0.3; transform: scaleX(0.8); }
      50% { opacity: 1; transform: scaleX(1); }
    }
    @keyframes bottom-breathe {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 1; }
    }
    @keyframes bottom-breathe-fast {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }
    @keyframes energy-wave {
      0% { opacity: 0; transform: scaleX(0.3) translateX(-30%); }
      50% { opacity: 1; transform: scaleX(1) translateX(0); }
      100% { opacity: 0; transform: scaleX(0.3) translateX(30%); }
    }
    @keyframes column-pulse {
      0%, 100% { opacity: 0.2; }
      50% { opacity: 0.8; }
    }
    @keyframes core-pulse {
      0%, 100% { opacity: 0.4; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.1); }
    }
    @keyframes text-shimmer {
      0% { background-position: 0% 50%; }
      100% { background-position: 300% 50%; }
    }
  `;

  if (isGenerating) {
    return (
      <div className="relative h-full overflow-hidden">
        <GeneratingAtmosphere />

        {/* Centered text — minimal, floating over the atmosphere */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center">
            <p
              className="text-sm font-bold uppercase tracking-[6px]"
              style={{
                background: "linear-gradient(90deg, #60a5fa, #00ddff, #3b82f6, #60a5fa)",
                backgroundSize: "300% 100%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                animation: "text-shimmer 2.5s linear infinite",
              }}
            >
              Creating
            </p>
            <p className="text-[10px] text-blue-400/30 mt-3 tracking-widest uppercase">
              Claude is building your site
            </p>
          </div>
        </div>

        <style>{sharedStyles}</style>
      </div>
    );
  }

  if (!html) {
    return (
      <div className="relative h-full overflow-hidden">
        <IdleAtmosphere />

        {/* Centered text — minimal, floating over the atmosphere */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center">
            <p className="text-sm text-white/25 uppercase tracking-[5px] mb-3">
              Ready to build
            </p>
            <p className="text-xs text-white/12 leading-relaxed max-w-xs mx-auto">
              Describe your website and watch it come to life
            </p>
          </div>
        </div>

        <style>{sharedStyles}</style>
      </div>
    );
  }

  return (
    <iframe
      srcDoc={srcDoc}
      className="w-full h-full border-0 bg-white"
      title="Website preview"
      sandbox="allow-scripts allow-same-origin"
    />
  );
}
