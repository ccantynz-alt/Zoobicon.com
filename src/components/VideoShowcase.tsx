"use client";

import { useState } from "react";
import { Play, Pause, Volume2, Maximize2, SkipForward, Heart, Share2, MessageCircle } from "lucide-react";

interface VideoCard {
  id: string;
  title: string;
  platform: string;
  duration: string;
  views: string;
  style: string;
  gradient: string;
  aspectRatio: string;
  mockContent: {
    headline: string;
    subtext: string;
    accent: string;
  };
}

const SHOWCASE_VIDEOS: VideoCard[] = [
  {
    id: "1",
    title: "Fitness App Launch",
    platform: "TikTok",
    duration: "0:30",
    views: "2.4M",
    style: "Energetic",
    gradient: "from-red-600 via-orange-500 to-yellow-500",
    aspectRatio: "aspect-[9/16]",
    mockContent: {
      headline: "TRANSFORM YOUR BODY",
      subtext: "Download FitPro Today",
      accent: "#FF6B35",
    },
  },
  {
    id: "2",
    title: "SaaS Product Demo",
    platform: "YouTube",
    duration: "1:20",
    views: "890K",
    style: "Cinematic",
    gradient: "from-blue-600 via-indigo-600 to-purple-600",
    aspectRatio: "aspect-video",
    mockContent: {
      headline: "Ship 10x Faster",
      subtext: "AI-Powered Development",
      accent: "#5B7CF7",
    },
  },
  {
    id: "3",
    title: "Restaurant Promo",
    platform: "Instagram",
    duration: "0:15",
    views: "1.1M",
    style: "Luxury",
    gradient: "from-amber-800 via-amber-600 to-yellow-500",
    aspectRatio: "aspect-square",
    mockContent: {
      headline: "Fine Dining Redefined",
      subtext: "Reserve Your Table",
      accent: "#D4A574",
    },
  },
  {
    id: "4",
    title: "E-Commerce Drop",
    platform: "Facebook",
    duration: "0:45",
    views: "3.2M",
    style: "Playful",
    gradient: "from-pink-500 via-rose-500 to-red-500",
    aspectRatio: "aspect-video",
    mockContent: {
      headline: "50% OFF EVERYTHING",
      subtext: "Limited Time Only",
      accent: "#EC4899",
    },
  },
  {
    id: "5",
    title: "Tech Startup Intro",
    platform: "LinkedIn",
    duration: "1:00",
    views: "450K",
    style: "Corporate",
    gradient: "from-slate-700 via-blue-800 to-indigo-900",
    aspectRatio: "aspect-video",
    mockContent: {
      headline: "The Future of Work",
      subtext: "Enterprise AI Solutions",
      accent: "#60A5FA",
    },
  },
  {
    id: "6",
    title: "Music Festival",
    platform: "TikTok",
    duration: "0:20",
    views: "5.7M",
    style: "Neon",
    gradient: "from-purple-600 via-pink-500 to-cyan-400",
    aspectRatio: "aspect-[9/16]",
    mockContent: {
      headline: "SOUNDWAVE 2026",
      subtext: "Get Your Tickets Now",
      accent: "#A855F7",
    },
  },
];

function VideoPlayer({ video, isLarge }: { video: VideoCard; isLarge?: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative ${video.aspectRatio} rounded-2xl overflow-hidden group cursor-pointer`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setTimeout(() => setIsHovered(false), 1500)}
      onClick={() => setIsPlaying(!isPlaying)}
      role="button"
      tabIndex={0}
      aria-label={`${isPlaying ? "Pause" : "Play"} ${video.title} video — ${video.platform}`}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setIsPlaying(!isPlaying); } }}
    >
      {/* Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${video.gradient}`}>
        {/* Animated scan line effect */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute w-full h-1 bg-white/10 blur-sm"
            style={{
              animation: isPlaying ? "scan 2s linear infinite" : "none",
              top: "0%",
            }}
          />
        </div>

        {/* Mock video content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
          {/* Animated floating shapes when playing */}
          {isPlaying && (
            <>
              <div
                className="absolute rounded-full"
                style={{
                  width: "60%",
                  height: "60%",
                  background: `radial-gradient(circle, ${video.mockContent.accent}50, transparent)`,
                  filter: "blur(40px)",
                  opacity: 0.4,
                  animation: "video-float 3s ease-in-out infinite",
                }}
              />
              <div
                className="absolute rounded-full"
                style={{
                  width: "40%",
                  height: "40%",
                  right: "10%",
                  top: "20%",
                  background: "radial-gradient(circle, rgba(255,255,255,0.3), transparent)",
                  filter: "blur(30px)",
                  opacity: 0.3,
                  animation: "video-float 2.5s ease-in-out 0.5s infinite reverse",
                }}
              />
            </>
          )}

          {/* Simulated motion graphics */}
          <div
            className="mb-4 transition-all duration-700"
            style={{
              transform: isPlaying ? "scale(1.05) translateY(-8px)" : "scale(0.9)",
              opacity: isPlaying ? 1 : 0.8,
            }}
          >
            <div
              className={`${isLarge ? "text-3xl md:text-4xl" : "text-lg md:text-xl"} font-black tracking-tight text-white mb-2 drop-shadow-lg`}
              style={{
                textShadow: `0 0 40px ${video.mockContent.accent}40`,
                animation: isPlaying ? "video-text-glow 2s ease-in-out infinite" : "none",
              }}
            >
              {video.mockContent.headline}
            </div>
            <div
              className={`${isLarge ? "text-base" : "text-xs"} text-white/70 font-medium transition-all duration-500`}
              style={{
                opacity: isPlaying ? 1 : 0.7,
                transform: isPlaying ? "translateY(0)" : "translateY(4px)",
              }}
            >
              {video.mockContent.subtext}
            </div>
          </div>

          {/* Animated elements when playing */}
          {isPlaying && (
            <>
              {/* Audio visualizer bars */}
              <div className="absolute top-4 left-4 flex gap-1 items-end">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-white/60 rounded-full"
                    style={{
                      animation: `video-bar ${0.3 + i * 0.1}s ease-in-out infinite alternate`,
                    }}
                  />
                ))}
              </div>

              {/* PREVIEW badge */}
              <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/80 backdrop-blur-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-[9px] font-bold text-white tracking-wider">PREVIEW</span>
              </div>

              {/* Progress bar */}
              <div className="absolute bottom-16 left-0 right-0 px-6">
                <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${video.mockContent.accent}, white)`,
                      animation: "progress 8s linear infinite",
                    }}
                  />
                </div>
              </div>

              {/* Timestamp */}
              <div className="absolute bottom-20 left-6 text-[10px] text-white/50 font-mono tabular-nums">
                00:00 / {video.duration}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Overlay controls */}
      <div className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${isHovered || !isPlaying ? "opacity-100" : "opacity-0"}`}>
        {/* Play/Pause center button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`w-14 h-14 rounded-full backdrop-blur-md flex items-center justify-center border transition-all duration-300 ${
              isPlaying
                ? "bg-black/30 border-white/20 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                : "bg-white/20 border-white/30 group-hover:scale-110"
            }`}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-white" />
            ) : (
              <Play className="w-6 h-6 text-white ml-0.5" />
            )}
          </div>
        </div>

        {/* Top info */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-[10px] font-bold text-white">
            {video.platform}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-[10px] text-white/80">
            {video.duration}
          </span>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white drop-shadow-md">{video.title}</div>
              <div className="text-[10px] text-white/60">{video.views} views • {video.style}</div>
            </div>
            {isPlaying && (
              <div className="flex gap-2">
                <button className="p-1.5 rounded-full bg-black/30 backdrop-blur-md">
                  <Volume2 className="w-3 h-3 text-white/70" />
                </button>
                <button className="p-1.5 rounded-full bg-black/30 backdrop-blur-md">
                  <Maximize2 className="w-3 h-3 text-white/70" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Side engagement (TikTok style) */}
        {video.aspectRatio.includes("9/16") && (
          <div className="absolute right-3 bottom-20 flex flex-col items-center gap-4">
            <button className="flex flex-col items-center gap-0.5">
              <Heart className="w-5 h-5 text-white" />
              <span className="text-[9px] text-white/70">24K</span>
            </button>
            <button className="flex flex-col items-center gap-0.5">
              <MessageCircle className="w-5 h-5 text-white" />
              <span className="text-[9px] text-white/70">1.2K</span>
            </button>
            <button className="flex flex-col items-center gap-0.5">
              <Share2 className="w-5 h-5 text-white" />
              <span className="text-[9px] text-white/70">890</span>
            </button>
          </div>
        )}
      </div>

      {/* Shimmer effect on hover */}
      <div
        className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-700 ${
          isHovered ? "translate-x-full" : "-translate-x-full"
        }`}
      />
    </div>
  );
}

export default function VideoShowcase() {
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 auto-rows-auto">
        {/* Featured large video */}
        <div className="col-span-2 row-span-2">
          <VideoPlayer video={SHOWCASE_VIDEOS[0]} isLarge />
        </div>

        {/* Grid videos */}
        {SHOWCASE_VIDEOS.slice(1, 5).map((video) => (
          <div key={video.id}>
            <VideoPlayer video={video} />
          </div>
        ))}

        {/* Last wide video */}
        <div className="col-span-2">
          <VideoPlayer video={SHOWCASE_VIDEOS[5]} />
        </div>
      </div>

      {/* Stats below */}
      <div className="flex flex-wrap justify-center gap-6 mt-8 pt-6 border-t border-white/[0.04]">
        {[
          { value: "6", label: "Platforms" },
          { value: "12+", label: "Video styles" },
          { value: "<2min", label: "Generation time" },
          { value: "4K", label: "Max resolution" },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="text-lg font-black gradient-text-static">{stat.value}</div>
            <div className="text-[10px] text-white/30">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
