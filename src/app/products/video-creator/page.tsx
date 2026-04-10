"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Video,
  ArrowRight,
  Play,
  Sparkles,
  Music,
  Type,
  Palette,
  Wand2,
  Layers,
  Share2,
  BarChart3,
  Scissors,
  Check,
  MonitorPlay,
  Clock,
} from "lucide-react";

const PLATFORMS = [
  { name: "TikTok", format: "9:16 vertical", duration: "15-60s", desc: "Hook-driven viral content with trending sounds and effects." },
  { name: "Instagram Reels", format: "9:16 vertical", duration: "15-90s", desc: "Aesthetic, branded content optimized for the Explore page." },
  { name: "YouTube Shorts", format: "9:16 vertical", duration: "15-60s", desc: "Engagement-optimized with thumbnails and end screens." },
  { name: "Facebook Ads", format: "1:1 & 16:9", duration: "15-120s", desc: "Conversion-focused with dynamic product showcases and CTAs." },
  { name: "LinkedIn", format: "1:1 & 16:9", duration: "30-120s", desc: "Professional thought leadership and B2B content." },
  { name: "Twitter/X", format: "16:9", duration: "15-140s", desc: "Punchy, attention-grabbing clips optimized for the timeline." },
];

const FEATURES = [
  { icon: Wand2, title: "AI Script & Storyboard", desc: "Describe your video and AI writes the script, plans scenes, camera movements, transitions, and timing." },
  { icon: Music, title: "Music Direction", desc: "AI generates music mood cues and timing for each scene. Pairs with your preferred royalty-free library." },
  { icon: Type, title: "Auto Captions", desc: "Auto-generated SRT/VTT subtitles with 5 caption styles: TikTok Bold, Camera Clean, YouTube Standard, Cinematic, Energetic." },
  { icon: Palette, title: "Brand Consistency", desc: "Set your brand colors and fonts. Every storyboard, scene image, and caption uses your brand kit." },
  { icon: Layers, title: "Scene-by-Scene Images", desc: "AI generates images for each scene using your storyboard. Supports Replicate (FLUX), DALL-E 3, and Stability AI." },
  { icon: Scissors, title: "AI Voiceover", desc: "10 premium voices via ElevenLabs with adjustable speed and clarity. Browser TTS fallback for free plans." },
  { icon: Share2, title: "Multi-Platform Formats", desc: "TikTok, Reels, YouTube, LinkedIn, Twitter — correct aspect ratios and format specs for each." },
  { icon: BarChart3, title: "Video Rendering (Coming Soon)", desc: "Scene-by-scene video generation via Runway Gen-3, Luma Dream Machine, Pika, and Kling. Currently in development." },
];

const STYLES = [
  "Cinematic", "Energetic", "Minimal", "Luxury", "Playful",
  "Corporate", "Documentary", "Retro", "Neon", "Organic",
  "Tech", "Fashion",
];

const STEPS = [
  { num: "01", title: "Describe", desc: "Tell AI what your video should be about. 'Product launch for a fitness app — energetic, TikTok format.'" },
  { num: "02", title: "Generate", desc: "AI creates a complete video with scenes, transitions, music, captions, and branding. Under 2 minutes." },
  { num: "03", title: "Publish", desc: "Export platform-optimized versions for every social network. One-click publish to connected accounts." },
];

const CARD_BG = "linear-gradient(135deg, rgba(17,17,24,0.85) 0%, rgba(10,10,15,0.7) 100%)";
const PRIMARY_CTA = {
  background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)",
  color: "#0a0a0f",
  boxShadow: "0 14px 40px -16px rgba(232,212,176,0.5)",
} as const;
const SERIF: React.CSSProperties = {
  fontFamily: "Fraunces, ui-serif, Georgia, serif",
  fontStyle: "italic",
  fontWeight: 400,
  color: "#E8D4B0",
};

export default function VideoCreatorPage() {
  const [, setUser] = useState<{ email: string; name?: string; role?: string } | null>(null);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistStatus, setWaitlistStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("zoobicon_user");
      if (stored) setUser(JSON.parse(stored));
    } catch { /* Safari private mode / storage unavailable */ }
  }, []);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail.trim() || waitlistStatus === "loading") return;
    setWaitlistStatus("loading");
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: waitlistEmail, source: "video-creator-waitlist" }),
      });
      setWaitlistStatus("success");
    } catch {
      setWaitlistStatus("error");
    }
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Zoobicon AI Video Creator",
    "applicationCategory": "MultimediaApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "0",
      "highPrice": "99",
      "priceCurrency": "USD",
      "offerCount": "4"
    },
    "description": "AI-powered video creation pipeline with script generation, storyboarding, scene images, voiceover, and auto-captions for TikTok, Instagram Reels, YouTube Shorts, and more.",
    "url": "https://zoobicon.com/products/video-creator",
    "screenshot": "https://zoobicon.com/og-image.png"
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://zoobicon.com" },
      { "@type": "ListItem", "position": 2, "name": "Products", "item": "https://zoobicon.com/products" },
      { "@type": "ListItem", "position": 3, "name": "Video Creator", "item": "https://zoobicon.com/products/video-creator" }
    ]
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white fs-grain pt-[72px]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      {/* Hero */}
      <section className="relative pt-20 pb-24 md:pt-28 md:pb-32 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute left-1/2 top-0 h-[720px] w-[1200px] -translate-x-1/2 rounded-full blur-[160px]"
            style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.09), transparent 70%)" }} />
          <div className="absolute right-[-10%] top-[30%] h-[420px] w-[520px] rounded-full blur-[140px]"
            style={{ background: "radial-gradient(closest-side, rgba(224,139,176,0.07), transparent 70%)" }} />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-8">
            <Video className="w-3 h-3" />
            AI Video Creator · Storyboards live · Rendering coming soon
          </div>

          <h1 className="fs-display-xl mb-6">
            High-end video,{" "}
            <span style={SERIF}>zero effort.</span>
          </h1>

          <p className="max-w-3xl mx-auto text-[17px] md:text-[19px] leading-relaxed text-white/60 mb-10">
            Create scroll-stopping videos for every platform. AI writes your script, builds your storyboard,
            generates scene images, voiceover, and subtitles — just describe what you want.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            <Link
              href="/video-creator"
              className="group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[14px] font-semibold transition-all duration-500 hover:-translate-y-0.5"
              style={PRIMARY_CTA}
            >
              <Play className="w-4 h-4" />
              Try the storyboard creator
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.03] px-7 py-3.5 text-[14px] font-medium text-white/80 backdrop-blur transition-all duration-500 hover:-translate-y-0.5 hover:border-[#E8D4B0]/35 hover:text-[#E8D4B0]"
            >
              <Sparkles className="w-4 h-4" />
              See features
            </Link>
          </div>

          {/* Waitlist */}
          <div className="max-w-lg mx-auto mb-14">
            {waitlistStatus === "success" ? (
              <div className="flex items-center justify-center gap-3 rounded-2xl border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-6 py-4 text-[#E8D4B0]">
                <Check className="w-5 h-5 flex-shrink-0" />
                <span className="text-[13px] font-medium">You&apos;re on the list. We&apos;ll notify you when full rendering ships.</span>
              </div>
            ) : (
              <form onSubmit={handleWaitlistSubmit} className="flex items-center gap-3">
                <input
                  type="email"
                  required
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  placeholder="Enter your email for early access"
                  className="flex-1 rounded-full border border-white/[0.12] bg-white/[0.03] px-5 py-3.5 text-[13px] text-white placeholder:text-white/40 outline-none transition-colors focus:border-[#E8D4B0]/35"
                />
                <button
                  type="submit"
                  disabled={waitlistStatus === "loading"}
                  className="group inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-semibold transition-all duration-500 hover:-translate-y-0.5 disabled:opacity-50"
                  style={PRIMARY_CTA}
                >
                  <span>{waitlistStatus === "loading" ? "Joining..." : "Join early access"}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </form>
            )}
          </div>

          {/* Platform pills */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 max-w-5xl mx-auto">
            {PLATFORMS.map((p) => (
              <div
                key={p.name}
                className="group relative overflow-hidden rounded-[18px] border border-white/[0.08] p-4 text-center transition-all duration-500 hover:-translate-y-1 hover:border-[#E8D4B0]/25"
                style={{ background: CARD_BG }}
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.07), transparent 70%)" }} />
                <div className="relative">
                  <div className="text-[13px] font-semibold tracking-[-0.01em] mb-1">{p.name}</div>
                  <div className="text-[10px] text-white/50">{p.format}</div>
                  <div className="text-[10px]" style={{ color: "rgba(232,212,176,0.7)" }}>{p.duration}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
              The flow
            </div>
            <h2 className="fs-display-lg mb-4">
              Three steps to{" "}
              <span style={SERIF}>viral content.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              Describe, generate, publish. From a sentence to a finished video — in under two minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {STEPS.map((step) => (
              <div
                key={step.num}
                className="group relative overflow-hidden rounded-[24px] border border-white/[0.08] p-7 transition-all duration-500 hover:-translate-y-1 hover:border-[#E8D4B0]/25"
                style={{ background: CARD_BG }}
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.07), transparent 70%)" }} />
                <div className="relative">
                  <div className="text-[11px] uppercase tracking-[0.18em] font-semibold mb-4" style={{ color: "rgba(232,212,176,0.75)" }}>
                    Step {step.num}
                  </div>
                  <h3 className="text-[20px] font-semibold tracking-[-0.01em] mb-3">{step.title}</h3>
                  <p className="text-[14px] text-white/55 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Styles */}
      <section className="relative py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
              Visual languages
            </div>
            <h2 className="fs-display-lg mb-4">
              Twelve directions,{" "}
              <span style={SERIF}>one prompt away.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              Pick a vibe or let AI choose the best style for your content.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {STYLES.map((style) => (
              <div
                key={style}
                className="rounded-full border border-white/[0.08] bg-white/[0.03] px-5 py-2.5 text-[13px] text-white/65 transition-all duration-500 hover:-translate-y-0.5 hover:border-[#E8D4B0]/35 hover:text-[#E8D4B0]"
              >
                {style}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
              Capabilities
            </div>
            <h2 className="fs-display-lg mb-4">
              Every feature,{" "}
              <span style={SERIF}>no compromises.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              Script, storyboard, voice, captions, music, brand kit — the full pipeline in one place.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-[24px] border border-white/[0.08] p-7 transition-all duration-500 hover:-translate-y-1 hover:border-[#E8D4B0]/25"
                style={{ background: CARD_BG }}
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.07), transparent 70%)" }} />
                <div className="relative">
                  <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.05]">
                    <f.icon className="h-5 w-5 text-[#E8D4B0]" />
                  </div>
                  <h3 className="text-[18px] font-semibold tracking-[-0.01em] mb-2">{f.title}</h3>
                  <p className="text-[14px] text-white/55 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform deep dive */}
      <section className="relative py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
              Platform-aware
            </div>
            <h2 className="fs-display-lg mb-4">
              Optimized for{" "}
              <span style={SERIF}>every platform.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              Correct aspect ratios, durations, and creative specs for the channels that matter.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {PLATFORMS.map((p) => (
              <div
                key={p.name}
                className="group relative overflow-hidden rounded-[24px] border border-white/[0.08] p-7 transition-all duration-500 hover:-translate-y-1 hover:border-[#E8D4B0]/25"
                style={{ background: CARD_BG }}
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.07), transparent 70%)" }} />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[18px] font-semibold tracking-[-0.01em]">{p.name}</h3>
                    <span className="text-[10px] font-mono rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.05] px-2 py-0.5" style={{ color: "#E8D4B0" }}>{p.format}</span>
                  </div>
                  <p className="text-[14px] text-white/55 leading-relaxed mb-3">{p.desc}</p>
                  <div className="text-[12px] text-white/45">Duration: {p.duration}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-24 md:py-32 border-t border-white/[0.06] overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute left-1/2 top-1/2 h-[560px] w-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px]"
            style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.11), transparent 70%)" }} />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <MonitorPlay className="w-10 h-10 mx-auto mb-6" style={{ color: "#E8D4B0" }} />
          <h2 className="fs-display-lg mb-5">
            Your first video,{" "}
            <span style={SERIF}>in under two minutes.</span>
          </h2>
          <p className="text-[17px] text-white/60 mb-8">
            No editing skills. No scripts. No templates. Just describe it.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            <Link
              href="/video-creator"
              className="group inline-flex items-center gap-2 rounded-full px-8 py-4 text-[15px] font-semibold transition-all duration-500 hover:-translate-y-0.5"
              style={PRIMARY_CTA}
            >
              <Play className="w-4 h-4" />
              Try the storyboard creator
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-10">
            <Clock className="w-3 h-3" />
            Full video rendering coming soon
          </div>

          <div className="max-w-lg mx-auto">
            {waitlistStatus === "success" ? (
              <div className="flex items-center justify-center gap-3 rounded-2xl border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-6 py-4 text-[#E8D4B0]">
                <Check className="w-5 h-5 flex-shrink-0" />
                <span className="text-[13px] font-medium">You&apos;re on the list. We&apos;ll notify you when full rendering ships.</span>
              </div>
            ) : (
              <form onSubmit={handleWaitlistSubmit} className="flex items-center gap-3">
                <input
                  type="email"
                  required
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  placeholder="Enter your email for early access"
                  className="flex-1 rounded-full border border-white/[0.12] bg-white/[0.03] px-5 py-3.5 text-[13px] text-white placeholder:text-white/40 outline-none transition-colors focus:border-[#E8D4B0]/35"
                />
                <button
                  type="submit"
                  disabled={waitlistStatus === "loading"}
                  className="group inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-semibold transition-all duration-500 hover:-translate-y-0.5 disabled:opacity-50"
                  style={PRIMARY_CTA}
                >
                  <span>{waitlistStatus === "loading" ? "Joining..." : "Join waitlist"}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </form>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-[12px] text-white/55">
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" style={{ color: "#E8D4B0" }} /> No credit card</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" style={{ color: "#E8D4B0" }} /> Free to try</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" style={{ color: "#E8D4B0" }} /> Storyboards in seconds</span>
          </div>
        </div>
      </section>
    </div>
  );
}
