"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Sparkles } from "lucide-react";

/**
 * Autoplay-on-scroll video for the homepage AI Video Creator demo.
 *
 * Behavior:
 *  - Attempts to load `src` (default: /samples/ai-spokesperson-demo.mp4).
 *  - When 40% of the element enters the viewport, video.play() fires.
 *  - When the element leaves the viewport, video.pause() fires.
 *  - If the video fails to load (404 / decode error), a cinematic
 *    animated fallback renders in its place — the UI never looks broken.
 *
 * Mobile autoplay requires muted + playsInline. Both are set.
 */
export default function AutoplayVideo({
  src = "/samples/ai-spokesperson-demo.mp4",
  poster,
  className = "",
}: {
  src?: string;
  poster?: string;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    const video = videoRef.current;
    if (!el || !video || failed) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio >= 0.4) {
            video.play().catch(() => {
              // Autoplay was blocked — fall back to animated preview
              setFailed(true);
            });
          } else {
            video.pause();
          }
        }
      },
      { threshold: [0, 0.4, 0.75, 1] }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [failed]);

  return (
    <div
      ref={containerRef}
      className={`relative aspect-video overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 ${className}`}
    >
      {!failed && (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          muted
          loop
          playsInline
          preload="metadata"
          onCanPlay={() => setReady(true)}
          onError={() => setFailed(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            ready ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {/* Cinematic animated fallback — always rendered underneath so the
          transition from fallback → video is seamless when the video loads. */}
      {(!ready || failed) && <CinematicPreview />}
    </div>
  );
}

function CinematicPreview() {
  return (
    <div className="absolute inset-0">
      {/* ambient orbs */}
      <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-cyan-500/20 blur-[100px] animate-pulse" />
      <div
        className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-violet-500/20 blur-[100px] animate-pulse"
        style={{ animationDelay: "1.2s" }}
      />
      <div
        className="absolute top-1/2 left-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-500/10 blur-[80px] animate-pulse"
        style={{ animationDelay: "0.6s" }}
      />

      {/* dot grid */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* centre composition — "talking head" silhouette + pulsing rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          {/* pulsing rings */}
          <div className="absolute inset-0 -m-8 rounded-full border border-cyan-400/20 animate-ping" />
          <div
            className="absolute inset-0 -m-4 rounded-full border border-cyan-400/30 animate-ping"
            style={{ animationDelay: "0.4s", animationDuration: "2.2s" }}
          />

          {/* avatar disc */}
          <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-cyan-400/40 via-blue-500/30 to-violet-500/40 p-[1px] shadow-2xl shadow-cyan-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-zinc-900/80 backdrop-blur">
              <Sparkles className="h-8 w-8 text-cyan-300" />
            </div>
          </div>
        </div>
      </div>

      {/* waveform strip */}
      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-end gap-1">
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            className="block w-1 origin-bottom rounded-full bg-gradient-to-t from-cyan-400/60 to-violet-400/60"
            style={{
              height: `${8 + Math.sin(i * 0.6) * 10 + 10}px`,
              animation: `autoplay-waveform 1.4s ease-in-out ${i * 0.05}s infinite`,
            }}
          />
        ))}
      </div>

      {/* label */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 whitespace-nowrap">
        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/30">
          AI spokesperson preview
        </span>
      </div>

      {/* play badge */}
      <div className="absolute top-4 right-4">
        <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 backdrop-blur">
          <Play className="h-2.5 w-2.5 text-white/70" fill="currentColor" />
          <span className="text-[10px] font-medium text-white/70">LIVE</span>
        </div>
      </div>

    </div>
  );
}
