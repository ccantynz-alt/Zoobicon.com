"use client";

import { useEffect, useState } from "react";

interface StatusBarProps {
  status: "idle" | "generating" | "editing" | "complete" | "error";
  pipelineStep?: string;
}

export default function StatusBar({ status, pipelineStep }: StatusBarProps) {
  const isActive = status === "generating" || status === "editing";
  const isComplete = status === "complete";
  const isError = status === "error";

  // Animate progress from 0→90% during generation, jump to 100% on complete
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isActive) {
      setProgress(5);
      // Gradually increase to ~90% over ~90 seconds (ease-out feel)
      const interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 90) return 90;
          // Slow down as we approach 90
          const increment = Math.max(0.3, (90 - p) * 0.02);
          return Math.min(90, p + increment);
        });
      }, 500);
      return () => clearInterval(interval);
    } else if (isComplete) {
      setProgress(100);
    } else if (isError) {
      // Keep current position on error
    } else {
      setProgress(0);
    }
  }, [isActive, isComplete, isError]);

  const statusLabel =
    status === "idle"
      ? "Ready"
      : status === "generating"
      ? pipelineStep || "Building your website..."
      : status === "editing"
      ? pipelineStep || "Applying edits..."
      : status === "complete"
      ? "Build Complete!"
      : "Error";

  const dotColor =
    status === "idle"
      ? "bg-white/20"
      : status === "generating" || status === "editing"
      ? "bg-blue-400 shadow-[0_0_6px_rgba(0,150,255,0.6)]"
      : status === "complete"
      ? "bg-green-500 shadow-[0_0_6px_rgba(0,200,100,0.6)]"
      : "bg-red-500";

  return (
    <footer className="relative flex items-center px-4 py-1.5 border-t border-white/[0.06] bg-[#12121a]/80 text-[10px] tracking-wide overflow-hidden h-8">
      {/* Left: status dot + label */}
      <div className="flex items-center gap-2 min-w-0 shrink-0 z-10">
        <div
          className={`w-1.5 h-1.5 rounded-full transition-colors ${dotColor} ${
            isActive ? "animate-pulse" : ""
          }`}
        />
        <span
          className={`truncate ${
            isActive ? "text-blue-400/70" : isComplete ? "text-green-400/70" : isError ? "text-red-400/70" : "text-white/30"
          }`}
        >
          {statusLabel}
        </span>
      </div>

      {/* Center: stick figure progress track */}
      {(isActive || isComplete) && (
        <div className="absolute inset-x-0 bottom-0 top-0 flex items-center pointer-events-none">
          <div className="relative w-full mx-24">
            {/* Track line */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/[0.06]" />
            {/* Progress fill */}
            <div
              className="absolute top-1/2 left-0 h-px bg-gradient-to-r from-blue-500/40 to-blue-400/60 transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
            {/* Milestone dots */}
            {[0, 25, 50, 75, 100].map((pos) => (
              <div
                key={pos}
                className={`absolute top-1/2 -translate-y-1/2 w-1 h-1 rounded-full transition-colors duration-500 ${
                  progress >= pos ? "bg-blue-400/60" : "bg-white/10"
                }`}
                style={{ left: `${pos}%` }}
              />
            ))}
            {/* Finish flag at the end */}
            <div className="absolute top-1/2 -translate-y-1/2 right-0 translate-x-1">
              <svg width="10" height="14" viewBox="0 0 10 14" className={`transition-colors duration-500 ${isComplete ? "text-green-400" : "text-white/20"}`}>
                <line x1="1" y1="0" x2="1" y2="14" stroke="currentColor" strokeWidth="1" />
                <rect x="1" y="0" width="8" height="5" fill="currentColor" opacity={isComplete ? "0.8" : "0.3"} />
                <rect x="1" y="0" width="4" height="2.5" fill={isComplete ? "#0a0a0f" : "transparent"} opacity="0.5" />
                <rect x="5" y="2.5" width="4" height="2.5" fill={isComplete ? "#0a0a0f" : "transparent"} opacity="0.5" />
              </svg>
            </div>
            {/* Stick figure runner */}
            <div
              className="absolute top-1/2 transition-all ease-out"
              style={{
                left: `${progress}%`,
                transitionDuration: isComplete ? "600ms" : "700ms",
                transform: "translate(-50%, -50%)",
              }}
            >
              <svg
                width="16"
                height="20"
                viewBox="0 0 16 20"
                className={`${isActive ? "runner-animate" : ""} ${isComplete ? "text-green-400" : isError ? "text-red-400" : "text-blue-400"}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* Head */}
                <circle cx="8" cy="3" r="2" />
                {/* Body */}
                <line x1="8" y1="5" x2="8" y2="12" />
                {/* Arms - animated via CSS */}
                <line x1="8" y1="7" x2="4" y2="9" className="runner-arm-l" />
                <line x1="8" y1="7" x2="12" y2="9" className="runner-arm-r" />
                {/* Legs - animated via CSS */}
                <line x1="8" y1="12" x2="5" y2="17" className="runner-leg-l" />
                <line x1="8" y1="12" x2="11" y2="17" className="runner-leg-r" />
              </svg>
              {isComplete && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] text-green-400 font-bold whitespace-nowrap animate-bounce">
                  Done!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Right: branding */}
      <div className="ml-auto flex items-center gap-4 text-white/20 z-10">
        <span>Powered by Claude</span>
        <span>Zoobicon v0.1.0</span>
      </div>

      <style>{`
        @keyframes runner-stride {
          0%, 100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(25deg);
          }
          75% {
            transform: rotate(-25deg);
          }
        }
        @keyframes runner-stride-reverse {
          0%, 100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(-25deg);
          }
          75% {
            transform: rotate(25deg);
          }
        }
        .runner-animate .runner-arm-l,
        .runner-animate .runner-leg-l {
          transform-origin: 8px 7px;
          animation: runner-stride 0.5s ease-in-out infinite;
        }
        .runner-animate .runner-arm-r,
        .runner-animate .runner-leg-r {
          transform-origin: 8px 7px;
          animation: runner-stride-reverse 0.5s ease-in-out infinite;
        }
        .runner-animate .runner-leg-l {
          transform-origin: 8px 12px;
          animation: runner-stride 0.5s ease-in-out infinite;
        }
        .runner-animate .runner-leg-r {
          transform-origin: 8px 12px;
          animation: runner-stride-reverse 0.5s ease-in-out infinite;
        }
      `}</style>
    </footer>
  );
}
