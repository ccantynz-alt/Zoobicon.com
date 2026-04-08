"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import BackgroundEffects from "@/components/BackgroundEffects";
import HeroEffects, { CursorGlowTracker } from "@/components/HeroEffects";
import {
  Zap,
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
  Star,
  MonitorPlay,
  Clock,
  LayoutDashboard,
  LogOut,
  User,
} from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};
const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

const PLATFORMS = [
  { name: "TikTok", format: "9:16 vertical", duration: "15-60s", desc: "Hook-driven viral content with trending sounds and effects." },
  { name: "Camera Reels", format: "9:16 vertical", duration: "15-90s", desc: "Aesthetic, branded content optimized for the Explore page." },
  { name: "YouTube Shorts", format: "9:16 vertical", duration: "15-60s", desc: "Engagement-optimized with thumbnails and end screens." },
  { name: "ThumbsUp Ads", format: "1:1 & 16:9", duration: "15-120s", desc: "Conversion-focused with dynamic product showcases and CTAs." },
  { name: "LinkedIn", format: "1:1 & 16:9", duration: "30-120s", desc: "Professional thought leadership and B2B content." },
  { name: "MessageCircle/X", format: "16:9", duration: "15-140s", desc: "Punchy, attention-grabbing clips optimized for the timeline." },
];

const FEATURES = [
  { icon: Wand2, title: "AI Script & Storyboard", desc: "Describe your video and AI writes the script, plans scenes, camera movements, transitions, and timing." },
  { icon: Music, title: "Music Direction", desc: "AI generates music mood cues and timing for each scene. Pairs with your preferred royalty-free library." },
  { icon: Type, title: "Auto Captions", desc: "Auto-generated SRT/VTT subtitles with 5 caption styles: TikTok Bold, Camera Clean, YouTube Standard, Cinematic, Energetic." },
  { icon: Palette, title: "Brand Consistency", desc: "Set your brand colors and fonts. Every storyboard, scene image, and caption uses your brand kit." },
  { icon: Layers, title: "Scene-by-Scene Images", desc: "AI generates images for each scene using your storyboard. Supports Replicate (FLUX), DALL-E 3, and Stability AI." },
  { icon: Scissors, title: "AI Voiceover", desc: "10 premium voices via ElevenLabs with adjustable speed and clarity. Browser TTS fallback for free plans." },
  { icon: Share2, title: "Multi-Platform Formats", desc: "TikTok, Camera Reels, YouTube, LinkedIn, MessageCircle — correct aspect ratios and format specs for each." },
  { icon: BarChart3, title: "Video Rendering (Coming Soon)", desc: "Scene-by-scene video generation via Runway Gen-3, Luma Dream Machine, Pika, and Kling. Currently in development." },
];

const STYLES = [
  "Cinematic", "Energetic", "Minimal", "Luxury", "Playful",
  "Corporate", "Documentary", "Retro", "Neon", "Organic",
  "Tech", "Fashion",
];

export default function VideoCreatorPage() {
  const [user, setUser] = useState<{ email: string; name?: string; role?: string } | null>(null);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistStatus, setWaitlistStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("zoobicon_user");
      if (stored) setUser(JSON.parse(stored));
    } catch { /* Safari private mode / storage unavailable */ }
  }, []);

  const handleLogout = () => {
    try { localStorage.removeItem("zoobicon_user"); } catch {}
    setUser(null);
  };

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
    "description": "AI-powered video creation pipeline with script generation, storyboarding, scene images, voiceover, and auto-captions for TikTok, Camera Reels, YouTube Shorts, and more.",
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
    <div className="relative min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <BackgroundEffects preset="technical" />

      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#0a0a12]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Video className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">Zoobicon</span>
            </Link>
            <span className="text-xs text-white/60">/</span>
            <span className="text-sm text-white/65">AI Video Creator</span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/dashboard" className="text-sm text-white/65 hover:text-white transition-colors px-4 py-2 flex items-center gap-1.5">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="text-sm text-white/65 hover:text-white transition-colors px-4 py-2 flex items-center gap-1.5">
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out
                </button>
                <Link href="/builder" className="btn-gradient px-5 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  <span>{user.name || user.email.split("@")[0]}</span>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm text-white/65 hover:text-white transition-colors px-4 py-2">
                  Sign in
                </Link>
                <Link href="/auth/signup" className="btn-gradient px-5 py-2 rounded-xl text-sm font-semibold text-white">
                  <span>Get Started</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
      <CursorGlowTracker />

      {/* Hero */}
      <section className="relative pt-32 pb-20 lg:pt-44 lg:pb-28">
        <HeroEffects variant="cyan" cursorGlow particles particleCount={35} interactiveGrid aurora beams />
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-3 mb-6">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/5">
                <Video className="w-3 h-3 text-cyan-400" />
                <span className="text-xs font-medium text-cyan-400">AI Video Creator</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
                <Clock size={12} /> Video Rendering Coming Soon
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <Sparkles size={12} /> Storyboard & Script AI — Live
              </span>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-5xl md:text-6xl lg:text-8xl font-black tracking-tight leading-[0.9] mb-6">
              High-End Video.<br />
              <span className="gradient-text-hero">Zero Effort.</span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="max-w-2xl text-lg md:text-xl text-white/60 leading-relaxed mb-6">
              Create scroll-stopping videos for every platform. AI writes your script, builds your storyboard,
              generates scene images, voiceover, and subtitles — just describe what you want.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-3 mb-10">
              <Link href="/video-creator" className="group btn-gradient px-6 py-3.5 rounded-xl text-sm font-bold text-white flex items-center gap-2 shadow-lg shadow-cyan-500/20">
                <Play className="w-4 h-4" />
                <span>Try Storyboard Creator</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <span className="text-xs text-white/60">AI-powered storyboards & scripts — free to try</span>
            </motion.div>

            <motion.div variants={fadeInUp} className="max-w-lg mb-16">
              {waitlistStatus === "success" ? (
                <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">You&apos;re on the list! We&apos;ll notify you when AI Video Creator launches.</span>
                </div>
              ) : (
                <form onSubmit={handleWaitlistSubmit} className="flex items-center gap-3">
                  <input
                    type="email"
                    required
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    placeholder="Enter your email for early access"
                    className="flex-1 bg-white/[0.07] border border-white/[0.12] rounded-xl px-5 py-4 text-white placeholder:text-white/60 outline-none text-sm focus:border-cyan-500/30 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={waitlistStatus === "loading"}
                    className="group btn-gradient px-6 py-4 rounded-xl text-sm font-bold text-white flex items-center gap-2 shadow-lg shadow-cyan-500/20 whitespace-nowrap disabled:opacity-50"
                  >
                    <span>{waitlistStatus === "loading" ? "Joining..." : "Join Early Access"}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
              )}
            </motion.div>

            {/* Platform cards */}
            <motion.div variants={fadeInUp} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {PLATFORMS.map((p) => (
                <div key={p.name} className="gradient-border p-4 rounded-xl text-center group card-hover">
                  <div className="text-sm font-bold mb-1 group-hover:text-white transition-colors">{p.name}</div>
                  <div className="text-[10px] text-white/60">{p.format}</div>
                  <div className="text-[10px] text-cyan-500/60">{p.duration}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Three Steps to<br /><span className="gradient-text">Viral Content</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { num: "01", title: "Describe", desc: "Tell AI what your video should be about. 'Product launch for a fitness app — energetic, TikTok format.'" },
                { num: "02", title: "Generate", desc: "AI creates a complete video with scenes, transitions, music, captions, and branding. Under 2 minutes." },
                { num: "03", title: "Publish", desc: "Export platform-optimized versions for every social network. One-click publish to connected accounts." },
              ].map((step, i) => (
                <motion.div key={i} variants={fadeInUp} className="gradient-border p-8 rounded-2xl relative">
                  <div className="text-6xl font-black text-white/[0.03] absolute top-4 right-6">{step.num}</div>
                  <div className="text-sm font-bold text-cyan-500 mb-1">{step.num}</div>
                  <h3 className="text-2xl font-black mb-3">{step.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Styles */}
      <section className="py-20 border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                12+ Video <span className="gradient-text">Styles</span>
              </h2>
              <p className="text-lg text-white/60">Pick a vibe or let AI choose the best style for your content.</p>
            </motion.div>

            <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-2">
              {STYLES.map((style) => (
                <div key={style} className="px-5 py-2.5 rounded-full border border-white/[0.10] bg-white/[0.05] text-sm text-white/65 hover:text-cyan-500 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all cursor-pointer">
                  {style}
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Every Feature.<br /><span className="gradient-text">No Compromises.</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {FEATURES.map((f, i) => (
                <motion.div key={i} variants={fadeInUp} className="gradient-border card-hover p-6 rounded-xl group">
                  <f.icon className="w-7 h-7 text-cyan-500/50 mb-3 group-hover:text-cyan-500 transition-colors" />
                  <h3 className="text-base font-bold mb-1.5">{f.title}</h3>
                  <p className="text-xs text-white/60 leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Platform deep dive */}
      <section className="py-20 border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Optimized for<br /><span className="gradient-text">Every Platform</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PLATFORMS.map((p, i) => (
                <motion.div key={i} variants={fadeInUp} className="gradient-border p-6 rounded-xl card-hover">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold">{p.name}</h3>
                    <span className="text-[10px] font-mono text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded">{p.format}</span>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed mb-2">{p.desc}</p>
                  <div className="text-xs text-white/60">Duration: {p.duration}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-white/[0.08]">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <MonitorPlay className="w-12 h-12 text-cyan-500/30 mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Your First Video<br /><span className="gradient-text">In Under 2 Minutes</span>
          </h2>
          <p className="text-lg text-white/60 mb-4">No editing skills. No scripts. No templates. Just AI magic.</p>
          <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
            <Link href="/video-creator" className="group btn-gradient px-6 py-3.5 rounded-xl text-sm font-bold text-white flex items-center gap-2 shadow-lg shadow-cyan-500/20">
              <Play className="w-4 h-4" />
              <span>Try Storyboard Creator</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium mb-8">
            <Clock size={12} /> Full Video Rendering Coming Soon
          </span>
          <div className="max-w-lg mx-auto">
            {waitlistStatus === "success" ? (
              <div className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Check className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">You&apos;re on the list! We&apos;ll notify you when AI Video Creator launches.</span>
              </div>
            ) : (
              <form onSubmit={handleWaitlistSubmit} className="flex items-center gap-3">
                <input
                  type="email"
                  required
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  placeholder="Enter your email for early access"
                  className="flex-1 bg-white/[0.07] border border-white/[0.12] rounded-xl px-5 py-4 text-white placeholder:text-white/60 outline-none text-sm focus:border-cyan-500/30 transition-colors"
                />
                <button
                  type="submit"
                  disabled={waitlistStatus === "loading"}
                  className="group btn-gradient px-6 py-4 rounded-xl text-sm font-bold text-white flex items-center gap-2 shadow-lg shadow-cyan-500/20 whitespace-nowrap disabled:opacity-50"
                >
                  <span>{waitlistStatus === "loading" ? "Joining..." : "Join Waitlist"}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] py-10">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-white/30">&copy; 2026 Zoobicon. All rights reserved.</div>
          <div className="text-xs text-white/20">zoobicon.com &middot; zoobicon.ai &middot; zoobicon.io &middot; zoobicon.sh</div>
          <div className="flex gap-4">
            <Link href="/privacy" className="text-xs text-white/30 hover:text-white/50 transition-colors">Privacy</Link>
            <Link href="/terms" className="text-xs text-white/30 hover:text-white/50 transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
