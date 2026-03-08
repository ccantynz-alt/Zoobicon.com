"use client";

import { useMemo } from "react";

interface PreviewPanelProps {
  html: string;
  isGenerating: boolean;
}

function AnimatedLogo() {
  return (
    <div className="relative w-64 h-64 flex items-center justify-center select-none">
      {/* Outer rotating ring */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "conic-gradient(from 0deg, transparent, #7c3aed, #00f0ff, #8b5cf6, transparent)",
          animation: "spin-slow 8s linear infinite",
          opacity: 0.3,
          filter: "blur(1px)",
        }}
      />
      {/* Inner counter-rotating ring */}
      <div
        className="absolute inset-6 rounded-full"
        style={{
          background: "conic-gradient(from 180deg, transparent, #00f0ff, #7c3aed, #ec4899, transparent)",
          animation: "spin-slow 6s linear infinite reverse",
          opacity: 0.25,
          filter: "blur(1px)",
        }}
      />
      {/* Pulsing glow backdrop */}
      <div
        className="absolute inset-10 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)",
          animation: "breathe 4s ease-in-out infinite",
        }}
      />
      {/* Dotted orbit ring 1 */}
      <div
        className="absolute inset-2 rounded-full border border-dashed border-brand-500/10"
        style={{ animation: "spin-slow 20s linear infinite" }}
      />
      {/* Dotted orbit ring 2 */}
      <div
        className="absolute inset-8 rounded-full border border-dashed border-accent-cyan/10"
        style={{ animation: "spin-slow 15s linear infinite reverse" }}
      />

      {/* Floating particles */}
      {[...Array(12)].map((_, i) => {
        const angle = (i / 12) * 360;
        const radius = 90 + (i % 3) * 15;
        const size = 2 + (i % 3);
        const color = i % 3 === 0 ? "#7c3aed" : i % 3 === 1 ? "#00f0ff" : "#ec4899";
        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: size,
              height: size,
              background: color,
              boxShadow: `0 0 ${size * 3}px ${color}`,
              top: `calc(50% + ${Math.sin((angle * Math.PI) / 180) * radius}px)`,
              left: `calc(50% + ${Math.cos((angle * Math.PI) / 180) * radius}px)`,
              animation: `twinkle ${2 + (i % 3)}s ease-in-out ${i * 0.3}s infinite`,
              transform: "translate(-50%, -50%)",
            }}
          />
        );
      })}

      {/* Center Z logo */}
      <div className="relative z-10 flex flex-col items-center">
        <div
          className="text-7xl font-black"
          style={{
            background: "linear-gradient(135deg, #a78bfa, #00f0ff, #8b5cf6)",
            backgroundSize: "200% 200%",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            animation: "gradient-drift 4s ease-in-out infinite",
            filter: "drop-shadow(0 0 20px rgba(124,58,237,0.4))",
          }}
        >
          Z
        </div>
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.15); opacity: 0.6; }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.8); }
        }
        @keyframes gradient-drift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}

/** Dramatic rotating blue light vortex for the generating state */
function GeneratingVortex() {
  return (
    <div className="relative w-80 h-80 flex items-center justify-center select-none">
      {/* Outer electric-blue rotating ring */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "conic-gradient(from 0deg, transparent 0%, #0066ff 15%, #00ccff 30%, transparent 45%, #3399ff 60%, #00eeff 75%, transparent 90%)",
          animation: "vortex-spin 2s linear infinite",
          opacity: 0.7,
          filter: "blur(2px)",
        }}
      />
      {/* Middle fast counter-rotating ring */}
      <div
        className="absolute inset-6 rounded-full"
        style={{
          background: "conic-gradient(from 90deg, transparent 0%, #00eeff 20%, #7c3aed 40%, transparent 55%, #00aaff 70%, #8b5cf6 85%, transparent 100%)",
          animation: "vortex-spin 1.5s linear infinite reverse",
          opacity: 0.6,
          filter: "blur(1px)",
        }}
      />
      {/* Inner fastest spinning ring */}
      <div
        className="absolute inset-14 rounded-full"
        style={{
          background: "conic-gradient(from 270deg, transparent, #00ddff, #4488ff, transparent, #00eeff, transparent)",
          animation: "vortex-spin 1s linear infinite",
          opacity: 0.8,
          filter: "blur(1px)",
        }}
      />

      {/* Electric glow pulse behind center */}
      <div
        className="absolute inset-16 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(0,200,255,0.4) 0%, rgba(0,100,255,0.15) 50%, transparent 70%)",
          animation: "electric-pulse 1.2s ease-in-out infinite",
        }}
      />

      {/* Orbiting light particles */}
      {[...Array(18)].map((_, i) => {
        const angle = (i / 18) * 360;
        const radius = 100 + (i % 4) * 20;
        const size = 2 + (i % 3) * 1.5;
        const isBlue = i % 3 !== 2;
        const color = isBlue ? (i % 2 === 0 ? "#00ddff" : "#3388ff") : "#8b5cf6";
        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: size,
              height: size,
              background: color,
              boxShadow: `0 0 ${size * 4}px ${color}, 0 0 ${size * 8}px ${color}40`,
              top: `calc(50% + ${Math.sin((angle * Math.PI) / 180) * radius}px)`,
              left: `calc(50% + ${Math.cos((angle * Math.PI) / 180) * radius}px)`,
              animation: `orbit-particle ${3 + (i % 3)}s linear ${i * 0.15}s infinite`,
              transform: "translate(-50%, -50%)",
            }}
          />
        );
      })}

      {/* Lightning streaks */}
      {[...Array(6)].map((_, i) => {
        const angle = (i / 6) * 360;
        return (
          <div
            key={`streak-${i}`}
            className="absolute"
            style={{
              width: "2px",
              height: "40px",
              background: `linear-gradient(to bottom, transparent, ${i % 2 === 0 ? "#00ddff" : "#4488ff"}, transparent)`,
              top: "50%",
              left: "50%",
              transformOrigin: "center center",
              transform: `rotate(${angle}deg) translateY(-90px)`,
              animation: `lightning-flash ${0.8 + (i % 3) * 0.4}s ease-in-out ${i * 0.2}s infinite`,
              opacity: 0,
            }}
          />
        );
      })}

      {/* Center pulsing Z */}
      <div className="relative z-10 flex flex-col items-center">
        <div
          className="text-5xl font-black"
          style={{
            background: "linear-gradient(135deg, #00ddff, #4488ff, #8b5cf6)",
            backgroundSize: "200% 200%",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            animation: "gradient-drift 2s ease-in-out infinite",
            filter: "drop-shadow(0 0 30px rgba(0,180,255,0.6))",
          }}
        >
          Z
        </div>
      </div>

      <style>{`
        @keyframes vortex-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes electric-pulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.3); opacity: 0.9; }
        }
        @keyframes orbit-particle {
          0% { opacity: 0.2; transform: translate(-50%, -50%) scale(0.5); }
          25% { opacity: 1; transform: translate(-50%, -50%) scale(1.5); }
          50% { opacity: 0.4; transform: translate(-50%, -50%) scale(1); }
          75% { opacity: 0.9; transform: translate(-50%, -50%) scale(1.3); }
          100% { opacity: 0.2; transform: translate(-50%, -50%) scale(0.5); }
        }
        @keyframes lightning-flash {
          0%, 100% { opacity: 0; }
          15% { opacity: 0.9; }
          30% { opacity: 0; }
          45% { opacity: 0.7; }
          55% { opacity: 0; }
        }
        @keyframes gradient-drift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}

export default function PreviewPanel({ html, isGenerating }: PreviewPanelProps) {
  const srcDoc = useMemo(() => html || "", [html]);

  if (isGenerating) {
    return (
      <div className="flex items-center justify-center h-full relative overflow-hidden">
        {/* Ambient background glow */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at center, rgba(0,100,255,0.08) 0%, rgba(0,50,200,0.03) 40%, transparent 70%)",
            animation: "bg-breathe 3s ease-in-out infinite",
          }}
        />
        <div className="text-center relative z-10">
          <GeneratingVortex />
          <p
            className="text-sm font-bold uppercase tracking-[4px] mt-4"
            style={{
              background: "linear-gradient(90deg, #00ddff, #4488ff, #8b5cf6, #00ddff)",
              backgroundSize: "300% 100%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "text-shimmer 2s linear infinite",
            }}
          >
            Building
          </p>
          <p className="text-[10px] text-blue-400/40 mt-2 tracking-wide">
            Claude is crafting your website...
          </p>
        </div>
        <style>{`
          @keyframes bg-breathe {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
          }
          @keyframes text-shimmer {
            0% { background-position: 0% 50%; }
            100% { background-position: 300% 50%; }
          }
        `}</style>
      </div>
    );
  }

  if (!html) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0a0a0f]">
        <div className="text-center">
          <AnimatedLogo />
          <p className="text-sm text-white/30 uppercase tracking-[3px] mt-2 mb-3">
            Ready to build
          </p>
          <p className="text-xs text-white/15 leading-relaxed max-w-xs mx-auto">
            Describe your website and hit Build to see it come to life.
          </p>
        </div>
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
