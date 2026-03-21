"use client";

import { useState } from "react";
import { Play, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

interface VideoCard {
  id: string;
  title: string;
  platform: string;
  duration: string;
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
    style: "Cinematic",
    gradient: "from-blue-600 via-indigo-600 to-blue-600",
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
    style: "Neon",
    gradient: "from-blue-600 via-pink-500 to-cyan-400",
    aspectRatio: "aspect-[9/16]",
    mockContent: {
      headline: "SOUNDWAVE 2026",
      subtext: "Get Your Tickets Now",
      accent: "#A855F7",
    },
  },
];

function VideoCard({ video, isLarge }: { video: VideoCard; isLarge?: boolean }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative ${video.aspectRatio} rounded-2xl overflow-hidden group`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${video.gradient}`}>
        {/* Mock video content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
          {/* Floating glow */}
          <div
            className="absolute rounded-full"
            style={{
              width: "60%",
              height: "60%",
              background: `radial-gradient(circle, ${video.mockContent.accent}30, transparent)`,
              filter: "blur(40px)",
              opacity: 0.4,
            }}
          />

          <div className="mb-4">
            <div
              className={`${isLarge ? "text-3xl md:text-4xl" : "text-lg md:text-xl"} font-black tracking-tight text-white mb-2 drop-shadow-lg`}
              style={{ textShadow: `0 0 40px ${video.mockContent.accent}40` }}
            >
              {video.mockContent.headline}
            </div>
            <div className={`${isLarge ? "text-base" : "text-xs"} text-white/70 font-medium`}>
              {video.mockContent.subtext}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay */}
      <div className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-60"}`}>
        {/* Coming Soon badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
          <Sparkles className="w-3 h-3 text-accent-pink" />
          <span className="text-[9px] font-bold text-white/80 tracking-wider uppercase">Coming Soon</span>
        </div>

        {/* Platform + style */}
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-[10px] font-bold text-white">
            {video.platform}
          </span>
        </div>

        {/* Center play icon (non-interactive — concept only) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 transition-all duration-300 ${isHovered ? "scale-110" : "scale-100"}`}>
            <Play className="w-6 h-6 text-white/60 ml-0.5" />
          </div>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-3 left-3 right-3">
          <div className="text-xs font-bold text-white drop-shadow-md">{video.title}</div>
          <div className="text-[10px] text-white/50">{video.style} • {video.duration}</div>
        </div>
      </div>

      {/* Shimmer on hover */}
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
          <VideoCard video={SHOWCASE_VIDEOS[0]} isLarge />
        </div>

        {/* Grid videos */}
        {SHOWCASE_VIDEOS.slice(1, 5).map((video) => (
          <div key={video.id}>
            <VideoCard video={video} />
          </div>
        ))}

        {/* Last wide video */}
        <div className="col-span-2">
          <VideoCard video={SHOWCASE_VIDEOS[5]} />
        </div>
      </div>

      {/* CTA below */}
      <div className="text-center mt-8 pt-6 border-t border-white/[0.04]">
        <p className="text-sm text-white/50 mb-4">
          AI storyboard & script generation is live today. Full video rendering launching soon.
        </p>
        <Link
          href="/video-creator"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent-pink/10 border border-accent-pink/20 text-sm font-medium text-accent-pink hover:bg-accent-pink/15 transition-colors"
        >
          Try Storyboard Generator <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
