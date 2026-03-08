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

export default function PreviewPanel({ html, isGenerating }: PreviewPanelProps) {
  const srcDoc = useMemo(() => html || "", [html]);

  if (isGenerating) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="flex gap-1 justify-center mb-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-2 h-8 bg-brand-500/30 rounded-sm"
                style={{
                  animation: `pulse 1s ease-in-out ${i * 0.15}s infinite`,
                }}
              />
            ))}
          </div>
          <style>{`
            @keyframes pulse {
              0%, 100% { transform: scaleY(0.4); opacity: 0.3; }
              50% { transform: scaleY(1); opacity: 1; }
            }
          `}</style>
          <p className="text-sm text-brand-400/60 uppercase tracking-[3px]">
            Generating
          </p>
          <p className="text-[10px] text-white/20 mt-2">
            Claude is building your website...
          </p>
        </div>
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
