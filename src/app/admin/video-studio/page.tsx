"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Video,
  Play,
  Download,
  Copy,
  Check,
  Loader2,
  Sparkles,
  Clock,
  Film,
  Mic,
  Music,
  Type,
  Zap,
  ChevronRight,
  Volume2,
  FileText,
  Settings,
  Clapperboard,
  Megaphone,
  RotateCcw,
  SplitSquareHorizontal,
  Timer,
  MessageSquare,
  ListOrdered,
  AlertCircle,
} from "lucide-react";

/* ─── types ─── */
interface VideoShot {
  shotNumber: number;
  duration: number;
  visual: string;
  textOverlay: string;
  voiceover: string;
  transition: string;
  mood: string;
}

interface VideoScript {
  title: string;
  totalDuration: number;
  hook: string;
  targetPlatform: string;
  aspectRatio: string;
  shots: VideoShot[];
  voiceoverFull: string;
  musicStyle: string;
  ctaText: string;
}

/* ─── templates ─── */
const TEMPLATES = [
  {
    id: "product-demo",
    name: "Product Demo",
    icon: Clapperboard,
    description: "Fast-paced product showcase with hook → problem → solution → demo",
    bestFor: "Showing your product in action",
    color: "violet",
  },
  {
    id: "before-after",
    name: "Before / After",
    icon: SplitSquareHorizontal,
    description: "Dramatic transformation — old way vs new way",
    bestFor: "Contrasting pain vs solution",
    color: "pink",
  },
  {
    id: "speedrun",
    name: "Speedrun",
    icon: Timer,
    description: "Watch something get built impossibly fast with a timer",
    bestFor: "Demonstrating speed and efficiency",
    color: "amber",
  },
  {
    id: "testimonial",
    name: "Results / Proof",
    icon: MessageSquare,
    description: "Real results, real numbers, trust-building story",
    bestFor: "Social proof and credibility",
    color: "emerald",
  },
  {
    id: "feature-highlight",
    name: "Feature Deep-Dive",
    icon: Zap,
    description: "Zoom into one killer feature with step-by-step demo",
    bestFor: "Educating about specific capabilities",
    color: "blue",
  },
  {
    id: "listicle",
    name: "Listicle",
    icon: ListOrdered,
    description: "\"5 things you didn't know\" — numbered reveals",
    bestFor: "Discovery and engagement bait",
    color: "orange",
  },
];

const PLATFORMS = [
  { id: "tiktok", name: "TikTok / Reels", aspect: "9:16", duration: 30 },
  { id: "youtube", name: "YouTube", aspect: "16:9", duration: 60 },
  { id: "instagram", name: "Instagram Feed", aspect: "1:1", duration: 30 },
  { id: "story", name: "Stories", aspect: "9:16", duration: 15 },
];

const TONES = [
  { id: "confident", name: "Confident", emoji: "💪" },
  { id: "playful", name: "Playful", emoji: "🎯" },
  { id: "urgent", name: "Urgent", emoji: "⚡" },
  { id: "inspirational", name: "Inspirational", emoji: "✨" },
  { id: "edgy", name: "Edgy", emoji: "🔥" },
  { id: "professional", name: "Professional", emoji: "📊" },
];

const VOICES = [
  { id: "energetic", name: "Bella", description: "Young, energetic" },
  { id: "professional", name: "Rachel", description: "Warm, professional" },
  { id: "authoritative", name: "Antoni", description: "Deep, authoritative" },
  { id: "casual", name: "Emily", description: "Casual, friendly" },
  { id: "narrator", name: "Arnold", description: "Cinematic narrator" },
];

const COLOR_MAP: Record<string, string> = {
  violet: "from-violet-500 to-purple-600",
  pink: "from-pink-500 to-rose-600",
  amber: "from-amber-500 to-orange-600",
  emerald: "from-emerald-500 to-teal-600",
  blue: "from-blue-500 to-indigo-600",
  orange: "from-orange-500 to-red-600",
};

/* ─── main component ─── */
export default function VideoStudioPage() {
  // Steps: template → brief → script → storyboard → export
  const [step, setStep] = useState<"template" | "brief" | "script" | "export">("template");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [platform, setPlatform] = useState("tiktok");
  const [duration, setDuration] = useState(30);
  const [tone, setTone] = useState("confident");
  const [voice, setVoice] = useState("energetic");
  const [businessName, setBusinessName] = useState("");
  const [product, setProduct] = useState("");
  const [brief, setBrief] = useState("");
  const [script, setScript] = useState<VideoScript | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingVoiceover, setIsGeneratingVoiceover] = useState(false);
  const [voiceoverUrl, setVoiceoverUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [activeShot, setActiveShot] = useState(0);
  const [editingShot, setEditingShot] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);

  const selectedPlatform = PLATFORMS.find(p => p.id === platform) || PLATFORMS[0];
  const template = TEMPLATES.find(t => t.id === selectedTemplate);

  /* ─── generate script ─── */
  const handleGenerateScript = async () => {
    if (!selectedTemplate) return;
    setIsGenerating(true);
    setError("");
    setScript(null);
    setVoiceoverUrl(null);

    try {
      const res = await fetch("/api/video/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template: selectedTemplate,
          brief: brief || `Promote ${product || "our product"} by ${businessName || "our business"}`,
          businessName: businessName || "Zoobicon",
          product: product || "AI Website Builder",
          platform,
          duration,
          tone,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Script generation failed");
      }

      const data = await res.json();
      setScript(data.script);
      setStep("script");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  /* ─── generate voiceover ─── */
  const handleGenerateVoiceover = async () => {
    if (!script?.voiceoverFull) return;
    setIsGeneratingVoiceover(true);

    try {
      const res = await fetch("/api/video/voiceover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: script.voiceoverFull, voice }),
      });

      const data = await res.json();
      if (data.audioUrl) {
        setVoiceoverUrl(data.audioUrl);
      } else if (data.status === "not_configured") {
        setError("ElevenLabs not configured — add ELEVENLABS_API_KEY to .env.local");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Voiceover generation failed");
    } finally {
      setIsGeneratingVoiceover(false);
    }
  };

  /* ─── export ─── */
  const handleExport = async (format: "json" | "srt" | "edl") => {
    if (!script) return;

    const res = await fetch("/api/video/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ script, format }),
    });

    if (format === "json") {
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      downloadBlob(blob, `${script.title || "video"}-timeline.json`);
    } else {
      const text = await res.text();
      const blob = new Blob([text], { type: "text/plain" });
      downloadBlob(blob, `${script.title || "video"}.${format}`);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  /* ─── update a shot inline ─── */
  const updateShot = (index: number, field: keyof VideoShot, value: string | number) => {
    if (!script) return;
    const newShots = [...script.shots];
    newShots[index] = { ...newShots[index], [field]: value };
    setScript({ ...script, shots: newShots });
  };

  /* ─── reset ─── */
  const handleReset = () => {
    setStep("template");
    setSelectedTemplate(null);
    setScript(null);
    setVoiceoverUrl(null);
    setError("");
    setBrief("");
    setBusinessName("");
    setProduct("");
  };

  return (
    <div className="min-h-screen bg-[#131520] text-white overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-600/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-600/[0.03] rounded-full blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#131520]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" />
              Admin
            </Link>
            <div className="w-px h-5 bg-white/10" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                <Video className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-sm">Video Studio</span>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-1">
            {["template", "brief", "script", "export"].map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  step === s
                    ? "bg-violet-500 text-white"
                    : ["template", "brief", "script", "export"].indexOf(step) > i
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-white/5 text-white/20"
                }`}>
                  {["template", "brief", "script", "export"].indexOf(step) > i ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                {i < 3 && <div className={`w-6 h-px ${["template", "brief", "script", "export"].indexOf(step) > i ? "bg-emerald-500/30" : "bg-white/10"}`} />}
              </div>
            ))}
          </div>

          {script && (
            <button onClick={handleReset} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">
              <RotateCcw className="w-3.5 h-3.5" />
              Start Over
            </button>
          )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        <AnimatePresence mode="wait">
          {/* ─── STEP 1: Template Selection ─── */}
          {step === "template" && (
            <motion.div
              key="template"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-10">
                <h1 className="text-3xl font-black tracking-tight mb-2">
                  <span className="bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text text-transparent">
                    Choose a Video Template
                  </span>
                </h1>
                <p className="text-sm text-white/40">
                  Each template uses a proven format that drives engagement on social media.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {TEMPLATES.map((t, i) => {
                  const Icon = t.icon;
                  const isSelected = selectedTemplate === t.id;
                  return (
                    <motion.button
                      key={t.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => { setSelectedTemplate(t.id); setStep("brief"); }}
                      className={`group relative text-left p-5 rounded-2xl border transition-all duration-300 ${
                        isSelected
                          ? "bg-violet-500/10 border-violet-500/40 shadow-lg shadow-violet-500/10"
                          : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.12]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${COLOR_MAP[t.color]} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-bold">{t.name}</h3>
                            <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 transition-colors" />
                          </div>
                          <p className="text-xs text-white/40 mb-2 leading-relaxed">{t.description}</p>
                          <span className="text-[10px] text-white/25 uppercase tracking-wider font-semibold">
                            Best for: {t.bestFor}
                          </span>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ─── STEP 2: Brief / Configuration ─── */}
          {step === "brief" && (
            <motion.div
              key="brief"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-3xl mx-auto"
            >
              <button onClick={() => setStep("template")} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 mb-6 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to templates
              </button>

              {template && (
                <div className="flex items-center gap-3 mb-8">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${COLOR_MAP[template.color]} flex items-center justify-center`}>
                    <template.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">{template.name} Video</h2>
                    <p className="text-xs text-white/40">{template.description}</p>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {/* Business details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-white/30 font-semibold mb-1.5 block">Business Name</label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g., Zoobicon, My Bakery..."
                      className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/40 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-white/30 font-semibold mb-1.5 block">Product / Service</label>
                    <input
                      type="text"
                      value={product}
                      onChange={(e) => setProduct(e.target.value)}
                      placeholder="e.g., AI Website Builder, Fresh Bread..."
                      className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/40 transition-colors"
                    />
                  </div>
                </div>

                {/* Brief */}
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-white/30 font-semibold mb-1.5 block">Creative Brief (optional)</label>
                  <textarea
                    value={brief}
                    onChange={(e) => setBrief(e.target.value)}
                    placeholder="What's the key message? What makes your product special? Any specific angles to highlight?"
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/40 transition-colors resize-none"
                  />
                </div>

                {/* Platform */}
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-white/30 font-semibold mb-2 block">Platform</label>
                  <div className="grid grid-cols-4 gap-2">
                    {PLATFORMS.map(p => (
                      <button
                        key={p.id}
                        onClick={() => { setPlatform(p.id); setDuration(p.duration); }}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                          platform === p.id
                            ? "bg-violet-500/10 border-violet-500/40 text-violet-300"
                            : "bg-white/[0.02] border-white/[0.06] text-white/40 hover:text-white/60 hover:border-white/[0.12]"
                        }`}
                      >
                        <div className="font-bold">{p.name}</div>
                        <div className="text-[9px] text-white/25 mt-0.5">{p.aspect} · {p.duration}s</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration slider */}
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-white/30 font-semibold mb-2 flex items-center justify-between">
                    <span>Duration</span>
                    <span className="text-violet-400 normal-case">{duration}s</span>
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={90}
                    step={5}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full accent-violet-500"
                  />
                  <div className="flex justify-between text-[9px] text-white/20 mt-1">
                    <span>10s</span>
                    <span>30s</span>
                    <span>60s</span>
                    <span>90s</span>
                  </div>
                </div>

                {/* Tone */}
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-white/30 font-semibold mb-2 block">Tone</label>
                  <div className="flex flex-wrap gap-2">
                    {TONES.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setTone(t.id)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                          tone === t.id
                            ? "bg-violet-500/10 border-violet-500/40 text-violet-300"
                            : "bg-white/[0.02] border-white/[0.06] text-white/40 hover:text-white/60"
                        }`}
                      >
                        {t.emoji} {t.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate button */}
                <button
                  onClick={handleGenerateScript}
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold transition-all disabled:opacity-50 shadow-lg shadow-violet-500/20"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Writing script...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Video Script
                    </>
                  )}
                </button>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ─── STEP 3: Script / Storyboard ─── */}
          {step === "script" && script && (
            <motion.div
              key="script"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-black tracking-tight">{script.title}</h2>
                  <div className="flex items-center gap-3 mt-1 text-xs text-white/30">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{script.totalDuration}s</span>
                    <span className="flex items-center gap-1"><Film className="w-3 h-3" />{script.shots.length} shots</span>
                    <span className="flex items-center gap-1"><Megaphone className="w-3 h-3" />{selectedPlatform.name}</span>
                    <span className="px-2 py-0.5 rounded bg-white/5 text-white/25">{script.aspectRatio}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setStep("brief"); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white/50 hover:text-white/80 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Edit Brief
                  </button>
                  <button
                    onClick={handleGenerateScript}
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/30 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                    Regenerate
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Storyboard timeline */}
                <div className="lg:col-span-2 space-y-3">
                  <h3 className="text-[10px] uppercase tracking-wider text-white/30 font-bold flex items-center gap-2">
                    <Film className="w-3 h-3" />
                    Storyboard — {script.shots.length} shots
                  </h3>

                  {script.shots.map((shot, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setActiveShot(i)}
                      className={`group relative p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                        activeShot === i
                          ? "bg-violet-500/[0.06] border-violet-500/30 shadow-lg shadow-violet-500/5"
                          : "bg-white/[0.015] border-white/[0.06] hover:bg-white/[0.03] hover:border-white/[0.1]"
                      }`}
                    >
                      {/* Shot number + timing */}
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center gap-1">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                            activeShot === i ? "bg-violet-500 text-white" : "bg-white/[0.06] text-white/30"
                          }`}>
                            {shot.shotNumber}
                          </div>
                          <span className="text-[9px] text-white/20 tabular-nums">{shot.duration}s</span>
                        </div>

                        <div className="flex-1 min-w-0 space-y-2">
                          {/* Visual description */}
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-white/20 font-semibold">Visual</span>
                            {editingShot === i ? (
                              <textarea
                                value={shot.visual}
                                onChange={(e) => updateShot(i, "visual", e.target.value)}
                                onBlur={() => setEditingShot(null)}
                                rows={2}
                                autoFocus
                                className="w-full mt-0.5 px-2 py-1.5 rounded-lg bg-white/[0.06] border border-violet-500/30 text-xs text-white focus:outline-none resize-none"
                              />
                            ) : (
                              <p
                                className="text-xs text-white/60 mt-0.5 cursor-text hover:text-white/80 transition-colors"
                                onClick={(e) => { e.stopPropagation(); setEditingShot(i); }}
                              >
                                {shot.visual}
                              </p>
                            )}
                          </div>

                          {/* Text overlay */}
                          <div className="flex items-start gap-2">
                            <Type className="w-3 h-3 text-amber-400/50 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="text-[9px] uppercase tracking-wider text-amber-400/40 font-semibold">Text Overlay</span>
                              <p className="text-xs text-amber-300/70 font-bold mt-0.5">{shot.textOverlay}</p>
                            </div>
                          </div>

                          {/* Voiceover line */}
                          <div className="flex items-start gap-2">
                            <Mic className="w-3 h-3 text-cyan-400/50 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="text-[9px] uppercase tracking-wider text-cyan-400/40 font-semibold">Voiceover</span>
                              <p className="text-xs text-cyan-300/70 italic mt-0.5">&ldquo;{shot.voiceover}&rdquo;</p>
                            </div>
                          </div>

                          {/* Transition + mood tags */}
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] px-2 py-0.5 rounded bg-white/[0.04] text-white/25 font-medium">
                              {shot.transition}
                            </span>
                            <span className="text-[9px] px-2 py-0.5 rounded bg-white/[0.04] text-white/25 font-medium">
                              {shot.mood}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Right: Controls & exports */}
                <div className="space-y-4">
                  {/* Hook */}
                  <div className="p-4 rounded-xl bg-amber-500/[0.06] border border-amber-500/20">
                    <h4 className="text-[10px] uppercase tracking-wider text-amber-400/60 font-bold mb-1.5 flex items-center gap-1.5">
                      <Zap className="w-3 h-3" />
                      Hook
                    </h4>
                    <p className="text-sm text-amber-200 font-semibold">{script.hook}</p>
                  </div>

                  {/* Full voiceover */}
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[10px] uppercase tracking-wider text-white/30 font-bold flex items-center gap-1.5">
                        <Mic className="w-3 h-3" />
                        Full Voiceover Script
                      </h4>
                      <button
                        onClick={() => copyText(script.voiceoverFull, "voiceover")}
                        className="text-white/20 hover:text-white/50 transition-colors"
                      >
                        {copied === "voiceover" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <p className="text-xs text-white/50 leading-relaxed">{script.voiceoverFull}</p>

                    {/* Voice selection */}
                    <div className="mt-3 pt-3 border-t border-white/[0.06]">
                      <label className="text-[9px] uppercase tracking-wider text-white/20 font-semibold mb-1.5 block">Voice</label>
                      <div className="flex flex-wrap gap-1.5">
                        {VOICES.map(v => (
                          <button
                            key={v.id}
                            onClick={() => setVoice(v.id)}
                            className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                              voice === v.id
                                ? "bg-violet-500/15 border border-violet-500/30 text-violet-300"
                                : "bg-white/[0.03] border border-white/[0.05] text-white/30 hover:text-white/50"
                            }`}
                          >
                            {v.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Generate voiceover button */}
                    <button
                      onClick={handleGenerateVoiceover}
                      disabled={isGeneratingVoiceover}
                      className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-xs font-semibold text-cyan-400 hover:bg-cyan-500/15 transition-colors disabled:opacity-50"
                    >
                      {isGeneratingVoiceover ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</>
                      ) : (
                        <><Volume2 className="w-3.5 h-3.5" /> Generate Voiceover</>
                      )}
                    </button>

                    {voiceoverUrl && (
                      <div className="mt-2">
                        <audio ref={audioRef} src={voiceoverUrl} className="w-full h-8" controls />
                      </div>
                    )}
                  </div>

                  {/* Music suggestion */}
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <h4 className="text-[10px] uppercase tracking-wider text-white/30 font-bold flex items-center gap-1.5 mb-1.5">
                      <Music className="w-3 h-3" />
                      Music Style
                    </h4>
                    <p className="text-xs text-white/50">{script.musicStyle}</p>
                  </div>

                  {/* CTA */}
                  <div className="p-4 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20">
                    <h4 className="text-[10px] uppercase tracking-wider text-emerald-400/60 font-bold mb-1.5">CTA</h4>
                    <p className="text-sm text-emerald-300 font-bold">{script.ctaText}</p>
                  </div>

                  {/* Export section */}
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <h4 className="text-[10px] uppercase tracking-wider text-white/30 font-bold flex items-center gap-1.5 mb-3">
                      <Download className="w-3 h-3" />
                      Export
                    </h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => handleExport("json")}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-white/60 hover:text-white/80 hover:bg-white/[0.06] transition-all"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Timeline JSON
                        <span className="ml-auto text-[9px] text-white/20">Full project</span>
                      </button>
                      <button
                        onClick={() => handleExport("srt")}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-white/60 hover:text-white/80 hover:bg-white/[0.06] transition-all"
                      >
                        <Type className="w-3.5 h-3.5" />
                        Subtitles (.srt)
                        <span className="ml-auto text-[9px] text-white/20">For captions</span>
                      </button>
                      <button
                        onClick={() => handleExport("edl")}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-white/60 hover:text-white/80 hover:bg-white/[0.06] transition-all"
                      >
                        <Film className="w-3.5 h-3.5" />
                        Edit Decision List (.edl)
                        <span className="ml-auto text-[9px] text-white/20">For Premiere/DaVinci</span>
                      </button>
                      <button
                        onClick={() => copyText(JSON.stringify(script, null, 2), "script")}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-white/60 hover:text-white/80 hover:bg-white/[0.06] transition-all"
                      >
                        {copied === "script" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        Copy Full Script
                        <span className="ml-auto text-[9px] text-white/20">Clipboard</span>
                      </button>
                    </div>
                  </div>

                  {/* Recording mode prompt */}
                  <div className="p-4 rounded-xl bg-violet-500/[0.04] border border-violet-500/15">
                    <h4 className="text-[10px] uppercase tracking-wider text-violet-400/50 font-bold mb-1.5 flex items-center gap-1.5">
                      <Play className="w-3 h-3" />
                      Record Product Footage
                    </h4>
                    <p className="text-[11px] text-white/35 mb-2">
                      Use recording mode to capture clean builder footage for your shots.
                    </p>
                    <Link
                      href="/builder?record=1"
                      target="_blank"
                      className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium"
                    >
                      Open Builder in Recording Mode
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
