"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import {
  Upload,
  Type,
  Wand2,
  Play,
  ChevronDown,
  ChevronUp,
  Shield,
  Globe,
  Briefcase,
  Sparkles,
  Image as ImageIcon,
  Mic,
  Film,
  CheckCircle2,
  Loader2,
  ArrowRight,
  X,
  Camera,
  Zap,
  Users,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const VOICE_STYLES = [
  { id: "professional", label: "Professional", icon: Briefcase, desc: "Clear, authoritative tone" },
  { id: "casual", label: "Casual", icon: Users, desc: "Friendly, conversational" },
  { id: "energetic", label: "Energetic", icon: Zap, desc: "Upbeat, high-energy" },
  { id: "calm", label: "Calm", icon: Globe, desc: "Soothing, measured pace" },
] as const;

const PROCESSING_STAGES = [
  { label: "Analyzing face...", icon: Camera, duration: 2000 },
  { label: "Generating voice...", icon: Mic, duration: 3000 },
  { label: "Creating lip-sync...", icon: Film, duration: 5000 },
  { label: "Rendering final video...", icon: Sparkles, duration: 3000 },
];

const MAX_CHARS = 500;

const EXAMPLE_CARDS = [
  { title: "Product Demo", gradient: "from-purple-600 to-blue-500", label: "Marketing" },
  { title: "Course Intro", gradient: "from-pink-500 to-orange-400", label: "Education" },
  { title: "Social Reel", gradient: "from-cyan-500 to-emerald-400", label: "Social Media" },
  { title: "Sales Pitch", gradient: "from-violet-600 to-fuchsia-500", label: "Sales" },
  { title: "News Update", gradient: "from-amber-500 to-red-500", label: "Media" },
  { title: "Personal Intro", gradient: "from-teal-500 to-blue-600", label: "Personal" },
];

const FAQ_ITEMS = [
  {
    q: "Is my selfie stored or shared?",
    a: "Your uploaded image is processed in memory and never stored on our servers. Once your video is generated, the original photo is discarded. We do not share your likeness with any third party.",
  },
  {
    q: "How realistic is the output?",
    a: "Our pipeline uses state-of-the-art face animation and voice synthesis models. Results are photorealistic with natural lip movements. Quality depends on your input photo \u2014 front-facing, well-lit selfies produce the best results.",
  },
  {
    q: "What languages are supported?",
    a: "AI Twins currently supports English, Spanish, French, German, Portuguese, Japanese, Korean, Chinese, Italian, and Dutch. We are adding more languages every month through our Fish Speech voice pipeline.",
  },
  {
    q: "Can I use AI Twin videos commercially?",
    a: "Yes. Videos generated from your own likeness are yours to use commercially \u2014 ads, social media, presentations, courses. You retain full rights. Do not create AI Twin videos using someone else\u2019s face without their explicit consent.",
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AITwinsPage() {
  /* --- state --- */
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [script, setScript] = useState("");
  const [voiceStyle, setVoiceStyle] = useState("professional");
  const [generating, setGenerating] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [stagesDone, setStagesDone] = useState<boolean[]>([false, false, false, false]);
  const [videoReady, setVideoReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* --- image handling --- */
  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG, or WebP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10 MB.");
      return;
    }
    setError(null);
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* --- generation (simulated client-side, calls real API) --- */
  const handleGenerate = async () => {
    if (!imagePreview || !script.trim()) return;
    setGenerating(true);
    setVideoReady(false);
    setError(null);
    setCurrentStage(0);
    setStagesDone([false, false, false, false]);

    // Animate through processing stages
    for (let i = 0; i < PROCESSING_STAGES.length; i++) {
      setCurrentStage(i);
      await new Promise((r) => setTimeout(r, PROCESSING_STAGES[i].duration));
      setStagesDone((prev) => {
        const next = [...prev];
        next[i] = true;
        return next;
      });
    }

    try {
      const res = await fetch("/api/video-creator/twins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imagePreview,
          script: script.trim(),
          voiceStyle,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Generation failed");
      setVideoReady(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setGenerating(false);
    }
  };

  /* --- render helpers --- */
  const canProceedToStep2 = !!imageFile;
  const canProceedToStep3 = script.trim().length > 0 && script.length <= MAX_CHARS;

  return (
    <div className="min-h-screen bg-[#0b0d17] text-white relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/20 blur-[120px] animate-pulse" />
        <div
          className="absolute bottom-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full bg-indigo-500/15 blur-[100px]"
          style={{ animation: "pulse 8s ease-in-out infinite alternate" }}
        />
        <div
          className="absolute top-[40%] left-[60%] w-[350px] h-[350px] rounded-full bg-fuchsia-500/10 blur-[90px]"
          style={{ animation: "pulse 6s ease-in-out infinite alternate-reverse" }}
        />
      </div>

      <TopBar />

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-24">
        {/* ── Hero ──────────────────────────────────────── */}
        <section className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-1.5 text-sm text-purple-300 mb-6">
            <Sparkles className="w-4 h-4" />
            Powered by AI Face Animation
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            Create Your{" "}
            <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              AI Twin
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Upload a selfie. Type what you want to say. Get a photorealistic video
            of &ldquo;you&rdquo; speaking &mdash; powered by AI.
          </p>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-3 mt-10">
            {[
              { n: 1, label: "Upload", icon: Upload },
              { n: 2, label: "Script", icon: Type },
              { n: 3, label: "Generate", icon: Wand2 },
            ].map(({ n, label, icon: Icon }) => (
              <button
                key={n}
                onClick={() => {
                  if (n === 1) setStep(1);
                  if (n === 2 && canProceedToStep2) setStep(2);
                  if (n === 3 && canProceedToStep2 && canProceedToStep3) setStep(3);
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  step === n
                    ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/25"
                    : step > n
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    : "bg-white/5 text-gray-500 border border-white/10"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* ── Step 1: Upload ───────────────────────────── */}
        {step === 1 && (
          <section className="max-w-xl mx-auto mb-20 animate-fadeIn">
            <h2 className="text-2xl font-semibold mb-2 text-center">Upload your photo</h2>
            <p className="text-gray-400 text-center mb-8">
              Front-facing, well-lit selfie works best. JPG, PNG, or WebP under 10 MB.
            </p>

            {!imagePreview ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative cursor-pointer border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                  dragOver
                    ? "border-purple-400 bg-purple-500/10"
                    : "border-white/15 bg-[#131520] hover:border-purple-500/40 hover:bg-purple-500/5"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/15 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-purple-400" />
                </div>
                <p className="text-white font-medium mb-1">
                  Drag &amp; drop your selfie here
                </p>
                <p className="text-gray-500 text-sm">or click to browse</p>
              </div>
            ) : (
              <div className="relative bg-[#131520] rounded-2xl border border-white/10 p-6 text-center">
                <button
                  onClick={removeImage}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/30 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Your uploaded photo"
                  className="w-48 h-48 object-cover rounded-xl mx-auto mb-4 border-2 border-purple-500/30"
                />
                <p className="text-green-400 text-sm flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  {imageFile?.name}
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <button
              disabled={!canProceedToStep2}
              onClick={() => setStep(2)}
              className="mt-8 w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
            >
              Continue to Script
              <ArrowRight className="w-4 h-4" />
            </button>
          </section>
        )}

        {/* ── Step 2: Script ───────────────────────────── */}
        {step === 2 && (
          <section className="max-w-xl mx-auto mb-20 animate-fadeIn">
            <h2 className="text-2xl font-semibold mb-2 text-center">Write your script</h2>
            <p className="text-gray-400 text-center mb-8">
              Type what your AI Twin should say. Keep it natural and conversational.
            </p>

            <div className="bg-[#131520] border border-white/10 rounded-2xl p-6 mb-6">
              <textarea
                value={script}
                onChange={(e) => setScript(e.target.value.slice(0, MAX_CHARS))}
                rows={5}
                placeholder="Hey there! I'm excited to show you our latest product. It's going to change how you work..."
                className="w-full bg-transparent text-white placeholder-gray-600 resize-none focus:outline-none text-base leading-relaxed"
              />
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                <span className="text-xs text-gray-500">
                  {script.length > MAX_CHARS * 0.9 ? (
                    <span className="text-amber-400">{script.length} / {MAX_CHARS}</span>
                  ) : (
                    <span>{script.length} / {MAX_CHARS}</span>
                  )}
                </span>
                {script.length > 0 && (
                  <button
                    onClick={() => setScript("")}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Voice style picker */}
            <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Voice Style</h3>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {VOICE_STYLES.map(({ id, label, icon: VIcon, desc }) => (
                <button
                  key={id}
                  onClick={() => setVoiceStyle(id)}
                  className={`flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 text-left ${
                    voiceStyle === id
                      ? "border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/10"
                      : "border-white/10 bg-[#131520] hover:border-white/20"
                  }`}
                >
                  <VIcon className={`w-5 h-5 mt-0.5 ${voiceStyle === id ? "text-purple-400" : "text-gray-500"}`} />
                  <div>
                    <p className={`text-sm font-medium ${voiceStyle === id ? "text-white" : "text-gray-300"}`}>
                      {label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3.5 rounded-xl font-medium text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                Back
              </button>
              <button
                disabled={!canProceedToStep3}
                onClick={() => setStep(3)}
                className="flex-[2] py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
              >
                Generate Video
                <Wand2 className="w-4 h-4" />
              </button>
            </div>
          </section>
        )}

        {/* ── Step 3: Generate ─────────────────────────── */}
        {step === 3 && (
          <section className="max-w-2xl mx-auto mb-20 animate-fadeIn">
            {!generating && !videoReady && !error && (
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-6">Ready to create your AI Twin</h2>
                <div className="bg-[#131520] border border-white/10 rounded-2xl p-8 mb-8">
                  <div className="flex items-center gap-6 mb-6">
                    {imagePreview && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={imagePreview}
                        alt="Your photo"
                        className="w-20 h-20 object-cover rounded-xl border-2 border-purple-500/30 flex-shrink-0"
                      />
                    )}
                    <div className="text-left">
                      <p className="text-sm text-gray-400 mb-1">Script ({script.length} chars)</p>
                      <p className="text-white text-sm leading-relaxed line-clamp-3">&ldquo;{script}&rdquo;</p>
                      <p className="text-xs text-purple-400 mt-2 capitalize">
                        Voice: {voiceStyle}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleGenerate}
                    className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 text-lg"
                  >
                    <Wand2 className="w-5 h-5" />
                    Create AI Twin Video
                  </button>
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
                >
                  &larr; Back to edit script
                </button>
              </div>
            )}

            {/* Generating progress */}
            {generating && (
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-8">Creating your AI Twin...</h2>
                <div className="bg-[#131520] border border-white/10 rounded-2xl p-8">
                  <div className="space-y-4">
                    {PROCESSING_STAGES.map((s, i) => {
                      const Icon = s.icon;
                      const done = stagesDone[i];
                      const active = currentStage === i && !done;
                      return (
                        <div
                          key={i}
                          className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-500 ${
                            done
                              ? "bg-green-500/10 border border-green-500/20"
                              : active
                              ? "bg-purple-500/10 border border-purple-500/30"
                              : "bg-white/5 border border-white/5"
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              done
                                ? "bg-green-500/20"
                                : active
                                ? "bg-purple-500/20"
                                : "bg-white/5"
                            }`}
                          >
                            {done ? (
                              <CheckCircle2 className="w-5 h-5 text-green-400" />
                            ) : active ? (
                              <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                            ) : (
                              <Icon className="w-5 h-5 text-gray-600" />
                            )}
                          </div>
                          <span
                            className={`text-sm font-medium ${
                              done ? "text-green-400" : active ? "text-white" : "text-gray-600"
                            }`}
                          >
                            {s.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Video ready */}
            {videoReady && !generating && (
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-2">Your AI Twin is ready!</h2>
                <p className="text-gray-400 mb-8">Download or share your video</p>
                <div className="bg-[#131520] border border-white/10 rounded-2xl overflow-hidden mb-8">
                  {/* Simulated video player */}
                  <div className="relative aspect-[9/16] max-h-[500px] mx-auto bg-gradient-to-br from-purple-900/30 to-indigo-900/30 flex items-center justify-center">
                    {imagePreview && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={imagePreview}
                        alt="AI Twin preview"
                        className="w-full h-full object-cover opacity-80"
                      />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors border border-white/20">
                        <Play className="w-7 h-7 text-white ml-1" />
                      </button>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 bg-black/40 backdrop-blur-sm rounded-lg p-3 text-left">
                      <p className="text-xs text-gray-300 line-clamp-2">&ldquo;{script}&rdquo;</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 max-w-md mx-auto">
                  <button
                    onClick={() => {
                      setVideoReady(false);
                      setStep(1);
                      removeImage();
                      setScript("");
                    }}
                    className="flex-1 py-3 rounded-xl font-medium text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                  >
                    New Video
                  </button>
                  <button className="flex-[2] py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 transition-all shadow-lg shadow-purple-500/20">
                    Download MP4
                  </button>
                </div>
              </div>
            )}

            {/* Error state */}
            {error && !generating && (
              <div className="text-center">
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 mb-6">
                  <p className="text-red-400 font-medium mb-2">Generation failed</p>
                  <p className="text-gray-400 text-sm mb-6">{error}</p>
                  <button
                    onClick={handleGenerate}
                    className="px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 transition-all"
                  >
                    Try Again
                  </button>
                </div>
                <button
                  onClick={() => {
                    setError(null);
                    setStep(2);
                  }}
                  className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
                >
                  &larr; Back to edit script
                </button>
              </div>
            )}
          </section>
        )}

        {/* ── Example Gallery ──────────────────────────── */}
        <section className="mb-24">
          <h2 className="text-3xl font-bold text-center mb-3">
            See what&apos;s{" "}
            <span className="bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
              possible
            </span>
          </h2>
          <p className="text-gray-400 text-center mb-10 max-w-lg mx-auto">
            AI Twins are used for marketing, education, sales, and personal branding.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {EXAMPLE_CARDS.map((card) => (
              <div
                key={card.title}
                className="group relative bg-[#131520] border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/30 transition-all duration-300"
              >
                <div
                  className={`aspect-[9/16] bg-gradient-to-br ${card.gradient} opacity-30 group-hover:opacity-40 transition-opacity`}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-white/20">
                    <Play className="w-6 h-6 text-white ml-0.5" />
                  </div>
                  <p className="text-white font-semibold text-lg">{card.title}</p>
                  <span className="mt-2 px-3 py-1 rounded-full bg-white/10 text-xs text-gray-300">
                    {card.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Pricing Callout ──────────────────────────── */}
        <section className="mb-24">
          <div className="relative bg-gradient-to-r from-purple-600/20 to-fuchsia-600/20 border border-purple-500/20 rounded-2xl p-10 text-center overflow-hidden">
            <div className="absolute inset-0 bg-[#131520]/60" />
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-3">
                <span className="bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                  $0.50
                </span>{" "}
                per video
              </h2>
              <p className="text-gray-300 text-lg mb-2">First 3 videos free. No credit card required.</p>
              <p className="text-gray-500 text-sm mb-8">
                Need volume pricing? Agency plans start at $299/mo with unlimited videos.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/pricing"
                  className="px-8 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 transition-all shadow-lg shadow-purple-500/20 inline-flex items-center justify-center gap-2"
                >
                  View Plans
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-8 py-3.5 rounded-xl font-medium text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-all inline-flex items-center justify-center"
                >
                  Create Free Account
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────── */}
        <section className="max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-10">
            Frequently asked{" "}
            <span className="bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
              questions
            </span>
          </h2>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <div
                key={i}
                className="bg-[#131520] border border-white/10 rounded-xl overflow-hidden hover:border-white/15 transition-colors"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="text-white font-medium pr-4 flex items-center gap-3">
                    <Shield className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    {item.q}
                  </span>
                  {expandedFaq === i ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {expandedFaq === i && (
                  <div className="px-5 pb-5 pt-0 text-gray-400 text-sm leading-relaxed ml-7">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Fade-in animation */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
