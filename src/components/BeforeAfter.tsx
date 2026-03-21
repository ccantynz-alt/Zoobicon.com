"use client";

import { useState, useRef, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { GripVertical, MessageSquare, Globe } from "lucide-react";

export default function BeforeAfter() {
  const [position, setPosition] = useState(40);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.min(Math.max((x / rect.width) * 100, 5), 95);
    setPosition(pct);
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);

      const onMouseMove = (ev: MouseEvent) => updatePosition(ev.clientX);
      const onMouseUp = () => {
        setIsDragging(false);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [updatePosition]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      setIsDragging(true);

      const onTouchMove = (ev: TouchEvent) => {
        ev.preventDefault();
        updatePosition(ev.touches[0].clientX);
      };
      const onTouchEnd = () => {
        setIsDragging(false);
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("touchend", onTouchEnd);
      };

      window.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("touchend", onTouchEnd);
    },
    [updatePosition]
  );

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      {/* Labels */}
      <div className="flex justify-between mb-3 px-1">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-white/50">
          <MessageSquare className="w-3.5 h-3.5" />
          Your Prompt
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-white/50">
          Your Website
          <Globe className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Main container */}
      <div
        ref={containerRef}
        className="relative w-full rounded-2xl overflow-hidden select-none"
        style={{
          aspectRatio: "16 / 10",
          border: "1px solid rgba(255,255,255,0.08)",
          cursor: isDragging ? "col-resize" : "default",
        }}
      >
        {/* === BEFORE SIDE (full width, clipped) === */}
        <div
          className="absolute inset-0 will-change-transform"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "#0a0a12" }}
          >
            {/* Grid pattern */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />

            {/* Prompt content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 sm:p-10">
              <div className="w-full max-w-md space-y-4">
                {/* Avatar + name */}
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
                    Y
                  </div>
                  <span className="text-sm font-medium text-white/70">You</span>
                </div>

                {/* Message bubble */}
                <div className="bg-white/[0.05] border border-white/[0.08] rounded-xl rounded-tl-sm p-4 sm:p-5">
                  <p className="text-sm sm:text-[15px] leading-relaxed text-white/80">
                    Build a modern SaaS landing page for an AI-powered project
                    management tool. Use a dark theme with purple accents,
                    include pricing, testimonials, and a demo video section.
                  </p>
                  {/* Blinking cursor */}
                  <motion.span
                    className="inline-block w-[2px] h-4 bg-purple-400 ml-0.5 align-middle"
                    animate={
                      prefersReducedMotion
                        ? {}
                        : { opacity: [1, 0, 1] }
                    }
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "steps(2)",
                    }}
                  />
                </div>

                {/* Subtext */}
                <p className="text-xs text-white/50 text-center pt-2 tracking-wide">
                  Just words. No code. No design skills.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* === AFTER SIDE (full width, clipped) === */}
        <div
          className="absolute inset-0 will-change-transform"
          style={{ clipPath: `inset(0 0 0 ${position}%)` }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(145deg, #0d0b1a 0%, #12101f 40%, #0f0d1a 100%)",
            }}
          >
            {/* Animated gradient border glow */}
            <motion.div
              className="absolute inset-0 rounded-2xl opacity-30 pointer-events-none"
              style={{
                background:
                  "linear-gradient(135deg, transparent 30%, rgba(139,92,246,0.15) 50%, transparent 70%)",
              }}
              animate={
                prefersReducedMotion
                  ? {}
                  : { backgroundPosition: ["0% 0%", "200% 200%"] }
              }
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />

            {/* Website mockup */}
            <div className="absolute inset-0 p-4 sm:p-6 flex flex-col gap-3 overflow-hidden">
              {/* Nav bar */}
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-gradient-to-br from-purple-500 to-indigo-500" />
                  <div className="w-16 h-2 rounded-full bg-white/20" />
                </div>
                <div className="hidden sm:flex items-center gap-3">
                  <div className="w-10 h-1.5 rounded-full bg-white/15" />
                  <div className="w-10 h-1.5 rounded-full bg-white/15" />
                  <div className="w-10 h-1.5 rounded-full bg-white/15" />
                  <div className="w-14 h-5 rounded-md bg-purple-600/80" />
                </div>
              </div>

              {/* Hero section */}
              <div className="flex-shrink-0 flex flex-col items-center text-center py-3 sm:py-4 gap-2">
                <div className="w-8 h-1.5 rounded-full bg-purple-500/40 mb-1" />
                <div className="w-3/4 max-w-[260px] h-3 rounded-full bg-white/25" />
                <div className="w-1/2 max-w-[180px] h-3 rounded-full bg-white/15" />
                <div className="w-2/3 max-w-[200px] h-1.5 rounded-full bg-white/8 mt-1" />
                <div className="flex gap-2 mt-2">
                  <div className="w-20 h-6 rounded-md bg-gradient-to-r from-purple-600 to-indigo-600" />
                  <div className="w-20 h-6 rounded-md border border-white/10 bg-white/[0.03]" />
                </div>
              </div>

              {/* Features grid */}
              <div className="grid grid-cols-3 gap-2 flex-shrink-0">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5 flex flex-col gap-1.5"
                  >
                    <div
                      className="w-5 h-5 rounded-md"
                      style={{
                        background: [
                          "linear-gradient(135deg, #7c3aed, #6366f1)",
                          "linear-gradient(135deg, #8b5cf6, #a78bfa)",
                          "linear-gradient(135deg, #6d28d9, #7c3aed)",
                        ][i],
                      }}
                    />
                    <div className="w-3/4 h-1.5 rounded-full bg-white/20" />
                    <div className="w-full h-1 rounded-full bg-white/8" />
                    <div className="w-2/3 h-1 rounded-full bg-white/8" />
                  </div>
                ))}
              </div>

              {/* Pricing section */}
              <div className="grid grid-cols-3 gap-2 flex-shrink-0">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="rounded-lg p-2 flex flex-col items-center gap-1"
                    style={{
                      background:
                        i === 1
                          ? "linear-gradient(180deg, rgba(139,92,246,0.15), rgba(139,92,246,0.05))"
                          : "rgba(255,255,255,0.02)",
                      border:
                        i === 1
                          ? "1px solid rgba(139,92,246,0.3)"
                          : "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div className="w-8 h-1 rounded-full bg-white/15" />
                    <div className="w-6 h-2 rounded-full bg-white/25 my-0.5" />
                    <div className="w-full space-y-0.5">
                      {[0, 1, 2].map((j) => (
                        <div
                          key={j}
                          className="w-full h-[3px] rounded-full bg-white/8"
                        />
                      ))}
                    </div>
                    <div
                      className="w-full h-4 rounded-md mt-1"
                      style={{
                        background:
                          i === 1
                            ? "linear-gradient(90deg, #7c3aed, #6366f1)"
                            : "rgba(255,255,255,0.06)",
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Testimonials */}
              <div className="flex gap-2 flex-shrink-0">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-lg bg-white/[0.02] border border-white/[0.05] p-2 flex flex-col gap-1"
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 opacity-60" />
                      <div className="w-10 h-1 rounded-full bg-white/15" />
                    </div>
                    <div className="w-full h-[3px] rounded-full bg-white/6" />
                    <div className="w-3/4 h-[3px] rounded-full bg-white/6" />
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 mt-auto border-t border-white/[0.05] pt-2 flex justify-between items-center px-1">
                <div className="w-12 h-1.5 rounded-full bg-white/10" />
                <div className="flex gap-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-3 h-3 rounded-full bg-white/8"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* === DIVIDER === */}
        <div
          className="absolute top-0 bottom-0 z-10"
          style={{
            left: `${position}%`,
            transform: "translateX(-50%)",
            cursor: "col-resize",
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {/* Glow line */}
          <div
            className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2"
            style={{
              width: "4px",
              background: "rgba(255,255,255,0.9)",
              boxShadow:
                "0 0 12px rgba(255,255,255,0.5), 0 0 30px rgba(139,92,246,0.3)",
            }}
          />

          {/* Drag handle */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full bg-white"
            style={{
              width: "40px",
              height: "40px",
              boxShadow:
                "0 0 20px rgba(139,92,246,0.4), 0 4px 12px rgba(0,0,0,0.4)",
              cursor: "col-resize",
            }}
          >
            <GripVertical className="w-5 h-5 text-gray-700" />
          </div>

          {/* Wider invisible hit area for easier dragging */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-10" />
        </div>
      </div>

      {/* Bottom text */}
      <div className="text-center mt-6">
        <p
          className="text-xl sm:text-2xl font-bold tracking-tight"
          style={{
            background: "linear-gradient(90deg, #a78bfa, #818cf8, #7c3aed)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 0 20px rgba(139,92,246,0.3))",
          }}
        >
          95 seconds. That&apos;s it.
        </p>
      </div>
    </div>
  );
}
